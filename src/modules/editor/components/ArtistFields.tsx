// src/modules/editor/components/ArtistFields.tsx
import TagEditor from "@/shared/ui/TagEditor";
import { Field } from "./Field";

interface Props {
  vocalists: string;
  producers: string;
  synthesizers: string;
  onVocalistsChange: (v: string) => void;
  onProducersChange: (v: string) => void;
  onSynthesizersChange: (v: string) => void;
  disabled?: boolean;
}

export function ArtistFields(p: Props) {
  return (
    <fieldset
      disabled={p.disabled}
      className="grid grid-cols-1 lg:grid-cols-3 gap-4"
    >
      <Field label="歌手">
        <TagEditor
          value={p.vocalists}
          onChange={p.onVocalistsChange}
          onInputChange={() => {}}
          searchType="vocalist"
        />
      </Field>
      <Field label="作者">
        <TagEditor
          value={p.producers}
          onChange={p.onProducersChange}
          onInputChange={() => {}}
          searchType="producer"
        />
      </Field>
      <Field label="引擎">
        <TagEditor
          value={p.synthesizers}
          onChange={p.onSynthesizersChange}
          onInputChange={() => {}}
          searchType="synthesizer"
        />
      </Field>
    </fieldset>
  );
}
