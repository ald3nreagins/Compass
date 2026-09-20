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
          <h2 className="text-sm font-semibold mb-3" style={{ color: COLORS.text }}>
            Analysis
          </h2>
          <pre
            className="text-xs whitespace-pre-wrap overflow-auto max-h-96 p-3 rounded-md"
            style={{ background: COLORS.elevated, color: COLORS.textMuted }}
          >
            {JSON.stringify(result.analysis, null, 2)}
          </pre>

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