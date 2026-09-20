import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Sector,
} from 'recharts';
import { ChevronDown, Check } from 'lucide-react';
import Shell, { COLORS } from './Shell';
import { useFund } from './FundContext';
import { api } from '../api';

const LINE_PALETTE = ['#4F7CFF', '#8B7FFF', '#2DD4BF', '#38BDF8', '#F472B6', '#A78BFA', '#67E8F9', '#C084FC'];

const HEALTH_COLOR = {
  ACCELERATING: COLORS.add,
  STABLE: COLORS.accent,
  BASELINE: COLORS.textMuted,
  REVIEW: COLORS.sell,
};

const MAX_COMPANIES_FOR_LINE_CHART = 12;

// Broad industry groups, checked in priority order (most specific first) so
// compound terms like "Fintech" or "Edtech" land in the right domain group
// instead of getting swallowed into a generic "Technology" bucket.
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

function LineTooltipContent({ active, payload, label, hovered }) {
  if (!active || !payload || payload.length === 0) return null;
  const items = hovered ? payload.filter((p) => p.dataKey === hovered) : payload.slice(0, 1);
  if (items.length === 0) return null;

  return (
    <div className="rounded-md px-3 py-2" style={{ background: COLORS.elevated, border: `1px solid ${COLORS.border}` }}>
      <p className="text-xs mb-1.5" style={{ color: COLORS.textMuted }}>{label}</p>
      {items.map((item) => (
        <div key={item.dataKey} className="flex items-center gap-2">
          <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: item.color }} />
          <span className="text-sm font-medium">{item.dataKey}</span>
          <span className="text-xs tabular-nums ml-auto" style={{ color: COLORS.textMuted }}>
            ${item.value}M
          </span>
        </div>
      ))}
    </div>
  );
}

function PieTooltipContent({ active, payload }) {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0];
  return (
    <div className="rounded-md px-3 py-2" style={{ background: COLORS.elevated, border: `1px solid ${COLORS.border}` }}>
      <div className="flex items-center gap-2">
        <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: item.payload.fill }} />
        <span className="text-sm font-medium">{item.name}</span>
        <span className="text-xs tabular-nums ml-auto" style={{ color: COLORS.textMuted }}>
          {item.value} · {item.payload.pct}%
        </span>
      </div>
    </div>
  );
}

function QuarterDropdown({ quarters, selected, onSelect }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium"
        style={{ background: COLORS.elevated, border: `1px solid ${COLORS.border}`, color: COLORS.text }}
      >
        {selected || 'Quarter'}
        <ChevronDown size={12} style={{ color: COLORS.textMuted }} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 mt-2 w-32 rounded-md overflow-hidden z-20"
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

function renderActiveSlice(props) {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <Sector
      cx={cx}
      cy={cy}
      innerRadius={innerRadius}
      outerRadius={outerRadius + 6}
      startAngle={startAngle}
      endAngle={endAngle}
      fill={fill}
    />
  );
}

