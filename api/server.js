import 'dotenv/config';
import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { Resend } from 'resend';
import { listByType, getById } from './lib/csvStore.js';

const app = express();
app.use(bodyParser.json());

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** 允许的来源域名（按需增减，含 www） */
const ALLOWED_ORIGINS = [
  'https://micro-myu.com',
  'https://www.micro-myu.com',
  'http://localhost:3000'
];

/** 统一 CORS 中间件（含预检） */
function setCors(req, res, methods = 'GET, POST, OPTIONS') {
  const origin = req.headers.origin || '';
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  // 开发期也可临时开放全部：
  // res.setHeader('Access-Control-Allow-Origin', '*');

  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', methods);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');
}

app.use((req, res, next) => {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  next();
});

/** 健康检查 */
app.get('/api/health', (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

/** 订阅接口（Resend）*/
const resend = new Resend(process.env.RESEND_API_KEY);

app.post('/api/subscribe', async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ error: 'Missing email' });

    await resend.emails.send({
      from: process.env.SEND_FROM || 'MicroMyu <onboarding@resend.dev>',
      to: email,
      subject: '新的订阅请求',
      html: `<p>新的订阅邮箱：<strong>${email}</strong></p>`
    });

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '邮件发送失败' });
  }
});

/** 新闻一览 */
app.get('/api/news', (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize || '12', 10)));
    const data = listByType('NEWS', { page, pageSize });

    res.json({
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
});

/** 新闻详情 */
app.get('/api/news/:id', (req, res) => {
  try {
    const item = getById(req.params.id);
    if (!item || item.type !== 'NEWS') {
      return res.status(404).json({ error: 'Not Found' });
    }
    res.json(item); // 包含 content（若 CSV 里有 contentPath）
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Detail fetch failed' });
  }
});

/** 事件一览 */
app.get('/api/events', (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize || '12', 10)));
    const data = listByType('EVENT', { page, pageSize });

    res.json({
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
});

/** 事件详情 */
app.get('/api/events/:id', (req, res) => {
  try {
    const item = getById(req.params.id);
    if (!item || item.type !== 'EVENT') {
      return res.status(404).json({ error: 'Not Found' });
    }
    res.json(item);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Detail fetch failed' });
  }
});

/** 静态文件（如果你需要直接访问 /data 里的图片或其它资源，可以开放静态目录）*/
// app.use('/public', express.static(path.join(__dirname, 'public')));

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`[myu-news-api] running on http://localhost:${port}`);
});
