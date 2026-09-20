import { useState, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import Shell, { COLORS } from './Shell';
import { useFund } from './FundContext';
import { api } from '../api';

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

function quarterSortKey(q) {
  const match = /Q(\d)\s*(\d{4})/i.exec(q || '');
  if (!match) return 0;
  const [, quarterNum, year] = match;
  return parseInt(year, 10) * 4 + parseInt(quarterNum, 10);
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

function QuarterDropdown({ quarters, selected, onSelect }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium"
        style={{ background: COLORS.elevated, border: `1px solid ${COLORS.border}`, color: COLORS.text }}
      >
        {selected || 'Select quarter'}
        <ChevronDown size={12} style={{ color: COLORS.textMuted }} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 mt-2 w-40 rounded-md overflow-hidden z-20"
            style={{ background: COLORS.elevated, border: `1px solid ${COLORS.border}` }}
          >
            {quarters.map((q) => (
              <button
                key={q}
                onClick={() => {
                  onSelect(q);
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-sm flex items-center justify-between transition-colors"
                style={{ color: q === selected ? COLORS.text : COLORS.textMuted }}
                onMouseEnter={(e) => (e.currentTarget.style.background = COLORS.surface)}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                {q}
                {q === selected && <Check size={14} style={{ color: COLORS.accent }} />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ---- Recent signals helpers (mirrors the logic in Signals.jsx) ----

function toneFor(analysis, type) {
  if (analysis.notApplicable) return COLORS.accent;
  if (type === 'portfolio-impact') {
    return analysis.overallImpact === 'positive'
      ? COLORS.add
      : analysis.overallImpact === 'negative'
      ? COLORS.sell
      : analysis.overallImpact === 'mixed'
      ? COLORS.hold
      : COLORS.accent;
  }
  if (analysis.sentiment === 'confident') return COLORS.add;
  if (analysis.sentiment === 'overhyped') return COLORS.sell;
  return COLORS.accent;
}

function summaryFor(analysis, type) {
  if (analysis.notApplicable) return analysis.reason;
  if (type === 'portfolio-impact') return analysis.eventSummary;
  return analysis.productDescription || analysis.companyName || 'Analyzed pitch';
}

function formatRelativeDate(iso) {
  try {
    const date = new Date(iso);
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  } catch {
    return '';
  }
}

function RecentSignals() {
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    api
      .getHistory()
      .then((data) => {
        setSignals(data.slice(0, 4)); // most recent first, already ordered by backend
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <p className="text-sm" style={{ color: COLORS.textMuted }}>
        Loading recent signals…
      </p>
    );
  }

  if (error) {
    return (
      <p className="text-sm" style={{ color: COLORS.textMuted }}>
        Couldn't load recent signals.
      </p>
    );
  }

  if (signals.length === 0) {
    return (
      <p className="text-sm" style={{ color: COLORS.textMuted }}>
        No signals yet — run an analysis from the Analyze tab.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {signals.map((s) => {
        let analysis = {};
        try {
          analysis = JSON.parse(s.analysisJson);
        } catch {
          analysis = {};
        }
        const tone = toneFor(analysis, s.analysisType);
        return (
          <div key={s.id} className="flex items-start gap-2.5">
            <span
              className="inline-block w-1.5 h-1.5 rounded-full shrink-0 mt-1.5"
              style={{ background: tone }}
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm truncate" style={{ color: COLORS.text }}>
                {summaryFor(analysis, s.analysisType)}
              </p>
              <p className="text-xs" style={{ color: COLORS.textMuted }}>
                {s.analysisType === 'portfolio-impact' ? 'Portfolio Impact' : 'Pitch Evaluation'} ·{' '}
                {formatRelativeDate(s.createdAt)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---- Main page ----

export default function PortfolioOverviewPage() {
  const [allCompanies, setAllCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [availableQuarters, setAvailableQuarters] = useState([]);
  const [selectedQuarter, setSelectedQuarter] = useState(null);
  const { selectedFund, setAvailableFunds } = useFund();

  useEffect(() => {
    api
      .getPortfolioHoldings()
      .then((data) => {
        setAllCompanies(data);

        const uniqueFunds = Array.from(new Set(data.map((c) => c.fundName).filter(Boolean))).sort();
        setAvailableFunds(uniqueFunds);

        const uniqueQuarters = Array.from(new Set(data.map((c) => c.snapshotQuarter).filter(Boolean))).sort(
          (a, b) => quarterSortKey(a) - quarterSortKey(b)
        );
        setAvailableQuarters(uniqueQuarters);
        setSelectedQuarter(uniqueQuarters[uniqueQuarters.length - 1] || null);

        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load portfolio:', err);
        setError(err.message);
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const companies = allCompanies.filter((c) => {
    const fundMatch = selectedFund === 'All funds' || c.fundName === selectedFund;
    const quarterMatch = c.snapshotQuarter === selectedQuarter;
    return fundMatch && quarterMatch;
  });

  const totalValue = companies.reduce((s, c) => s + (c.arr || 0), 0) / 1_000_000;
  const accelerating = companies.filter((c) => c.healthFlag === 'ACCELERATING').length;
  const review = companies.filter((c) => c.healthFlag === 'REVIEW').length;

  return (
    <Shell>
      <div className="flex items-baseline justify-between mb-6">
        <h1 className="text-lg font-semibold">Portfolio overview</h1>
        <span className="text-xs" style={{ color: COLORS.textMuted }}>
          {loading ? 'Syncing...' : error ? 'Sync failed' : `Last synced just now · ${selectedFund}`}
        </span>
      </div>

      {error && (
        <div
          className="rounded-lg p-4 mb-6 text-sm"
          style={{ background: `${COLORS.sell}1A`, color: COLORS.sell, border: `1px solid ${COLORS.sell}` }}
        >
          Couldn't load portfolio data: {error}. Confirm the Spring Boot server is running on port 8080 and that
          you're logged in.
        </div>
      )}

      {!loading && !error && companies.length === 0 && (
        <div
          className="rounded-lg p-4 mb-6 text-sm"
          style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, color: COLORS.textMuted }}
        >
          No holdings found for {selectedFund} in {selectedQuarter}.
        </div>
      )}

      {/* Stat cards */}
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

      {/* Health + Signals row */}
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
          <RecentSignals />
        </div>
      </div>

      {/* Companies table */}
      <div className="rounded-lg overflow-hidden" style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
        <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: COLORS.border }}>
          <p className="text-sm font-medium">Portfolio companies</p>
          {availableQuarters.length > 0 && (
            <QuarterDropdown
              quarters={availableQuarters}
              selected={selectedQuarter}
              onSelect={setSelectedQuarter}
            />
          )}
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
                  key={`${c.companyName}-${c.fundName}-${i}`}
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