import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Compass, LocateFixed, AlertTriangle } from "lucide-react";

const KAABA_LAT = 21.4225;
const KAABA_LNG = 39.8262;

function calcQibla(lat: number, lng: number): number {
  const latRad = (lat * Math.PI) / 180;
  const lngRad = (lng * Math.PI) / 180;
  const kaabaLatRad = (KAABA_LAT * Math.PI) / 180;
  const kaabaLngRad = (KAABA_LNG * Math.PI) / 180;
  const dLng = kaabaLngRad - lngRad;
  const x = Math.sin(dLng);
  const y = Math.cos(latRad) * Math.tan(kaabaLatRad) - Math.sin(latRad) * Math.cos(dLng);
  let bearing = (Math.atan2(x, y) * 180) / Math.PI;
  return (bearing + 360) % 360;
}

const QiblaPage = () => {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [heading, setHeading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const compassRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported by your browser.");
      setLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLoading(false);
      },
      (err) => {
        setError("Could not get your location. Please enable location services.");
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  // Device compass
  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      // iOS uses webkitCompassHeading
      const alpha = (e as any).webkitCompassHeading ?? e.alpha;
      if (alpha !== null && alpha !== undefined) {
        setHeading(alpha);
      }
    };

    // Request permission on iOS 13+
    if (typeof (DeviceOrientationEvent as any).requestPermission === "function") {
      // Will be triggered by user interaction
    } else {
      window.addEventListener("deviceorientation", handleOrientation, true);
    }

    return () => {
      window.removeEventListener("deviceorientation", handleOrientation, true);
    };
  }, []);

  const requestCompass = async () => {
    if (typeof (DeviceOrientationEvent as any).requestPermission === "function") {
      try {
        const permission = await (DeviceOrientationEvent as any).requestPermission();
        if (permission === "granted") {
          window.addEventListener(
            "deviceorientation",
            (e: DeviceOrientationEvent) => {
              const alpha = (e as any).webkitCompassHeading ?? e.alpha;
              if (alpha !== null) setHeading(alpha);
            },
            true
          );
        }
      } catch {}
    }
  };

  const qiblaDirection = location ? calcQibla(location.lat, location.lng) : 0;
  const rotation = heading !== null ? qiblaDirection - heading : qiblaDirection;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Qibla Compass</h1>
        <p className="text-muted-foreground">Find the direction of the Kaaba</p>
      </div>

      <Card>
        <CardContent className="pt-6 flex flex-col items-center gap-6">
          {loading && (
            <p className="text-muted-foreground text-sm">Getting your location...</p>
          )}

          {error && (
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {location && (
            <>
              {/* Compass visual */}
              <div className="relative w-64 h-64 sm:w-80 sm:h-80">
                {/* Outer ring */}
                <div className="absolute inset-0 rounded-full border-2 border-border" />

                {/* Cardinal directions (rotate with heading) */}
                <div
                  className="absolute inset-0 transition-transform duration-300 ease-out"
                  style={{ transform: `rotate(${heading !== null ? -heading : 0}deg)` }}
                >
                  {["N", "E", "S", "W"].map((dir, i) => (
                    <span
                      key={dir}
                      className={`absolute text-xs font-bold ${dir === "N" ? "text-primary" : "text-muted-foreground"}`}
                      style={{
                        top: dir === "N" ? "4px" : dir === "S" ? "auto" : "50%",
                        bottom: dir === "S" ? "4px" : "auto",
                        left: dir === "W" ? "4px" : dir === "E" ? "auto" : "50%",
                        right: dir === "E" ? "4px" : "auto",
                        transform:
                          dir === "N" || dir === "S"
                            ? "translateX(-50%)"
                            : "translateY(-50%)",
                      }}
                    >
                      {dir}
                    </span>
                  ))}
                </div>

                {/* Qibla needle */}
                <div
                  ref={compassRef}
                  className="absolute inset-4 flex items-center justify-center transition-transform duration-300 ease-out"
                  style={{ transform: `rotate(${rotation}deg)` }}
                >
                  <div className="relative w-full h-full flex items-center justify-center">
                    {/* Arrow pointing up = Qibla direction */}
                    <div className="absolute top-2 left-1/2 -translate-x-1/2">
                      <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-b-[24px] border-b-primary" />
                    </div>
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
                      <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[16px] border-t-muted-foreground/30" />
                    </div>
                    {/* Center Kaaba icon */}
                    <div className="w-8 h-8 rounded-sm bg-foreground flex items-center justify-center text-background text-xs font-bold">
                      🕋
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-center space-y-2">
                <p className="text-lg font-semibold">
                  {Math.round(qiblaDirection)}° from North
                </p>
                {heading === null && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      Compass not available — showing static direction
                    </p>
                    <Button size="sm" variant="outline" onClick={requestCompass}>
                      <Compass className="h-4 w-4 mr-1.5" /> Enable Compass
                    </Button>
                  </div>
                )}
                {heading !== null && (
                  <Badge variant="outline" className="text-xs">
                    <LocateFixed className="h-3 w-3 mr-1" /> Live compass active
                  </Badge>
                )}
              </div>

              <div className="text-center text-xs text-muted-foreground">
                <p>Your location: {location.lat.toFixed(4)}°, {location.lng.toFixed(4)}°</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default QiblaPage;
