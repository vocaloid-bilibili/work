// src/components/contributions/RankingTab.tsx
import { Separator } from "@/components/ui/separator";
import ContributorList from "./ContributorList";
import FieldBreakdown from "./FieldBreakdown";
import type { ContributorStats, TaskStats } from "./types";

interface Props {
  contributors: ContributorStats[];
  activeStats: TaskStats | null;
}

export default function RankingTab({ contributors, activeStats }: Props) {
  return (
    <div className="space-y-6">
      <ContributorList contributors={contributors} />
      {activeStats && (
        <>
          <Separator />
          <FieldBreakdown breakdown={activeStats.fieldBreakdown} />
        </>
      )}
    </div>
  );
}
