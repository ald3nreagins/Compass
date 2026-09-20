import Shell, { COLORS } from './Shell';

export default function Candidates() {
  return (
    <Shell>
      <h1 className="text-lg font-semibold mb-6">Candidates</h1>
      <div
        className="rounded-lg p-8 flex items-center justify-center"
        style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, minHeight: '300px' }}
      >
        <p className="text-sm" style={{ color: COLORS.textMuted }}>
          Companies not yet in the portfolio go here — coming next.
        </p>
      </div>
    </Shell>
  );
}