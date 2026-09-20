import { useState, useEffect } from 'react';
import { ExternalLink } from 'lucide-react';
import Shell, { COLORS } from './Shell';
import { useFund } from './FundContext';
import { api } from '../api';

// Same grouping used on the Portfolio page — kept duplicated here rather than
// shared, since this app has had a lot of cross-file import path issues.
const INDUSTRY_GROUPS = [
  { group: 'Education', keywords: ['edtech', 'education'] },
  { group: 'Finance', keywords: ['fintech', 'finance', 'banking', 'credit', 'cryptocurrency', 'crypto', 'insurance', 'payments'] },
  { group: 'Healthcare', keywords: ['healthtech', 'biotech', 'biotechnology', 'health care', 'healthcare', 'medtech', 'pharma'] },
  { group: 'Industrial', keywords: ['agtech', 'agriculture', 'aerospace', 'carbon capture', 'energy', 'manufacturing', 'robotics', 'logistics'] },
  { group: 'Consumer', keywords: ['consumer', 'beauty', 'collectibles', 'e-commerce', 'ecommerce', 'events', 'delivery', 'gamification', 'media', 'entertainment', 'gaming'] },
  { group: 'Business', keywords: ['compliance', 'document management', 'law enforcement', 'legal', 'real estate', 'marketplace', 'hr', 'analytics', 'enterprise'] },
  {
    group: 'Technology',
    keywords: ['artificial intelligence', 'agentic ai', '\\bai\\b', 'big data', 'apps', 'mobile apps', 'cloud', 'database', 'developer', 'blockchain', 'cybersecurity', 'software', 'saas', 'technology'],
  },
];

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function groupIndustry(industry) {
  if (!industry) return 'Unspecified';
  for (const { group, keywords } of INDUSTRY_GROUPS) {
    for (const kw of keywords) {
      const pattern = kw.startsWith('\\b') ? kw : `\\b${escapeRegex(kw)}\\b`;
      if (new RegExp(pattern, 'i').test(industry)) return group;
    }
  }
  return 'Other';
}

function quarterSortKey(q) {
  const match = /Q(\d)\s*(\d{4})/i.exec(q || '');
  if (!match) return 0;
  const [, quarterNum, year] = match;
  return parseInt(year, 10) * 4 + parseInt(quarterNum, 10);
}

// Best-effort extraction from a signal/history entry — tries several
// plausible field-name paths since the real shape hasn't been confirmed yet.
// Returns { companies: string[], sentiment: string|null, recommendation: string|null }
function parseSignalEntry(item) {
  const companies =
    item.companiesMentioned ||
    item.extraction?.companiesMentioned ||
    item.result?.companiesMentioned ||
    item.companies ||
    (item.company ? [item.company] : []) ||
    [];

  const sentiment = item.sentiment || item.extraction?.sentiment || item.result?.sentiment || null;

  const recommendation =
    item.recommendation || item.signal || item.decision || item.action || null;

  return {
    companies: Array.isArray(companies) ? companies : [],
    sentiment: sentiment ? String(sentiment).toLowerCase() : null,
    recommendation: recommendation ? String(recommendation).toUpperCase() : null,
  };
}

