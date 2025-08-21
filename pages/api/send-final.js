import { Resend } from 'resend';


const resend = new Resend(process.env.RESEND_API_KEY);


export default async function handler(req, res) {
if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
const { pdfDataUri, contractorEmail, contractorName } = req.body || {};
if (!pdfDataUri) return res.status(400).json({ error: 'Missing PDF' });
try {
const base64 = pdfDataUri.split(',')[1];
const companyEmail = process.env.COMPANY_EMAIL;
const to = [companyEmail].filter(Boolean);
if (contractorEmail) to.push(contractorEmail);


await resend.emails.send({
from: 'Oak Cliff Clean <sign@yourdomain.com>',
to,
subject: `Executed IC Agreement — ${contractorName || 'Contractor'}`,
html: `<p>Attached is the fully executed Independent Contractor Agreement.</p>`,
attachments: [{ filename: 'Oak_Cliff_Clean_IC_Agreement.pdf', content: base64, path: undefined, type: 'application/pdf' }]
});


res.status(200).json({ ok: true });
} catch (e) { res.status(500).json({ error: 'Email failed' }); }
}
