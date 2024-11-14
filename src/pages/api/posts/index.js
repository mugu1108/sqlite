import { DBClient } from '../../../db/client.js';

export async function POST({ request }) {
  try {
    const post = await request.json();
    const db = new DBClient();
    await db.createPost(post);
    db.close();
    
    return new Response(null, { status: 201 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: 'Failed to create post' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}