function companyHasSignal(companyName, signals) {
  let positive = false;
  let negative = false;

  for (const entry of signals) {
    const matched = entry.companies.some(
      (c) => c && companyName && c.toLowerCase().trim() === companyName.toLowerCase().trim()
    );
    if (!matched) continue;

    if (entry.sentiment === 'bullish' || entry.recommendation === 'ADD') positive = true;
    if (entry.sentiment === 'bearish' || entry.recommendation === 'SELL') negative = true;
  }

  return { positive, negative };
}

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState([]);
  const [holdings, setHoldings] = useState([]);
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { selectedFund } = useFund();

  useEffect(() => {
    Promise.all([
      api.getCandidates(),
      api.getPortfolioHoldings(),
      api.getHistory().catch((err) => {
        console.warn('Signal history unavailable, ranking will skip the signal boost:', err.message);
        return [];
      }),
    ])
      .then(([candidatesData, holdingsData, signalsData]) => {
        setCandidates(candidatesData);
        setHoldings(holdingsData);
        setSignals(Array.isArray(signalsData) ? signalsData.map(parseSignalEntry) : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load candidates:', err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const fundFiltered =
    selectedFund === 'All funds' ? holdings : holdings.filter((h) => h.fundName === selectedFund);

  const quarters = Array.from(new Set(fundFiltered.map((h) => h.snapshotQuarter).filter(Boolean))).sort(
    (a, b) => quarterSortKey(a) - quarterSortKey(b)
  );
  const latestQuarter = quarters[quarters.length - 1];
  const currentPortfolio = fundFiltered.filter((h) => h.snapshotQuarter === latestQuarter);

  // How saturated is each industry group in the current portfolio?
  const groupCounts = {};
  currentPortfolio.forEach((h) => {
    const g = groupIndustry(h.industry);
    groupCounts[g] = (groupCounts[g] || 0) + 1;
  });
  const portfolioTotal = currentPortfolio.length || 1;

  const ranked = candidates
    .map((c) => {
      const group = groupIndustry(c.industry);
      const share = (groupCounts[group] || 0) / portfolioTotal;
      const diversificationScore = 1 - share; // underrepresented industries score higher

      const { positive, negative } = companyHasSignal(c.companyName, signals);
      const signalAdjustment = positive ? 0.3 : negative ? -0.3 : 0;

      const score = Math.max(0, Math.min(1, diversificationScore + signalAdjustment));

      return { ...c, group, diversificationScore, positive, negative, score };
    })
    .sort((a, b) => b.score - a.score);

  return (
    <Shell>
      <div className="flex items-baseline justify-between mb-2">
        <h1 className="text-lg font-semibold">Candidates</h1>
        <span className="text-xs" style={{ color: COLORS.textMuted }}>
          {loading ? 'Syncing...' : `Ranked against ${selectedFund}`}
        </span>
      </div>
      <p className="text-sm mb-6" style={{ color: COLORS.textMuted }}>
        Ranked by how much each candidate would diversify your current portfolio's industry mix, boosted when
        recent signals point to strong performance.
      </p>

      {error && (
        <div
          className="rounded-lg p-4 mb-6 text-sm"
          style={{ background: `${COLORS.sell}1A`, color: COLORS.sell, border: `1px solid ${COLORS.sell}` }}
        >
          Couldn't load candidates: {error}.
        </div>
      )}

      {loading ? (
        <p className="text-sm" style={{ color: COLORS.textMuted }}>Loading...</p>
      ) : ranked.length === 0 ? (
        <p className="text-sm" style={{ color: COLORS.textMuted }}>No candidate companies found.</p>
      ) : (
        <div className="rounded-lg overflow-hidden" style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ color: COLORS.textMuted }}>
                <th className="text-left font-normal px-5 py-3">Company</th>
                <th className="text-left font-normal px-3 py-3">Industry</th>
                <th className="text-left font-normal px-3 py-3">Stage</th>
                <th className="text-left font-normal px-3 py-3">Backed by</th>
                <th className="text-left font-normal px-3 py-3">Signal</th>
                <th className="text-right font-normal px-5 py-3">Match</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((c, i) => (
                <tr
                  key={`${c.companyName}-${i}`}
                  className="border-t transition-colors"
                  style={{ borderColor: COLORS.border }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = COLORS.elevated)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1.5">
                      <span>{c.companyName}</span>
                      {c.profileUrl && (
                        <a href={c.profileUrl} target="_blank" rel="noreferrer" style={{ color: COLORS.textMuted }}>
                          <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                    {c.description && (
                      <div className="text-xs truncate max-w-xs" style={{ color: COLORS.textMuted }}>
                        {c.description}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <div className="text-sm">{c.group}</div>
                    <div className="text-xs" style={{ color: COLORS.textMuted }}>{c.industry}</div>
                  </td>
                  <td className="px-3 py-3" style={{ color: COLORS.textMuted }}>{c.stage || '—'}</td>
                  <td className="px-3 py-3" style={{ color: COLORS.textMuted }}>{c.backedBy || '—'}</td>
                  <td className="px-3 py-3">
                    {c.positive ? (
                      <span className="text-xs font-medium" style={{ color: COLORS.add }}>Bullish signal</span>
                    ) : c.negative ? (
                      <span className="text-xs font-medium" style={{ color: COLORS.sell }}>Bearish signal</span>
                    ) : (
                      <span className="text-xs" style={{ color: COLORS.textMuted }}>—</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: COLORS.border }}>
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${Math.round(c.score * 100)}%`, background: COLORS.accent }}
                        />
                      </div>
                      <span className="text-xs tabular-nums w-9 text-right" style={{ color: COLORS.textMuted }}>
                        {Math.round(c.score * 100)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Shell>
  );
}