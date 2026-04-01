// src/modules/editor/video/VideoForm.tsx
import { useState } from "react";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { Switch } from "@/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/select";
import { Card, CardContent } from "@/ui/card";
import { toast } from "sonner";
import { COPYRIGHT } from "@/core/types/constants";
import ConfirmDialog from "@/shared/ui/ConfirmDialog";
import type { useVideoForm } from "./useVideoForm";

type Form = ReturnType<typeof useVideoForm>;
interface Props {
  form: Form;
  bvid: string;
  onSubmitted: () => void;
}

export default function VideoForm({ form, bvid, onSubmitted }: Props) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  const doSubmit = async () => {
    const ok = await form.submit();
    if (ok) {
      setConfirmOpen(false);
      onSubmitted();
    }
  };

  return (
    <>
      <Card>
        <CardContent className="pt-5 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">视频标题</Label>
            <Input
              value={form.title}
              onChange={(e) => form.setTitle(e.target.value)}
            />
            <p className="text-[10px] text-muted-foreground">
              标题修改会被下次爬虫覆盖
            </p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">版权类型</Label>
            <Select
              value={String(form.copyright)}
              onValueChange={(v: string) => form.setCopyright(parseInt(v))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COPYRIGHT.map((o) => (
                  <SelectItem key={o.value} value={String(o.value)}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-md">
            <div>
              <Label className="text-xs">禁用视频</Label>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                禁用后不参与排名，数据保留
              </p>
            </div>
            <Switch
              checked={form.disabled}
              onCheckedChange={form.setDisabled}
            />
          </div>
          <Button
            className="w-full"
            disabled={form.submitting || !form.hasChanges}
            onClick={() =>
              form.hasChanges ? setConfirmOpen(true) : toast.info("没有变化")
            }
          >
            {form.hasChanges ? "提交更新" : "无变化"}
          </Button>
        </CardContent>
      </Card>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="确认更新视频信息"
        loading={form.submitting}
        onConfirm={doSubmit}
        confirm="确认更新"
      >
        <div className="text-sm space-y-1">
          <p className="font-mono">{bvid}</p>
          <div className="text-xs text-muted-foreground">
            {Object.entries(form.changes()).map(([k, d]) => (
              <p key={k}>
                {k}: {String(d.old)} → {String(d.new)}
              </p>
            ))}
          </div>
        </div>
      </ConfirmDialog>
    </>
  );
}
