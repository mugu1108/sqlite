import sqlite3 from 'sqlite3';

export class DBClient {
  constructor() {
    this.db = new sqlite3.Database('sample.db');
  }

  async getAllPosts() {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT p.*, GROUP_CONCAT(t.name) as tags
        FROM posts p
        LEFT JOIN posts_tags pt ON p.id = pt.post_id
        LEFT JOIN tags t ON pt.tag_id = t.id
        GROUP BY p.id
        ORDER BY p.date DESC
      `, (err, rows) => {
        if (err) return reject(err);
        if (!rows) return resolve([]);
        resolve(rows.map(row => ({
          ...row,
          tags: row.tags ? row.tags.split(',') : []
        })));
      });
    });
  }

  async getPostBySlug(slug) {
    return new Promise((resolve, reject) => {
      this.db.get(`
        SELECT p.*, GROUP_CONCAT(t.name) as tags
        FROM posts p
        LEFT JOIN posts_tags pt ON p.id = pt.post_id
        LEFT JOIN tags t ON pt.tag_id = t.id
        WHERE p.slug = ?
        GROUP BY p.id
      `, [slug], (err, row) => {
        if (err) return reject(err);
        if (!row) return resolve(null);
        resolve({
          ...row,
          tags: row.tags ? row.tags.split(',') : []
        });
      });
    });
  }

  async createPost(post) {
    return new Promise((resolve, reject) => {
      this.db.run(`
        INSERT INTO posts (title, content, date, slug)
        VALUES (?, ?, ?, ?)
      `, [post.title, post.content, post.date, post.slug], async function(err) {
        if (err) return reject(err);
        const postId = this.lastID;
        
        if (post.tags && post.tags.length > 0) {
          try {
            await this.addTagsToPost(postId, post.tags);
            resolve(postId);
          } catch (err) {
            reject(err);
          }
        } else {
          resolve(postId);
        }
      }.bind(this));
    });
  }

  async updatePost(slug, post) {
    return new Promise((resolve, reject) => {
      this.db.run(`
        UPDATE posts 
        SET title = ?, content = ?, date = ?
        WHERE slug = ?
      `, [post.title, post.content, post.date, slug], async (err) => {
        if (err) return reject(err);
        
        try {
          const postId = await this.getPostIdBySlug(slug);
          await this.removeAllTagsFromPost(postId);
          if (post.tags && post.tags.length > 0) {
            await this.addTagsToPost(postId, post.tags);
          }
          resolve();
        } catch (err) {
          reject(err);
        }
      });
    });
  }

  async deletePost(slug) {
    return new Promise((resolve, reject) => {
      this.db.run(`
        DELETE FROM posts WHERE slug = ?
      `, [slug], (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  }

  async addTagsToPost(postId, tags) {
    for (const tag of tags) {
      await this.ensureTagExists(tag);
      await new Promise((resolve, reject) => {
        this.db.run(`
          INSERT OR IGNORE INTO posts_tags (post_id, tag_id)
          SELECT ?, id FROM tags WHERE name = ?
        `, [postId, tag], (err) => {
          if (err) return reject(err);
          resolve();
        });
      });
    }
  }

  async ensureTagExists(tagName) {
    return new Promise((resolve, reject) => {
      this.db.run(`
        INSERT OR IGNORE INTO tags (name) VALUES (?)
      `, [tagName], (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  }

  async removeAllTagsFromPost(postId) {
    return new Promise((resolve, reject) => {
      this.db.run(`
        DELETE FROM posts_tags WHERE post_id = ?
      `, [postId], (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  }

  async getPostIdBySlug(slug) {
    return new Promise((resolve, reject) => {
      this.db.get(`
        SELECT id FROM posts WHERE slug = ?
      `, [slug], (err, row) => {
        if (err) return reject(err);
        if (!row) return reject(new Error('Post not found'));
        resolve(row.id);
      });
    });
  }

  async getAllTags() {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT name FROM tags ORDER BY name
      `, (err, rows) => {
        if (err) return reject(err);
        resolve(rows.map(row => row.name));
      });
    });
  }

  close() {
    this.db.close();
  }
}