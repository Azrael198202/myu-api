const { setCors } = require('../_utils/cors.js');
const { listByType } = require('../_utils/csv.js');

module.exports = (req, res) => {
  setCors(req, res, 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET', 'OPTIONS']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize || '12', 10)));
    const data = listByType('EVENT', { page, pageSize });
    res.status(200).json({
      ...data,
      items: data.items.map(it => ({
        id: it.id,
        date: it.date,
        title: it.title,
        summary: it.summary,
        thumbnail: it.thumbnail,
        tags: it.tags,
        slug: it.slug
      }))
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'List fetch failed' });
  }
};
