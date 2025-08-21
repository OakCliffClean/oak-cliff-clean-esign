import { useEffect, useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// Optional: paste your real base64 logo here. If left empty, no watermark image renders.
const WATERMARK = ""; // e.g. "data:image/png;base64,AAAA..."

function SignaturePad({ label, value, onChange, height = 140 }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const drawing = useRef(false);
  const lastPoint = useRef({ x: 0, y: 0 });

  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = rect.width + 'px';
    canvas.style.height = height + 'px';
    const ctx = canvas.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, rect.width, height);
    ctx.strokeStyle = '#e5e7eb';
    ctx.strokeRect(0.5, 0.5, rect.width - 1, height - 1);
    if (value) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, rect.width, height);
      img.src = value;
    }
  };

  useEffect(() => {
    resizeCanvas();
    const onR = () => resizeCanvas();
    window.addEventListener('resize', onR);
    return () => window.removeEventListener('resize', onR);
  }, []);

  useEffect(() => { resizeCanvas(); }, [value]);

  const getPos = (e) => {
    const c = canvasRef.current;
    const r = c.getBoundingClientRect();
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: cx - r.left, y: cy - r.top };
  };

  const start = (e) => { e.preventDefault(); drawing.current = true; lastPoint.current = getPos(e); };
  const move = (e) => {
    if (!drawing.current) return;
    e.preventDefault();
    const ctx = canvasRef.current.getContext('2d');
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#111827';
    const p = getPos(e);
    ctx.beginPath();
    ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    lastPoint.current = p;
  };
  const end = () => {
    if (!drawing.current) return;
    drawing.current = false;
    onChange(canvasRef.current.toDataURL('image/png'));
  };
  const clear = () => {
    const c = canvasRef.current, ctx = c.getContext('2d'), r = c.getBoundingClientRect();
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, r.width, height);
    ctx.strokeStyle = '#e5e7eb';
    ctx.strokeRect(0.5, 0.5, r.width - 1, height - 1);
    onChange('');
  };

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <label style={{fontSize:12, fontWeight:600}}>{label}</label>
        <button type="button" onClick={clear} style={{fontSize:12, textDecoration:'underline', background:'none', border:0, cursor:'pointer'}}>Clear</button>
      </div>
      <div ref={containerRef} style={{border:'1px solid #e5e7eb',borderRadius:12,background:'#fff'}}>
        <canvas
          ref={canvasRef}
          onMouseDown={start}
          onMouseMove={move}
          onMouseUp={end}
          onMouseLeave={end}
          onTouchStart={start}
          onTouchMove={move}
          onTouchEnd={end}
        />
      </div>
    </div>
  );
}

