// api/index.js  （把你之前的 server.js 内容复制过来）
// 注意：文件路径从 api/ 开始，所以相对路径要用 process.cwd() 拼 data 目录

import 'dotenv/config';
import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { Resend } from 'resend';

// ---- utils: 读取 CSV/MD（直接内嵌，避免跨文件导入路径问题） ----

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, 'data');
const CSV_PATH = path.join(DATA_DIR, 'content.csv');

function parseCSV(text) {
  const rows = [];
  let i = 0, field = '', row = [], inQuotes = false;
  const pushField = () => { row.push(field); field = ''; };
  const pushRow = () => { rows.push(row); row = []; };
  while (i < text.length) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 2; continue; }
        inQuotes = false; i++; continue;
      }
      field += c; i++; continue;
    } else {
      if (c === '"') { inQuotes = true; i++; continue; }
      if (c === ',') { pushField(); i++; continue; }
      if (c === '\n') { pushField(); pushRow(); i++; continue; }
      if (c === '\r') { i++; continue; }
      field += c; i++; continue;
    }
  }
  if (field.length > 0 || row.length > 0) { pushField(); pushRow(); }
  return rows;
}
function toObjects(rows) {
  if (!rows.length) return [];
  const headers = rows[0].map(h => h.trim());
  return rows.slice(1).filter(r => r.length && r.some(x => x && x.trim() !== '')).map(cols => {
    const obj = {};
    headers.forEach((h, idx) => { obj[h] = (cols[idx] ?? '').trim(); });
    return obj;
  });
}
function loadAllItems() {
  const raw = fs.readFileSync(CSV_PATH, 'utf8');
  const rows = parseCSV(raw);
  const list = toObjects(rows).map(it => ({
    ...it,
    tags: (it.tags || '').split('|').filter(Boolean),
    date: it.date || '1970-01-01'
  }));
  return list.sort((a, b) => (a.date < b.date ? 1 : -1));
}
function listByType(type, { page = 1, pageSize = 10 } = {}) {
  const all = loadAllItems().filter(x => x.type === type);
  const total = all.length;
  const start = (page - 1) * pageSize;
  const items = all.slice(start, start + pageSize).map(({ contentPath, ...lite }) => lite);
  return { total, page, pageSize, items };
}
function getById(id) {
  const all = loadAllItems();
  const found = all.find(x => x.id === id);
  if (!found) return null;
  if (found.contentPath) {
    const p = path.isAbsolute(found.contentPath)
      ? found.contentPath
      : path.join(ROOT, found.contentPath);
    if (fs.existsSync(p)) {
      const md = fs.readFileSync(p, 'utf8');
      return { ...found, content: md };
    }
  }
  return found;
}

// ---- CORS ----
const ALLOWED_ORIGINS = [
  'https://micro-myu.com',
  'https://www.micro-myu.com',
  'http://localhost:3000'
];
function setCors(req, res, methods = 'GET, POST, OPTIONS') {
  const origin = req.headers.origin || '';
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', methods);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');
}

const app = express();
app.use(bodyParser.json());
app.use((req, res, next) => {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  next();
});

// ---- routes ----
app.get('/api/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

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
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: '邮件发送失败' });
  }
});

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

app.get('/api/news/:id', (req, res) => {
  try {
    const item = getById(req.params.id);
    if (!item || item.type !== 'NEWS') return res.status(404).json({ error: 'Not Found' });
    res.json(item);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Detail fetch failed' });
  }
});

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

app.get('/api/events/:id', (req, res) => {
  try {
    const item = getById(req.params.id);
    if (!item || item.type !== 'EVENT') return res.status(404).json({ error: 'Not Found' });
    res.json(item);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Detail fetch failed' });
  }
});

// ---- 关键：导出 Vercel handler（不要 app.listen）----
export default function handler(req, res) {
  return app(req, res);
}
