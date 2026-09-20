import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { COLORS } from './Shell';

// Generic monogram badges instead of real company logos/marks (avoids using
// anyone's trademarked logo) — first letter, distinct color per badge.
const LOGOS = [
  { name: 'Affirm', color: COLORS.accent },
  { name: 'SoFi', color: COLORS.add },
  { name: 'Klarna', color: COLORS.hold },
  { name: 'Robinhood', color: COLORS.sell },
  { name: 'Ramp', color: COLORS.accent },
  { name: 'Brex', color: COLORS.add },
  { name: 'Stripe', color: COLORS.hold },
  { name: 'OpenAI', color: COLORS.sell },
];

function titleCase(str) {
  const smallWords = new Set(['the', 'a', 'an', 'of', 'in', 'on', 'does']);
  return str
    .split(' ')
    .map((w, i) => {
      const lower = w.toLowerCase().replace(/[.,!?]/g, '');
      if (i !== 0 && smallWords.has(lower) && lower !== 'does') return w.toLowerCase();
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase().replace(/^./, (c) => c);
    })
    .join(' ');
}

const PLANS = [
  {
    name: 'Analyst',
    price: '$0',
    period: '',
    tagline: 'Try it on a handful of signals',
    features: ['5 analyses / month', 'Pitch evaluation', 'Portfolio impact checks', 'Signal history'],
    cta: 'Get Started',
    highlight: false,
  },
  {
    name: 'Fund',
    price: '$99',
    period: '/mo',
    tagline: 'For active investment teams',
    features: [
      'Unlimited analyses',
      'Full portfolio dashboard',
      'Team accounts',
      'Priority processing',
      'Slack alerts on high-urgency signals',
    ],
    cta: 'Get Started',
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    tagline: 'For multi-fund firms',
    features: [
      'Everything in Fund',
      'Custom data sources',
      'Dedicated support',
      'SOC 2 / compliance review',
      'API access',
    ],
    cta: 'Contact Sales',
    highlight: false,
  },
];

function useInView() {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return [ref, inView];
}

