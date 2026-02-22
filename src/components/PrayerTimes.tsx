import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PrayerTime {
  name: string;
  time: string;
}

const PrayerTimes = () => {
  const [prayers, setPrayers] = useState<PrayerTime[]>([]);
  const [hijriDate, setHijriDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    // Try geolocation, fallback to London
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setLocation({ lat: 51.5074, lng: -0.1278 }),
        { timeout: 5000 }
      );
    } else {
      setLocation({ lat: 51.5074, lng: -0.1278 });
    }
  }, []);

  useEffect(() => {
    if (!location) return;
    const fetchPrayers = async () => {
      try {
        const today = new Date();
        const dd = today.getDate();
        const mm = today.getMonth() + 1;
        const yyyy = today.getFullYear();
        const res = await fetch(
          `https://api.aladhan.com/v1/timings/${dd}-${mm}-${yyyy}?latitude=${location.lat}&longitude=${location.lng}&method=2`
        );
        const json = await res.json();
        const timings = json.data.timings;
        setPrayers([
          { name: "Fajr", time: timings.Fajr },
          { name: "Sunrise", time: timings.Sunrise },
          { name: "Dhuhr", time: timings.Dhuhr },
          { name: "Asr", time: timings.Asr },
          { name: "Maghrib", time: timings.Maghrib },
          { name: "Isha", time: timings.Isha },
        ]);
        const hijri = json.data.date.hijri;
        setHijriDate(`${hijri.day} ${hijri.month.en} ${hijri.year} AH`);
      } catch (e) {
        console.error("Failed to fetch prayer times:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchPrayers();
  }, [location]);

  // Find next prayer
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const nextPrayer = prayers.find((p) => {
    const [h, m] = p.time.split(":").map(Number);
    return h * 60 + m > nowMinutes;
  });

  if (loading) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">Prayer Times</CardTitle>
          {hijriDate && <Badge variant="secondary" className="text-xs font-normal">{hijriDate}</Badge>}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {prayers.map((p) => (
            <div
              key={p.name}
              className={`text-center rounded-lg p-2 ${
                nextPrayer?.name === p.name ? "bg-primary/10 border border-primary/30" : "bg-muted/50"
              }`}
            >
              <div className="text-xs text-muted-foreground">{p.name}</div>
              <div className={`text-sm font-semibold tabular-nums ${nextPrayer?.name === p.name ? "text-primary" : ""}`}>
                {p.time}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default PrayerTimes;
