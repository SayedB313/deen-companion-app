import { useState, useEffect } from "react";
import { getDailyInspiration } from "@/data/dailyInspiration";

interface Inspiration {
  text: string;
  source: string;
}

const COLLECTIONS = [
  { edition: "eng-bukhari", name: "Sahih al-Bukhari", maxHadith: 7563 },
  { edition: "eng-muslim", name: "Sahih Muslim", maxHadith: 7563 },
  { edition: "eng-abudawud", name: "Sunan Abu Dawud", maxHadith: 5274 },
  { edition: "eng-tirmidhi", name: "Jami' at-Tirmidhi", maxHadith: 3956 },
  { edition: "eng-ibnmajah", name: "Sunan Ibn Majah", maxHadith: 4341 },
];

const API_BASE = "https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions";

function getDailyRandom(seed: number, max: number) {
  // Simple seeded random based on day of year
  const x = Math.sin(seed) * 10000;
  return Math.floor((x - Math.floor(x)) * max) + 1;
}

export function useDailyInspiration() {
  const [inspiration, setInspiration] = useState<Inspiration>(getDailyInspiration());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const dayOfYear = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
    );

    const collectionIndex = dayOfYear % COLLECTIONS.length;
    const collection = COLLECTIONS[collectionIndex];
    const hadithNumber = getDailyRandom(dayOfYear * 137, collection.maxHadith);

    // Try to find the section containing this hadith
    const url = `${API_BASE}/${collection.edition}?limit=1&page=${hadithNumber}`;

    // The API uses section-based access, so we fetch the whole edition and pick one
    // Actually, individual hadith access pattern: /editions/{edition}/{sectionNumber}.json
    // Let's use a simpler approach - fetch a specific section
    const sectionNumber = getDailyRandom(dayOfYear * 31, 50); // most books have < 50 sections

    fetch(`${API_BASE}/${collection.edition}/${sectionNumber}.json`)
      .then((res) => {
        if (!res.ok) throw new Error("API error");
        return res.json();
      })
      .then((data) => {
        const hadiths = data.hadiths;
        if (hadiths && hadiths.length > 0) {
          const picked = hadiths[dayOfYear % hadiths.length];
          if (picked?.text && picked.text.length > 20) {
            setInspiration({
              text: picked.text.trim(),
              source: `${collection.name}, Hadith ${picked.hadithnumber}`,
            });
          }
        }
      })
      .catch(() => {
        // Keep fallback local data
      })
      .finally(() => setLoading(false));
  }, []);

  return { inspiration, loading };
}
