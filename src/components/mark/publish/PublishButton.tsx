// src/components/mark/publish/PublishButton.tsx

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Send } from "lucide-react";
import PublishDialog from "./PublishDialog";
import { usePublish } from "./usePublish";

interface Props {
  taskId: string;
}

export default function PublishButton({ taskId }: Props) {
  const [open, setOpen] = useState(false);
  const publishState = usePublish({ taskId });

  const handleOpenChange = (v: boolean) => {
    if (publishState.busy) return;
    setOpen(v);
    if (!v) publishState.reset();
  };

  return (
    <>
      <Button
        variant="outline"
        className="gap-2"
        onClick={() => setOpen(true)}
        disabled={publishState.busy}
      >
        {publishState.busy ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
        发布
      </Button>

      <PublishDialog
        open={open}
        onOpenChange={handleOpenChange}
        state={publishState}
      />
    </>
  );
}
