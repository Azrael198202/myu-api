// pages/api/_cors.js  （可选抽出，或在每个路由内复制）
export const ALLOWED_ORIGINS = [
  'https://micro-myu.com',
  'https://www.micro-myu.com',
  'http://localhost:3000'
];

export function setCors(req, res) {
  const origin = req.headers.origin || '';
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400');
}
