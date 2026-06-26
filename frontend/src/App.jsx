import React, { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import {
  Briefcase, Users, BarChart3, ChevronRight,
  ShieldCheck, ShieldAlert, Download, Loader2, Brain, Zap, Award,
  TrendingUp, Eye, EyeOff, RefreshCw, FolderOpen, Plus, Cpu,
  Mail, X, Send, CheckCircle, AlertCircle, Info, AlertTriangle,
  SlidersHorizontal, Layers
} from 'lucide-react';
import { G, glassCard, liquidGlassCSS } from './theme.js';

const API_BASE_URL = 'http://localhost:8000';

// Extra tokens used only in the dashboard
const blur = 'blur(32px) saturate(160%)';

// ── BIAS CHECKER ─────────────────────────────────────────────────────────────
const BIAS_PATTERNS = [
  {
    pattern: /\b(rockstar|rock\s+star|ninja|guru|wizard|killer|badass|crushing\s+it|dominant|aggressive|manpower|man[\s-]hours|brotherhood)\b/gi,
    label: 'Masculine-coded language',
    severity: 'warn',
    tip: 'Use neutral alternatives like "expert", "specialist", or "top performer".',
  },
  {
    pattern: /\b(digital\s+native|recent\s+graduate|fresh\s+graduate|young\s+professional|energetic\s+team|youthful|millennial|gen[\s-]?z)\b/gi,
    label: 'Age-biased language',
    severity: 'warn',
    tip: 'Avoid implying a preferred age group — it may violate employment law.',
  },
  {
    pattern: /\b(he\s+or\s+she|he\/she|his\/her|chairman|businessmen|manpower|policeman|fireman)\b/gi,
    label: 'Non-inclusive pronoun / title',
    severity: 'info',
    tip: 'Use gender-neutral terms: "they/them", "chairperson", "firefighter".',
  },
  {
    pattern: /\b(must\s+have|mandatory|required).{0,40}(degree|bachelor|master|phd|university|college)\b/gi,
    label: 'Strict degree gate',
    severity: 'info',
    tip: 'Consider "degree or equivalent experience" to widen the talent pool.',
  },
  {
    pattern: /\b(perfect\s+candidate|flawless|exceptional\s+candidate|outstanding\s+individual|10x)\b/gi,
    label: 'Perfectionist language',
    severity: 'info',
    tip: 'Unrealistic standards deter qualified applicants, especially under-represented groups.',
  },
];

function checkJdBias(text) {
  if (!text || text.length < 20) return [];
  return BIAS_PATTERNS.reduce((acc, { pattern, label, severity, tip }) => {
    const matches = [...text.matchAll(pattern)].map(m => m[0]);
    if (matches.length) acc.push({ label, severity, tip, matches: [...new Set(matches.map(m => m.toLowerCase()))] });
    return acc;
  }, []);
}

// ── SCORE RING ────────────────────────────────────────────────────────────────
const ScoreRing = ({ score, size = 52 }) => {
  const sw = 4;
  const r  = (size - sw * 2) / 2;
  const c  = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  const color  = score >= 70 ? G.sage : score >= 50 ? G.gold : G.red;
  return (
    <div style={{ position:'relative', width:size, height:size }}>
      <svg width={size} height={size} style={{ transform:'rotate(-90deg)', display:'block' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(124,79,42,0.12)" strokeWidth={sw}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={sw}
          strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition:'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)' }}/>
      </svg>
      <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <span style={{ fontSize:11, fontWeight:800, color, letterSpacing:'-0.02em' }}>{score.toFixed(0)}</span>
      </div>
    </div>
  );
};

const MiniBar = ({ value, color, height=5 }) => (
  <div style={{ width:'100%', height, borderRadius:99, background:'rgba(124,79,42,0.10)', overflow:'hidden' }}>
    <div style={{ width:`${value}%`, height:'100%', borderRadius:99, background:color, transition:'width 1s ease' }}/>
  </div>
);

const RANK_CONFIG = [
  { glow: G.goldGlow,  border: G.gold,                 badgeBg:'linear-gradient(135deg,#8B6508,#D4A017)', label:'1st' },
  { glow:'0 0 14px rgba(160,160,140,0.3)', border:'rgba(140,130,100,0.7)', badgeBg:'linear-gradient(135deg,#7A7060,#AEA898)', label:'2nd' },
  { glow:'0 0 14px rgba(160,120,60,0.25)', border:'rgba(160,112,74,0.7)', badgeBg:`linear-gradient(135deg,${G.accent},${G.accentLight})`, label:'3rd' },
];

const DEFAULT_SUBJECT = t => `Congratulations — You've Passed Initial Screening for ${t}`;
const DEFAULT_BODY    = t =>
`Dear {{name}},

We are pleased to inform you that you have successfully passed the first stage of our AI-powered recruitment assessment for the ${t} position.

Your profile demonstrated a strong alignment with our requirements, and we would like to invite you to the next stage of the selection process.

Please prepare for a formal interview. Our team will be in touch shortly with details on the date, time, and format.

We look forward to speaking with you.

Best regards,
The Recruitment Team`;

// ── SHARED INPUT STYLE ────────────────────────────────────────────────────────
const inputStyle = {
  width:'100%', padding:'9px 12px', borderRadius:10,
  background:'rgba(255,252,248,0.60)', border:`1px solid ${G.glassBorder}`,
  color:G.textPrimary, fontSize:13, outline:'none', boxSizing:'border-box',
};

// ── CANDIDATE DETAIL MODAL ────────────────────────────────────────────────────
function CandidateDetailModal({ candidate, rank, jobTitle, onClose }) {
  if (!candidate) return null;
  const finalPct = candidate.final_score    * 100;
  const semPct   = candidate.semantic_score * 100;
  const expScore = candidate.experience_score * 100;
  const rankCfg  = rank < 3 ? RANK_CONFIG[rank] : null;
  const scoreColor = v => v >= 70 ? G.sage : v >= 50 ? G.gold : G.red;

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(80,45,15,0.35)',
        backdropFilter:'blur(6px)', WebkitBackdropFilter:'blur(6px)', zIndex:300,
        display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="lq lq-d2 lq-iri" style={{ ...glassCard(), background:'rgba(255,252,248,0.82)', backdropFilter:blur,
          WebkitBackdropFilter:blur, width:'100%', maxWidth:640,
          boxShadow:G.shadowLg, overflow:'hidden', display:'flex',
          flexDirection:'column', maxHeight:'92vh',
          border:`1px solid ${G.glassBorderHi}` }}>

        {/* Coloured top bar */}
        <div style={{ height:4, background: rankCfg
          ? `linear-gradient(90deg, ${rankCfg.border}, transparent)`
          : `linear-gradient(90deg, ${G.accent}, transparent)` }}/>

        {/* Header */}
        <div className="lq lq-d3" style={{ padding:'20px 24px 16px', borderBottom:`1px solid ${G.glassBorder}`,
            background:'rgba(255,252,248,0.55)', display:'flex', alignItems:'flex-start', gap:16, flexShrink:0 }}>
          <div className="lq" style={{ width:52, height:52, borderRadius:16,
              background: rankCfg ? rankCfg.badgeBg : G.accentDim,
              border:`1px solid ${G.glassBorder}`, display:'flex', alignItems:'center',
              justifyContent:'center', flexShrink:0,
              boxShadow: rankCfg ? rankCfg.glow : G.accentGlow }}>
            {rankCfg ? <Award size={22} color="#fff"/> : <Users size={22} color={G.accent}/>}
          </div>
          <div style={{ flex:1 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
              <h3 style={{ margin:0, fontSize:18, fontWeight:800, color:G.textPrimary, letterSpacing:'-0.02em' }}>
                {candidate.candidate_name}
              </h3>
              {rankCfg && (
                <span style={{ fontSize:10, fontWeight:800, background:rankCfg.badgeBg,
                    color:'#fff', padding:'3px 10px', borderRadius:99, textTransform:'uppercase', letterSpacing:'0.08em' }}>
                  {rankCfg.label} Place
                </span>
              )}
              {candidate.risk_flag && (
                <span style={{ fontSize:10, fontWeight:700, background:G.redDim, color:G.red,
                    border:`1px solid rgba(176,52,31,0.25)`, padding:'3px 10px', borderRadius:99 }}>
                  {candidate.risk_flag}
                </span>
              )}
            </div>
            <p style={{ margin:'4px 0 0', fontSize:12, color:G.textMuted }}>{candidate.email}</p>
            <p style={{ margin:'2px 0 0', fontSize:11, color:G.textMuted, fontStyle:'italic' }}>Applied for: {jobTitle}</p>
          </div>
          <button onClick={onClose} style={{ width:30, height:30, borderRadius:8, background:'rgba(124,79,42,0.08)',
              border:`1px solid ${G.glassBorder}`, display:'flex', alignItems:'center',
              justifyContent:'center', cursor:'pointer', color:G.textMuted, flexShrink:0 }}>
            <X size={14}/>
          </button>
        </div>

        {/* Body */}
        <div style={{ padding:'22px 24px', overflowY:'auto', display:'flex', flexDirection:'column', gap:20 }}>

          {/* Score overview */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
            {[
              { label:'Final Score', value:finalPct,  ring:true  },
              { label:'Skill Match', value:semPct,    ring:false },
              { label:'Experience',  value:expScore,  ring:false },
            ].map(({ label, value, ring }) => (
              <div key={label} className="lq lq-iri" style={{ ...glassCard({ background:'rgba(255,252,248,0.60)' }),
                  padding:'16px 14px', display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
                {ring ? <ScoreRing score={value} size={64}/> : (
                  <>
                    <span style={{ fontSize:28, fontWeight:800, color:scoreColor(value),
                        letterSpacing:'-0.04em', lineHeight:1 }}>
                      {value.toFixed(1)}%
                    </span>
                    <MiniBar value={value} color={scoreColor(value)} height={6}/>
                  </>
                )}
                <span style={{ fontSize:10, fontWeight:700, color:G.textMuted,
                    textTransform:'uppercase', letterSpacing:'0.1em', textAlign:'center' }}>
                  {label}
                </span>
              </div>
            ))}
          </div>

          {/* Experience detail */}
          <div style={{ ...glassCard({ background:'rgba(255,252,248,0.50)' }), padding:'14px 18px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
              <TrendingUp size={14} color={G.accentLight}/>
              <span style={{ fontSize:11, fontWeight:700, color:G.textSecondary,
                  textTransform:'uppercase', letterSpacing:'0.08em' }}>Experience Profile</span>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <div>
                <span style={{ fontSize:10, color:G.textMuted, fontWeight:600,
                    textTransform:'uppercase', letterSpacing:'0.06em' }}>Total Experience</span>
                <div style={{ fontSize:22, fontWeight:800, color:G.accent,
                    letterSpacing:'-0.03em', lineHeight:1.2 }}>{candidate.total_experience} yrs</div>
              </div>
              <div>
                <span style={{ fontSize:10, color:G.textMuted, fontWeight:600,
                    textTransform:'uppercase', letterSpacing:'0.06em' }}>Anti-gaming Variance</span>
                <div style={{ fontSize:22, fontWeight:800,
                    color:candidate.similarity_variance > 0.35 ? G.red : G.sage,
                    letterSpacing:'-0.03em', lineHeight:1.2 }}>
                  {(candidate.similarity_variance * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          </div>

          {/* Matched skills */}
          {candidate.matched_skills?.length > 0 && (
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:10 }}>
                <CheckCircle size={14} color={G.sage}/>
                <span style={{ fontSize:11, fontWeight:700, color:G.sage,
                    textTransform:'uppercase', letterSpacing:'0.08em' }}>
                  Matched Skills ({candidate.matched_skills.length})
                </span>
              </div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                {candidate.matched_skills.map((s, i) => (
                  <span key={i} style={{ fontSize:11, fontWeight:700, background:G.sageDim,
                      border:`1px solid rgba(58,125,87,0.22)`, color:G.sage,
                      padding:'4px 12px', borderRadius:99, textTransform:'capitalize' }}>{s}</span>
                ))}
              </div>
            </div>
          )}

          {/* Missing skills */}
          {candidate.missing_skills?.length > 0 && (
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:10 }}>
                <AlertCircle size={14} color={G.red}/>
                <span style={{ fontSize:11, fontWeight:700, color:G.red,
                    textTransform:'uppercase', letterSpacing:'0.08em' }}>
                  Skill Gaps ({candidate.missing_skills.length})
                </span>
              </div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                {candidate.missing_skills.map((s, i) => (
                  <span key={i} style={{ fontSize:11, fontWeight:600, background:G.redDim,
                      border:`1px solid rgba(176,52,31,0.22)`, color:G.red,
                      padding:'4px 12px', borderRadius:99, textTransform:'capitalize' }}>{s}</span>
                ))}
              </div>
              <p style={{ margin:'10px 0 0', fontSize:11, color:G.textMuted, fontStyle:'italic' }}>
                Skills in the job description not detected in this CV.
              </p>
            </div>
          )}

          {/* Risk flag */}
          {candidate.risk_flag && (
            <div style={{ padding:'12px 16px', background:G.redDim,
                border:`1px solid rgba(176,52,31,0.22)`, borderRadius:12,
                display:'flex', alignItems:'flex-start', gap:10 }}>
              <ShieldAlert size={16} color={G.red} style={{ flexShrink:0, marginTop:1 }}/>
              <div>
                <p style={{ margin:0, fontSize:13, fontWeight:700, color:G.red }}>{candidate.risk_flag}</p>
                <p style={{ margin:'4px 0 0', fontSize:12, color:G.textSecondary }}>
                  The skills section matches the JD significantly more than the experience section —
                  possible keyword stuffing. Probe skill claims during interview.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function App() {
  const [jobs,           setJobs]           = useState([]);
  const [selectedJob,    setSelectedJob]    = useState(null);
  const [rankings,       setRankings]       = useState([]);
  const [rankingLimit,   setRankingLimit]   = useState(10);
  const [jobTitle,       setJobTitle]       = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [semanticWeight, setSemanticWeight] = useState(0.8);
  const [blindMode,      setBlindMode]      = useState(false);
  const [files,          setFiles]          = useState([]);
  const [loading,        setLoading]        = useState(false);
  const [processing,     setProcessing]     = useState(false);
  const [isPolling,      setIsPolling]      = useState(false);
  const [pollStatus,     setPollStatus]     = useState({ total:0, processed:0 });
  const [showForm,       setShowForm]       = useState(false);
  const pollingRef = useRef(null);

  const [selectedCandidate,    setSelectedCandidate]    = useState(null);
  const [selectedCandidateIdx, setSelectedCandidateIdx] = useState(null);
  const [liveAlpha,            setLiveAlpha]            = useState(null);

  const [showEmailModal,       setShowEmailModal]       = useState(false);
  const [emailSingleCandidate, setEmailSingleCandidate] = useState(null);
  const [emailTopN,            setEmailTopN]            = useState(10);
  const [emailSubject,         setEmailSubject]         = useState('');
  const [emailBody,            setEmailBody]            = useState('');
  const [emailSending,         setEmailSending]         = useState(false);
  const [emailResult,          setEmailResult]          = useState(null);

  useEffect(() => { fetchJobs(); }, []);

  const fetchJobs = async () => {
    try { const r = await axios.get(`${API_BASE_URL}/jobs`); setJobs(r.data); }
    catch (e) { console.error(e); }
  };

  const createJob = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      const r = await axios.post(`${API_BASE_URL}/jobs`, {
        title:jobTitle, description:jobDescription, semantic_weight:semanticWeight });
      setJobs(prev => [...prev, r.data]); setSelectedJob(r.data);
      setJobTitle(''); setJobDescription(''); setShowForm(false);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleFileUpload = async () => {
    if (!selectedJob || !files.length) return;
    setProcessing(true);
    const fd = new FormData();
    for (let i = 0; i < files.length; i++) fd.append('files', files[i]);
    try {
      await axios.post(`${API_BASE_URL}/jobs/${selectedJob.id}/upload-cvs`, fd);
      setPollStatus({ total:files.length, processed:0 }); setFiles([]);
      startPolling(selectedJob.id);
    } catch (e) { console.error(e); } finally { setProcessing(false); }
  };

  const fetchRankings = async () => {
    if (!selectedJob) return; setLoading(true);
    try {
      const r = await axios.get(
        `${API_BASE_URL}/jobs/${selectedJob.id}/rankings?blind_mode=${blindMode}&limit=${rankingLimit}`);
      setRankings(r.data); setLiveAlpha(null);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const stopPolling = () => {
    if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
    setIsPolling(false);
  };

  const startPolling = (jobId) => {
    stopPolling(); setIsPolling(true);
    pollingRef.current = setInterval(async () => {
      try {
        const { data } = await axios.get(`${API_BASE_URL}/jobs/${jobId}/status`);
        setPollStatus({ total:data.total, processed:data.processed });
        if (data.is_complete) {
          stopPolling();
          const rr = await axios.get(
            `${API_BASE_URL}/jobs/${jobId}/rankings?blind_mode=${blindMode}&limit=${rankingLimit}`);
          setRankings(rr.data);
        }
      } catch (e) { console.error(e); }
    }, 5000);
  };

  const exportToCSV = () => {
    if (!rankings.length) return;
    const headers = ['Rank','Candidate Name','Email','Semantic Score (%)','Experience (Yrs)','Final Score (%)','Matched Skills','Risk Flag'];
    const rows = rankings.map((r,i) => [i+1,r.candidate_name,r.email,
      (r.semantic_score*100).toFixed(1),r.total_experience,(r.final_score*100).toFixed(1),
      r.matched_skills.join('; '),r.risk_flag||'']);
    const esc = v => `"${String(v).replace(/"/g,'""')}"`;
    const csv = [headers,...rows].map(row => row.map(esc).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'}));
    const a = Object.assign(document.createElement('a'),{href:url,
      download:`rankings_${selectedJob.title.replace(/\s+/g,'_')}_${new Date().toISOString().split('T')[0]}.csv`});
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  const openEmailModal = (candidate = null) => {
    setEmailSingleCandidate(candidate);
    setEmailSubject(DEFAULT_SUBJECT(selectedJob?.title || 'this position'));
    setEmailBody(DEFAULT_BODY(selectedJob?.title || 'this position'));
    setEmailResult(null); setEmailSending(false); setShowEmailModal(true);
  };
  const closeEmailModal = () => { setShowEmailModal(false); setEmailSingleCandidate(null); setEmailResult(null); };

  const emailRecipients = emailSingleCandidate ? [emailSingleCandidate] : rankings.slice(0, emailTopN);

  const sendEmails = async () => {
    if (!emailRecipients.length) return;
    setEmailSending(true); setEmailResult(null);
    try {
      const { data } = await axios.post(`${API_BASE_URL}/jobs/${selectedJob.id}/send-emails`, {
        subject:emailSubject, body:emailBody, candidate_ids:emailRecipients.map(r=>r.candidate_id) });
      setEmailResult({ type:'success', ...data });
    } catch (e) {
      setEmailResult({ type:'error', message:e.response?.data?.detail || 'Failed. Check SMTP settings.' });
    } finally { setEmailSending(false); }
  };

  const displayRankings = useMemo(() => {
    if (liveAlpha === null || !rankings.length) return rankings;
    const beta = 1 - liveAlpha;
    return [...rankings]
      .map(r => ({ ...r, final_score: liveAlpha * r.semantic_score + beta * r.experience_score }))
      .sort((a, b) => b.final_score - a.final_score);
  }, [rankings, liveAlpha]);

  const isLiveMode  = liveAlpha !== null;
  const storedAlpha = selectedJob?.semantic_weight ?? 0.8;
  const biasFlags   = useMemo(() => checkJdBias(jobDescription), [jobDescription]);

  useEffect(() => { if (selectedJob) { stopPolling(); fetchRankings(); } }, [blindMode, rankingLimit, selectedJob]);
  useEffect(() => () => stopPolling(), []);

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight:'100vh', background:G.bgGradient,
        fontFamily:"'Inter','Segoe UI',system-ui,sans-serif", color:G.textPrimary,
        position:'relative', overflow:'hidden' }}>

      {/* Ambient warm glow blobs */}
      <div style={{ position:'fixed', top:'-15vh', left:'-8vw', width:'55vw', height:'55vh',
          background:'radial-gradient(ellipse, rgba(255,220,160,0.30) 0%, transparent 70%)',
          pointerEvents:'none', zIndex:0 }}/>
      <div style={{ position:'fixed', bottom:'-18vh', right:'-6vw', width:'50vw', height:'50vh',
          background:'radial-gradient(ellipse, rgba(200,150,80,0.20) 0%, transparent 70%)',
          pointerEvents:'none', zIndex:0 }}/>
      <div style={{ position:'fixed', top:'40vh', right:'20vw', width:'30vw', height:'30vh',
          background:'radial-gradient(ellipse, rgba(255,240,200,0.18) 0%, transparent 70%)',
          pointerEvents:'none', zIndex:0 }}/>

      <div style={{ maxWidth:1380, margin:'0 auto', padding:'28px', position:'relative', zIndex:1 }}>

        {/* ── HEADER ── */}
        <header className="lq lq-iri" style={{ ...glassCard(), padding:'16px 24px', marginBottom:24,
            display:'flex', alignItems:'center', justifyContent:'space-between',
            border:`1px solid ${G.glassBorderHi}` }}>
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <div style={{ width:44, height:44, borderRadius:14,
                background:`linear-gradient(135deg, ${G.accent}, ${G.accentLight})`,
                display:'flex', alignItems:'center', justifyContent:'center',
                flexShrink:0, boxShadow:G.accentGlow }}>
              <Brain size={20} color="#fff"/>
            </div>
            <div>
              <h1 style={{ margin:0, fontSize:20, fontWeight:800, color:G.textPrimary,
                  letterSpacing:'-0.03em', lineHeight:1.1 }}>AI Recruit Architect</h1>
              <p style={{ margin:'2px 0 0', fontSize:11, color:G.textMuted, fontWeight:600,
                  letterSpacing:'0.08em', textTransform:'uppercase' }}>
                Automated CV Intelligence Platform
              </p>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8,
              background:G.sageDim, border:`1px solid rgba(58,125,87,0.22)`,
              borderRadius:99, padding:'7px 16px' }}>
            <div style={{ width:7, height:7, borderRadius:'50%', background:G.sage,
                animation:'pulse 2.5s infinite' }}/>
            <span style={{ fontSize:11, fontWeight:700, color:G.sage,
                letterSpacing:'0.08em', textTransform:'uppercase' }}>System Online</span>
          </div>
        </header>

        {/* ── TWO-COLUMN LAYOUT ── */}
        <div style={{ display:'grid', gridTemplateColumns:'290px 1fr', gap:20, alignItems:'start' }}>

          {/* ── SIDEBAR ── */}
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

            {/* New Position */}
            <div className="lq lq-d1 lq-iri" style={{ ...glassCard() }}>
              <button onClick={() => setShowForm(!showForm)}
                style={{ width:'100%', padding:'14px 18px', background:'none', border:'none',
                    cursor:'pointer', display:'flex', alignItems:'center', gap:10, borderRadius:18 }}>
                <div style={{ width:30, height:30, borderRadius:9, background:G.accentDim,
                    border:`1px solid rgba(124,79,42,0.22)`, display:'flex',
                    alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <Plus size={15} color={G.accent}/>
                </div>
                <span style={{ fontWeight:700, fontSize:13, color:G.accent }}>New Position</span>
                <ChevronRight size={14} color={G.textMuted} style={{ marginLeft:'auto',
                    transform:showForm?'rotate(90deg)':'none', transition:'transform 0.2s' }}/>
              </button>

              {showForm && (
                <form onSubmit={createJob} style={{ padding:'0 16px 16px', display:'flex', flexDirection:'column', gap:10 }}>
                  <div style={{ height:1, background:G.glassBorder, marginBottom:4 }}/>

                  <input type="text" placeholder="Job Title" value={jobTitle} required
                    onChange={e => setJobTitle(e.target.value)} style={inputStyle}/>

                  {/* JD textarea + bias checker */}
                  <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
                    <textarea placeholder="Job description — include required skills and experience..."
                      value={jobDescription} required onChange={e => setJobDescription(e.target.value)}
                      style={{ ...inputStyle, resize:'vertical', minHeight:90, lineHeight:1.5,
                        borderRadius: biasFlags.length > 0 ? '10px 10px 0 0' : 10,
                        borderBottom: biasFlags.length > 0 ? 'none' : undefined,
                        borderColor: biasFlags.some(f=>f.severity==='warn')
                          ? 'rgba(196,124,42,0.5)' : G.glassBorder }}/>
                    {biasFlags.length > 0 && (
                      <div style={{ background:G.amberDim, border:`1px solid rgba(196,124,42,0.28)`,
                          borderTop:'none', borderRadius:'0 0 10px 10px',
                          padding:'8px 12px', display:'flex', flexDirection:'column', gap:6 }}>
                        {biasFlags.map((flag, i) => (
                          <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:6 }}>
                            {flag.severity === 'warn'
                              ? <AlertTriangle size={11} color={G.amber} style={{ flexShrink:0, marginTop:2 }}/>
                              : <Info size={11} color={G.textSecondary} style={{ flexShrink:0, marginTop:2 }}/>}
                            <div style={{ flex:1 }}>
                              <span style={{ fontSize:10, fontWeight:700,
                                  color:flag.severity==='warn' ? G.amber : G.textSecondary }}>
                                {flag.label}:{' '}
                              </span>
                              {flag.matches.slice(0,3).map((m,j) => (
                                <span key={j} style={{ fontSize:10, background:'rgba(255,252,248,0.70)',
                                    border:`1px solid ${G.glassBorder}`, borderRadius:4,
                                    padding:'0 4px', marginRight:3, fontFamily:'monospace',
                                    color:G.textPrimary }}>{m}</span>
                              ))}
                              <div style={{ fontSize:10, color:G.textMuted, marginTop:1 }}>{flag.tip}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                      <span style={{ fontSize:10, fontWeight:700, color:G.textMuted,
                          textTransform:'uppercase', letterSpacing:'0.08em' }}>Skill vs Experience Weight</span>
                      <span style={{ fontSize:10, fontWeight:800, color:G.accent }}>
                        {Math.round(semanticWeight*100)}% / {Math.round((1-semanticWeight)*100)}%
                      </span>
                    </div>
                    <input type="range" min="0" max="1" step="0.1" value={semanticWeight}
                      onChange={e => setSemanticWeight(parseFloat(e.target.value))}
                      style={{ width:'100%', accentColor:G.accent }}/>
                  </div>

                  <button type="submit" disabled={loading}
                    style={{ padding:'10px', borderRadius:10,
                        background:`linear-gradient(135deg, ${G.accent}, ${G.accentLight})`,
                        border:'none', color:'white', fontWeight:700, fontSize:13,
                        cursor:loading?'not-allowed':'pointer', opacity:loading?0.7:1,
                        boxShadow:G.accentGlow }}>
                    {loading ? 'Creating…' : 'Create Opening'}
                  </button>
                </form>
              )}
            </div>

            {/* Jobs list */}
            <div className="lq lq-d2 lq-iri" style={{ ...glassCard(), padding:16 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
                <Briefcase size={14} color={G.accentLight}/>
                <span style={{ fontSize:11, fontWeight:700, color:G.textMuted,
                    textTransform:'uppercase', letterSpacing:'0.1em' }}>Active Positions</span>
                <span style={{ marginLeft:'auto', background:G.accentDim,
                    border:`1px solid rgba(124,79,42,0.22)`, color:G.accent,
                    fontSize:10, fontWeight:800, padding:'2px 8px', borderRadius:99 }}>
                  {jobs.length}
                </span>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:5, maxHeight:320, overflowY:'auto' }}>
                {jobs.length === 0 && (
                  <p style={{ fontSize:12, color:G.textMuted, textAlign:'center', padding:'20px 0', fontStyle:'italic' }}>
                    No positions yet.
                  </p>
                )}
                {jobs.map(job => {
                  const active = selectedJob?.id === job.id;
                  return (
                    <div key={job.id} onClick={() => setSelectedJob(job)}
                      style={{ padding:'9px 12px', borderRadius:10, cursor:'pointer',
                          display:'flex', alignItems:'center', gap:10, transition:'all 0.15s',
                          background:active ? G.accentDim : 'transparent',
                          border:`1px solid ${active ? 'rgba(124,79,42,0.30)' : 'transparent'}` }}>
                      <div style={{ width:6, height:6, borderRadius:'50%',
                          background:active ? G.accent : G.glassBorder, flexShrink:0 }}/>
                      <span style={{ fontSize:13, fontWeight:active?700:500,
                          color:active ? G.accent : G.textSecondary, flex:1,
                          overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {job.title}
                      </span>
                      {active && <ChevronRight size={13} color={G.accent}/>}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Cohort stats */}
            {selectedJob && rankings.length > 0 && (
              <div className="lq lq-d4 lq-iri" style={{ ...glassCard(), padding:16 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
                  <TrendingUp size={14} color={G.accentLight}/>
                  <span style={{ fontSize:11, fontWeight:700, color:G.textMuted,
                      textTransform:'uppercase', letterSpacing:'0.1em' }}>Cohort Summary</span>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  {[
                    { label:'Candidates', value:rankings.length,                                                             color:G.accent },
                    { label:'Avg Score',  value:`${(rankings.reduce((s,r)=>s+r.final_score,0)/rankings.length*100).toFixed(0)}%`, color:G.accentLight },
                    { label:'Top Score',  value:`${(Math.max(...rankings.map(r=>r.final_score))*100).toFixed(0)}%`,          color:G.sage },
                    { label:'Risk Flags', value:rankings.filter(r=>r.risk_flag).length,                                      color:G.red },
                  ].map(stat => (
                    <div key={stat.label} style={{ background:'rgba(255,252,248,0.50)',
                        border:`1px solid ${G.glassBorder}`, borderRadius:10, padding:'10px 12px' }}>
                      <div style={{ fontSize:20, fontWeight:800, color:stat.color,
                          letterSpacing:'-0.03em', lineHeight:1 }}>{stat.value}</div>
                      <div style={{ fontSize:10, color:G.textMuted, fontWeight:600,
                          textTransform:'uppercase', letterSpacing:'0.06em', marginTop:3 }}>{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── MAIN CONTENT ── */}
          <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
            {!selectedJob ? (
              <div className="lq lq-d2 lq-iri" style={{ ...glassCard(), padding:80, display:'flex', flexDirection:'column',
                  alignItems:'center', justifyContent:'center', textAlign:'center', minHeight:480 }}>
                <div style={{ width:68, height:68, borderRadius:20, background:G.accentDim,
                    border:`1px solid rgba(124,79,42,0.22)`, display:'flex',
                    alignItems:'center', justifyContent:'center', marginBottom:20 }}>
                  <Briefcase size={28} color={G.accent}/>
                </div>
                <h2 style={{ margin:'0 0 8px', fontSize:20, fontWeight:800, color:G.textSecondary,
                    letterSpacing:'-0.02em' }}>No Position Selected</h2>
                <p style={{ margin:0, color:G.textMuted, fontSize:14, maxWidth:300, lineHeight:1.6 }}>
                  Select an active position from the sidebar, or create a new one to start screening candidates.
                </p>
              </div>
            ) : (
              <>
                {/* Job Header */}
                <div className="lq lq-d1 lq-iri" style={{ ...glassCard(), overflow:'hidden' }}>
                  <div style={{ height:3, background:`linear-gradient(90deg,${G.accent},${G.accentLight},transparent)` }}/>
                  <div style={{ padding:'18px 22px' }}>
                    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:20, flexWrap:'wrap' }}>
                      <div style={{ flex:1, minWidth:200 }}>
                        <span style={{ display:'inline-block', fontSize:10, fontWeight:700, color:G.accent,
                            textTransform:'uppercase', letterSpacing:'0.12em', background:G.accentDim,
                            padding:'3px 10px', borderRadius:99, marginBottom:8,
                            border:`1px solid rgba(124,79,42,0.22)` }}>Active Role</span>
                        <h2 style={{ margin:'0 0 6px', fontSize:22, fontWeight:800, color:G.textPrimary,
                            letterSpacing:'-0.03em' }}>{selectedJob.title}</h2>
                        <p style={{ margin:0, fontSize:13, color:G.textMuted, lineHeight:1.55,
                            display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
                          {selectedJob.description}
                        </p>
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:16, flexShrink:0 }}>
                        {/* Blind Mode toggle */}
                        <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:5 }}>
                          <span style={{ fontSize:9, fontWeight:700, color:G.textMuted,
                              textTransform:'uppercase', letterSpacing:'0.1em' }}>Blind Mode</span>
                          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                            {blindMode ? <EyeOff size={12} color={G.accent}/> : <Eye size={12} color={G.textMuted}/>}
                            <button onClick={() => setBlindMode(!blindMode)}
                              style={{ width:42, height:23, borderRadius:99,
                                  background:blindMode ? G.accent : 'rgba(124,79,42,0.12)',
                                  border:`1px solid ${blindMode ? G.accent : G.glassBorder}`,
                                  cursor:'pointer', position:'relative', transition:'background 0.3s' }}>
                              <div style={{ position:'absolute', top:3, width:17, height:17,
                                  background:'white', borderRadius:'50%', transition:'left 0.25s',
                                  left:blindMode?22:3, boxShadow:'0 1px 4px rgba(80,40,10,0.30)' }}/>
                            </button>
                          </div>
                        </div>
                        {/* Show limit */}
                        <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:5 }}>
                          <span style={{ fontSize:9, fontWeight:700, color:G.textMuted,
                              textTransform:'uppercase', letterSpacing:'0.1em' }}>Show</span>
                          <select value={rankingLimit} onChange={e => setRankingLimit(parseInt(e.target.value))}
                            style={{ padding:'5px 10px', borderRadius:9,
                                background:'rgba(255,252,248,0.65)', border:`1px solid ${G.glassBorder}`,
                                color:G.textPrimary, fontSize:12, fontWeight:700, outline:'none', cursor:'pointer' }}>
                            {[5,10,20,50,100].map(n => <option key={n} value={n}>Top {n}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Upload Zone */}
                <div className="lq lq-d3 lq-iri" style={{ ...glassCard(), padding:20 }}>
                  <div style={{ border:`2px dashed ${G.glassBorder}`, borderRadius:14,
                      padding:'26px 20px', textAlign:'center',
                      background:'rgba(255,252,248,0.30)' }}>
                    <div style={{ width:48, height:48, borderRadius:14, background:G.accentDim,
                        border:`1px solid rgba(124,79,42,0.22)`, display:'flex',
                        alignItems:'center', justifyContent:'center',
                        margin:'0 auto 14px' }}>
                      <FolderOpen size={20} color={G.accent}/>
                    </div>
                    <h3 style={{ margin:'0 0 4px', fontSize:15, fontWeight:800, color:G.textPrimary }}>
                      Batch CV Processing
                    </h3>
                    <p style={{ margin:'0 0 16px', fontSize:12, color:G.textMuted }}>
                      Select a folder of PDF or DOCX files — up to 50 candidates per run
                    </p>
                    <input type="file" webkitdirectory="" multiple accept=".pdf,.docx"
                      onChange={e => setFiles(e.target.files)} className="hidden" id="cv-upload"/>
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
                      <label htmlFor="cv-upload"
                        style={{ display:'inline-flex', alignItems:'center', gap:8,
                            padding:'9px 22px', borderRadius:10, background:G.glass,
                            border:`1px solid ${G.glassBorderHi}`, color:G.textPrimary,
                            fontSize:13, fontWeight:700, cursor:'pointer', boxShadow:G.shadowSm }}>
                        <FolderOpen size={14}/> Select Folder
                      </label>
                      {files.length > 0 && (
                        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
                          <div style={{ background:G.accentDim, border:`1px solid rgba(124,79,42,0.25)`,
                              borderRadius:99, padding:'4px 16px', fontSize:12, fontWeight:700, color:G.accent }}>
                            {files.length} CV{files.length!==1?'s':''} ready
                          </div>
                          <button onClick={handleFileUpload} disabled={processing}
                            style={{ display:'inline-flex', alignItems:'center', gap:8,
                                padding:'9px 26px', borderRadius:10,
                                background:`linear-gradient(135deg,${G.accent},${G.accentLight})`,
                                border:'none', color:'white', fontSize:13, fontWeight:700,
                                cursor:'pointer', boxShadow:G.accentGlow, opacity:processing?0.75:1 }}>
                            {processing ? <Loader2 size={14} style={{ animation:'spin 1s linear infinite' }}/> : <Zap size={14}/>}
                            {processing ? 'Uploading…' : 'Run Analysis'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  {isPolling && (
                    <div style={{ marginTop:14, background:'rgba(255,252,248,0.50)',
                        border:`1px solid ${G.glassBorder}`, borderRadius:12,
                        padding:'12px 16px', display:'flex', alignItems:'center', gap:12 }}>
                      <Cpu size={15} color={G.accentLight} style={{ flexShrink:0 }}/>
                      <div style={{ flex:1 }}>
                        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:7 }}>
                          <span style={{ fontSize:12, fontWeight:700, color:G.textSecondary }}>Processing CVs</span>
                          <span style={{ fontSize:12, fontWeight:800, color:G.accent }}>
                            {pollStatus.processed} / {pollStatus.total}
                          </span>
                        </div>
                        <MiniBar
                          value={pollStatus.total > 0 ? (pollStatus.processed/pollStatus.total)*100 : 0}
                          color={G.accent}/>
                      </div>
                    </div>
                  )}
                </div>

                {/* Rankings */}
                <div className="lq lq-d5 lq-iri" style={{ ...glassCard(), overflow:'hidden' }}>
                  {/* Toolbar */}
                  <div style={{ padding:'14px 20px', borderBottom:`1px solid ${G.glassBorder}`,
                      background:'rgba(255,252,248,0.40)' }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
                        marginBottom:rankings.length > 0 ? 12 : 0 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{ width:30, height:30, borderRadius:9, background:G.accentDim,
                            display:'flex', alignItems:'center', justifyContent:'center' }}>
                          <BarChart3 size={15} color={G.accent}/>
                        </div>
                        <span style={{ fontSize:14, fontWeight:800, color:G.textPrimary }}>
                          Candidate Rankings
                        </span>
                        {rankings.length > 0 && (
                          <span style={{ fontSize:11, color:G.textMuted }}>({rankings.length})</span>
                        )}
                        {isLiveMode && (
                          <span style={{ fontSize:9, fontWeight:800,
                              background:`linear-gradient(135deg,${G.accent},${G.accentLight})`,
                              color:'white', padding:'3px 9px', borderRadius:99,
                              textTransform:'uppercase', letterSpacing:'0.08em',
                              animation:'pulse 2s infinite' }}>
                            Live Preview
                          </span>
                        )}
                      </div>
                      <div style={{ display:'flex', gap:8 }}>
                        {rankings.length > 0 && (
                          <button onClick={() => openEmailModal()}
                            style={{ display:'inline-flex', alignItems:'center', gap:6,
                                padding:'6px 14px', borderRadius:8,
                                background:`linear-gradient(135deg,${G.accent},${G.accentLight})`,
                                border:'none', color:'white', fontSize:11, fontWeight:700,
                                cursor:'pointer', boxShadow:G.accentGlow }}>
                            <Mail size={12}/> Notify Shortlist
                          </button>
                        )}
                        {rankings.length > 0 && (
                          <button onClick={exportToCSV}
                            style={{ display:'inline-flex', alignItems:'center', gap:6,
                                padding:'6px 14px', borderRadius:8, background:G.sageDim,
                                border:`1px solid rgba(58,125,87,0.22)`, color:G.sage,
                                fontSize:11, fontWeight:700, cursor:'pointer' }}>
                            <Download size={12}/> Export CSV
                          </button>
                        )}
                        <button onClick={fetchRankings} disabled={loading}
                          style={{ display:'inline-flex', alignItems:'center', gap:6,
                              padding:'6px 14px', borderRadius:8, background:G.glass,
                              border:`1px solid ${G.glassBorder}`, color:G.textSecondary,
                              fontSize:11, fontWeight:700, cursor:'pointer' }}>
                          <RefreshCw size={11} style={loading?{animation:'spin 1s linear infinite'}:{}}/> Refresh
                        </button>
                      </div>
                    </div>

                    {/* Live re-ranking slider */}
                    {rankings.length > 0 && (
                      <div className="lq lq-d1" style={{ ...glassCard({ background:'rgba(255,252,248,0.45)' }),
                          padding:'10px 16px', display:'flex', alignItems:'center', gap:14,
                          border:`1px solid ${isLiveMode ? 'rgba(124,79,42,0.40)' : G.glassBorder}`,
                          boxShadow: isLiveMode ? G.accentGlow : 'none',
                          transition:'border-color 0.2s, box-shadow 0.2s' }}>
                        <SlidersHorizontal size={14} color={isLiveMode ? G.accent : G.textMuted} style={{ flexShrink:0 }}/>
                        <div style={{ flex:1 }}>
                          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                            <span style={{ fontSize:10, fontWeight:700, color:G.textSecondary,
                                textTransform:'uppercase', letterSpacing:'0.08em' }}>
                              Live Re-rank — Skill vs Experience
                            </span>
                            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                              <span style={{ fontSize:11, fontWeight:800, color:G.accent }}>
                                {Math.round((liveAlpha ?? storedAlpha) * 100)}% skill / {Math.round((1 - (liveAlpha ?? storedAlpha)) * 100)}% exp
                              </span>
                              {isLiveMode && (
                                <button onClick={() => setLiveAlpha(null)}
                                  style={{ fontSize:10, fontWeight:700, color:G.textMuted,
                                      background:'none', border:`1px solid ${G.glassBorder}`,
                                      borderRadius:6, padding:'2px 8px', cursor:'pointer' }}>
                                  Reset
                                </button>
                              )}
                            </div>
                          </div>
                          <input type="range" min="0" max="1" step="0.05"
                            value={liveAlpha ?? storedAlpha}
                            onChange={e => setLiveAlpha(parseFloat(e.target.value))}
                            style={{ width:'100%', accentColor:G.accent }}/>
                          <div style={{ display:'flex', justifyContent:'space-between', marginTop:3 }}>
                            <span style={{ fontSize:9, color:G.textMuted }}>Skill-only</span>
                            <span style={{ fontSize:9, color:G.textMuted, fontStyle:'italic' }}>
                              Drag to preview re-ranked results instantly
                            </span>
                            <span style={{ fontSize:9, color:G.textMuted }}>Exp-only</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Column headers */}
                  {rankings.length > 0 && (
                    <div style={{ display:'grid',
                        gridTemplateColumns:'56px 1fr 140px 110px 110px 1fr 70px',
                        padding:'9px 20px', borderBottom:`1px solid ${G.glassBorder}`,
                        background:'rgba(255,252,248,0.30)' }}>
                      {['Rank','Candidate','Skill Match','Experience','Final Score','Skills & Signals',''].map(h => (
                        <span key={h} style={{ fontSize:9, fontWeight:700, color:G.textMuted,
                            textTransform:'uppercase', letterSpacing:'0.1em' }}>{h}</span>
                      ))}
                    </div>
                  )}

                  {/* Rows */}
                  <div>
                    {rankings.length === 0 ? (
                      <div style={{ padding:'60px 20px', textAlign:'center',
                          display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
                        <div style={{ width:52, height:52, borderRadius:16, background:G.accentDim,
                            border:`1px solid rgba(124,79,42,0.18)`, display:'flex',
                            alignItems:'center', justifyContent:'center' }}>
                          <Users size={22} color={G.accentLight}/>
                        </div>
                        <p style={{ margin:0, fontSize:13, color:G.textSecondary, fontWeight:600 }}>
                          No candidate data yet
                        </p>
                        <p style={{ margin:0, fontSize:12, color:G.textMuted }}>
                          Upload a folder of CVs above to begin
                        </p>
                      </div>
                    ) : displayRankings.map((r, idx) => {
                      const rankCfg  = RANK_CONFIG[idx] || null;
                      const finalPct = r.final_score    * 100;
                      const semPct   = r.semantic_score * 100;
                      const expPct   = Math.min(r.total_experience / 10 * 100, 100);
                      return (
                        <div key={r.candidate_id ?? idx}
                          onClick={() => { setSelectedCandidate(r); setSelectedCandidateIdx(idx); }}
                          style={{ display:'grid',
                              gridTemplateColumns:'56px 1fr 140px 110px 110px 1fr 70px',
                              padding:'14px 20px', borderBottom:`1px solid ${G.glassBorder}`,
                              alignItems:'center', cursor:'pointer', transition:'background 0.15s',
                              background: rankCfg ? 'rgba(255,252,248,0.35)' : 'transparent',
                              borderLeft:`3px solid ${rankCfg ? rankCfg.border : 'transparent'}` }}
                          onMouseEnter={e => e.currentTarget.style.background='rgba(255,252,248,0.65)'}
                          onMouseLeave={e => e.currentTarget.style.background=rankCfg?'rgba(255,252,248,0.35)':'transparent'}>

                          {/* Rank badge */}
                          <div>
                            {rankCfg ? (
                              <div style={{ width:32, height:32, borderRadius:10,
                                  background:rankCfg.badgeBg, display:'flex',
                                  alignItems:'center', justifyContent:'center',
                                  boxShadow:rankCfg.glow }}>
                                <Award size={15} color="white"/>
                              </div>
                            ) : (
                              <div style={{ width:32, height:32, borderRadius:10,
                                  background:'rgba(255,252,248,0.60)',
                                  border:`1px solid ${G.glassBorder}`, display:'flex',
                                  alignItems:'center', justifyContent:'center' }}>
                                <span style={{ fontSize:12, fontWeight:800, color:G.textMuted }}>{idx+1}</span>
                              </div>
                            )}
                          </div>

                          {/* Candidate info */}
                          <div style={{ display:'flex', flexDirection:'column', gap:3, paddingRight:14 }}>
                            <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                              <span style={{ fontSize:13, fontWeight:700, color:G.textPrimary }}>{r.candidate_name}</span>
                              {r.risk_flag && (
                                <div title={`${r.risk_flag} — Variance: ${(r.similarity_variance*100).toFixed(1)}%`}
                                  style={{ display:'inline-flex', alignItems:'center', gap:4,
                                      background:G.redDim, border:`1px solid rgba(176,52,31,0.25)`,
                                      borderRadius:99, padding:'2px 7px', cursor:'help' }}>
                                  <ShieldAlert size={10} color={G.red}/>
                                  <span style={{ fontSize:9, fontWeight:700, color:G.red, textTransform:'uppercase' }}>Risk</span>
                                </div>
                              )}
                              {!r.risk_flag && r.similarity_variance > 0 && (
                                <ShieldCheck size={12} color={G.sage} style={{ opacity:0.7 }}/>
                              )}
                            </div>
                            <span style={{ fontSize:11, color:G.textMuted }}>{r.email}</span>
                          </div>

                          {/* Skill match */}
                          <div style={{ paddingRight:14 }}>
                            <span style={{ fontSize:11, fontWeight:800, display:'block', marginBottom:5,
                                color:semPct>=70 ? G.sage : G.textMuted }}>
                              {semPct.toFixed(1)}%
                            </span>
                            <MiniBar value={semPct} color={semPct>=70 ? G.sage : 'rgba(124,79,42,0.20)'}/>
                          </div>

                          {/* Experience */}
                          <div style={{ paddingRight:14 }}>
                            <span style={{ fontSize:11, fontWeight:800, color:G.textSecondary,
                                display:'block', marginBottom:5 }}>{r.total_experience} yrs</span>
                            <MiniBar value={expPct} color={G.accentLight}/>
                          </div>

                          {/* Score ring */}
                          <div><ScoreRing score={finalPct} size={48}/></div>

                          {/* Skills */}
                          <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                            <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                              {r.matched_skills.slice(0,5).map((s,i) => (
                                <span key={i} style={{ fontSize:9, fontWeight:700, textTransform:'uppercase',
                                    letterSpacing:'0.04em', background:G.sageDim,
                                    border:`1px solid rgba(58,125,87,0.20)`, color:G.sage,
                                    padding:'2px 7px', borderRadius:99 }}>{s}</span>
                              ))}
                              {r.matched_skills.length > 5 && (
                                <span style={{ fontSize:9, color:G.textMuted, alignSelf:'center' }}>
                                  +{r.matched_skills.length-5}
                                </span>
                              )}
                            </div>
                            {r.missing_skills.length > 0 && (
                              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                                {r.missing_skills.slice(0,3).map((s,i) => (
                                  <span key={i} style={{ fontSize:9, color:G.textMuted, fontStyle:'italic' }}>· {s}</span>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Action buttons */}
                          <div style={{ display:'flex', justifyContent:'center', gap:5 }}>
                            <button onClick={e => { e.stopPropagation(); setSelectedCandidate(r); setSelectedCandidateIdx(idx); }}
                              title="View full profile"
                              style={{ width:28, height:28, borderRadius:8, background:G.accentDim,
                                  border:`1px solid rgba(124,79,42,0.22)`, display:'flex',
                                  alignItems:'center', justifyContent:'center', cursor:'pointer',
                                  transition:'all 0.15s', flexShrink:0 }}
                              onMouseEnter={e => e.currentTarget.style.boxShadow=G.accentGlow}
                              onMouseLeave={e => e.currentTarget.style.boxShadow='none'}>
                              <Layers size={12} color={G.accent}/>
                            </button>
                            <button onClick={e => { e.stopPropagation(); openEmailModal(r); }}
                              title={`Email ${r.candidate_name}`}
                              style={{ width:28, height:28, borderRadius:8, background:G.accentDim,
                                  border:`1px solid rgba(124,79,42,0.22)`, display:'flex',
                                  alignItems:'center', justifyContent:'center', cursor:'pointer',
                                  transition:'all 0.15s', flexShrink:0 }}
                              onMouseEnter={e => e.currentTarget.style.boxShadow=G.accentGlow}
                              onMouseLeave={e => e.currentTarget.style.boxShadow='none'}>
                              <Mail size={12} color={G.accent}/>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── FOOTER ── */}
        <footer style={{ marginTop:36, paddingTop:20, borderTop:`1px solid ${G.glassBorder}`,
            display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:10 }}>
          <span style={{ fontSize:11, color:G.textMuted, fontWeight:600 }}>
            © 2026 AI Recruit Architect — Academic Defence Edition
          </span>
          <div style={{ display:'flex', gap:20 }}>
            {['FastAPI','Sentence-BERT','PostgreSQL','React 19'].map(t => (
              <span key={t} style={{ fontSize:10, color:G.textMuted, fontWeight:700,
                  textTransform:'uppercase', letterSpacing:'0.1em' }}>{t}</span>
            ))}
          </div>
        </footer>
      </div>

      {/* ── CANDIDATE DETAIL MODAL ── */}
      {selectedCandidate && (
        <CandidateDetailModal
          candidate={selectedCandidate}
          rank={selectedCandidateIdx}
          jobTitle={selectedJob?.title || ''}
          onClose={() => { setSelectedCandidate(null); setSelectedCandidateIdx(null); }}
        />
      )}

      {/* ── EMAIL MODAL ── */}
      {showEmailModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(80,45,15,0.35)',
            backdropFilter:'blur(6px)', WebkitBackdropFilter:'blur(6px)', zIndex:200,
            display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}
          onClick={e => { if (e.target===e.currentTarget) closeEmailModal(); }}>
          <div className="lq lq-d4 lq-iri" style={{ ...glassCard(), background:'rgba(255,252,248,0.88)',
              backdropFilter:blur, WebkitBackdropFilter:blur, width:'100%', maxWidth:620,
              boxShadow:G.shadowLg, overflow:'hidden', display:'flex',
              flexDirection:'column', maxHeight:'90vh',
              border:`1px solid ${G.glassBorderHi}` }}>

            {/* Modal header */}
            <div style={{ padding:'18px 24px', borderBottom:`1px solid ${G.glassBorder}`,
                background:'rgba(255,252,248,0.55)', display:'flex',
                alignItems:'center', gap:14, flexShrink:0 }}>
              <div style={{ width:38, height:38, borderRadius:11,
                  background:`linear-gradient(135deg,${G.accent},${G.accentLight})`,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  flexShrink:0, boxShadow:G.accentGlow }}>
                <Mail size={17} color="white"/>
              </div>
              <div style={{ flex:1 }}>
                <h3 style={{ margin:0, fontSize:16, fontWeight:800, color:G.textPrimary, letterSpacing:'-0.02em' }}>
                  {emailSingleCandidate ? `Email ${emailSingleCandidate.candidate_name}` : 'Notify Shortlisted Candidates'}
                </h3>
                <p style={{ margin:'2px 0 0', fontSize:12, color:G.textMuted }}>
                  {emailSingleCandidate ? 'Send a personalised interview invitation' : 'Send interview invitations to your top candidates'}
                </p>
              </div>
              <button onClick={closeEmailModal}
                style={{ width:30, height:30, borderRadius:8, background:'rgba(124,79,42,0.08)',
                    border:`1px solid ${G.glassBorder}`, display:'flex',
                    alignItems:'center', justifyContent:'center', cursor:'pointer',
                    color:G.textMuted, flexShrink:0 }}>
                <X size={14}/>
              </button>
            </div>

            {/* Modal body */}
            <div style={{ padding:'20px 24px', overflowY:'auto', display:'flex', flexDirection:'column', gap:16 }}>
              {!emailSingleCandidate && (
                <div>
                  <label style={{ display:'block', fontSize:11, fontWeight:700, color:G.textSecondary,
                      textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>Send To</label>
                  <select value={emailTopN} onChange={e => setEmailTopN(parseInt(e.target.value))}
                    style={{ ...inputStyle }}>
                    {[5,10,20,50,100].map(n => {
                      const av = Math.min(n, rankings.length);
                      return <option key={n} value={n}>Top {n} Candidates ({av} available)</option>;
                    })}
                  </select>
                </div>
              )}
              <div>
                <label style={{ display:'block', fontSize:11, fontWeight:700, color:G.textSecondary,
                    textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>
                  Recipients — {emailRecipients.length} candidate{emailRecipients.length!==1?'s':''}
                </label>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6, padding:'10px 12px',
                    background:'rgba(255,252,248,0.50)', border:`1px solid ${G.glassBorder}`,
                    borderRadius:10, maxHeight:100, overflowY:'auto' }}>
                  {emailRecipients.length === 0
                    ? <span style={{ fontSize:12, color:G.textMuted, fontStyle:'italic' }}>No candidates available.</span>
                    : emailRecipients.map((r,i) => (
                      <div key={i} style={{ display:'inline-flex', alignItems:'center', gap:5,
                          background:G.accentDim, border:`1px solid rgba(124,79,42,0.22)`,
                          borderRadius:99, padding:'3px 10px' }}>
                        <div style={{ width:5, height:5, borderRadius:'50%', background:G.accent }}/>
                        <span style={{ fontSize:11, fontWeight:600, color:G.textPrimary }}>{r.candidate_name}</span>
                        <span style={{ fontSize:10, color:G.textMuted }}>· {r.email}</span>
                      </div>
                    ))}
                </div>
              </div>
              <div>
                <label style={{ display:'block', fontSize:11, fontWeight:700, color:G.textSecondary,
                    textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>Subject</label>
                <input type="text" value={emailSubject} onChange={e => setEmailSubject(e.target.value)}
                  style={inputStyle}/>
              </div>
              <div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:6 }}>
                  <label style={{ fontSize:11, fontWeight:700, color:G.textSecondary,
                      textTransform:'uppercase', letterSpacing:'0.08em' }}>Message Body</label>
                  <span style={{ fontSize:10, color:G.textMuted }}>
                    Use{' '}
                    <code style={{ background:G.accentDim, padding:'1px 5px', borderRadius:4,
                        fontFamily:'monospace', color:G.accent }}>{'{{name}}'}</code>{' '}to personalise
                  </span>
                </div>
                <textarea value={emailBody} onChange={e => setEmailBody(e.target.value)} rows={11}
                  style={{ ...inputStyle, resize:'vertical', lineHeight:1.7,
                      fontFamily:"'Georgia',serif", borderRadius:10 }}/>
              </div>

              {emailResult?.type === 'success' && (
                <div style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'12px 14px',
                    background:G.sageDim, border:`1px solid rgba(58,125,87,0.22)`, borderRadius:10 }}>
                  <CheckCircle size={16} color={G.sage} style={{ flexShrink:0, marginTop:1 }}/>
                  <div>
                    <p style={{ margin:0, fontSize:13, fontWeight:700, color:G.sage }}>
                      {emailResult.sent} email{emailResult.sent!==1?'s':''} sent successfully
                    </p>
                    {emailResult.failed > 0 && (
                      <p style={{ margin:'4px 0 0', fontSize:12, color:G.textSecondary }}>
                        {emailResult.failed} failed — check SMTP credentials
                      </p>
                    )}
                  </div>
                </div>
              )}
              {emailResult?.type === 'error' && (
                <div style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'12px 14px',
                    background:G.redDim, border:`1px solid rgba(176,52,31,0.22)`, borderRadius:10 }}>
                  <AlertCircle size={16} color={G.red} style={{ flexShrink:0, marginTop:1 }}/>
                  <div>
                    <p style={{ margin:0, fontSize:13, fontWeight:700, color:G.red }}>Failed to send emails</p>
                    <p style={{ margin:'4px 0 0', fontSize:12, color:G.textSecondary }}>{emailResult.message}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div style={{ padding:'16px 24px', borderTop:`1px solid ${G.glassBorder}`,
                background:'rgba(255,252,248,0.55)', display:'flex',
                justifyContent:'flex-end', gap:10, flexShrink:0 }}>
              <button onClick={closeEmailModal}
                style={{ padding:'9px 20px', borderRadius:10,
                    background:'rgba(124,79,42,0.08)', border:`1px solid ${G.glassBorder}`,
                    color:G.textSecondary, fontSize:13, fontWeight:600, cursor:'pointer' }}>
                {emailResult?.type === 'success' ? 'Close' : 'Cancel'}
              </button>
              <button onClick={sendEmails} disabled={emailSending || emailRecipients.length === 0}
                style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'9px 24px',
                    borderRadius:10,
                    background: emailRecipients.length === 0
                      ? 'rgba(124,79,42,0.10)'
                      : `linear-gradient(135deg,${G.accent},${G.accentLight})`,
                    border:'none', color:'white', fontSize:13, fontWeight:700,
                    cursor: emailRecipients.length === 0 ? 'not-allowed' : 'pointer',
                    boxShadow: emailRecipients.length > 0 ? G.accentGlow : 'none',
                    opacity: emailSending ? 0.75 : 1 }}>
                {emailSending ? <Loader2 size={14} style={{ animation:'spin 1s linear infinite' }}/> : <Send size={14}/>}
                {emailSending ? 'Sending…' : `Send to ${emailRecipients.length} Candidate${emailRecipients.length!==1?'s':''}`}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        * { box-sizing: border-box; }
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.45; } }
        body { margin:0; }
        ::-webkit-scrollbar { width:5px; }
        ::-webkit-scrollbar-track { background:rgba(124,79,42,0.05); }
        ::-webkit-scrollbar-thumb { background:rgba(124,79,42,0.22); border-radius:99px; }
        select option { background:#F4EDE3; color:#2C1A0E; }
        input[type=range] { appearance:none; -webkit-appearance:none; height:4px;
          background:rgba(124,79,42,0.18); border-radius:99px; cursor:pointer; outline:none; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance:none; width:14px; height:14px;
          border-radius:50%; background:${G.accent}; cursor:pointer;
          box-shadow: 0 1px 4px rgba(80,40,10,0.30); }
        input::placeholder, textarea::placeholder { color:rgba(80,48,18,0.38); }
        .hidden { display:none; }
        ${liquidGlassCSS}
      `}</style>
    </div>
  );
}
