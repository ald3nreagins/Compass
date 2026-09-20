import { useState } from 'react';
import Shell, { COLORS } from './Shell';
import { api } from '../api';

export default function Analyze() {
  const [url, setUrl] = useState('');
  const [portfolioInput, setPortfolioInput] = useState('');
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
            className="px-3 py-1.5 rounded-md text-sm"
            style={
              mode === 'pitch'
                ? { background: COLORS.elevated, color: COLORS.text }
                : { color: COLORS.textMuted }
            }
          >
            Pitch evaluation
          </button>
          <button
            onClick={() => setMode('portfolio')}
            className="px-3 py-1.5 rounded-md text-sm"
            style={
              mode === 'portfolio'
                ? { background: COLORS.elevated, color: COLORS.text }
                : { color: COLORS.textMuted }
            }
          >
            Portfolio impact
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
            {loading ? 'Analyzing... (this can take 30-60s)' : 'Analyze'}
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
          className="rounded-lg p-6"
          style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}
        >
          <h2 className="text-sm font-semibold mb-4" style={{ color: COLORS.text }}>
            Analysis
          </h2>

          {result.analysis.notApplicable ? (
            <div
              className="rounded-md p-4 text-sm"
              style={{ background: `${COLORS.hold}1A`, color: COLORS.hold, border: `1px solid ${COLORS.hold}` }}
            >
              <p className="font-medium mb-1">Not applicable to VC evaluation</p>
              <p style={{ color: COLORS.textMuted }}>{result.analysis.reason}</p>
            </div>
          ) : mode === 'portfolio' ? (
            <PortfolioImpactView analysis={result.analysis} />
          ) : (
            <PitchAnalysisView analysis={result.analysis} />
          )}

          <details className="mt-4">
            <summary className="text-sm cursor-pointer" style={{ color: COLORS.textMuted }}>
              View full transcript
            </summary>
            <p className="text-xs mt-2 whitespace-pre-wrap" style={{ color: COLORS.textMuted }}>
              {result.transcript}
            </p>
          </details>
        </div>
      )}
    </Shell>
  );
}

function Field({ label, value }) {
  if (value == null || (Array.isArray(value) && value.length === 0)) return null;
  return (
    <div className="mb-3">
      <p className="text-xs mb-1" style={{ color: COLORS.textMuted }}>{label}</p>
      {Array.isArray(value) ? (
        <ul className="text-sm list-disc list-inside" style={{ color: COLORS.text }}>
          {value.map((v, i) => (
            <li key={i}>{v}</li>
          ))}
        </ul>
      ) : (
        <p className="text-sm" style={{ color: COLORS.text }}>{value}</p>
      )}
    </div>
  );
}

function PitchAnalysisView({ analysis }) {
  return (
    <div>
      <Field label="Company" value={analysis.companyName} />
      <Field label="Product" value={analysis.productDescription} />
      <Field label="Target market" value={analysis.targetMarket} />
      <Field label="Stated metrics" value={analysis.statedMetrics} />
      <Field label="Founder credibility" value={analysis.founderCredibility} />
      <Field label="Key claims" value={analysis.keyClaims} />
      <Field label="Risks / concerns" value={analysis.risksOrConcerns} />
      <Field label="Sentiment" value={analysis.sentiment} />
      <Field label="Investment readiness" value={analysis.investmentReadiness} />
    </div>
  );
}

function PortfolioImpactView({ analysis }) {
  return (
    <div>
      <Field label="Event summary" value={analysis.eventSummary} />
      <Field label="Affected sectors" value={analysis.affectedSectors} />

      {analysis.affectedCompanies && analysis.affectedCompanies.length > 0 && (
        <div className="mb-3">
          <p className="text-xs mb-2" style={{ color: COLORS.textMuted }}>
            Affected companies
          </p>
          <div className="flex flex-col gap-2">
            {analysis.affectedCompanies.map((c, i) => {
              const impactColor =
                c.impactDirection === 'positive'
                  ? COLORS.add
                  : c.impactDirection === 'negative'
                  ? COLORS.sell
                  : COLORS.hold;
              return (
                <div key={i} className="rounded-md p-3" style={{ background: COLORS.elevated }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">{c.companyName}</span>
                    <span
                      className="text-xs px-2 py-0.5 rounded"
                      style={{ color: impactColor, background: `${impactColor}1A` }}
                    >
                      {c.impactDirection}
                    </span>
                  </div>
                  <p className="text-xs" style={{ color: COLORS.textMuted }}>
                    {c.rationale}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Field label="Overall impact" value={analysis.overallImpact} />
      <Field label="Urgency" value={analysis.urgency} />
      <Field label="Recommended actions" value={analysis.recommendedActions} />
    </div>
  );
}