export function GreetingHeader({ dateLabel }: { dateLabel: string }) {
  return (
    <header>
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">Good morning, Milan.</h1>
      <p className="mt-1 text-slate-500">{dateLabel}</p>
    </header>
  );
}
