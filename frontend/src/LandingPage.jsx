import React, { useEffect, useRef, useState } from 'react';
import {
  Brain, Zap, ShieldCheck, BarChart3, Mail, Eye,
  ArrowRight, ChevronDown, Users, Briefcase, Award,
  TrendingUp, CheckCircle, Star, FileText, Target, Cpu
} from 'lucide-react';
import { G, glassCard, liquidGlassCSS } from './theme.js';

// ── ANIMATED COUNTER ──────────────────────────────────────────────────────────
function Counter({ target, suffix = '', duration = 1800 }) {
  const [val, setVal]   = useState(0);
  const [ran, setRan]   = useState(false);
  const ref             = useRef(null);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !ran) { setRan(true); obs.disconnect(); }
    }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [ran]);

  useEffect(() => {
    if (!ran) return;
    const steps = 60;
    const inc   = target / steps;
    let cur     = 0;
    const id = setInterval(() => {
      cur += inc;
      if (cur >= target) { setVal(target); clearInterval(id); }
      else setVal(Math.floor(cur));
    }, duration / steps);
    return () => clearInterval(id);
  }, [ran, target, duration]);

  return <span ref={ref}>{val}{suffix}</span>;
}

// ── MINI SCORE RING ──────────────────────────────────────────────────────────
function Ring({ score, size = 40 }) {
  const sw = 3.5, r = (size - sw * 2) / 2, c = 2 * Math.PI * r;
  const color = score >= 70 ? G.sage : score >= 50 ? G.gold : G.red;
  return (
    <div style={{ position:'relative', width:size, height:size, flexShrink:0 }}>
      <svg width={size} height={size} style={{ transform:'rotate(-90deg)', display:'block' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(124,79,42,0.12)" strokeWidth={sw}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={sw}
          strokeDasharray={c} strokeDashoffset={c - (score/100)*c} strokeLinecap="round"
          style={{ transition:'stroke-dashoffset 1.4s cubic-bezier(0.4,0,0.2,1)' }}/>
      </svg>
      <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center',
          justifyContent:'center', fontSize:10, fontWeight:800, color }}>
        {score}
      </div>
    </div>
  );
}

// ── MOCK DASHBOARD CARD ───────────────────────────────────────────────────────
const MOCK = [
  { name:'Alexandra Chen',  score:91, sem:94, exp:88, skills:['Python','ML','SQL'],   risk:false },
  { name:'James O\'Brien',  score:76, sem:79, exp:73, skills:['React','Node','AWS'],   risk:false },
  { name:'Sarah Okonkwo',   score:62, sem:58, exp:66, skills:['Java','Spring','Git'],  risk:true  },
];

