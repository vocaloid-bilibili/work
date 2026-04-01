// src/modules/editor/shared/ArtistFields.tsx
import TagEditor from "@/shared/ui/TagEditor";
import { Label } from "@/ui/label";

interface Props {
  vocalists: string;
  producers: string;
  synthesizers: string;
  onVocalistsChange: (v: string) => void;
  onProducersChange: (v: string) => void;
  onSynthesizersChange: (v: string) => void;
  disabled?: boolean;
}

export default function ArtistFields({
  vocalists,
  producers,
  synthesizers,
  onVocalistsChange,
  onProducersChange,
  onSynthesizersChange,
  disabled,
}: Props) {
  return (
    <fieldset disabled={disabled} className="space-y-3">
      <div className="space-y-1.5">
        <Label className="text-xs">歌手</Label>
        <TagEditor
          value={vocalists}
          onChange={onVocalistsChange}
          searchType="vocalist"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">作者</Label>
        <TagEditor
          value={producers}
          onChange={onProducersChange}
          searchType="producer"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">引擎</Label>
        <TagEditor
          value={synthesizers}
          onChange={onSynthesizersChange}
          searchType="synthesizer"
        />
      </div>
    </fieldset>
  );
}
