// api/subscribe.js
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// 允许的来源域名（按需增减，含 www）
const ALLOWED_ORIGINS = [
  'https://micro-myu.com',
  'https://www.micro-myu.com',
  'http://localhost:3000'
];

function setCors(req, res) {
  const origin = req.headers.origin || '';
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  // 如果你希望开发期先放开全部来源，也可以用：res.setHeader('Access-Control-Allow-Origin', '*');

  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400');
}

export const config = { api: { bodyParser: true } };

export default async function handler(req, res) {
  setCors(req, res);

  // 预检请求必须在这里直接返回
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST', 'OPTIONS']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ error: 'Missing email' });

    // === 这里写你的发送邮件逻辑 ===
    await resend.emails.send({
      from: "MicroMyu <onboarding@resend.dev>",  //process.env.SEND_FROM
      to: email,
      subject: '新的订阅请求',
      html: `<p>新的订阅邮箱：<strong>${email}</strong></p>`
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: '邮件发送失败' });
  }
}

