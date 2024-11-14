import { DBClient } from '../../../db/client.js';

export async function PUT({ params, request }) {
  try {
    const { slug } = params;
    const post = await request.json();
    const db = new DBClient();
    await db.updatePost(slug, post);
    db.close();
    
    return new Response(null, { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: 'Failed to update post' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function DELETE({ params }) {
  try {
    const { slug } = params;
    const db = new DBClient();
    await db.deletePost(slug);
    db.close();
    
    return new Response(null, { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: 'Failed to delete post' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}