// src/modules/marking/publish/PublishButton.tsx
import { useState } from "react";
import { Button } from "@/ui/button";
import { Loader2, Send } from "lucide-react";
import PublishDialog from "./PublishDialog";
import { usePublish } from "./usePublish";
import type { Row } from "@/core/types/collab";

export function PublishButton({
  taskId,
  records,
  includes,
}: {
  taskId: string;
  records: Row[];
  includes: boolean[];
}) {
  const [open, setOpen] = useState(false);
  const pub = usePublish({ taskId, records, includes });
  const toggle = (v: boolean) => {
    if (pub.busy) return;
    setOpen(v);
    if (!v) pub.reset();
  };
  return (
    <>
      <Button
        variant="outline"
        className="gap-2"
        onClick={() => setOpen(true)}
        disabled={pub.busy}
      >
        {pub.busy ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
        发布
      </Button>
      <PublishDialog open={open} onOpenChange={toggle} state={pub} />
    </>
  );
}
