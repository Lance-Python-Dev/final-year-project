// Shared design tokens — imported by LandingPage, LoginPage, and App
export const G = {
  bgGradient: 'linear-gradient(135deg, #EDE0CE 0%, #E2D0B8 35%, #D9C5A8 65%, #E8D8C2 100%)',
  glass:         'rgba(255,252,248,0.55)',
  glassMid:      'rgba(255,252,248,0.68)',
  glassHover:    'rgba(255,252,248,0.78)',
  glassBorder:   'rgba(160,112,74,0.22)',
  glassBorderHi: 'rgba(160,112,74,0.40)',
  textPrimary:   '#2C1A0E',
  textSecondary: 'rgba(60,32,12,0.72)',
  textMuted:     'rgba(80,48,18,0.45)',
  accent:        '#7C4F2A',
  accentDim:     'rgba(124,79,42,0.12)',
  accentGlow:    '0 0 20px rgba(124,79,42,0.22)',
  accentLight:   '#A0704A',
  gold:          '#B8860B',
  goldDim:       'rgba(184,134,11,0.14)',
  sage:          '#3A7D57',
  sageDim:       'rgba(58,125,87,0.12)',
  red:           '#B0341F',
  redDim:        'rgba(176,52,31,0.12)',
  amber:         '#C47C2A',
  shadow:   '0 8px 32px rgba(100,60,20,0.18)',
  shadowLg: '0 20px 60px rgba(80,40,10,0.28)',
  shadowSm: '0 4px 16px rgba(100,60,20,0.14)',
};

export const blur = 'blur(32px) saturate(160%)';

export const glassCard = (extra = {}) => ({
  background: G.glass,
  backdropFilter: blur,
  WebkitBackdropFilter: blur,
  border: '1px solid rgba(255,255,255,0.58)',
  outline: '1px solid rgba(160,112,74,0.18)',
  outlineOffset: -1,
  borderRadius: 18,
  boxShadow: [
    '0 8px 32px rgba(100,60,20,0.18)',
    'inset 0 1.5px 0 rgba(255,255,255,0.75)',
    'inset 0 -1px 0 rgba(120,80,40,0.07)',
    '0 1px 0 rgba(255,255,255,0.40)',
  ].join(', '),
  ...extra,
});

export const liquidGlassCSS = `
  .lq { position: relative; overflow: hidden; }
  .lq::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background:
      radial-gradient(ellipse 90% 55% at 18% -5%, rgba(255,255,255,0.62) 0%, transparent 58%),
      radial-gradient(ellipse 50% 35% at 85% 105%, rgba(255,210,150,0.22) 0%, transparent 55%);
    pointer-events: none;
    z-index: 0;
  }
  .lq::after {
    content: '';
    position: absolute;
    top: 0; bottom: 0;
    left: -130%;
    width: 65%;
    background: linear-gradient(108deg, transparent 28%, rgba(255,255,255,0.28) 46%, rgba(255,245,220,0.18) 52%, transparent 68%);
    transform: skewX(-14deg);
    animation: lq-sweep 10s ease-in-out infinite;
    pointer-events: none;
    z-index: 0;
  }
  .lq-d1::after { animation-delay: -1.8s; }
  .lq-d2::after { animation-delay: -3.6s; }
  .lq-d3::after { animation-delay: -5.4s; }
  .lq-d4::after { animation-delay: -7.2s; }
  .lq-d5::after { animation-delay: -9.0s; }
  .lq > * { position: relative; z-index: 1; }
  @keyframes lq-sweep {
    0%        { left: -130%; opacity: 0; }
    8%        { opacity: 1; }
    42%       { left: 120%; opacity: 0.85; }
    43%, 100% { left: 120%; opacity: 0; }
  }
  .lq-iri { animation: lq-iri-pulse 5s ease-in-out infinite; }
  @keyframes lq-iri-pulse {
    0%,100% { box-shadow: 0 8px 32px rgba(100,60,20,0.18), inset 0 1.5px 0 rgba(255,255,255,0.75), inset 0 -1px 0 rgba(120,80,40,0.07), 0 0 0 1px rgba(255,210,140,0.45), 0 0 18px rgba(200,150,80,0.12); }
    25%     { box-shadow: 0 8px 32px rgba(100,60,20,0.18), inset 0 1.5px 0 rgba(255,255,255,0.80), inset 0 -1px 0 rgba(120,80,40,0.07), 0 0 0 1px rgba(255,235,180,0.55), 0 0 22px rgba(220,170,90,0.18); }
    50%     { box-shadow: 0 8px 32px rgba(100,60,20,0.18), inset 0 1.5px 0 rgba(255,255,255,0.85), inset 0 -1px 0 rgba(120,80,40,0.07), 0 0 0 1px rgba(200,230,255,0.40), 0 0 22px rgba(160,200,240,0.14); }
    75%     { box-shadow: 0 8px 32px rgba(100,60,20,0.18), inset 0 1.5px 0 rgba(255,255,255,0.78), inset 0 -1px 0 rgba(120,80,40,0.07), 0 0 0 1px rgba(255,200,220,0.38), 0 0 18px rgba(200,140,160,0.12); }
  }
`;
