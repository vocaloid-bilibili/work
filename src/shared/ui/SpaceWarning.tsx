// src/shared/ui/SpaceWarning.tsx
export default function SpaceWarning({ text }: { text: string }) {
  if (!text) return null;
  const m = text.match(/^(\s*)([\s\S]*?)(\s*)$/);
  if (!m) return <>{text}</>;
  const [, lead, core, trail] = m;
  if (!lead && !trail) return <>{text}</>;
  const render = (sp: string) => (
    <span
      className="bg-destructive/20 text-destructive font-mono px-0.5 mx-px rounded-[2px] opacity-80"
      title="警告：多余空格"
    >
      {sp.replace(/ /g, "␣").replace(/\t/g, "⇥")}
    </span>
  );
  return (
    <>
      {lead && render(lead)}
      {core}
      {trail && render(trail)}
    </>
  );
}
