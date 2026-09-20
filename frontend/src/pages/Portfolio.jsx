import Shell, { COLORS } from './Shell';

export default function Portfolio() {
  return (
    <Shell>
      <h1 className="text-lg font-semibold mb-6">Portfolio</h1>
      <div
        className="rounded-lg p-8 flex items-center justify-center"
        style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, minHeight: '300px' }}
      >
        <p className="text-sm" style={{ color: COLORS.textMuted }}>
          Full portfolio browsing and filtering goes here — coming next.
        </p>
      </div>
    </Shell>
  );
}