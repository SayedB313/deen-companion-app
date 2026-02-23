import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface FastLog {
  date: string;
  fast_type: string;
}

const TYPE_COLORS: Record<string, string> = {
  ramadan: "bg-primary",
  monday_thursday: "bg-emerald-500",
  ayyam_al_bid: "bg-sky-500",
  voluntary: "bg-amber-500",
  shawwal: "bg-violet-500",
  dhul_hijjah: "bg-rose-500",
  ashura: "bg-pink-500",
  other: "bg-muted-foreground",
};

const TYPE_LABELS: Record<string, string> = {
  ramadan: "Ramadan",
  monday_thursday: "Mon/Thu",
  ayyam_al_bid: "Ayyam al-Bid",
  voluntary: "Voluntary",
  shawwal: "Shawwal",
  dhul_hijjah: "Dhul Hijjah",
  ashura: "Ashura",
  other: "Other",
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["", "Mon", "", "Wed", "", "Fri", ""];

export default function FastingHeatmap({ fasts }: { fasts: FastLog[] }) {
  const { grid, fastMap, totalWeeks, monthPositions } = useMemo(() => {
    const today = new Date();
    const oneYearAgo = new Date(today);
    oneYearAgo.setFullYear(today.getFullYear() - 1);
    oneYearAgo.setDate(oneYearAgo.getDate() - oneYearAgo.getDay()); // align to Sunday

    const fastMap = new Map<string, string>();
    fasts.forEach((f) => fastMap.set(f.date, f.fast_type));

    const grid: { date: Date; dateStr: string }[][] = [];
    const monthPositions: { label: string; col: number }[] = [];
    let currentDate = new Date(oneYearAgo);
    let lastMonth = -1;

    while (currentDate <= today) {
      const week: { date: Date; dateStr: string }[] = [];
      for (let day = 0; day < 7; day++) {
        const d = new Date(currentDate);
        d.setDate(d.getDate() + day);
        const dateStr = d.toISOString().split("T")[0];
        week.push({ date: d, dateStr });

        if (d.getMonth() !== lastMonth && d <= today) {
          lastMonth = d.getMonth();
          monthPositions.push({ label: MONTHS[d.getMonth()], col: grid.length });
        }
      }
      grid.push(week);
      currentDate.setDate(currentDate.getDate() + 7);
    }

    return { grid, fastMap, totalWeeks: grid.length, monthPositions };
  }, [fasts]);

  const today = new Date().toISOString().split("T")[0];
  const yearTotal = fasts.filter((f) => {
    const d = new Date(f.date);
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    return d >= oneYearAgo;
  }).length;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Fasting Heatmap</CardTitle>
          <Badge variant="secondary" className="text-xs">{yearTotal} days this year</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="inline-flex flex-col gap-0.5 min-w-max">
            {/* Month labels */}
            <div className="flex ml-8">
              {monthPositions.map((m, i) => {
                const nextCol = monthPositions[i + 1]?.col ?? totalWeeks;
                const span = nextCol - m.col;
                return (
                  <div
                    key={`${m.label}-${m.col}`}
                    className="text-[10px] text-muted-foreground"
                    style={{ width: `${span * 13}px` }}
                  >
                    {span >= 2 ? m.label : ""}
                  </div>
                );
              })}
            </div>

            {/* Grid */}
            <div className="flex gap-0">
              {/* Day labels */}
              <div className="flex flex-col gap-0.5 mr-1 pt-0">
                {DAYS.map((d, i) => (
                  <div key={i} className="h-[11px] text-[9px] text-muted-foreground leading-[11px] w-6 text-right pr-1">
                    {d}
                  </div>
                ))}
              </div>

              {/* Weeks */}
              <div className="flex gap-0.5">
                {grid.map((week, wi) => (
                  <div key={wi} className="flex flex-col gap-0.5">
                    {week.map((cell) => {
                      const isFuture = cell.dateStr > today;
                      const fastType = fastMap.get(cell.dateStr);
                      const colorClass = fastType
                        ? TYPE_COLORS[fastType] || TYPE_COLORS.other
                        : "bg-muted/50";

                      return (
                        <Tooltip key={cell.dateStr}>
                          <TooltipTrigger asChild>
                            <div
                              className={`h-[11px] w-[11px] rounded-[2px] transition-colors ${
                                isFuture ? "bg-transparent" : colorClass
                              }`}
                            />
                          </TooltipTrigger>
                          {!isFuture && (
                            <TooltipContent side="top" className="text-xs">
                              <p className="font-medium">
                                {cell.date.toLocaleDateString("en-US", {
                                  weekday: "short",
                                  month: "short",
                                  day: "numeric",
                                })}
                              </p>
                              {fastType ? (
                                <p className="text-muted-foreground">
                                  {TYPE_LABELS[fastType] || fastType}
                                </p>
                              ) : (
                                <p className="text-muted-foreground">No fast</p>
                              )}
                            </TooltipContent>
                          )}
                        </Tooltip>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-2 mt-3">
              {Object.entries(TYPE_LABELS).map(([key, label]) => (
                <div key={key} className="flex items-center gap-1">
                  <div className={`h-2.5 w-2.5 rounded-sm ${TYPE_COLORS[key]}`} />
                  <span className="text-[10px] text-muted-foreground">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
