import jwt from 'jsonwebtoken';


export default async function handler(req, res) {
if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
const { token } = req.body || {};
if (!token) return res.status(400).json({ error: 'Missing token' });
try {
const secret = process.env.SIGNING_SECRET;
const payload = jwt.verify(token, secret);
return res.status(200).json({ payload });
} catch (e) {
return res.status(400).json({ error: 'Invalid or expired token' });
}
}
