import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Shell, { COLORS } from './Shell';

const KNOWN_SOURCES = [
  {
    title: 'Chairman Kevin Warsh — Fed Rate Hike Presser',
    url: 'https://www.youtube.com/watch?v=Nkmrr7P5gW4',
    type: 'Portfolio Impact',
    note: 'Strong test case — fintech/lending sensitivity to rate changes.',
  },
  {
    title: 'BOJ Rate Hike — Bloomberg Daybreak Europe',
    url: 'https://www.youtube.com/watch?v=c0zGcyv2HE8',
    type: 'Portfolio Impact',
    note: 'Good for cross-currency, SoftBank/Arm financing angle.',
  },
  {
    title: 'CNBC / Yahoo Finance Market Coverage',
    url: 'https://www.youtube.com/watch?v=9zk8m4kBgno',
    type: 'Pitch or Portfolio',
    note: 'General market commentary — YouTube link extracts reliably.',
  },
];

const KNOWN_LIMITATIONS = [
  'Most YouTube links extract reliably.',
  'News-site embeds (CNBC.com, Bloomberg.com, Euronews) often do not extract — the underlying video player is proprietary and unsupported by our extraction tool.',
  'NPR article pages are not directly downloadable; a direct MP3 link works better than the article URL.',
  'If a URL fails, use the file upload option on the Analyze page instead.',
];

export default function Sources() {
  const navigate = useNavigate();
  const [copiedUrl, setCopiedUrl] = useState(null);

  function handleCopy(url) {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 1500);
  }

  function handleUse(url) {
    navigator.clipboard.writeText(url);
    navigate('/analyze');
  }

  return (
    <Shell>
      <h1 className="text-lg font-semibold mb-6">Sources</h1>

      <div className="flex flex-col gap-4 max-w-2xl">
        <div
          className="rounded-lg p-5"
          style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}
        >
          <p className="text-xs font-semibold tracking-wide uppercase mb-3" style={{ color: COLORS.textMuted }}>
            Verified Working Links
          </p>
          <div className="flex flex-col gap-2">
            {KNOWN_SOURCES.map((s) => (
              <div
                key={s.url}
                className="rounded-md p-3"
                style={{ background: COLORS.elevated, border: `1px solid ${COLORS.border}` }}
              >
                <div className="flex items-center justify-between gap-3 mb-1">
                  <p className="text-sm font-medium" style={{ color: COLORS.text }}>
                    {s.title}
                  </p>
                  <span
                    className="text-xs px-2 py-0.5 rounded shrink-0"
                    style={{ color: COLORS.accent, background: `${COLORS.accent}1A` }}
                  >
                    {s.type}
                  </span>
                </div>
                <p className="text-xs mb-2 break-all" style={{ color: COLORS.textMuted }}>
                  {s.url}
                </p>
                <p className="text-xs mb-3" style={{ color: COLORS.textMuted }}>
                  {s.note}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleUse(s.url)}
                    className="px-3 py-1 rounded-md text-xs font-medium"
                    style={{ background: COLORS.accent, color: '#fff' }}
                  >
                    Use in Analyze
                  </button>
                  <button
                    onClick={() => handleCopy(s.url)}
                    className="px-3 py-1 rounded-md text-xs font-medium"
                    style={{ border: `1px solid ${COLORS.border}`, color: COLORS.textMuted }}
                  >
                    {copiedUrl === s.url ? 'Copied' : 'Copy Link'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          className="rounded-lg p-5"
          style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}
        >
          <p className="text-xs font-semibold tracking-wide uppercase mb-3" style={{ color: COLORS.textMuted }}>
            Supported Sources
          </p>
          <ul className="text-sm space-y-1.5" style={{ color: COLORS.text }}>
            {KNOWN_LIMITATIONS.map((l, i) => (
              <li key={i} className="flex gap-2">
                <span style={{ color: COLORS.textMuted }}>—</span>
                <span className="leading-snug">{l}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Shell>
  );
}