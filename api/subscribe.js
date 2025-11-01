import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const config = { api: { bodyParser: true } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Only POST allowed' });

  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: 'Missing email' });

  try {
    // 向你的邮箱发送通知
    await resend.emails.send({
      from: 'no-reply@myu-api.vercel.app',
      to: email,
      subject: '新的订阅请求',
      html: `<p>新的订阅邮箱: <strong>${email}</strong></p>`,
    });

    res.status(200).json({ message: '邮件发送成功' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '邮件发送失败' });
  }
}
