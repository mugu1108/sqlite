import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('sample.db');

db.serialize(() => {
  // Create posts table
  db.run(`
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      date TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL
    )
  `);

  // Create tags table
  db.run(`
    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL
    )
  `);

  // Create posts_tags junction table
  db.run(`
    CREATE TABLE IF NOT EXISTS posts_tags (
      post_id INTEGER,
      tag_id INTEGER,
      FOREIGN KEY (post_id) REFERENCES posts (id),
      FOREIGN KEY (tag_id) REFERENCES tags (id),
      PRIMARY KEY (post_id, tag_id)
    )
  `);

  // Insert sample data
  db.run(`
    INSERT OR IGNORE INTO posts (title, content, date, slug) VALUES 
    ('最初のブログ記事', '# 最初のブログ記事へようこそ！\n\nこれは最初のブログ記事です。', '2024-04-10', 'first-post'),
    ('2番目のブログ記事', '# マークダウンの使い方\n\nこの記事では、マークダウンについて説明します。', '2024-04-11', 'second-post')
  `);

  db.run(`
    INSERT OR IGNORE INTO tags (name) VALUES 
    ('Astro'),
    ('ブログ'),
    ('チュートリアル'),
    ('マークダウン')
  `);

  db.run(`
    INSERT OR IGNORE INTO posts_tags (post_id, tag_id)
    SELECT p.id, t.id
    FROM posts p, tags t
    WHERE p.slug = 'first-post' AND t.name IN ('Astro', 'ブログ')
    AND NOT EXISTS (
      SELECT 1 FROM posts_tags 
      WHERE post_id = p.id AND tag_id = t.id
    )
  `);

  db.run(`
    INSERT OR IGNORE INTO posts_tags (post_id, tag_id)
    SELECT p.id, t.id
    FROM posts p, tags t
    WHERE p.slug = 'second-post' AND t.name IN ('チュートリアル', 'マークダウン')
    AND NOT EXISTS (
      SELECT 1 FROM posts_tags 
      WHERE post_id = p.id AND tag_id = t.id
    )
  `);
});

db.close();