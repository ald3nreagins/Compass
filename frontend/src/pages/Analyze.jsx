import { useState } from 'react';
import Shell, { COLORS } from './Shell';
import { api, getDefaultPortfolio } from '../api';

function titleCase(str) {
  if (typeof str !== 'string') return str;
  return str
    .split(/[\s_-]+/)
    .map((w) => (w.length ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');
}

// Splits a paragraph into short, scannable bullet points by sentence.
function toBullets(value) {
  if (value == null) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  const sentences = String(value)
    .split(/(?<=[.!?])\s+(?=[A-Z(])/)
    .map((s) => s.trim())
    .filter(Boolean);
  return sentences.length ? sentences : [String(value)];
}

export default function Analyze() {
  const [url, setUrl] = useState('');
  const [portfolioInput, setPortfolioInput] = useState(() => getDefaultPortfolio().join(', '));
  const [mode, setMode] = useState('pitch'); // 'pitch' | 'portfolio'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  async function handleAnalyze(e) {
    e.preventDefault();
    setError('');
    setResult(null);
    setLoading(true);

    try {
      let data;
      if (mode === 'pitch') {
        data = await api.analyzeUrl(url);
      } else {
        const companies = portfolioInput
          .split(',')
          .map((c) => c.trim())
          .filter(Boolean);
        data = await api.analyzePortfolioImpact(url, companies);
      }
      setResult(data);
    } catch (err) {
      setError(err.message || 'Analysis failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Shell>
      <h1 className="text-lg font-semibold mb-6">Analyze market signal</h1>

      <div
        className="rounded-lg p-6 mb-6"
        style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}
      >
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setMode('pitch')}
            className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
            style={
              mode === 'pitch'
                ? { background: COLORS.elevated, color: COLORS.text }
                : { color: COLORS.textMuted }
            }
          >
            Pitch Evaluation
          </button>
          <button
            onClick={() => setMode('portfolio')}
            className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
            style={
              mode === 'portfolio'
                ? { background: COLORS.elevated, color: COLORS.text }
                : { color: COLORS.textMuted }
            }
          >
            Portfolio Impact
          </button>
        </div>

        <form onSubmit={handleAnalyze}>
          <input
            placeholder="Video URL (YouTube, etc.)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full mb-3 px-3 py-2 rounded-md text-sm bg-transparent outline-none"
            style={{ border: `1px solid ${COLORS.border}`, color: COLORS.text }}
            required
          />

          {mode === 'portfolio' && (
            <input
              placeholder="Portfolio companies, comma-separated (e.g. Affirm, SoFi, Klarna)"
              value={portfolioInput}
              onChange={(e) => setPortfolioInput(e.target.value)}
              className="w-full mb-3 px-3 py-2 rounded-md text-sm bg-transparent outline-none"
              style={{ border: `1px solid ${COLORS.border}`, color: COLORS.text }}
              required
            />
          )}

          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded-md text-sm font-medium"
            style={{ background: COLORS.accent, color: '#fff' }}
          >
            {loading ? 'Analyzing… (this can take 30–60s)' : 'Analyze'}
          </button>
        </form>

        {error && (
          <p className="text-sm mt-4" style={{ color: COLORS.sell }}>
            {error}
          </p>
        )}
      </div>

      {result && (
        <div
          className="rounded-lg overflow-hidden"
          style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}
        >
          {result.analysis.notApplicable ? (
            <NotApplicableBanner reason={result.analysis.reason} />
          ) : mode === 'portfolio' ? (
            <PortfolioImpactView analysis={result.analysis} />
          ) : (
            <PitchAnalysisView analysis={result.analysis} />
          )}

          <div className="px-6 pb-6">
            <details className="mt-2">
              <summary
                className="text-xs font-medium tracking-wide uppercase cursor-pointer"
                style={{ color: COLORS.textMuted }}
              >
                View Full Transcript
              </summary>
              <p className="text-xs mt-3 whitespace-pre-wrap leading-relaxed" style={{ color: COLORS.textMuted }}>
                {result.transcript}
              </p>
            </details>
          </div>
        </div>
      )}
    </Shell>
  );
}

// Prominent color-coded status strip: blue = unrelated, green = positive, red = negative
function StatusBanner({ tone, title, bullets }) {
  const toneColor = {
    unrelated: COLORS.accent,
    positive: COLORS.add,
    negative: COLORS.sell,
    neutral: COLORS.accent,
    mixed: COLORS.hold,
  }[tone] || COLORS.accent;

  return (
    <div
      className="px-6 py-5"
      style={{ background: `${toneColor}14`, borderBottom: `1px solid ${COLORS.border}` }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="inline-block w-2 h-2 rounded-full" style={{ background: toneColor }} />
        <span className="text-xs font-semibold tracking-wide uppercase" style={{ color: toneColor }}>
          {title}
        </span>
      </div>
      {bullets && bullets.length > 0 && (
        <ul className="text-sm space-y-1">
          {bullets.map((b, i) => (
            <li key={i} className="flex gap-2" style={{ color: COLORS.text }}>
              <span style={{ color: toneColor }}>•</span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function NotApplicableBanner({ reason }) {
  return (
    <StatusBanner
      tone="unrelated"
      title="Not Related to Portfolio or Pitch Criteria"
      bullets={toBullets(reason)}
    />
  );
}

function Section({ label, children }) {
  return (
    <div className="mb-5 last:mb-0">
      <p className="text-xs font-semibold tracking-wide uppercase mb-1.5" style={{ color: COLORS.textMuted }}>
        {label}
      </p>
      {children}
    </div>
  );
}

function BulletField({ label, value, capitalize }) {
  const bullets = toBullets(value);
  if (bullets.length === 0) return null;
  const display = (v) => (capitalize ? titleCase(v) : v);
  return (
    <Section label={label}>
      <ul className="text-sm space-y-1.5" style={{ color: COLORS.text }}>
        {bullets.map((b, i) => (
          <li key={i} className="flex gap-2">
            <span style={{ color: COLORS.textMuted }}>—</span>
            <span className="leading-snug">{display(b)}</span>
          </li>
        ))}
      </ul>
    </Section>
  );
}

function PitchAnalysisView({ analysis }) {
  const sentimentTone =
    analysis.sentiment === 'confident'
      ? 'positive'
      : analysis.sentiment === 'overhyped'
      ? 'negative'
      : 'neutral';

  return (
    <div>
      {analysis.sentiment && (
        <StatusBanner
          tone={sentimentTone}
          title={`Sentiment: ${titleCase(analysis.sentiment)}`}
          bullets={toBullets(analysis.productDescription)}
        />
      )}
      <div className="px-6 py-6">
        <BulletField label="Company" value={analysis.companyName} />
        <BulletField label="Target Market" value={analysis.targetMarket} />
        <BulletField label="Stated Metrics" value={analysis.statedMetrics} />
        <BulletField label="Founder Credibility" value={analysis.founderCredibility} />
        <BulletField label="Key Claims" value={analysis.keyClaims} />
        <BulletField label="Risks / Concerns" value={analysis.risksOrConcerns} />
        <BulletField label="Investment Readiness" value={analysis.investmentReadiness} capitalize />
      </div>
    </div>
  );
}

function PortfolioImpactView({ analysis }) {
  const tone = analysis.overallImpact || 'neutral';

  return (
    <div>
      <StatusBanner
        tone={tone}
        title={`Overall Impact: ${titleCase(tone)} · Urgency: ${titleCase(analysis.urgency)}`}
        bullets={toBullets(analysis.eventSummary)}
      />
      <div className="px-6 py-6">
        <BulletField label="Affected Sectors" value={analysis.affectedSectors} capitalize />

        {analysis.affectedCompanies && analysis.affectedCompanies.length > 0 && (
          <Section label="Affected Companies">
            <div className="flex flex-col gap-2">
              {analysis.affectedCompanies.map((c, i) => {
                const impactColor =
                  c.impactDirection === 'positive'
                    ? COLORS.add
                    : c.impactDirection === 'negative'
                    ? COLORS.sell
                    : COLORS.hold;
                return (
                  <div
                    key={i}
                    className="rounded-md p-3"
                    style={{ background: COLORS.elevated, border: `1px solid ${COLORS.border}` }}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-sm font-medium" style={{ color: COLORS.text }}>
                        {c.companyName}
                      </span>
                      <span
                        className="text-xs font-medium px-2 py-0.5 rounded"
                        style={{ color: impactColor, background: `${impactColor}1A` }}
                      >
                        {titleCase(c.impactDirection)}
                      </span>
                    </div>
                    <ul className="text-xs space-y-1">
                      {toBullets(c.rationale).map((b, j) => (
                        <li key={j} className="flex gap-1.5" style={{ color: COLORS.textMuted }}>
                          <span>—</span>
                          <span className="leading-snug">{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </Section>
        )}

        <BulletField label="Recommended Actions" value={analysis.recommendedActions} />
      </div>
    </div>
  );
}