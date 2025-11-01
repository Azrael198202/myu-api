import { Resend } from 'resend';

// ⚠️ 测试用写死（部署到公开仓库前务必删除）
const RESEND_API_KEY = 're_CL39sotD_7suRRnQatrsDfPuhJqShbpea';  // ← 你的 Resend API Key
const TO_EMAIL = 'ying.hahn@gmail.com';                       // 收件人邮箱

const resend = new Resend(RESEND_API_KEY);

export const config = { api: { bodyParser: true } };

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  const { email } = req.body || {};
  if (!email) {
    return res.status(400).json({ error: 'Missing email' });
  }

  try {
    // 发送邮件通知
    await resend.emails.send({
      from: 'no-reply@myu-api.vercel.app',
      to: TO_EMAIL,
      subject: '新的订阅请求',
      html: `
        <h2>新的订阅</h2>
        <p>订阅邮箱：<strong>${email}</strong></p>
        <p>时间：${new Date().toLocaleString('zh-CN')}</p>
      `,
    });

    res.status(200).json({ message: '邮件发送成功' });
  } catch (error) {
    console.error('发送失败:', error);
    res.status(500).json({ error: '邮件发送失败' });
  }
}
