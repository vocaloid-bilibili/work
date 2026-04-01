// src/modules/editor/song/SongForm.tsx
import { useState } from "react";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/select";
import { Card, CardContent } from "@/ui/card";
import { toast } from "sonner";
import { SONG_TYPES } from "@/core/types/constants";
import ArtistFields from "../shared/ArtistFields";
import ConfirmDialog from "@/shared/ui/ConfirmDialog";
import type { SongType } from "@/core/types/catalog";
import type { useSongForm } from "./useSongForm";

type Form = ReturnType<typeof useSongForm>;
interface Props {
  form: Form;
  songName: string;
  onSubmitted: () => void;
}

export default function SongForm({ form, songName, onSubmitted }: Props) {
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">显示名称</Label>
              <Input
                value={form.displayName}
                placeholder="留空使用原名"
                onChange={(e) => form.setDisplayName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">类型</Label>
              <Select
                value={form.type}
                onValueChange={(v: SongType) => form.setType(v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SONG_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <ArtistFields
            vocalists={form.vocalists}
            producers={form.producers}
            synthesizers={form.synthesizers}
            onVocalistsChange={form.setVocalists}
            onProducersChange={form.setProducers}
            onSynthesizersChange={form.setSynthesizers}
          />
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
        title="确认更新歌曲信息"
        loading={form.submitting}
        onConfirm={doSubmit}
        confirm="确认更新"
      >
        <div className="text-sm space-y-1">
          <p>歌曲: {songName}</p>
          <div className="text-xs text-muted-foreground">
            {Object.entries(form.changes()).map(([k, d]) => (
              <p key={k}>
                {k}: {String(d.old) || "（空）"} → {String(d.new) || "（空）"}
              </p>
            ))}
          </div>
        </div>
      </ConfirmDialog>
    </>
  );
}
