import { useState, useEffect } from 'react';
import Shell, { COLORS } from './Shell';

const HEALTH_KEYS = ['ACCELERATING', 'STABLE', 'BASELINE', 'REVIEW'];

const HEALTH_COLOR = {
  ACCELERATING: COLORS.add,
  STABLE: COLORS.accent,
  BASELINE: COLORS.textMuted,
  REVIEW: COLORS.sell,
};

const SIGNAL_COLOR = {
  ADD: COLORS.add,
  HOLD: COLORS.hold,
  SELL: COLORS.sell,
};

function fmtArr(v) {
  if (v == null) return '—';
  return `$${(v / 1_000_000).toFixed(1)}M`;
}

function HealthPill({ health }) {
  const color = HEALTH_COLOR[health] || COLORS.textMuted;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium" style={{ color }}>
      <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: color }} />
      {health || 'BASELINE'}
    </span>
  );
}

function SignalBadge({ signal }) {
  const color = SIGNAL_COLOR[signal] || COLORS.hold;
  return (
    <span
      className="inline-flex items-center justify-center text-xs font-semibold px-2.5 py-1 rounded"
      style={{ color, background: `${color}1A`, minWidth: '52px' }}
    >
      {signal || 'HOLD'}
    </span>
  );
}

export default function PortfolioOverviewPage() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('http://localhost:8080/api/portfolio/holdings')
      .then((res) => {
        if (!res.ok) throw new Error(`Server responded ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setCompanies(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load portfolio:', err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const totalValue = companies.reduce((s, c) => s + (c.arr || 0), 0) / 1_000_000;
  const accelerating = companies.filter((c) => c.healthFlag === 'ACCELERATING').length;
  const review = companies.filter((c) => c.healthFlag === 'REVIEW').length;

  return (
    <Shell>
      <div className="flex items-baseline justify-between mb-6">
        <h1 className="text-lg font-semibold">Portfolio overview</h1>
        <span className="text-xs" style={{ color: COLORS.textMuted }}>
          {loading ? 'Syncing...' : error ? 'Sync failed' : 'Last synced just now'}
        </span>
      </div>

      {error && (
        <div
          className="rounded-lg p-4 mb-6 text-sm"
          style={{ background: `${COLORS.sell}1A`, color: COLORS.sell, border: `1px solid ${COLORS.sell}` }}
        >
          Couldn't load portfolio data: {error}. Confirm the Spring Boot server is running on port 8080.
        </div>
      )}

      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Portfolio value', value: `$${totalValue.toFixed(0)}M` },
          { label: 'Companies', value: companies.length.toString() },
          { label: 'Accelerating', value: accelerating.toString(), color: COLORS.add },
          { label: 'Review', value: review.toString(), color: COLORS.sell },
        ].map((s) => (
          <div key={s.label} className="rounded-lg p-4" style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
            <p className="text-xs mb-2" style={{ color: COLORS.textMuted }}>{s.label}</p>
            <p className="text-2xl font-semibold tabular-nums" style={{ color: s.color || COLORS.text }}>
              {loading ? '—' : s.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="rounded-lg p-5" style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
          <p className="text-sm font-medium mb-4">Portfolio health</p>
          <div className="flex flex-col gap-3">
            {HEALTH_KEYS.map((key) => (
              <div key={key} className="flex items-center gap-3">
                <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: HEALTH_COLOR[key] }} />
                <span className="text-sm flex-1" style={{ color: COLORS.textMuted }}>{key}</span>
                <span className="text-sm font-medium tabular-nums">
                  {companies.filter((c) => c.healthFlag === key).length}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg p-5" style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
          <p className="text-sm font-medium mb-4">Recent signals</p>
          <p className="text-sm" style={{ color: COLORS.textMuted }}>
            Signals will appear here once the Analyze pipeline is connected.
          </p>
        </div>
      </div>

      <div className="rounded-lg overflow-hidden" style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
        <div className="px-5 py-4 border-b" style={{ borderColor: COLORS.border }}>
          <p className="text-sm font-medium">Portfolio companies</p>
        </div>
        {loading ? (
          <p className="px-5 py-6 text-sm" style={{ color: COLORS.textMuted }}>Loading...</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ color: COLORS.textMuted }}>
                <th className="text-left font-normal px-5 py-3">Company</th>
                <th className="text-right font-normal px-3 py-3">ARR</th>
                <th className="text-right font-normal px-3 py-3">Growth</th>
                <th className="text-right font-normal px-3 py-3">Runway</th>
                <th className="text-left font-normal px-3 py-3">Health</th>
                <th className="text-center font-normal px-5 py-3">Signal</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((c, i) => (
                <tr
                  key={`${c.companyName}-${i}`}
                  className="border-t transition-colors"
                  style={{ borderColor: COLORS.border }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = COLORS.elevated)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <td className="px-5 py-3">
                    <div>{c.companyName}</div>
                    <div className="text-xs" style={{ color: COLORS.textMuted }}>{c.fundName}</div>
                  </td>
                  <td className="text-right px-3 py-3 tabular-nums">{fmtArr(c.arr)}</td>
                  <td
                    className="text-right px-3 py-3 tabular-nums"
                    style={{ color: (c.arrGrowth || 0) >= 0 ? COLORS.add : COLORS.sell }}
                  >
                    {c.arrGrowth != null ? `${c.arrGrowth >= 0 ? '+' : ''}${(c.arrGrowth * 100).toFixed(0)}%` : '—'}
                  </td>
                  <td className="text-right px-3 py-3 tabular-nums" style={{ color: COLORS.textMuted }}>
                    {c.runwayMonths != null ? `${c.runwayMonths.toFixed(0)} mo` : '—'}
                  </td>
                  <td className="px-3 py-3">
                    <HealthPill health={c.healthFlag} />
                  </td>
                  <td className="text-center px-5 py-3">
                    <SignalBadge
                      signal={c.healthFlag === 'ACCELERATING' ? 'ADD' : c.healthFlag === 'REVIEW' ? 'SELL' : 'HOLD'}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Shell>
  );
}