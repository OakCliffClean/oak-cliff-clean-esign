import { Resend } from 'resend';


const resend = new Resend(process.env.RESEND_API_KEY);


export default async function handler(req, res) {
if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
const { url, contractorEmail } = req.body || {};
if (!url) return res.status(400).json({ error: 'Missing URL' });
try {
const to = process.env.COMPANY_EMAIL;
if (!to) return res.status(200).json({ ok: true }); // soft‑success if not configured
await resend.emails.send({
from: 'Oak Cliff Clean <sign@yourdomain.com>',
to: [to],
subject: 'IC Agreement ready to countersign',
html: `<p>Contractor email: ${contractorEmail || 'n/a'}</p><p><a href="${url}">Open countersign link</a></p>`
});
res.status(200).json({ ok: true });
} catch (e) { res.status(500).json({ error: 'Notify failed' }); }
}
