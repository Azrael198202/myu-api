// api/news/[id].js
import { setCors } from '../_utils/cors.js';
import { getById } from '../_utils/csv.js';

export default function handler(req, res) {
  setCors(req, res, 'GET, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET', 'OPTIONS']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { id } = req.query; // Vercel 会注入 id
    const item = getById(id);
    if (!item || item.type !== 'NEWS') return res.status(404).json({ error: 'Not Found' });
    res.status(200).json(item);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Detail fetch failed' });
  }
}
