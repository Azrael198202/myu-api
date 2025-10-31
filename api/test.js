// /api/test

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*'); // 或者指定域名
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export const config = {
  api: {
    bodyParser: true, // 让 Vercel 自动解析 JSON
  },
};

export default function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  
  if (req.method === 'POST') {
    const { name, age } = req.body || {};
    if (!name || !age) {
      return res.status(400).json({ message: '缺少 name 或 age 参数' });
    }
    return res.status(200).json({
      message: 'POST 请求成功！',
      received: { name, age },
    });
  }

  // 其他方法
  res.setHeader('Allow', ['POST']);
  res.status(405).json({ message: 'Method Not Allowed' });
}
