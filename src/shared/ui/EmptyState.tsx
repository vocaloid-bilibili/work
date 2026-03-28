// src/shared/ui/EmptyState.tsx
export default function EmptyState({ text = "暂无数据" }: { text?: string }) {
  return (
    <div className="text-center text-muted-foreground py-16 text-sm">
      {text}
    </div>
  );
}
