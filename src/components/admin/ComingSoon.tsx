export function ComingSoon({
  title,
  description,
  phase,
}: {
  title: string;
  description: string;
  phase: string;
}) {
  return (
    <div>
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
      <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600">
        <p className="font-medium text-slate-800">Planned for {phase}.</p>
        <p className="mt-1">
          This screen is scaffolded so the navigation is complete. The
          implementation lands in an upcoming Phase 2 session.
        </p>
      </div>
    </div>
  );
}
