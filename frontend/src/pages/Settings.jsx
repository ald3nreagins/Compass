import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Shell, { COLORS } from './Shell';
import {
  clearToken,
  getCurrentUserEmail,
  getDefaultPortfolio,
  saveDefaultPortfolio,
} from '../api';

export default function Settings() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [portfolioInput, setPortfolioInput] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setEmail(getCurrentUserEmail() || 'Unknown');
    setPortfolioInput(getDefaultPortfolio().join(', '));
  }, []);

  function handleLogout() {
    clearToken();
    navigate('/');
  }

  function handleSavePortfolio(e) {
    e.preventDefault();
    const companies = portfolioInput
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);
    saveDefaultPortfolio(companies);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <Shell>
      <h1 className="text-lg font-semibold mb-6">Settings</h1>

      <div className="flex flex-col gap-4 max-w-lg">
        {/* Account */}
        <div
          className="rounded-lg p-5"
          style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}
        >
          <p className="text-xs font-semibold tracking-wide uppercase mb-3" style={{ color: COLORS.textMuted }}>
            Account
          </p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm" style={{ color: COLORS.text }}>{email}</p>
              <p className="text-xs mt-0.5" style={{ color: COLORS.textMuted }}>Signed in</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-md text-sm font-medium"
              style={{ background: `${COLORS.sell}1A`, color: COLORS.sell }}
            >
              Log Out
            </button>
          </div>
        </div>

        {/* Default portfolio */}
        <div
          className="rounded-lg p-5"
          style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}
        >
          <p className="text-xs font-semibold tracking-wide uppercase mb-1" style={{ color: COLORS.textMuted }}>
            Default Portfolio Companies
          </p>
          <p className="text-xs mb-3" style={{ color: COLORS.textMuted }}>
            Pre-fills the company list on the Analyze page for Portfolio Impact checks.
          </p>
          <form onSubmit={handleSavePortfolio}>
            <textarea
              value={portfolioInput}
              onChange={(e) => setPortfolioInput(e.target.value)}
              placeholder="e.g. Affirm, SoFi, Klarna, Robinhood"
              rows={3}
              className="w-full mb-3 px-3 py-2 rounded-md text-sm bg-transparent outline-none resize-none"
              style={{ border: `1px solid ${COLORS.border}`, color: COLORS.text }}
            />
            <div className="flex items-center gap-3">
              <button
                type="submit"
                className="px-4 py-2 rounded-md text-sm font-medium"
                style={{ background: COLORS.accent, color: '#fff' }}
              >
                Save
              </button>
              {saved && (
                <span className="text-xs" style={{ color: COLORS.add }}>
                  Saved
                </span>
              )}
            </div>
          </form>
        </div>

        {/* About */}
        <div
          className="rounded-lg p-5"
          style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}
        >
          <p className="text-xs font-semibold tracking-wide uppercase mb-2" style={{ color: COLORS.textMuted }}>
            About
          </p>
          <p className="text-sm" style={{ color: COLORS.textMuted }}>
            Compass analyzes pitch videos and news for VC due diligence, using ElevenLabs for
            transcription and Claude for structured extraction and portfolio impact analysis.
          </p>
        </div>

        {/* More / marketing link */}
        <div
          className="rounded-lg p-5"
          style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}` }}
        >
          <p className="text-xs font-semibold tracking-wide uppercase mb-2" style={{ color: COLORS.textMuted }}>
            More
          </p>
          <a href="/" className="text-sm" style={{ color: COLORS.accent }}>
            View marketing site &amp; pricing →
          </a>
        </div>
      </div>
    </Shell>
  );
}