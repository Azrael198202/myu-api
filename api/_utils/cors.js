// api/_utils/cors.js
export const ALLOWED_ORIGINS = [
  'https://micro-myu.com',
  'https://www.micro-myu.com',
  'http://localhost:3000'
];

export function setCors(req, res, methods = 'GET, OPTIONS') {
  const origin = req.headers.origin || '';
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', methods);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');
}