function PieCard({ title, subtitle, headerRight, data, colorFor, centerLabel, centerContent }) {
  const [activeIndex, setActiveIndex] = useState(null);
  const total = data.reduce((s, d) => s + d.value, 0);
  const withPct = data.map((d) => ({ ...d, pct: total ? Math.round((d.value / total) * 100) : 0 }));

  return (
    <div className="rounded-lg p-5" style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium">{title}</p>
        {headerRight ? headerRight : subtitle ? (
          <span className="text-xs" style={{ color: COLORS.textMuted }}>{subtitle}</span>
        ) : null}
      </div>

      {total === 0 ? (
        <p className="text-sm py-8 text-center" style={{ color: COLORS.textMuted }}>
          No data for this selection.
        </p>
      ) : (
        <div className="flex items-center gap-6">
          <div className="relative shrink-0" style={{ width: 140, height: 140 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={withPct}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={40}
                  outerRadius={65}
                  paddingAngle={2}
                  animationDuration={700}
                  animationEasing="ease-out"
                  activeIndex={activeIndex}
                  activeShape={renderActiveSlice}
                  onMouseEnter={(_, i) => setActiveIndex(i)}
                  onMouseLeave={() => setActiveIndex(null)}
                >
                  {withPct.map((entry, i) => (
                    <Cell key={entry.name} fill={colorFor(entry.name, i)} stroke="none" />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltipContent />} />
              </PieChart>
            </ResponsiveContainer>

            {centerContent ? (
              centerContent
            ) : (
              centerLabel && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xl font-semibold tabular-nums">{total}</span>
                  <span className="text-[10px]" style={{ color: COLORS.textMuted }}>{centerLabel}</span>
                </div>
              )
            )}
          </div>

          <div className="flex-1 flex flex-col gap-2">
            {withPct.map((d, i) => (
              <div
                key={d.name}
                className="flex items-center gap-2"
                onMouseEnter={() => setActiveIndex(i)}
                onMouseLeave={() => setActiveIndex(null)}
              >
                <span className="inline-block w-1.5 h-1.5 rounded-full shrink-0" style={{ background: colorFor(d.name, i) }} />
                <span
                  className="text-sm flex-1 truncate transition-colors"
                  style={{ color: activeIndex === i ? COLORS.text : COLORS.text }}
                >
                  {d.name}
                </span>
                <span className="text-xs tabular-nums" style={{ color: COLORS.textMuted }}>{d.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function PortfolioPage() {
  const [allCompanies, setAllCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredCompany, setHoveredCompany] = useState(null);
  const [selectedHealthQuarter, setSelectedHealthQuarter] = useState(null);
  const [yZoomMax, setYZoomMax] = useState(null); // null = full auto range, not zoomed
  const { selectedFund } = useFund();

  useEffect(() => {
    api
      .getPortfolioHoldings()
      .then((data) => {
        setAllCompanies(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load portfolio:', err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const fundFiltered =
    selectedFund === 'All funds' ? allCompanies : allCompanies.filter((c) => c.fundName === selectedFund);

  const quarters = Array.from(new Set(fundFiltered.map((c) => c.snapshotQuarter).filter(Boolean))).sort(
    (a, b) => quarterSortKey(a) - quarterSortKey(b)
  );
  const latestQuarter = quarters[quarters.length - 1];
  const latestSnapshot = fundFiltered.filter((c) => c.snapshotQuarter === latestQuarter);

  // Falls back to the latest quarter automatically if nothing's been picked
  // yet, or if the fund switched and the previous selection no longer exists.
  const effectiveHealthQuarter =
    selectedHealthQuarter && quarters.includes(selectedHealthQuarter) ? selectedHealthQuarter : latestQuarter;
  const healthSnapshot = fundFiltered.filter((c) => c.snapshotQuarter === effectiveHealthQuarter);

  const companyNames = Array.from(new Set(fundFiltered.map((c) => c.companyName).filter(Boolean))).sort();
  // Only guard against an unreadable chart when viewing ALL funds combined —
  // a single fund should always render fully, however many companies it has.
  const tooManyForLineChart = selectedFund === 'All funds' && companyNames.length > MAX_COMPANIES_FOR_LINE_CHART;

  const lineData = quarters.map((q) => {
    const row = { quarter: q };
    companyNames.forEach((name) => {
      const rec = fundFiltered.find((c) => c.snapshotQuarter === q && c.companyName === name);
      row[name] = rec && rec.arr != null ? +(rec.arr / 1_000_000).toFixed(2) : null;
    });
    return row;
  });

  const dataMaxArr = Math.max(
    1,
    ...lineData.flatMap((row) => companyNames.map((name) => row[name]).filter((v) => v != null))
  );

  const industryCounts = {};
  latestSnapshot.forEach((c) => {
    const key = groupIndustry(c.industry);
    industryCounts[key] = (industryCounts[key] || 0) + 1;
  });
  const industryData = Object.entries(industryCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const statusCounts = { ACCELERATING: 0, STABLE: 0, BASELINE: 0, REVIEW: 0 };
  healthSnapshot.forEach((c) => {
    if (statusCounts[c.healthFlag] != null) statusCounts[c.healthFlag] += 1;
  });
  const statusData = Object.entries(statusCounts)
    .map(([name, value]) => ({ name, value }))
    .filter((d) => d.value > 0);

  const growthValues = healthSnapshot.map((c) => c.arrGrowth).filter((v) => v != null);
  const netGrowthPct = growthValues.length ? (growthValues.reduce((s, v) => s + v, 0) / growthValues.length) * 100 : null;

  return (
    <Shell>
      <style>{`
        .compass-range {
          -webkit-appearance: none;
          appearance: none;
          height: 4px;
          background: ${COLORS.border};
          border-radius: 999px;
          outline: none;
        }
        .compass-range::-webkit-slider-runnable-track {
          height: 4px;
          background: ${COLORS.border};
          border-radius: 999px;
        }
        .compass-range::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: ${COLORS.accent};
          cursor: pointer;
          margin-top: -5px;
          border: 2px solid ${COLORS.bg};
          box-shadow: 0 0 0 1px ${COLORS.border};
          transition: transform 150ms ease;
        }
        .compass-range::-webkit-slider-thumb:hover {
          transform: scale(1.15);
        }
        .compass-range::-moz-range-track {
          height: 4px;
          background: ${COLORS.border};
          border-radius: 999px;
        }
        .compass-range::-moz-range-thumb {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: ${COLORS.accent};
          cursor: pointer;
          border: 2px solid ${COLORS.bg};
          box-shadow: 0 0 0 1px ${COLORS.border};
          transition: transform 150ms ease;
        }
        .compass-range::-moz-range-thumb:hover {
          transform: scale(1.15);
        }
      `}</style>

      <div className="flex items-baseline justify-between mb-6">
        <h1 className="text-lg font-semibold">Portfolio</h1>
        <span className="text-xs" style={{ color: COLORS.textMuted }}>
          {loading ? 'Syncing...' : `${selectedFund} · ${latestQuarter || 'no data'}`}
        </span>
      </div>

      {error && (
        <div
          className="rounded-lg p-4 mb-6 text-sm"
          style={{ background: `${COLORS.sell}1A`, color: COLORS.sell, border: `1px solid ${COLORS.sell}` }}
        >
          Couldn't load portfolio data: {error}.
        </div>
      )}

      {loading ? (
        <p className="text-sm" style={{ color: COLORS.textMuted }}>Loading...</p>
      ) : (
        <>
          {/* ARR trend line chart */}
          <div className="rounded-lg p-5 mb-6" style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
            <p className="text-sm font-medium mb-4">Company performance over time</p>

            {tooManyForLineChart ? (
              <div className="py-10 text-center">
                <p className="text-sm" style={{ color: COLORS.textMuted }}>
                  {companyNames.length} companies selected — pick a specific fund above to see individual trend
                  lines clearly.
                </p>
              </div>
            ) : companyNames.length === 0 ? (
              <p className="text-sm py-10 text-center" style={{ color: COLORS.textMuted }}>
                No companies found for this selection.
              </p>
            ) : (
              <>
                <div className="flex flex-wrap gap-x-4 gap-y-2 mb-4 max-h-20 overflow-y-auto pr-1">
                  {companyNames.map((name, i) => (
                    <div
                      key={name}
                      className="flex items-center gap-1.5 text-xs cursor-default"
                      style={{ color: hoveredCompany === name ? COLORS.text : COLORS.textMuted }}
                      onMouseEnter={() => setHoveredCompany(name)}
                      onMouseLeave={() => setHoveredCompany(null)}
                    >
                      <span
                        className="inline-block w-1.5 h-1.5 rounded-full"
                        style={{ background: LINE_PALETTE[i % LINE_PALETTE.length] }}
                      />
                      {name}
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs shrink-0" style={{ color: COLORS.textMuted }}>
                    Zoom Y-axis
                  </span>
                  <input
                    type="range"
                    min={1}
                    max={Math.ceil(dataMaxArr)}
                    step={Math.max(1, Math.round(dataMaxArr / 200))}
                    value={yZoomMax ?? Math.ceil(dataMaxArr)}
                    onChange={(e) => setYZoomMax(Number(e.target.value))}
                    className="compass-range flex-1"
                  />
                  <span className="text-xs tabular-nums w-16 shrink-0" style={{ color: COLORS.textMuted }}>
                    ${(yZoomMax ?? Math.ceil(dataMaxArr)).toFixed(0)}M
                  </span>
                  {yZoomMax != null && (
                    <button
                      onClick={() => setYZoomMax(null)}
                      className="text-xs px-2 py-1 rounded shrink-0"
                      style={{ color: COLORS.accent, border: `1px solid ${COLORS.border}` }}
                    >
                      Reset
                    </button>
                  )}
                </div>

                <div style={{ width: '100%', height: 340 }}>
                  <ResponsiveContainer>
                    <LineChart data={lineData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                      <CartesianGrid stroke={COLORS.border} strokeDasharray="0" vertical={false} />
                      <XAxis
                        dataKey="quarter"
                        tick={{ fill: COLORS.textMuted, fontSize: 11 }}
                        axisLine={{ stroke: COLORS.border }}
                        tickLine={false}
                      />
                      <YAxis
                        domain={[0, yZoomMax ?? 'auto']}
                        allowDataOverflow={yZoomMax != null}
                        tick={{ fill: COLORS.textMuted, fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => `$${v}M`}
                        width={50}
                      />
                      <Tooltip
                        content={<LineTooltipContent hovered={hoveredCompany} />}
                        cursor={{ stroke: COLORS.accent, strokeWidth: 1, strokeDasharray: '3 3' }}
                      />
                      {companyNames.map((name, i) => (
                        <Line
                          key={name}
                          type="monotone"
                          dataKey={name}
                          stroke={LINE_PALETTE[i % LINE_PALETTE.length]}
                          strokeWidth={hoveredCompany === name ? 2.5 : 1.5}
                          strokeOpacity={hoveredCompany && hoveredCompany !== name ? 0.15 : 1}
                          dot={false}
                          activeDot={{ r: 4 }}
                          connectNulls
                          animationDuration={700}
                          animationEasing="ease-out"
                          onMouseEnter={() => setHoveredCompany(name)}
                          onMouseLeave={() => setHoveredCompany(null)}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}
          </div>

          {/* Pie charts */}
          <div className="grid grid-cols-2 gap-4">
            <PieCard
              title="Industry breakdown"
              centerLabel="companies"
              data={industryData}
              colorFor={(name, i) => LINE_PALETTE[i % LINE_PALETTE.length]}
            />
            <PieCard
              title="Portfolio health"
              centerContent={
                netGrowthPct != null && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span
                      className="text-xl font-semibold tabular-nums"
                      style={{ color: netGrowthPct >= 0 ? COLORS.add : COLORS.sell }}
                    >
                      {netGrowthPct >= 0 ? '+' : ''}
                      {netGrowthPct.toFixed(1)}%
                    </span>
                    <span className="text-[10px]" style={{ color: COLORS.textMuted }}>net growth</span>
                  </div>
                )
              }
              headerRight={
                <QuarterDropdown
                  quarters={quarters}
                  selected={effectiveHealthQuarter}
                  onSelect={setSelectedHealthQuarter}
                />
              }
              data={statusData}
              colorFor={(name) => HEALTH_COLOR[name] || COLORS.textMuted}
            />
          </div>
        </>
      )}
    </Shell>
  );
}