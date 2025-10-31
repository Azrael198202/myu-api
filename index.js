// index.js
const express = require('express');
const app = express();
const port = 3000;

// 让 Express 能解析 JSON 请求体
app.use(express.json());

// GET 测试接口
app.get('/', (req, res) => {
  res.send('Hello from Node.js API!');
});

// POST 测试接口
app.post('/api/test', (req, res) => {
  console.log('收到的POST数据:', req.body);
  const { name, age } = req.body;

  if (!name || !age) {
    return res.status(400).json({ message: '缺少 name 或 age 参数' });
  }

  res.json({
    message: 'POST 请求成功！',
    received: { name, age }
  });
});

// 启动服务器
app.listen(port, () => {
  console.log(`✅ 服务器已启动: http://localhost:${port}`);
});
