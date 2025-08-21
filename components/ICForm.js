import { useEffect, useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const WATERMARK = "data:image/png;base64, ..."; // keep as-is or replace with your base64

function SignaturePad({ label, value, onChange, height = 140 }) {
  // (rest of the file continues…)

{/* Right: print preview */}
<div id="printable" className="card prose" style={{position:'relative'}}>
<img src={WATERMARK} alt="watermark" className="watermark" />
<div className="print-surface">
<div style={{textAlign:'center'}}>
<h2 style={{margin:'4px 0'}}>OAK CLIFF CLEAN</h2>
<h3 style={{margin:'4px 0'}}>INDEPENDENT CONTRACTOR AGREEMENT</h3>
<p className="small">CERTIFIED CLEANER PROGRAM · Locally and Minority Owned · Serving Oak Cliff and Greater Dallas</p>
</div>
<hr/>
<p><b>Agreement Date:</b> {form.agreementDate || '__________'}</p>
<p><b>Contractor Name:</b> {form.contractorName || '______________________________'}</p>
<p><b>Business Name (if applicable):</b> {form.contractorBusinessName || '______________________________'}</p>
<p><b>Contractor Address:</b><br/>
{form.contractorAddress1 || '_______________________________________________'}<br/>
{form.contractorAddress2 || '_______________________________________________'}</p>
<p><b>Phone:</b> {form.contractorPhone || '____________'} &nbsp; <b>Email:</b> {form.contractorEmail || '__________________'}</p>
<p><b>Business License/Tax ID:</b> {form.contractorTaxId || '__________________'}</p>


<p>This Independent Contractor Agreement ("Agreement") is entered into by and between <b>Oak Cliff Clean, LLC</b> ("Company") and <b>{form.contractorName||'Contractor'}</b> ("Contractor").</p>


<h4>Key Term</h4>
<p><b>Base Compensation:</b> Contractor receives <b>60%</b> of the total customer payment for each completed project.</p>


<h4>Signatures</h4>
<div className="row row-2">
<div>
<p><b>CONTRACTOR</b></p>
{form.signatureContractorDrawn ? (
<p>Signature (drawn): <img src={form.signatureContractorDrawn} alt="Contractor Signature" style={{maxHeight:64}}/></p>
) : <p>Signature (typed): {form.signatureContractor || '______________________________'}</p>}
<p>Name: {form.contractorName || '___________________________________'}</p>
<p>Date: {form.signatureDateContractor || '____________'}</p>
</div>
<div>
<p><b>COMPANY — OAK CLIFF CLEAN, LLC</b></p>
{form.signatureCompanyDrawn ? (
<p>Signature (drawn): <img src={form.signatureCompanyDrawn} alt="Company Signature" style={{maxHeight:64}}/></p>
) : <p>Signature (typed): {form.signatureCompany || '______________________________'}</p>}
<p>Name: {form.companyRepName || '___________________________________'}</p>
<p>Title: {form.companyRepTitle || '___________________________________'}</p>
<p>Date: {form.signatureDateCompany || '____________'}</p>
</div>
</div>


<hr/>
<h4>E‑Sign Consent</h4>
<p><b>Consent:</b> {consent ? 'Consented' : 'Not Consented'} · <b>IP:</b> {ip || 'Unavailable'} · <b>UA:</b> {ua || 'Unavailable'}</p>
</div>
</div>
</div>
);
}
