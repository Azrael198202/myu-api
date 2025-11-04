import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const CSV_PATH = path.join(DATA_DIR, 'content.csv');

// 简易 CSV 解析（支持引号、逗号、换行）
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

export function loadAllItems() {
  const raw = fs.readFileSync(CSV_PATH, 'utf8');
  const rows = parseCSV(raw);
  const list = toObjects(rows).map(it => ({
    ...it,
    tags: (it.tags || '').split('|').filter(Boolean),
    date: it.date || '1970-01-01'
  }));
  // 日期倒序
  return list.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function listByType(type, { page = 1, pageSize = 10 } = {}) {
  const all = loadAllItems().filter(x => x.type === type);
  const total = all.length;
  const start = (page - 1) * pageSize;
  const items = all.slice(start, start + pageSize).map(({ contentPath, ...lite }) => lite);
  return { total, page, pageSize, items };
}

export function getById(id) {
  const all = loadAllItems();
  const found = all.find(x => x.id === id);
  if (!found) return null;

  // 读取 Markdown 正文（如果有）
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
