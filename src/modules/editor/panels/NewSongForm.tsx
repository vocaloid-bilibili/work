// src/modules/editor/panels/NewSongForm.tsx
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/select";
import { SONG_TYPES } from "@/core/types/constants";
import ArtistFields from "../shared/ArtistFields";
import type { SongType } from "@/core/types/catalog";

interface Props {
  name: string;
  onNameChange: (v: string) => void;
  type: SongType;
  onTypeChange: (v: SongType) => void;
  vocalists: string;
  onVocalistsChange: (v: string) => void;
  producers: string;
  onProducersChange: (v: string) => void;
  synthesizers: string;
  onSynthesizersChange: (v: string) => void;
  showInheritHint?: boolean;
}

export default function NewSongForm(p: Props) {
  return (
    <div className="space-y-3 border rounded-md p-3 sm:p-4">
      <div className="text-sm font-medium">新歌曲信息</div>
      <div className="space-y-1.5">
        <Label className="text-xs">歌曲名称</Label>
        <Input
          placeholder="输入新歌曲名称"
          value={p.name}
          onChange={(e) => p.onNameChange(e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">类型</Label>
        <Select
          value={p.type}
          onValueChange={(v: SongType) => p.onTypeChange(v)}
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
      {p.showInheritHint && (
        <p className="text-[10px] text-muted-foreground">
          以下艺人从原歌曲继承，可修改
        </p>
      )}
      <ArtistFields
        vocalists={p.vocalists}
        producers={p.producers}
        synthesizers={p.synthesizers}
        onVocalistsChange={p.onVocalistsChange}
        onProducersChange={p.onProducersChange}
        onSynthesizersChange={p.onSynthesizersChange}
      />
    </div>
  );
}
