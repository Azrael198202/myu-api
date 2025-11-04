// api/_utils/csv.js (CommonJS)
const fs = require('fs');
const path = require('path');

// 数据在 api/_utils/_data 下
const DATA_DIR = path.join(__dirname, 'data');
const CSV_PATH = path.join(DATA_DIR, 'content.csv');

// 简易 CSV 解析（支持引号/逗号/换行）
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

function listByType(type, { page = 1, pageSize = 12 } = {}) {
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
    // 文章路径相对 _data；兼容 CSV 里写的 data/articles/xxx.md
    const relative = found.contentPath.replace(/^data\//, '');
    const p = path.join(DATA_DIR, relative);
    if (fs.existsSync(p)) {
      const md = fs.readFileSync(p, 'utf8');
      return { ...found, content: md };
    }
  }
  return found;
}

module.exports = {
  loadAllItems,
  listByType,
  getById,
};
