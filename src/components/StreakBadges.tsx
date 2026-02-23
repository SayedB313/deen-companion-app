import { ACHIEVEMENT_LABELS } from "@/hooks/useStreaks";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface StreakBadgesProps {
  achievements: string[];
}

const StreakBadges = ({ achievements }: StreakBadgesProps) => {
  if (achievements.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {achievements.map((key) => {
        const info = ACHIEVEMENT_LABELS[key];
        if (!info) return null;
        return (
          <Tooltip key={key}>
            <TooltipTrigger asChild>
              <Badge variant="secondary" className="text-xs gap-1 cursor-default">
                <span>{info.icon}</span>
                <span>{info.label}</span>
              </Badge>
            </TooltipTrigger>
            <TooltipContent>{info.label} achieved!</TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
};

export default StreakBadges;
