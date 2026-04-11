// src/modules/editor/components/Confirm.tsx
import ConfirmDialog from "@/shared/ui/ConfirmDialog";

export function Confirm({
  children,
  ...props
}: React.ComponentProps<typeof ConfirmDialog>) {
  return (
    <ConfirmDialog {...props}>
      <div className="min-w-0 wrap-anywhere">{children}</div>
    </ConfirmDialog>
  );
}
