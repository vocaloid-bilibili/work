export default function HighlightSpaces({ text }: { text: string }) {
  if (!text) return null;
  const match = text.match(/^(\s*)([\s\S]*?)(\s*)$/);
  if (!match) return <>{text}</>;
  const [, leading, core, trailing] = match;
  if (!leading && !trailing) return <>{text}</>;

  const renderSpace = (sp: string) => (
    <span
      className="bg-destructive/20 text-destructive font-mono px-0.5 mx-px rounded-[2px] opacity-80"
      title="警告：包含多余的前导或后导空格"
    >
      {sp.replace(/ /g, "␣").replace(/\t/g, "⇥")}
    </span>
  );

  return (
    <>
      {leading && renderSpace(leading)}
      {core}
      {trailing && renderSpace(trailing)}
    </>
  );
}