export default function Landing() {
  return (
    <div
      style={{ background: COLORS.bg, color: COLORS.text, fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" }}
      className="min-h-screen w-full relative overflow-hidden"
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        @keyframes orbit {
          from { transform: rotate(0deg) translateX(220px) rotate(0deg); }
          to   { transform: rotate(360deg) translateX(220px) rotate(-360deg); }
        }
        .orbit-item {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 116px;
          height: 34px;
          margin-left: -58px;
          margin-top: -17px;
          animation: orbit 26s linear infinite;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      `}</style>

      {/* Original abstract watermark — three diamonds, not any real brand's mark */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[
          { top: '-8%', left: '-8%' },
          { top: '-8%', left: '32%' },
          { top: '-8%', left: '72%' },
        ].map((pos, i) => (
          <svg
            key={i}
            className="absolute"
            style={{ ...pos, opacity: 0.05 }}
            width="420"
            height="420"
            viewBox="0 0 200 200"
          >
            <polygon points="100,10 190,100 100,190 10,100" fill="none" stroke={COLORS.accent} strokeWidth="1.5" />
            <polygon points="100,40 160,100 100,160 40,100" fill="none" stroke={COLORS.accent} strokeWidth="1.5" />
            <polygon points="100,70 130,100 100,130 70,100" fill={COLORS.accent} />
          </svg>
        ))}
      </div>

      {/* Top nav */}
      <div className="relative flex items-center justify-between px-8 py-5 border-b" style={{ borderColor: COLORS.border }}>
        <div className="flex items-center gap-2">
          <span style={{ color: COLORS.accent }} className="text-lg">◇</span>
          <span className="font-semibold text-sm tracking-wide">Compass</span>
        </div>
        <Link
          to="/login"
          className="px-4 py-2 rounded-md text-sm font-medium"
          style={{ background: COLORS.accent, color: '#fff' }}
        >
          Sign In
        </Link>
      </div>

      {/* Hero */}
      <div className="relative flex flex-col items-center justify-center px-6 py-20">
        <div className="relative flex items-center justify-center mb-10" style={{ width: 500, height: 500, maxWidth: '90vw' }}>
          {LOGOS.map((logo, i) => (
            <div
              key={logo.name}
              className="orbit-item flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full justify-center"
              style={{
                background: COLORS.surface,
                border: `1px solid ${COLORS.border}`,
                animationDelay: `-${(i * 26) / LOGOS.length}s`,
              }}
            >
              <span
                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                style={{ background: `${logo.color}25`, color: logo.color }}
              >
                {logo.name[0]}
              </span>
              <span className="text-xs font-medium truncate" style={{ color: COLORS.textMuted }}>
                {logo.name}
              </span>
            </div>
          ))}
          <div className="text-center z-10 max-w-xs">
            <h1 className="text-3xl font-bold mb-3 leading-tight">
              {titleCase('Know Before The Market Does.')}
            </h1>
            <p className="text-sm" style={{ color: COLORS.textMuted }}>
              Compass turns pitch videos and market news into structured, sourced
              due-diligence signals — automatically.
            </p>
          </div>
        </div>

        <Link
          to="/login"
          className="px-6 py-3 rounded-md text-sm font-medium"
          style={{ background: COLORS.accent, color: '#fff' }}
        >
          Get Started
        </Link>
      </div>

      {/* Pricing */}
      <div className="relative px-6 pb-24 max-w-5xl mx-auto">
        <h2 className="text-xl font-semibold text-center mb-2">Simple, Usage-Based Pricing</h2>
        <p className="text-sm text-center mb-12" style={{ color: COLORS.textMuted }}>
          Start free. Upgrade when your dealflow does.
        </p>

        <div className="grid md:grid-cols-3 gap-5">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className="rounded-lg p-6 flex flex-col"
              style={{
                background: COLORS.surface,
                border: plan.highlight ? `1.5px solid ${COLORS.accent}` : `1px solid ${COLORS.border}`,
              }}
            >
              {plan.highlight && (
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded self-start mb-3"
                  style={{ background: `${COLORS.accent}1A`, color: COLORS.accent }}
                >
                  Most Popular
                </span>
              )}
              <h3 className="text-sm font-semibold mb-1">{plan.name}</h3>
              <p className="text-xs mb-4" style={{ color: COLORS.textMuted }}>
                {plan.tagline}
              </p>
              <div className="mb-5">
                <span className="text-2xl font-semibold">{plan.price}</span>
                <span className="text-sm" style={{ color: COLORS.textMuted }}>{plan.period}</span>
              </div>
              <ul className="flex flex-col gap-2 mb-6 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check size={14} style={{ color: COLORS.add, marginTop: 3 }} className="shrink-0" />
                    <span style={{ color: COLORS.text }}>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                to="/login"
                className="text-center px-4 py-2 rounded-md text-sm font-medium"
                style={
                  plan.highlight
                    ? { background: COLORS.accent, color: '#fff' }
                    : { border: `1px solid ${COLORS.border}`, color: COLORS.text }
                }
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* About */}
      <div className="relative px-6 py-24 border-t" style={{ borderColor: COLORS.border }}>
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl font-semibold mb-2">About Compass</h2>
          <p className="text-sm mb-12" style={{ color: COLORS.textMuted }}>
            Why we built this, and how it actually works.
          </p>

          <div className="flex flex-col gap-10">
            <AboutBlock
              index={0}
              title="The Problem"
              body={[
                'Venture teams review dozens of pitch videos, market updates, and news clips every week — most of it unstructured video and audio that never makes it into a searchable record.',
                'By the time something relevant surfaces, the moment to act on it has often passed.',
              ]}
            />

            <AboutBlock
              index={1}
              title="How It Works"
              body={[
                'A team submits a video URL or file — a pitch recording, an earnings call, a piece of market news.',
                'Compass transcribes the audio with word-level accuracy, then runs the transcript through a structured extraction model trained to think like an analyst, not a summarizer.',
                'The result is either a pitch evaluation (product, market, claims, risks, readiness) or a portfolio-impact assessment (which holdings are affected, how, and how urgently) — never a generic summary.',
              ]}
            />

            <AboutBlock
              index={2}
              title="Built On Honesty, Not Hype"
              body={[
                "When a video has no real bearing on an investment decision, Compass says so directly instead of forcing a connection that isn't there.",
                'Every claim is grounded in what was actually said — flagged as a claim, not presented as fact — so the output augments diligence rather than replacing judgment.',
              ]}
            />

            <AboutBlock
              index={3}
              title="The Team"
              body={[
                'Built in a single hackathon sprint by a small team exploring how transcription and reasoning models can compress the time between a signal appearing and a team acting on it.',
              ]}
            />
          </div>
        </div>
      </div>

      {/* Contact */}
      <ContactSection />
    </div>
  );
}

function AboutBlock({ title, body, index = 0 }) {
  const [ref, inView] = useInView();
  return (
    <div
      ref={ref}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(24px)',
        transition: `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`,
      }}
    >
      <h3
        className="text-xs font-semibold tracking-wide uppercase mb-3"
        style={{ color: COLORS.accent }}
      >
        {title}
      </h3>
      <div className="flex flex-col gap-3">
        {body.map((p, i) => (
          <p key={i} className="text-sm leading-relaxed" style={{ color: COLORS.text }}>
            {p}
          </p>
        ))}
      </div>
    </div>
  );
}

function ContactSection() {
  const [ref, inView] = useInView();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    setSent(true);
  }

  return (
    <div
      ref={ref}
      className="relative px-6 py-24 border-t"
      style={{
        borderColor: COLORS.border,
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(24px)',
        transition: 'opacity 0.6s ease, transform 0.6s ease',
      }}
    >
      <div className="max-w-lg mx-auto text-center">
        <h2 className="text-xl font-semibold mb-2">Get in Touch</h2>
        <p className="text-sm mb-8" style={{ color: COLORS.textMuted }}>
          Questions, feedback, or want a walkthrough for your fund? Leave your email and we'll follow up.
        </p>

        {sent ? (
          <div
            className="rounded-md p-4 text-sm"
            style={{ background: `${COLORS.add}1A`, color: COLORS.add, border: `1px solid ${COLORS.add}` }}
          >
            Thanks — we'll be in touch shortly.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@fund.com"
              className="flex-1 px-3 py-2 rounded-md text-sm bg-transparent outline-none"
              style={{ border: `1px solid ${COLORS.border}`, color: COLORS.text }}
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-md text-sm font-medium shrink-0"
              style={{ background: COLORS.accent, color: '#fff' }}
            >
              Contact Us
            </button>
          </form>
        )}
      </div>
    </div>
  );
}