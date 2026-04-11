// src/modules/editor/views/Board.tsx
import { useState } from "react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/select";
import * as api from "@/core/api/mainEndpoints";
import { logEdit } from "@/core/api/collabEndpoints";
import { BOARDS } from "@/core/types/constants";
import { Section } from "../components/Section";
import { Field } from "../components/Field";
import { Input } from "../components/Input";
import { Btn } from "../components/Btn";

function boardLabel(v: string) {
  return BOARDS.find((b) => b.value === v)?.label || v;
}

export function BoardView() {
  const [board, setBoard] = useState("vocaloid-daily");
  const [issue, setIssue] = useState("");
  const [cur, setCur] = useState<string | null>(null);
  const [bvid, setBvid] = useState("");
  const [querying, setQuerying] = useState(false);
  const [saving, setSaving] = useState(false);

  const query = async () => {
    const n = parseInt(issue);
    if (!n || n < 1) {
      toast.warning("请输入有效期数");
      return;
    }
    setQuerying(true);
    try {
      const r = await api.getBoardVideo(board, n);
      setCur(r?.bvid ?? "");
      setBvid(r?.bvid ?? "");
    } catch {
      setCur("");
      setBvid("");
    } finally {
      setQuerying(false);
    }
  };

  const save = async () => {
    const n = parseInt(issue);
    if (!n || !bvid.trim()) return;
    setSaving(true);
    try {
      await api.setBoardVideo(board, n, bvid.trim());
      logEdit({
        targetType: "ranking_video",
        targetId: `${board}_${n}`,
        action: "set_board_video",
        detail: {
          bvid: bvid.trim(),
          board,
          boardName: boardLabel(board),
          issue: n,
          oldBvid: cur || null,
        },
      });
      toast.success("榜单视频设置成功");
      setCur(bvid.trim());
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || "设置失败");
    } finally {
      setSaving(false);
    }
  };

  const changed = bvid.trim() !== (cur ?? "");

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground text-center">
        设置榜单期对应的 B 站投稿视频
      </p>

      <Section title="查询">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="榜单">
              <Select value={board} onValueChange={setBoard}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BOARDS.map((b) => (
                    <SelectItem key={b.value} value={b.value}>
                      {b.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="期数">
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="期数"
                  value={issue}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setIssue(e.target.value)
                  }
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) =>
                    e.key === "Enter" && query()
                  }
                />
                <Btn onClick={query} disabled={querying} loading={querying}>
                  查询
                </Btn>
              </div>
            </Field>
          </div>

          {cur !== null && (
            <div className="space-y-3 border-t pt-4">
              <p className="text-sm text-muted-foreground break-all">
                当前：<span className="font-mono">{cur || "（未设置）"}</span>
              </p>
              <Field label="BV 号">
                <Input
                  value={bvid}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setBvid(e.target.value)
                  }
                  placeholder="输入 BV 号"
                />
              </Field>
              <Btn
                variant="primary"
                className="w-full"
                onClick={save}
                disabled={saving || !changed || !bvid.trim()}
                loading={saving}
              >
                {changed ? "保存" : "无变化"}
              </Btn>
            </div>
          )}
        </div>
      </Section>
    </div>
  );
}