function MockDashboard() {
  return (
    <div className="lq lq-d2 lq-iri" style={{ ...glassCard({ background:'rgba(255,252,248,0.72)' }),
        width:'100%', maxWidth:480, overflow:'hidden' }}>

      {/* Header bar */}
      <div style={{ padding:'14px 18px', borderBottom:`1px solid ${G.glassBorder}`,
          background:'rgba(255,252,248,0.45)', display:'flex', alignItems:'center',
          justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:26, height:26, borderRadius:8, background:G.accentDim,
              display:'flex', alignItems:'center', justifyContent:'center' }}>
            <BarChart3 size={13} color={G.accent}/>
          </div>
          <span style={{ fontSize:13, fontWeight:800, color:G.textPrimary }}>Live Rankings</span>
          <span style={{ fontSize:10, background:`linear-gradient(135deg,${G.accent},${G.accentLight})`,
              color:'#fff', padding:'2px 8px', borderRadius:99, fontWeight:700 }}>3 candidates</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:5, background:G.sageDim,
            border:`1px solid rgba(58,125,87,0.20)`, borderRadius:99, padding:'4px 10px' }}>
          <div style={{ width:6, height:6, borderRadius:'50%', background:G.sage,
              animation:'pulse 2s infinite' }}/>
          <span style={{ fontSize:10, fontWeight:700, color:G.sage }}>AI Processing</span>
        </div>
      </div>

      {/* Column headers */}
      <div style={{ display:'grid', gridTemplateColumns:'26px 1fr 50px 50px',
          padding:'7px 18px', background:'rgba(255,252,248,0.28)',
          borderBottom:`1px solid ${G.glassBorder}` }}>
        {['#','Candidate','Score','Match'].map(h => (
          <span key={h} style={{ fontSize:9, fontWeight:700, color:G.textMuted,
              textTransform:'uppercase', letterSpacing:'0.1em' }}>{h}</span>
        ))}
      </div>

      {/* Rows */}
      {MOCK.map((c, i) => (
        <div key={i} style={{ display:'grid', gridTemplateColumns:'26px 1fr 50px 50px',
            padding:'12px 18px', borderBottom: i < MOCK.length-1 ? `1px solid ${G.glassBorder}` : 'none',
            alignItems:'center',
            borderLeft:`3px solid ${i===0?G.gold:i===1?'rgba(140,130,100,0.6)':G.accentLight}`,
            background: i === 0 ? 'rgba(255,252,248,0.40)' : 'transparent' }}>
          <div style={{ width:20, height:20, borderRadius:6, fontSize:11, fontWeight:800,
              background: i===0 ? `linear-gradient(135deg,#8B6508,#D4A017)` :
                          i===1 ? 'linear-gradient(135deg,#7A7060,#AEA898)' :
                                  `linear-gradient(135deg,${G.accent},${G.accentLight})`,
              color:'#fff', display:'flex', alignItems:'center', justifyContent:'center' }}>
            {i+1}
          </div>
          <div style={{ paddingRight:10 }}>
            <div style={{ display:'flex', alignItems:'center', gap:5 }}>
              <span style={{ fontSize:12, fontWeight:700, color:G.textPrimary }}>{c.name}</span>
              {c.risk && (
                <span style={{ fontSize:8, fontWeight:700, background:G.redDim,
                    color:G.red, border:`1px solid rgba(176,52,31,0.22)`,
                    padding:'1px 5px', borderRadius:99 }}>Risk</span>
              )}
            </div>
            <div style={{ display:'flex', gap:4, marginTop:3, flexWrap:'wrap' }}>
              {c.skills.map((s,j) => (
                <span key={j} style={{ fontSize:8, fontWeight:700, background:G.sageDim,
                    border:`1px solid rgba(58,125,87,0.18)`, color:G.sage,
                    padding:'1px 6px', borderRadius:99, textTransform:'uppercase' }}>{s}</span>
              ))}
            </div>
          </div>
          <Ring score={c.score}/>
          <div style={{ fontSize:11, fontWeight:700,
              color:c.sem>=80?G.sage:c.sem>=60?G.amber:G.red }}>{c.sem}%</div>
        </div>
      ))}

      {/* Footer stats */}
      <div style={{ padding:'10px 18px', background:'rgba(255,252,248,0.40)',
          display:'flex', gap:16, borderTop:`1px solid ${G.glassBorder}` }}>
        {[['Avg Score','76%',G.accent],['Top Match','94%',G.sage],['Risk Flags','1',G.red]].map(([l,v,c]) => (
          <div key={l}>
            <div style={{ fontSize:15, fontWeight:800, color:c, letterSpacing:'-0.02em' }}>{v}</div>
            <div style={{ fontSize:9, color:G.textMuted, fontWeight:600, textTransform:'uppercase',
                letterSpacing:'0.06em' }}>{l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── FEATURE CARD ──────────────────────────────────────────────────────────────
function FeatureCard({ icon: Icon, title, desc, color, delay }) {
  return (
    <div className={`lq lq-d${delay} lq-iri`}
      style={{ ...glassCard(), padding:'28px 24px',
          animation:`fadeUp 0.7s ease ${delay * 0.12}s both` }}>
      <div style={{ width:48, height:48, borderRadius:14, marginBottom:18,
          background:`rgba(${color},0.12)`,
          border:`1px solid rgba(${color},0.22)`,
          display:'flex', alignItems:'center', justifyContent:'center',
          boxShadow:`0 0 20px rgba(${color},0.14)` }}>
        <Icon size={22} color={`rgb(${color})`}/>
      </div>
      <h3 style={{ margin:'0 0 10px', fontSize:16, fontWeight:800, color:G.textPrimary,
          letterSpacing:'-0.02em' }}>{title}</h3>
      <p style={{ margin:0, fontSize:13, color:G.textSecondary, lineHeight:1.65 }}>{desc}</p>
    </div>
  );
}

// ── STEP ──────────────────────────────────────────────────────────────────────
function Step({ n, icon: Icon, title, desc, last }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', flex:1,
        animation:`fadeUp 0.6s ease ${n * 0.15}s both` }}>
      <div style={{ display:'flex', alignItems:'center', width:'100%', marginBottom:20 }}>
        <div className="lq lq-iri" style={{ ...glassCard(), width:56, height:56, borderRadius:18,
            display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <Icon size={22} color={G.accent}/>
        </div>
        {!last && (
          <div style={{ flex:1, height:2, margin:'0 12px',
              background:`linear-gradient(90deg, ${G.glassBorder}, transparent)` }}/>
        )}
      </div>
      <div style={{ textAlign:'center', paddingRight: last ? 0 : 16 }}>
        <div style={{ fontSize:11, fontWeight:700, color:G.accentLight, marginBottom:5,
            textTransform:'uppercase', letterSpacing:'0.1em' }}>Step {n}</div>
        <div style={{ fontSize:15, fontWeight:800, color:G.textPrimary, marginBottom:6,
            letterSpacing:'-0.02em' }}>{title}</div>
        <div style={{ fontSize:12, color:G.textMuted, lineHeight:1.6 }}>{desc}</div>
      </div>
    </div>
  );
}

// ── MAIN LANDING PAGE ─────────────────────────────────────────────────────────
export default function LandingPage({ onGetStarted }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <div style={{ minHeight:'100vh', background:G.bgGradient,
        fontFamily:"'Inter','Segoe UI',system-ui,sans-serif",
        color:G.textPrimary, overflowX:'hidden' }}>

      {/* ── AMBIENT BACKGROUND ── */}
      <div style={{ position:'fixed', top:'-25vh', left:'-12vw', width:'70vw', height:'70vh',
          background:'radial-gradient(ellipse, rgba(255,220,160,0.30) 0%, transparent 70%)',
          pointerEvents:'none', zIndex:0 }}/>
      <div style={{ position:'fixed', top:'30vh', right:'-10vw', width:'55vw', height:'55vh',
          background:'radial-gradient(ellipse, rgba(200,170,110,0.18) 0%, transparent 70%)',
          pointerEvents:'none', zIndex:0 }}/>
      <div style={{ position:'fixed', bottom:'-20vh', left:'10vw', width:'50vw', height:'50vh',
          background:'radial-gradient(ellipse, rgba(255,200,130,0.18) 0%, transparent 70%)',
          pointerEvents:'none', zIndex:0 }}/>

      {/* Decorative floating orbs */}
      <div style={{ position:'fixed', top:'18%', right:'8%', width:200, height:200,
          borderRadius:'50%', background:'rgba(255,255,255,0.22)',
          backdropFilter:'blur(40px)', WebkitBackdropFilter:'blur(40px)',
          border:'1px solid rgba(255,255,255,0.45)',
          boxShadow:'inset 0 2px 0 rgba(255,255,255,0.7)',
          animation:'float 8s ease-in-out infinite', pointerEvents:'none', zIndex:0 }}/>
      <div style={{ position:'fixed', top:'55%', left:'3%', width:130, height:130,
          borderRadius:'50%', background:'rgba(255,255,255,0.18)',
          backdropFilter:'blur(30px)', WebkitBackdropFilter:'blur(30px)',
          border:'1px solid rgba(255,255,255,0.40)',
          boxShadow:'inset 0 2px 0 rgba(255,255,255,0.6)',
          animation:'float 11s ease-in-out infinite reverse', pointerEvents:'none', zIndex:0 }}/>
      <div style={{ position:'fixed', bottom:'15%', right:'14%', width:90, height:90,
          borderRadius:'50%', background:'rgba(255,255,255,0.16)',
          backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)',
          border:'1px solid rgba(255,255,255,0.35)',
          boxShadow:'inset 0 2px 0 rgba(255,255,255,0.55)',
          animation:'float 7s ease-in-out infinite 2s', pointerEvents:'none', zIndex:0 }}/>

      {/* ── NAVBAR ── */}
      <nav style={{ position:'fixed', top:0, left:0, right:0, zIndex:100,
          padding:'0 32px', height:64, display:'flex', alignItems:'center',
          justifyContent:'space-between',
          background: scrolled ? 'rgba(237,224,206,0.75)' : 'transparent',
          backdropFilter: scrolled ? 'blur(20px)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(20px)' : 'none',
          borderBottom: scrolled ? `1px solid ${G.glassBorder}` : '1px solid transparent',
          transition:'background 0.35s, border-color 0.35s, backdrop-filter 0.35s',
          boxShadow: scrolled ? G.shadowSm : 'none' }}>

        {/* Brand */}
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:36, height:36, borderRadius:11,
              background:`linear-gradient(135deg, ${G.accent}, ${G.accentLight})`,
              display:'flex', alignItems:'center', justifyContent:'center',
              boxShadow:G.accentGlow }}>
            <Brain size={17} color="#fff"/>
          </div>
          <div>
            <div style={{ fontSize:14, fontWeight:800, color:G.textPrimary,
                letterSpacing:'-0.02em', lineHeight:1 }}>AI Recruit Architect</div>
            <div style={{ fontSize:10, color:G.textMuted, fontWeight:600,
                letterSpacing:'0.06em', textTransform:'uppercase' }}>CV Intelligence</div>
          </div>
        </div>

        {/* Nav links */}
        <div style={{ display:'flex', alignItems:'center', gap:28 }}>
          {['Features','How It Works','Tech Stack'].map(l => (
            <a key={l} href={`#${l.toLowerCase().replace(/ /g,'-')}`}
              style={{ fontSize:13, fontWeight:600, color:G.textSecondary,
                  textDecoration:'none', transition:'color 0.2s' }}
              onMouseEnter={e => e.target.style.color=G.accent}
              onMouseLeave={e => e.target.style.color=G.textSecondary}>{l}</a>
          ))}
        </div>

        {/* CTA */}
        <button onClick={onGetStarted}
          style={{ display:'flex', alignItems:'center', gap:7, padding:'8px 20px',
              borderRadius:99, background:`linear-gradient(135deg,${G.accent},${G.accentLight})`,
              border:'none', color:'white', fontSize:13, fontWeight:700, cursor:'pointer',
              boxShadow:`${G.accentGlow}, inset 0 1px 0 rgba(255,255,255,0.20)`,
              transition:'transform 0.15s, box-shadow 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.transform='translateY(-1px)';
            e.currentTarget.style.boxShadow=`0 0 28px rgba(124,79,42,0.35), inset 0 1px 0 rgba(255,255,255,0.20)`; }}
          onMouseLeave={e => { e.currentTarget.style.transform='none';
            e.currentTarget.style.boxShadow=`${G.accentGlow}, inset 0 1px 0 rgba(255,255,255,0.20)`; }}>
          Sign In <ArrowRight size={13}/>
        </button>
      </nav>

      {/* ── HERO ── */}
      <section style={{ minHeight:'100vh', display:'flex', alignItems:'center',
          padding:'120px 80px 80px', maxWidth:1380, margin:'0 auto',
          position:'relative', zIndex:1 }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:64,
            alignItems:'center', width:'100%' }}>

          {/* Left — copy */}
          <div style={{ animation:'fadeUp 0.8s ease both' }}>
            {/* Eyebrow badge */}
            <div style={{ display:'inline-flex', alignItems:'center', gap:7, marginBottom:24,
                background:'rgba(255,252,248,0.65)', backdropFilter:'blur(16px)',
                WebkitBackdropFilter:'blur(16px)', border:`1px solid rgba(255,255,255,0.60)`,
                borderRadius:99, padding:'6px 14px',
                boxShadow:'inset 0 1px 0 rgba(255,255,255,0.70), 0 4px 16px rgba(100,60,20,0.12)' }}>
              <div style={{ width:7, height:7, borderRadius:'50%', background:G.sage,
                  animation:'pulse 2s infinite' }}/>
              <span style={{ fontSize:11, fontWeight:700, color:G.textSecondary,
                  letterSpacing:'0.08em', textTransform:'uppercase' }}>
                AI-Powered · Bias-Aware · Real-Time
              </span>
            </div>

            {/* Headline */}
            <h1 style={{ margin:'0 0 24px', lineHeight:1.05, letterSpacing:'-0.04em' }}>
              <span style={{ display:'block', fontSize:62, fontWeight:900, color:G.textPrimary }}>
                Screen Smarter.
              </span>
              <span style={{ display:'block', fontSize:62, fontWeight:900, color:G.textPrimary }}>
                Hire
              </span>
              <span style={{ display:'block', fontSize:62, fontWeight:900,
                  background:`linear-gradient(135deg, ${G.accent} 0%, ${G.accentLight} 45%, ${G.gold} 100%)`,
                  WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
                  backgroundClip:'text' }}>
                Faster.
              </span>
            </h1>

            <p style={{ margin:'0 0 36px', fontSize:18, color:G.textSecondary,
                lineHeight:1.7, maxWidth:480 }}>
              AI Recruit Architect uses semantic embeddings, weighted experience scoring,
              and anti-gaming detection to rank candidates with precision — in seconds, not hours.
            </p>

            {/* CTAs */}
            <div style={{ display:'flex', gap:14, alignItems:'center', flexWrap:'wrap' }}>
              <button onClick={onGetStarted}
                style={{ display:'inline-flex', alignItems:'center', gap:8,
                    padding:'14px 32px', borderRadius:14,
                    background:`linear-gradient(135deg,${G.accent},${G.accentLight})`,
                    border:'none', color:'white', fontSize:15, fontWeight:700, cursor:'pointer',
                    boxShadow:`0 8px 24px rgba(124,79,42,0.30), inset 0 1px 0 rgba(255,255,255,0.22)`,
                    transition:'transform 0.15s, box-shadow 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)';
                  e.currentTarget.style.boxShadow=`0 12px 32px rgba(124,79,42,0.40), inset 0 1px 0 rgba(255,255,255,0.22)`; }}
                onMouseLeave={e => { e.currentTarget.style.transform='none';
                  e.currentTarget.style.boxShadow=`0 8px 24px rgba(124,79,42,0.30), inset 0 1px 0 rgba(255,255,255,0.22)`; }}>
                Start Screening <ArrowRight size={16}/>
              </button>

              <a href="#how-it-works"
                style={{ display:'inline-flex', alignItems:'center', gap:8,
                    padding:'14px 28px', borderRadius:14,
                    background:'rgba(255,252,248,0.60)', backdropFilter:'blur(16px)',
                    WebkitBackdropFilter:'blur(16px)',
                    border:'1px solid rgba(255,255,255,0.60)',
                    boxShadow:'inset 0 1px 0 rgba(255,255,255,0.70)',
                    color:G.textPrimary, fontSize:15, fontWeight:600,
                    textDecoration:'none', cursor:'pointer',
                    transition:'transform 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.transform='translateY(-2px)'}
                onMouseLeave={e => e.currentTarget.style.transform='none'}>
                See How It Works <ChevronDown size={16}/>
              </a>
            </div>

            {/* Trust bar */}
            <div style={{ marginTop:44, paddingTop:32, borderTop:`1px solid ${G.glassBorder}`,
                display:'flex', gap:28, flexWrap:'wrap' }}>
              {[
                { icon:CheckCircle, label:'Semantic BERT Matching' },
                { icon:ShieldCheck, label:'Anti-Gaming Detection' },
                { icon:Eye,         label:'Blind Screening Mode' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} style={{ display:'flex', alignItems:'center', gap:7 }}>
                  <Icon size={14} color={G.sage}/>
                  <span style={{ fontSize:12, color:G.textSecondary, fontWeight:600 }}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right — dashboard mockup */}
          <div style={{ display:'flex', justifyContent:'center', alignItems:'center',
              animation:'fadeUp 0.8s ease 0.2s both' }}>
            <div style={{ position:'relative', width:'100%' }}>

              {/* Floating accent cards */}
              <div className="lq lq-d1 lq-iri" style={{ ...glassCard(),
                  position:'absolute', top:-30, right:-20, padding:'12px 16px',
                  display:'flex', alignItems:'center', gap:10, zIndex:10,
                  animation:'float 7s ease-in-out infinite' }}>
                <div style={{ width:32, height:32, borderRadius:10,
                    background:`linear-gradient(135deg,${G.accent},${G.accentLight})`,
                    display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Zap size={15} color="#fff"/>
                </div>
                <div>
                  <div style={{ fontSize:16, fontWeight:800, color:G.accent }}>50 CVs</div>
                  <div style={{ fontSize:10, color:G.textMuted, fontWeight:600 }}>Processed in 28s</div>
                </div>
              </div>

              <div className="lq lq-d3 lq-iri" style={{ ...glassCard(),
                  position:'absolute', bottom:-20, left:-20, padding:'12px 16px',
                  display:'flex', alignItems:'center', gap:10, zIndex:10,
                  animation:'float 9s ease-in-out infinite reverse 1s' }}>
                <div style={{ width:32, height:32, borderRadius:10,
                    background:G.sageDim, border:`1px solid rgba(58,125,87,0.25)`,
                    display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <ShieldCheck size={15} color={G.sage}/>
                </div>
                <div>
                  <div style={{ fontSize:13, fontWeight:800, color:G.sage }}>0 False Flags</div>
                  <div style={{ fontSize:10, color:G.textMuted, fontWeight:600 }}>Anti-gaming active</div>
                </div>
              </div>

              <MockDashboard/>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <a href="#stats" style={{ position:'absolute', bottom:36, left:'50%',
            transform:'translateX(-50%)', textDecoration:'none',
            display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:10, fontWeight:700, color:G.textMuted,
              textTransform:'uppercase', letterSpacing:'0.1em' }}>Scroll</span>
          <ChevronDown size={18} color={G.textMuted} style={{ animation:'bounce 2s infinite' }}/>
        </a>
      </section>

      {/* ── STATS BAR ── */}
      <section id="stats" style={{ padding:'64px 80px', position:'relative', zIndex:1 }}>
        <div style={{ maxWidth:1380, margin:'0 auto' }}>
          <div className="lq lq-d2 lq-iri" style={{ ...glassCard({
                background:'rgba(255,252,248,0.62)' }),
              padding:'36px 48px', display:'grid',
              gridTemplateColumns:'repeat(4,1fr)', gap:0 }}>
            {[
              { n:300, suf:'+', label:'Skills Detected',      sub:'Across 8 industry domains',   icon:Target,   color:G.accent },
              { n:50,  suf:'',  label:'CVs Per Batch',         sub:'Processed in < 30 seconds',   icon:FileText, color:G.sage },
              { n:8,   suf:'',  label:'Occupational Domains',  sub:'Finance · Health · Legal · +5', icon:Briefcase,color:G.gold },
              { n:100, suf:'%', label:'Local Inference',       sub:'No data sent to the cloud',   icon:Cpu,      color:G.amber },
            ].map(({ n, suf, label, sub, icon: Icon, color }, i) => (
              <div key={label} style={{ padding:'0 32px', textAlign:'center',
                  borderRight: i < 3 ? `1px solid ${G.glassBorder}` : 'none' }}>
                <div style={{ width:42, height:42, borderRadius:13, margin:'0 auto 14px',
                    background:`rgba(${color === G.accent ? '124,79,42' :
                                      color === G.sage   ? '58,125,87' :
                                      color === G.gold   ? '184,134,11' : '196,124,42'},0.12)`,
                    border:`1px solid rgba(${color === G.accent ? '124,79,42' :
                                           color === G.sage   ? '58,125,87' :
                                           color === G.gold   ? '184,134,11' : '196,124,42'},0.22)`,
                    display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Icon size={18} color={color}/>
                </div>
                <div style={{ fontSize:42, fontWeight:900, color, letterSpacing:'-0.04em',
                    lineHeight:1, marginBottom:6 }}>
                  <Counter target={n} suffix={suf} duration={1600}/>
                </div>
                <div style={{ fontSize:13, fontWeight:700, color:G.textPrimary,
                    marginBottom:4, letterSpacing:'-0.01em' }}>{label}</div>
                <div style={{ fontSize:11, color:G.textMuted }}>{sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={{ padding:'80px 80px', position:'relative', zIndex:1 }}>
        <div style={{ maxWidth:1380, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:56, animation:'fadeUp 0.6s ease both' }}>
            <div style={{ display:'inline-block', fontSize:11, fontWeight:700,
                color:G.accentLight, textTransform:'uppercase', letterSpacing:'0.12em',
                background:G.accentDim, border:`1px solid rgba(124,79,42,0.22)`,
                borderRadius:99, padding:'5px 16px', marginBottom:16 }}>
              What It Does
            </div>
            <h2 style={{ margin:'0 0 16px', fontSize:42, fontWeight:900, color:G.textPrimary,
                letterSpacing:'-0.03em', lineHeight:1.1 }}>
              Everything a Recruiter Needs.<br/>
              <span style={{ background:`linear-gradient(135deg,${G.accent},${G.gold})`,
                  WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
                  backgroundClip:'text' }}>Nothing They Don't.</span>
            </h2>
            <p style={{ margin:0, fontSize:16, color:G.textSecondary, maxWidth:560, marginLeft:'auto', marginRight:'auto' }}>
              Every feature is purpose-built to make screening faster, fairer, and more accurate.
            </p>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:18 }}>
            <FeatureCard delay={1} icon={Brain}      color="124,79,42"
              title="Semantic Matching"
              desc="Sentence-BERT embeddings (all-MiniLM-L6-v2) measure true conceptual alignment between a CV and a JD — not just keyword overlap."/>
            <FeatureCard delay={2} icon={ShieldCheck} color="58,125,87"
              title="Anti-Gaming Shield"
              desc="Two-signal detection: section embedding variance + keyword density mismatch flag candidates who stuffed their skills section with JD keywords."/>
            <FeatureCard delay={3} icon={Eye}         color="184,134,11"
              title="Bias-Free Screening"
              desc="Blind mode hides names and emails. The JD bias checker flags masculine-coded language, age bias, strict degree gates, and perfectionist wording."/>
            <FeatureCard delay={4} icon={Mail}        color="196,124,42"
              title="One-Click Emails"
              desc="Send personalised interview invitations to your entire shortlist in one click. Template uses {{name}} for personalisation. Powered by SMTP."/>
          </div>

          {/* Second row */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:18, marginTop:18 }}>
            <FeatureCard delay={1} icon={TrendingUp}  color="58,125,87"
              title="Weighted Experience Score"
              desc="Recent experience (≤3 years) carries 1.2× weight; older experience carries 0.8×. Overlapping date ranges are merged automatically."/>
            <FeatureCard delay={2} icon={BarChart3}   color="124,79,42"
              title="Live Re-ranking Slider"
              desc="Drag the α slider to instantly re-rank candidates by any skill-vs-experience ratio without re-processing. Results update in real time."/>
            <FeatureCard delay={3} icon={Users}       color="184,134,11"
              title="Candidate Detail Modal"
              desc="Full candidate breakdown: matched skills, skill gaps, experience profile, anti-gaming variance score, and risk flags — all in one view."/>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" style={{ padding:'80px 80px', position:'relative', zIndex:1 }}>
        <div style={{ maxWidth:1380, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:56, animation:'fadeUp 0.6s ease both' }}>
            <div style={{ display:'inline-block', fontSize:11, fontWeight:700,
                color:G.accentLight, textTransform:'uppercase', letterSpacing:'0.12em',
                background:G.accentDim, border:`1px solid rgba(124,79,42,0.22)`,
                borderRadius:99, padding:'5px 16px', marginBottom:16 }}>
              How It Works
            </div>
            <h2 style={{ margin:'0 0 16px', fontSize:42, fontWeight:900, color:G.textPrimary,
                letterSpacing:'-0.03em' }}>
              From Job Post to Ranked List<br/>
              <span style={{ background:`linear-gradient(135deg,${G.accent},${G.accentLight})`,
                  WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
                  backgroundClip:'text' }}>in Four Steps.</span>
            </h2>
          </div>

          <div className="lq lq-d3 lq-iri" style={{ ...glassCard({ background:'rgba(255,252,248,0.60)' }),
              padding:'48px 52px', display:'flex', gap:0, alignItems:'flex-start' }}>
            <Step n={1} icon={Briefcase} title="Post a Role"
              desc="Write your job description and set the skill-vs-experience weighting. The bias checker reviews your JD as you type."/>
            <Step n={2} icon={FolderOpenIcon} title="Upload CVs"
              desc="Drop a folder of PDF or DOCX CVs (up to 50). Files are parsed locally — no CV ever leaves your machine."/>
            <Step n={3} icon={Cpu} title="AI Analyses"
              desc="Sentence-BERT embeds both JD and each CV. Experience is extracted and weighted. Anti-gaming signals are computed."/>
            <Step n={4} icon={Award} title="Review & Hire" last
              desc="Browse the ranked leaderboard, open full candidate profiles, adjust weighting live, and notify your shortlist by email."/>
          </div>
        </div>
      </section>

      {/* ── TECH STACK ── */}
      <section id="tech-stack" style={{ padding:'64px 80px', position:'relative', zIndex:1 }}>
        <div style={{ maxWidth:1380, margin:'0 auto', textAlign:'center' }}>
          <p style={{ margin:'0 0 28px', fontSize:12, fontWeight:700, color:G.textMuted,
              textTransform:'uppercase', letterSpacing:'0.12em' }}>Built With</p>
          <div style={{ display:'flex', gap:16, justifyContent:'center', flexWrap:'wrap' }}>
            {[
              ['Python 3.10+',      '#3776AB'],
              ['FastAPI',           '#009688'],
              ['Sentence-BERT',     '#7C4F2A'],
              ['spaCy NLP',         '#09A3D5'],
              ['React 19',          '#61DAFB'],
              ['Vite 7',            '#646CFF'],
              ['PostgreSQL',        '#336791'],
              ['SQLAlchemy',        '#D71F00'],
            ].map(([name, color]) => (
              <div key={name} className="lq lq-iri" style={{ ...glassCard({
                    background:'rgba(255,252,248,0.60)' }),
                  padding:'10px 20px', display:'flex', alignItems:'center', gap:8 }}>
                <div style={{ width:8, height:8, borderRadius:'50%', background:color,
                    boxShadow:`0 0 8px ${color}` }}/>
                <span style={{ fontSize:12, fontWeight:700, color:G.textPrimary }}>{name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section style={{ padding:'80px 80px 100px', position:'relative', zIndex:1 }}>
        <div style={{ maxWidth:1380, margin:'0 auto' }}>
          <div className="lq lq-d1 lq-iri" style={{ ...glassCard({
                background:'rgba(255,252,248,0.68)' }),
              padding:'72px 80px', textAlign:'center', position:'relative', overflow:'hidden' }}>

            {/* Background decoration */}
            <div style={{ position:'absolute', top:-80, right:-80, width:300, height:300,
                borderRadius:'50%', background:`radial-gradient(circle, rgba(124,79,42,0.08) 0%, transparent 70%)`,
                pointerEvents:'none' }}/>
            <div style={{ position:'absolute', bottom:-60, left:-60, width:240, height:240,
                borderRadius:'50%', background:`radial-gradient(circle, rgba(184,134,11,0.08) 0%, transparent 70%)`,
                pointerEvents:'none' }}/>

            <div style={{ position:'relative', zIndex:1 }}>
              <div style={{ display:'inline-flex', alignItems:'center', gap:7, marginBottom:20,
                  background:G.accentDim, border:`1px solid rgba(124,79,42,0.22)`,
                  borderRadius:99, padding:'6px 16px' }}>
                <Star size={12} color={G.gold} fill={G.gold}/>
                <span style={{ fontSize:11, fontWeight:700, color:G.accentLight,
                    textTransform:'uppercase', letterSpacing:'0.08em' }}>Final Year Project — BSc Computer Science</span>
                <Star size={12} color={G.gold} fill={G.gold}/>
              </div>
              <h2 style={{ margin:'0 0 18px', fontSize:48, fontWeight:900, color:G.textPrimary,
                  letterSpacing:'-0.04em', lineHeight:1.05 }}>
                Stop Sifting CVs<br/>
                <span style={{ background:`linear-gradient(135deg,${G.accent} 0%,${G.accentLight} 50%,${G.gold} 100%)`,
                    WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
                    backgroundClip:'text' }}>Let AI Do the Heavy Lift.</span>
              </h2>
              <p style={{ margin:'0 0 40px', fontSize:17, color:G.textSecondary,
                  maxWidth:520, marginLeft:'auto', marginRight:'auto', lineHeight:1.7 }}>
                AI Recruit Architect analyses 50 candidates in under 30 seconds.
                Semantic matching. Bias detection. Anti-gaming. All on your machine.
              </p>
              <div style={{ display:'flex', gap:14, justifyContent:'center', flexWrap:'wrap' }}>
                <button onClick={onGetStarted}
                  style={{ display:'inline-flex', alignItems:'center', gap:8,
                      padding:'16px 40px', borderRadius:14,
                      background:`linear-gradient(135deg,${G.accent},${G.accentLight})`,
                      border:'none', color:'white', fontSize:16, fontWeight:700, cursor:'pointer',
                      boxShadow:`0 10px 28px rgba(124,79,42,0.32), inset 0 1px 0 rgba(255,255,255,0.22)`,
                      transition:'transform 0.15s, box-shadow 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)';
                    e.currentTarget.style.boxShadow=`0 16px 36px rgba(124,79,42,0.42), inset 0 1px 0 rgba(255,255,255,0.22)`; }}
                  onMouseLeave={e => { e.currentTarget.style.transform='none';
                    e.currentTarget.style.boxShadow=`0 10px 28px rgba(124,79,42,0.32), inset 0 1px 0 rgba(255,255,255,0.22)`; }}>
                  Open Dashboard <ArrowRight size={17}/>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ padding:'24px 80px 32px', borderTop:`1px solid ${G.glassBorder}`,
          position:'relative', zIndex:1, display:'flex',
          justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:28, height:28, borderRadius:8,
              background:`linear-gradient(135deg,${G.accent},${G.accentLight})`,
              display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Brain size={13} color="#fff"/>
          </div>
          <span style={{ fontSize:12, color:G.textMuted, fontWeight:600 }}>
            © 2026 AI Recruit Architect — Academic Defence Edition
          </span>
        </div>
        <div style={{ display:'flex', gap:20 }}>
          {['FastAPI','Sentence-BERT','PostgreSQL','React 19','spaCy'].map(t => (
            <span key={t} style={{ fontSize:10, color:G.textMuted, fontWeight:700,
                textTransform:'uppercase', letterSpacing:'0.1em' }}>{t}</span>
          ))}
        </div>
      </footer>

      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; }
        @keyframes pulse  { 0%,100% { opacity:1; } 50% { opacity:0.45; } }
        @keyframes float  { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-14px); } }
        @keyframes bounce { 0%,100% { transform:translateY(0); } 50% { transform:translateY(6px); } }
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(28px); }
          to   { opacity:1; transform:translateY(0); }
        }
        a { color: inherit; }
        ${liquidGlassCSS}
      `}</style>
    </div>
  );
}

// inline placeholder so Step component works without extra import
function FolderOpenIcon(props) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      width={props.size||24} height={props.size||24} color={props.color}>
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
    </svg>
  );
}
