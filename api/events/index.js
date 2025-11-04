const { setCors } = require('../_utils/cors.js');
const { listByType } = require('../_utils/csv.js');

module.exports = (req, res) => {
  setCors(req, res, 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', ['GET', 'POST', 'OPTIONS']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const q = req.method === 'GET' ? req.query : (req.body || {});
    const page = Math.max(1, parseInt(q.page || '1', 10));
    const pageSize = Math.min(50, Math.max(1, parseInt(q.pageSize || '12', 10)));
    const data = listByType('EVENT', { page, pageSize });

    return res.status(200).json({
      ...data,
      items: data.items.map(it => ({
        id: it.id, date: it.date, title: it.title, summary: it.summary,
        thumbnail: it.thumbnail, tags: it.tags, slug: it.slug
      }))
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'List fetch failed' });
  }
};
