import React, { useState } from 'react';
import { Brain, Mail, Lock, ArrowRight, Eye, EyeOff, ChevronLeft, AlertCircle } from 'lucide-react';
import { G, glassCard, liquidGlassCSS } from './theme.js';

const DEMO_EMAIL    = 'demo@recruitarchitect.ai';
const DEMO_PASSWORD = 'demo1234';

export default function LoginPage({ onLogin, onBack }) {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 900));
    if (email === DEMO_EMAIL && password === DEMO_PASSWORD) {
      onLogin();
    } else {
      setError('Invalid credentials. Use the demo account below.');
    }
    setLoading(false);
  };

  const fillDemo = () => { setEmail(DEMO_EMAIL); setPassword(DEMO_PASSWORD); setError(''); };

  const inp = {
    width: '100%', padding: '11px 14px 11px 42px',
    borderRadius: 12, background: 'rgba(255,252,248,0.65)',
    border: `1px solid ${G.glassBorder}`, color: G.textPrimary,
    fontSize: 14, outline: 'none', boxSizing: 'border-box',
    backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  };

  return (
    <div style={{ minHeight: '100vh', background: G.bgGradient,
        fontFamily: "'Inter','Segoe UI',system-ui,sans-serif",
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', overflow: 'hidden', padding: 24 }}>

      {/* Ambient warm blobs */}
      <div style={{ position:'fixed', top:'-20vh', left:'-10vw', width:'60vw', height:'60vh',
          background:'radial-gradient(ellipse, rgba(255,220,160,0.32) 0%, transparent 70%)',
          pointerEvents:'none' }}/>
      <div style={{ position:'fixed', bottom:'-18vh', right:'-6vw', width:'50vw', height:'50vh',
          background:'radial-gradient(ellipse, rgba(200,150,80,0.20) 0%, transparent 70%)',
          pointerEvents:'none' }}/>

      <div style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 1 }}>

        {/* Back link */}
        <button onClick={onBack}
          style={{ display:'inline-flex', alignItems:'center', gap:6, marginBottom:28,
              background:'none', border:'none', cursor:'pointer',
              color:G.textMuted, fontSize:13, fontWeight:600, padding:0 }}>
          <ChevronLeft size={15}/>
          Back to home
        </button>

        {/* Card */}
        <div className="lq lq-iri"
          style={{ ...glassCard(), padding: '40px 36px', background: 'rgba(255,252,248,0.72)' }}>

          {/* Logo */}
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', marginBottom:32 }}>
            <div style={{ width:56, height:56, borderRadius:18,
                background:`linear-gradient(135deg, ${G.accent}, ${G.accentLight})`,
                display:'flex', alignItems:'center', justifyContent:'center',
                boxShadow:`${G.accentGlow}, inset 0 1px 0 rgba(255,255,255,0.3)`,
                marginBottom:16 }}>
              <Brain size={26} color="#fff"/>
            </div>
            <h1 style={{ margin:0, fontSize:22, fontWeight:800, color:G.textPrimary,
                letterSpacing:'-0.03em' }}>Welcome back</h1>
            <p style={{ margin:'6px 0 0', fontSize:14, color:G.textMuted, textAlign:'center' }}>
              Sign in to AI Recruit Architect
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>

            {/* Email */}
            <div style={{ position:'relative' }}>
              <Mail size={15} color={G.textMuted} style={{ position:'absolute', left:13, top:'50%',
                  transform:'translateY(-50%)', pointerEvents:'none' }}/>
              <input type="email" placeholder="Email address" value={email} required
                onChange={e => setEmail(e.target.value)}
                onFocus={e => { e.target.style.borderColor = G.accentLight; e.target.style.boxShadow = G.accentGlow; }}
                onBlur={e => { e.target.style.borderColor = G.glassBorder; e.target.style.boxShadow = 'none'; }}
                style={inp}/>
            </div>

            {/* Password */}
            <div style={{ position:'relative' }}>
              <Lock size={15} color={G.textMuted} style={{ position:'absolute', left:13, top:'50%',
                  transform:'translateY(-50%)', pointerEvents:'none' }}/>
              <input type={showPw ? 'text' : 'password'} placeholder="Password" value={password} required
                onChange={e => setPassword(e.target.value)}
                onFocus={e => { e.target.style.borderColor = G.accentLight; e.target.style.boxShadow = G.accentGlow; }}
                onBlur={e => { e.target.style.borderColor = G.glassBorder; e.target.style.boxShadow = 'none'; }}
                style={{ ...inp, paddingRight: 42 }}/>
              <button type="button" onClick={() => setShowPw(!showPw)}
                style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)',
                    background:'none', border:'none', cursor:'pointer', color:G.textMuted, padding:2 }}>
                {showPw ? <EyeOff size={15}/> : <Eye size={15}/>}
              </button>
            </div>

            {/* Error */}
            {error && (
              <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 13px',
                  background:G.redDim, border:`1px solid rgba(176,52,31,0.22)`,
                  borderRadius:10, color:G.red }}>
                <AlertCircle size={14} style={{ flexShrink:0 }}/>
                <span style={{ fontSize:12, fontWeight:600 }}>{error}</span>
              </div>
            )}

            {/* Submit */}
            <button type="submit" disabled={loading}
              style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                  padding:'12px', borderRadius:12, marginTop:4,
                  background:`linear-gradient(135deg, ${G.accent}, ${G.accentLight})`,
                  border:'none', color:'white', fontSize:14, fontWeight:700,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.8 : 1,
                  boxShadow:`${G.accentGlow}, inset 0 1px 0 rgba(255,255,255,0.20)`,
                  transition:'opacity 0.2s, transform 0.15s' }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.transform='translateY(-1px)'; }}
              onMouseLeave={e => e.currentTarget.style.transform='none'}>
              {loading
                ? <span style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ width:16, height:16, border:'2px solid rgba(255,255,255,0.4)',
                        borderTopColor:'white', borderRadius:'50%', animation:'spin 0.8s linear infinite',
                        display:'inline-block' }}/>
                    Signing in…
                  </span>
                : <><span>Sign In</span><ArrowRight size={15}/></>}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display:'flex', alignItems:'center', gap:12, margin:'24px 0' }}>
            <div style={{ flex:1, height:1, background:G.glassBorder }}/>
            <span style={{ fontSize:11, color:G.textMuted, fontWeight:600,
                textTransform:'uppercase', letterSpacing:'0.08em' }}>Demo Access</span>
            <div style={{ flex:1, height:1, background:G.glassBorder }}/>
          </div>

          {/* Demo credentials box */}
          <div className="lq" style={{ ...glassCard({ background:'rgba(255,252,248,0.50)' }),
              padding:'14px 16px', cursor:'pointer' }} onClick={fillDemo}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
              <span style={{ fontSize:11, fontWeight:700, color:G.accentLight,
                  textTransform:'uppercase', letterSpacing:'0.08em' }}>Click to auto-fill demo credentials</span>
              <ArrowRight size={12} color={G.accentLight}/>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
              <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                <span style={{ fontSize:11, color:G.textMuted, width:60 }}>Email</span>
                <code style={{ fontSize:12, fontWeight:600, color:G.textPrimary,
                    background:'rgba(124,79,42,0.08)', padding:'2px 8px', borderRadius:6 }}>
                  {DEMO_EMAIL}
                </code>
              </div>
              <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                <span style={{ fontSize:11, color:G.textMuted, width:60 }}>Password</span>
                <code style={{ fontSize:12, fontWeight:600, color:G.textPrimary,
                    background:'rgba(124,79,42,0.08)', padding:'2px 8px', borderRadius:6 }}>
                  {DEMO_PASSWORD}
                </code>
              </div>
            </div>
          </div>
        </div>

        <p style={{ textAlign:'center', marginTop:20, fontSize:12, color:G.textMuted }}>
          Final Year Project — Academic Demonstration System
        </p>
      </div>

      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; }
        @keyframes spin { to { transform: rotate(360deg); } }
        ${liquidGlassCSS}
        input::placeholder { color: rgba(80,48,18,0.38); }
      `}</style>
    </div>
  );
}
