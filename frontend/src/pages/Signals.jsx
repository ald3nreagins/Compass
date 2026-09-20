import { useState, useEffect } from 'react';
import Shell, { COLORS } from './Shell';
import { api } from '../api';

function titleCase(str) {
  if (typeof str !== 'string') return str;
  return str
    .split(/[\s_-]+/)
    .map((w) => (w.length ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');
}

function toBullets(value) {
  if (value == null) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  const sentences = String(value)
    .split(/(?<=[.!?])\s+(?=[A-Z(])/)
    .map((s) => s.trim())
    .filter(Boolean);
  return sentences.length ? sentences : [String(value)];
}

function toneFor(analysis, type) {
  if (analysis.notApplicable) return 'unrelated';
  if (type === 'portfolio-impact') return analysis.overallImpact || 'neutral';
  if (analysis.sentiment === 'confident') return 'positive';
  if (analysis.sentiment === 'overhyped') return 'negative';
  return 'neutral';
}

const TONE_COLOR = {
  unrelated: COLORS.accent,
  positive: COLORS.add,
  negative: COLORS.sell,
  neutral: COLORS.accent,
  mixed: COLORS.hold,
};

function summaryFor(analysis, type) {
  if (analysis.notApplicable) return analysis.reason;
  if (type === 'portfolio-impact') return analysis.eventSummary;
  return analysis.productDescription || analysis.companyName;
}

function statusLabelFor(analysis, type) {
  if (analysis.notApplicable) return 'Not Applicable';
  if (type === 'portfolio-impact') return `Impact: ${titleCase(analysis.overallImpact || 'neutral')}`;
  return `Sentiment: ${titleCase(analysis.sentiment || 'unknown')}`;
}

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function Section({ label, children }) {
  return (
    <div className="mb-4 last:mb-0">
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
      <ul className="text-sm space-y-1" style={{ color: COLORS.text }}>
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

function ExpandedDetail({ analysis, type }) {
  if (analysis.notApplicable) {
    return <BulletField label="Reason" value={analysis.reason} />;
  }

  if (type === 'portfolio-impact') {
    return (
      <div>
        <BulletField label="Event Summary" value={analysis.eventSummary} />
        <BulletField label="Affected Sectors" value={analysis.affectedSectors} capitalize />
        {analysis.affectedCompanies && analysis.affectedCompanies.length > 0 && (
          <Section label="Affected Companies">
            <div className="flex flex-col gap-2">
              {analysis.affectedCompanies.map((c, i) => {
                const color =
                  c.impactDirection === 'positive'
                    ? COLORS.add
                    : c.impactDirection === 'negative'
                    ? COLORS.sell
                    : COLORS.hold;
                return (
                  <div key={i} className="rounded-md p-3" style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium" style={{ color: COLORS.text }}>{c.companyName}</span>
                      <span className="text-xs font-medium px-2 py-0.5 rounded" style={{ color, background: `${color}1A` }}>
                        {titleCase(c.impactDirection)}
                      </span>
                    </div>
                    <ul className="text-xs space-y-1">
                      {toBullets(c.rationale).map((b, j) => (
                        <li key={j} className="flex gap-1.5" style={{ color: COLORS.textMuted }}>
                          <span>—</span><span className="leading-snug">{b}</span>
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
    );
  }

  // pitch
  return (
    <div>
      <BulletField label="Company" value={analysis.companyName} />
      <BulletField label="Product" value={analysis.productDescription} />
      <BulletField label="Target Market" value={analysis.targetMarket} />
      <BulletField label="Stated Metrics" value={analysis.statedMetrics} />
      <BulletField label="Founder Credibility" value={analysis.founderCredibility} />
      <BulletField label="Key Claims" value={analysis.keyClaims} />
      <BulletField label="Risks / Concerns" value={analysis.risksOrConcerns} />
      <BulletField label="Investment Readiness" value={analysis.investmentReadiness} capitalize />
    </div>
  );
}

export default function Signals() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    api
      .getHistory()
      .then((data) => {
        setSubmissions(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load signal history');
        setLoading(false);
      });
  }, []);

  return (
    <Shell>
      <h1 className="text-lg font-semibold mb-6">Signals</h1>

      {loading && (
        <div
          className="rounded-lg p-8 flex items-center justify-center"
          style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, minHeight: '200px' }}
        >
          <p className="text-sm" style={{ color: COLORS.textMuted }}>Loading signal history…</p>
        </div>
      )}

      {error && (
        <div
          className="rounded-lg p-4 text-sm"
          style={{ background: `${COLORS.sell}1A`, color: COLORS.sell, border: `1px solid ${COLORS.sell}` }}
        >
          {error}
        </div>
      )}

      {!loading && !error && submissions.length === 0 && (
        <div
          className="rounded-lg p-8 flex items-center justify-center"
          style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, minHeight: '200px' }}
        >
          <p className="text-sm" style={{ color: COLORS.textMuted }}>
            No signals analyzed yet — run an analysis from the Analyze tab.
          </p>
        </div>
      )}

      {!loading && !error && submissions.length > 0 && (
        <div className="flex flex-col gap-3">
          {submissions.map((s) => {
            let analysis = {};
            try {
              analysis = JSON.parse(s.analysisJson);
            } catch {
              analysis = {};
            }
            const tone = TONE_COLOR[toneFor(analysis, s.analysisType)] || COLORS.accent;
            const isOpen = expandedId === s.id;

            return (
              <div
                key={s.id}
                className="rounded-lg overflow-hidden"
                style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}
              >
                <div
                  className="flex items-center justify-between px-5 py-4 cursor-pointer"
                  onClick={() => setExpandedId(isOpen ? null : s.id)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="inline-block w-2 h-2 rounded-full shrink-0" style={{ background: tone }} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: COLORS.text }}>
                        {statusLabelFor(analysis, s.analysisType)}
                      </p>
                      <p className="text-xs truncate" style={{ color: COLORS.textMuted }}>
                        {summaryFor(analysis, s.analysisType)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0 ml-4">
                    <span
                      className="text-xs px-2 py-0.5 rounded"
                      style={{ color: COLORS.textMuted, border: `1px solid ${COLORS.border}` }}
                    >
                      {s.analysisType === 'portfolio-impact' ? 'Portfolio Impact' : 'Pitch Evaluation'}
                    </span>
                    <span className="text-xs" style={{ color: COLORS.textMuted }}>
                      {formatDate(s.createdAt)}
                    </span>
                  </div>
                </div>

                {isOpen && (
                  <div
                    className="px-5 pb-5 pt-4"
                    style={{ borderTop: `1px solid ${COLORS.border}`, background: `${tone}0A` }}
                  >
                    <p className="text-xs mb-4 break-all" style={{ color: COLORS.textMuted }}>
                      {s.sourceUrl}
                    </p>
                    <ExpandedDetail analysis={analysis} type={s.analysisType} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Shell>
  );
}