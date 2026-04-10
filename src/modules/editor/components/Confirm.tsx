// src/modules/editor/components/Confirm.tsx
import ConfirmDialog from "@/shared/ui/ConfirmDialog";

export function Confirm(props: React.ComponentProps<typeof ConfirmDialog>) {
  return <ConfirmDialog {...props} />;
}
