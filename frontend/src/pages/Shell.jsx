import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, ChevronDown, Check } from 'lucide-react';
import { useFund } from './FundContext';

export const COLORS = {
  bg: '#0B0F17',
  surface: '#121824',
  elevated: '#182131',
  text: '#F5F7FA',
  textMuted: '#8B96A8',
  border: '#253044',
  accent: '#4F7CFF',
  add: '#22C55E',
  hold: '#F59E0B',
  sell: '#EF5A67',
};

const NAV_ROUTES = {
  Overview: '/dashboard',
  Analyze: '/analyze',
  Portfolio: '/portfolio',
  Signals: '/signals',
  Candidates: '/candidates',
};

const NAV_SECONDARY = ['Sources', 'Settings'];

export default function Shell({ children }) {
  const location = useLocation();
  const { selectedFund, setSelectedFund, availableFunds } = useFund();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const options = ['All funds', ...availableFunds];

  return (
    <div
      style={{ background: COLORS.bg, color: COLORS.text, fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" }}
      className="min-h-screen w-full"
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');`}</style>

      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: COLORS.border }}>
        <Link to="/dashboard" className="flex items-center gap-2">
          <span style={{ color: COLORS.accent }} className="text-lg">◇</span>
          <span className="font-semibold text-sm tracking-wide">Compass</span>
        </Link>

        <form
  onSubmit={(e) => {
    e.preventDefault();
    const query = e.target.elements.searchInput.value.trim();
    if (query) navigate(`/signals?q=${encodeURIComponent(query)}`);
  }}
  className="flex items-center gap-2 px-3 py-1.5 rounded-md w-80"
  style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}
>
  <Search size={14} style={{ color: COLORS.textMuted }} />
  <input
    name="searchInput"
    placeholder="Search signals, companies…"
    className="bg-transparent outline-none text-sm w-full"
    style={{ color: COLORS.text }}
  />
</form>

        <div className="flex items-center gap-4">
          <div className="relative">
            <button
              onClick={() => setDropdownOpen((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm"
              style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, color: COLORS.text }}
            >
              {selectedFund}
              <ChevronDown size={14} style={{ color: COLORS.textMuted }} />
            </button>

            {dropdownOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
                <div
                  className="absolute right-0 mt-2 w-56 rounded-md overflow-hidden z-20 max-h-80 overflow-y-auto"
                  style={{ background: COLORS.elevated, border: `1px solid ${COLORS.border}` }}
                >
                  {options.length === 0 ? (
                    <p className="px-3 py-2 text-sm" style={{ color: COLORS.textMuted }}>
                      No funds loaded yet
                    </p>
                  ) : (
                    options.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => {
                          setSelectedFund(opt);
                          setDropdownOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm flex items-center justify-between transition-colors"
                        style={{ color: opt === selectedFund ? COLORS.text : COLORS.textMuted }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = COLORS.surface)}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        {opt}
                        {opt === selectedFund && <Check size={14} style={{ color: COLORS.accent }} />}
                      </button>
                    ))
                  )}
                </div>
              </>
            )}
          </div>

          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold"
            style={{ background: COLORS.elevated, color: COLORS.text, border: `1px solid ${COLORS.border}` }}
          >
            AR
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-52 shrink-0 px-4 py-6 border-r" style={{ borderColor: COLORS.border }}>
          <nav className="flex flex-col gap-1">
            {Object.entries(NAV_ROUTES).map(([label, path]) => {
              const active = location.pathname === path;
              return (
                <Link
                  key={label}
                  to={path}
                  className="text-left text-sm px-3 py-2 rounded-md transition-colors"
                  style={active ? { background: COLORS.elevated, color: COLORS.text } : { color: COLORS.textMuted }}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
          <div className="my-4 border-t" style={{ borderColor: COLORS.border }} />
    <nav className="flex flex-col gap-1">
  <Link
    to="/settings"
    className="text-left text-sm px-3 py-2 rounded-md transition-colors"
    style={location.pathname === '/settings' ? { background: COLORS.elevated, color: COLORS.text } : { color: COLORS.textMuted }}
  >
    Settings
  </Link>
  <Link
  to="/sources"
  className="text-left text-sm px-3 py-2 rounded-md transition-colors"
  style={location.pathname === '/sources' ? { background: COLORS.elevated, color: COLORS.text } : { color: COLORS.textMuted }}
>
  Sources
</Link>
</nav>
        </aside>

        {/* Page content */}
        <main className="flex-1 px-8 py-8">{children}</main>
      </div>
    </div>
  );
}