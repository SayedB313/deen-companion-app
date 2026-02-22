import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, UtensilsCrossed } from "lucide-react";

const fastTypes = [
  { value: "ramadan", label: "Ramadan" },
  { value: "monday_thursday", label: "Mon/Thu" },
  { value: "ayyam_al_bid", label: "Ayyam al-Bid" },
  { value: "voluntary", label: "Voluntary" },
  { value: "shawwal", label: "Shawwal" },
  { value: "dhul_hijjah", label: "Dhul Hijjah" },
  { value: "ashura", label: "Ashura" },
  { value: "other", label: "Other" },
];

const Fasting = () => {
  const { user } = useAuth();
  const [fasts, setFasts] = useState<any[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedType, setSelectedType] = useState("voluntary");

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("fasting_log").select("*").eq("user_id", user.id);
    if (data) setFasts(data);
  };

  useEffect(() => { load(); }, [user]);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const toggleDay = async (day: number) => {
    if (!user) return;
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const existing = fasts.find((f) => f.date === dateStr);
    if (existing) {
      await supabase.from("fasting_log").delete().eq("id", existing.id);
    } else {
      await supabase.from("fasting_log").insert({ user_id: user.id, date: dateStr, fast_type: selectedType });
    }
    load();
  };

  const isDayFasted = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return fasts.find((f) => f.date === dateStr);
  };

  const monthFasts = fasts.filter((f) => {
    const d = new Date(f.date);
    return d.getFullYear() === year && d.getMonth() === month;
  });

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Fasting Tracker</h1>
        <p className="text-muted-foreground">{fasts.length} total days fasted</p>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">Fast type:</span>
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>{fastTypes.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <Button variant="ghost" size="icon" onClick={prevMonth}><ChevronLeft className="h-4 w-4" /></Button>
          <CardTitle className="text-base">
            {currentMonth.toLocaleString("default", { month: "long", year: "numeric" })}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={nextMonth}><ChevronRight className="h-4 w-4" /></Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1 text-center">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="text-xs font-medium text-muted-foreground py-1">{d}</div>
            ))}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
              const fasted = isDayFasted(day);
              return (
                <button
                  key={day}
                  onClick={() => toggleDay(day)}
                  className={`aspect-square rounded-lg text-sm font-medium transition-colors flex items-center justify-center ${
                    fasted ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {monthFasts.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1">
              {monthFasts.map((f) => (
                <Badge key={f.id} variant="secondary" className="text-xs">
                  {new Date(f.date).getDate()} — {fastTypes.find((t) => t.value === f.fast_type)?.label}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {fastTypes.slice(0, 4).map((type) => {
          const count = fasts.filter((f) => f.fast_type === type.value).length;
          return (
            <Card key={type.value}>
              <CardContent className="pt-4 text-center">
                <div className="text-2xl font-bold">{count}</div>
                <p className="text-xs text-muted-foreground">{type.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Fasting;
