import jwt from 'jsonwebtoken';


export default async function handler(req, res) {
if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
const { payload } = req.body || {};
if (!payload) return res.status(400).json({ error: 'Missing payload' });
try {
const secret = process.env.SIGNING_SECRET;
const token = jwt.sign(payload, secret, { expiresIn: '14d' });
return res.status(200).json({ token });
} catch (e) {
return res.status(500).json({ error: 'Failed to create token' });
}
}
