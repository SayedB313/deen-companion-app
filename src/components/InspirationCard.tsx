import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface InspirationCardProps {
  text: string;
  source: string;
  loading?: boolean;
}

const TRUNCATE_LENGTH = 180;

const InspirationCard = ({ text, source, loading }: InspirationCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > TRUNCATE_LENGTH;
  const displayText = !expanded && isLong ? text.slice(0, TRUNCATE_LENGTH) + "…" : text;

  if (loading) {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="py-4 space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/3" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        "border-primary/20 bg-primary/5 transition-all duration-300",
        isLong && "cursor-pointer hover:bg-primary/10"
      )}
      onClick={() => isLong && setExpanded(!expanded)}
    >
      <CardContent className="py-4">
        <div className="flex items-start gap-2">
          <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm italic leading-relaxed">"{displayText}"</p>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-muted-foreground">— {source}</p>
              {isLong && (
                <button className="text-xs text-primary flex items-center gap-0.5 ml-2 shrink-0">
                  {expanded ? (
                    <>Less <ChevronUp className="h-3 w-3" /></>
                  ) : (
                    <>More <ChevronDown className="h-3 w-3" /></>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default InspirationCard;
