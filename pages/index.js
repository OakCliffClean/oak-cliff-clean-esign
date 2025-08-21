import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';


const ICForm = dynamic(() => import('../components/ICForm'), { ssr: false });


export default function Home() {
const router = useRouter();
const role = (router.query.role || 'contractor').toString();
const token = (router.query.token || '').toString();


const [contractorData, setContractorData] = useState(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState('');


useEffect(() => {
document.title = 'Oak Cliff Clean — IC Agreement';
}, []);


// If company role with token: fetch verified payload
useEffect(() => {
(async () => {
if (role === 'company' && token) {
setLoading(true);
try {
const res = await fetch('/api/verify-token', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) });
const json = await res.json();
if (!res.ok) throw new Error(json.error || 'Invalid link');
setContractorData(json.payload);
} catch (e) { setError(e.message); } finally { setLoading(false); }
}
})();
}, [role, token]);


return (
<div className="container">
<div className="no-print" style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
<h1 style={{fontSize:18, fontWeight:600}}>Oak Cliff Clean — Independent Contractor Agreement</h1>
<div className="small">Role: <b>{role}</b></div>
</div>


{role === 'company' && loading && <div className="card">Validating link…</div>}
{error && <div className="card" style={{color:'#b91c1c'}}>{error}</div>}


{(role === 'contractor' || (role === 'company' && contractorData)) && (
<ICForm role={role} token={token} contractorPrefill={contractorData} />
)}


<div className="no-print" style={{marginTop:12}}>
<p className="small">Tip: Share <code>?role=contractor</code> to start new agreements. The app emails you a secure countersign link after the contractor signs.</p>
</div>
</div>
);
}