export default function ICForm({ role, token, contractorPrefill }) {
  const isContractor = role === 'contractor';

  const [consent, setConsent] = useState(false);
  const [ip, setIp] = useState('');
  const [ua, setUa] = useState('');
  const [form, setForm] = useState({
    agreementDate: '',
    contractorName: '', contractorBusinessName: '',
    contractorAddress1: '', contractorAddress2: '',
    contractorPhone: '', contractorEmail: '', contractorTaxId: '',
    companyAddress: '', companyRepName: '', companyRepTitle: '',
    signatureContractor: '', signatureCompany: '',
    signatureDateContractor: '', signatureDateCompany: '',
    signatureContractorDrawn: '', signatureCompanyDrawn: ''
  });

  useEffect(() => {
    setUa(navigator.userAgent || '');
    (async () => {
      try {
        const r = await fetch('https://api.ipify.org?format=json');
        const j = await r.json();
        if (j && j.ip) setIp(j.ip);
      } catch {}
    })();
  }, []);

  useEffect(() => {
    if (contractorPrefill) setForm((f) => ({ ...f, ...contractorPrefill }));
  }, [contractorPrefill]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  async function generateCountersign() {
    if (!consent) return alert('Please consent to e-sign.');
    if (!form.contractorName || !(form.signatureContractor || form.signatureContractorDrawn)) {
      return alert('Contractor name and signature are required.');
    }
    const payload = {
      ...form,
      consent: true,
      ip,
      ua,
      signedAtContractor: new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' })
    };
    const res = await fetch('/api/create-token', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ payload })
    });
    const json = await res.json();
    if (!res.ok) return alert(json.error || 'Could not create link');

    const base = process.env.NEXT_PUBLIC_APP_BASE_URL || window.location.origin;
    const url = `${base}/?role=company&token=${encodeURIComponent(json.token)}`;

    // Optional: email you automatically if /api/notify is configured
    try { await fetch('/api/notify', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ url, contractorEmail: form.contractorEmail })
    }); } catch {}

    try { await navigator.clipboard.writeText(url); } catch {}
    alert('Countersign link created and copied to clipboard.\n\nPaste it in an email to yourself (or check your inbox if notify is configured).');
  }

  async function finalizeAndEmail() {
    if (!consent) return alert('Please consent to e-sign.');
    if (!(form.signatureCompany || form.signatureCompanyDrawn)) return alert('Company signature is required.');

    const container = document.getElementById('printable');
    const pdf = new jsPDF('p','pt','a4');
    const scale = 2; // quality
    const canvas = await html2canvas(container, { scale });
    const imgData = canvas.toDataURL('image/png');

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const fullHeight = canvas.height * (pageWidth / canvas.width);

    let y = 0;
    while (y < fullHeight) {
      if (y > 0) pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, -y, pageWidth, fullHeight);
      y += pageHeight;
    }

    const pdfDataUri = pdf.output('datauristring');
    const res = await fetch('/api/send-final', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({
        pdfDataUri,
        contractorEmail: form.contractorEmail,
        contractorName: form.contractorName
      })
    });
    const json = await res.json();
    if (!res.ok) return alert(json.error || 'Email failed');
    alert('Finalized PDF emailed to both parties.');
  }

  return (
    <div className="row">
      {/* LEFT: controls */}
      <div className="card no-print">
        <h2 style={{marginTop:0}}>Fill the Fields</h2>

        <label>Agreement Date
          <input className="input" type="date" name="agreementDate" value={form.agreementDate} onChange={onChange}/>
        </label>

        <label>Contractor Name
          <input className="input" type="text" name="contractorName" value={form.contractorName} onChange={onChange}/>
        </label>

        <label>Business Name (optional)
          <input className="input" type="text" name="contractorBusinessName" value={form.contractorBusinessName} onChange={onChange}/>
        </label>

        <label>Address — Line 1
          <input className="input" type="text" name="contractorAddress1" value={form.contractorAddress1} onChange={onChange}/>
        </label>

        <label>Address — Line 2
          <input className="input" type="text" name="contractorAddress2" value={form.contractorAddress2} onChange={onChange}/>
        </label>

        <div className="row row-2">
          <label>Phone
            <input className="input" type="tel" name="contractorPhone" value={form.contractorPhone} onChange={onChange}/>
          </label>
          <label>Email
            <input className="input" type="email" name="contractorEmail" value={form.contractorEmail} onChange={onChange}/>
          </label>
        </div>

        {!isContractor && (
          <>
            <div className="row row-2">
              <label>Company Rep — Name
                <input className="input" type="text" name="companyRepName" value={form.companyRepName} onChange={onChange}/>
              </label>
              <label>Company Rep — Title
                <input className="input" type="text" name="companyRepTitle" value={form.companyRepTitle} onChange={onChange}/>
              </label>
            </div>
            <label>Company Address
              <input className="input" type="text" name="companyAddress" value={form.companyAddress} onChange={onChange}/>
            </label>
          </>
        )}

        <div className="hint">Compensation is fixed at <b>60%</b> of the total customer payment (per Section 3.2).</div>

        <div className="row row-2">
          <div>
            {isContractor && (
              <>
                <label>Contractor Signature (typed)
                  <input className="input" type="text" name="signatureContractor" value={form.signatureContractor} onChange={onChange}/>
                </label>
                <SignaturePad label="Contractor Signature (draw here)" value={form.signatureContractorDrawn} onChange={(v)=>setForm(f=>({...f,signatureContractorDrawn:v}))}/>
                <label>Date
                  <input className="input" type="date" name="signatureDateContractor" value={form.signatureDateContractor} onChange={onChange}/>
                </label>
              </>
            )}
          </div>

          <div>
            {!isContractor && (
              <>
                <label>Company Signature (typed)
                  <input className="input" type="text" name="signatureCompany" value={form.signatureCompany} onChange={onChange}/>
                </label>
                <SignaturePad label="Company Signature (draw here)" value={form.signatureCompanyDrawn} onChange={(v)=>setForm(f=>({...f,signatureCompanyDrawn:v}))}/>
                <label>Date
                  <input className="input" type="date" name="signatureDateCompany" value={form.signatureDateCompany} onChange={onChange}/>
                </label>
              </>
            )}
          </div>
        </div>

        <label className="small">
          <input type="checkbox" checked={consent} onChange={(e)=>setConsent(e.target.checked)} style={{marginRight:8}}/>
          I agree to use electronic records and signatures
        </label>

        {isContractor ? (
          <div style={{display:'flex',gap:8,marginTop:8}}>
            <button className="btn btn-primary" onClick={generateCountersign}>Create Countersign Link</button>
          </div>
        ) : (
          <div style={{display:'flex',gap:8,marginTop:8}}>
            <button className="btn btn-primary" onClick={finalizeAndEmail}>Finalize & Email PDF</button>
          </div>
        )}

        <p className="small">Metadata captured at finalization: IP ({ip || 'n/a'}), Device: {ua.slice(0,52)}…</p>
      </div>

      {/* RIGHT: print preview */}
      <div id="printable" className="card prose" style={{position:'relative'}}>
        {WATERMARK && <img src={WATERMARK} alt="watermark" className="watermark" />}
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
            {form.contractorAddress2 || '_______________________________________________'}
          </p>
          <p><b>Phone:</b> {form.contractorPhone || '____________'} &nbsp; <b>Email:</b> {form.contractorEmail || '__________________'}</p>
          <p><b>Business License/Tax ID:</b> {form.contractorTaxId || '__________________'}</p>

          <p>This Independent Contractor Agreement ("Agreement") is entered into by and between <b>Oak Cliff Clean, LLC</b> ("Company") and <b>{form.contractorName || 'Contractor'}</b> ("Contractor").</p>

          <h4>Key Term</h4>
          <p><b>Base Compensation:</b> Contractor receives <b>60%</b> of the total customer payment for each completed project.</p>

          <h4>Signatures</h4>
          <div className="row row-2">
            <div>
              <p><b>CONTRACTOR</b></p>
              {form.signatureContractorDrawn
                ? <p>Signature (drawn): <img src={form.signatureContractorDrawn} alt="Contractor Signature" style={{maxHeight:64}}/></p>
                : <p>Signature (typed): {form.signatureContractor || '______________________________'}</p>}
              <p>Name: {form.contractorName || '___________________________________'}</p>
              <p>Date: {form.signatureDateContractor || '____________'}</p>
            </div>
            <div>
              <p><b>COMPANY — OAK CLIFF CLEAN, LLC</b></p>
              {form.signatureCompanyDrawn
                ? <p>Signature (drawn): <img src={form.signatureCompanyDrawn} alt="Company Signature" style={{maxHeight:64}}/></p>
                : <p>Signature (typed): {form.signatureCompany || '______________________________'}</p>}
              <p>Name: {form.companyRepName || '___________________________________'}</p>
              <p>Title: {form.companyRepTitle || '___________________________________'}</p>
              <p>Date: {form.signatureDateCompany || '____________'}</p>
            </div>
          </div>

          <hr/>
          <h4>E-Sign Consent</h4>
          <p>
            <b>Consent:</b> {consent ? 'Consented' : 'Not Consented'} · <b>IP:</b> {ip || 'Unavailable'} · <b>UA:</b> {ua || 'Unavailable'}
          </p>
      </div>
    </div>
  );
}
