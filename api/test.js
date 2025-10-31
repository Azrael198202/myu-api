export const config = { api: { bodyParser: true } };

function setCors(res) {
    res.setHeader('Access-Control-Allow-Origin', '*'); // 或者指定域名
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default function handler(req, res) {
    setCors(res);
    if (req.method === 'OPTIONS') return res.status(204).end();

    if (req.method !== "POST")
        return res.status(405).end();

    if (req.method === 'POST') {
        const { name, age } = req.body || {};

        // 参数校验
        if (!name || !age) {
            return res.status(400).json({ error: '缺少 name 或 age 参数' });
        }

        // 返回 JSON 响应
        return res.status(200).json({
            message: 'POST 请求成功！',
            received: { name, age },
            serverTime: new Date().toISOString(),
        });
    }

    // 只允许 POST 方法
    res.setHeader('Allow', ['POST']);
    res.status(405).json({ error: 'Method Not Allowed' });

    res.json({ received: req.body });
}