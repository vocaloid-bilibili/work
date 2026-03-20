export default function UserAvatar({
  src,
  name,
  size = "md",
}: {
  src?: string | null;
  name: string;
  size?: "sm" | "md";
}) {
  const dim = size === "sm" ? "h-7 w-7 text-[10px]" : "h-9 w-9 text-xs";
  return (
    <div
      className={`relative ${dim} rounded-full overflow-hidden bg-muted flex items-center justify-center shrink-0 ring-2 ring-background`}
    >
      {src ? (
        <img
          src={src}
          alt={name}
          className="h-full w-full object-cover"
          referrerPolicy="no-referrer"
        />
      ) : (
        <span className="font-semibold text-muted-foreground">
          {(name || "?").slice(0, 1).toUpperCase()}
        </span>
      )}
    </div>
  );
}
