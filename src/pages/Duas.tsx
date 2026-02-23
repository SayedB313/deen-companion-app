import { useState, useCallback, useMemo } from "react";
import { duaCategories, type Dua } from "@/data/duas";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ChevronDown,
  ChevronUp,
  Search,
  Copy,
  Check,
  Heart,
  Repeat,
  X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const FAVORITES_KEY = "dua-favorites";

const getFavorites = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]");
  } catch {
    return [];
  }
};

const DuasPage = () => {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("morning");
  const [expandedDua, setExpandedDua] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>(getFavorites);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const toggleFavorite = useCallback(
    (duaId: string) => {
      setFavorites((prev) => {
        const next = prev.includes(duaId)
          ? prev.filter((id) => id !== duaId)
          : [...prev, duaId];
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
        return next;
      });
    },
    []
  );

  const copyArabic = useCallback(
    (dua: Dua) => {
      navigator.clipboard.writeText(dua.arabic);
      setCopied(dua.id);
      toast({ title: "Copied ✓", description: "Arabic text copied" });
      setTimeout(() => setCopied(null), 2000);
    },
    [toast]
  );

  const totalDuas = useMemo(
    () => duaCategories.reduce((s, c) => s + c.duas.length, 0),
    []
  );

  // Build filtered list
  const displayCategories = useMemo(() => {
    let cats = duaCategories;

    if (showFavoritesOnly) {
      cats = cats
        .map((cat) => ({
          ...cat,
          duas: cat.duas.filter((d) => favorites.includes(d.id)),
        }))
        .filter((cat) => cat.duas.length > 0);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      cats = cats
        .map((cat) => ({
          ...cat,
          duas: cat.duas.filter(
            (d) =>
              d.title.toLowerCase().includes(q) ||
              d.translation.toLowerCase().includes(q) ||
              d.transliteration.toLowerCase().includes(q)
          ),
        }))
        .filter((cat) => cat.duas.length > 0);
    }

    return cats;
  }, [search, showFavoritesOnly, favorites]);

  // Which duas to show in the main list
  const visibleDuas = useMemo(() => {
    if (search.trim() || showFavoritesOnly) {
      // Show all matching across categories
      return displayCategories.flatMap((cat) =>
        cat.duas.map((dua) => ({ ...dua, categoryName: cat.name, categoryIcon: cat.icon }))
      );
    }
    const cat = displayCategories.find((c) => c.id === activeCategory);
    return cat
      ? cat.duas.map((dua) => ({ ...dua, categoryName: cat.name, categoryIcon: cat.icon }))
      : [];
  }, [displayCategories, activeCategory, search, showFavoritesOnly]);

  const activeCat = duaCategories.find((c) => c.id === activeCategory);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Duas & Adhkar</h1>
        <p className="text-sm text-muted-foreground">
          {totalDuas} authentic supplications •{" "}
          {favorites.length > 0 && (
            <button
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={`inline-flex items-center gap-1 font-medium transition-colors ${
                showFavoritesOnly ? "text-destructive" : "text-primary"
              }`}
            >
              <Heart className={`h-3 w-3 ${showFavoritesOnly ? "fill-current" : ""}`} />
              {favorites.length} saved
            </button>
          )}
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by title, translation, or transliteration..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 pr-9"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Category pills — hidden when searching or showing favorites */}
      {!search.trim() && !showFavoritesOnly && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {duaCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition-all ${
                activeCategory === cat.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
            >
              {cat.icon} {cat.name}
              <span className="text-xs opacity-70">({cat.duas.length})</span>
            </button>
          ))}
        </div>
      )}

      {/* Category description */}
      {!search.trim() && !showFavoritesOnly && activeCat && (
        <p className="text-sm text-muted-foreground -mt-2">{activeCat.description}</p>
      )}

      {showFavoritesOnly && (
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1">
            <Heart className="h-3 w-3 fill-current" /> Favorites
          </Badge>
          <button
            onClick={() => setShowFavoritesOnly(false)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Show all →
          </button>
        </div>
      )}

      {/* Duas list */}
      <div className="space-y-3">
        {visibleDuas.map((dua) => {
          const isExpanded = expandedDua === dua.id;
          const isFav = favorites.includes(dua.id);
          const showCatLabel = search.trim() || showFavoritesOnly;

          return (
            <Card
              key={dua.id}
              className={`overflow-hidden transition-shadow ${
                isExpanded ? "shadow-md ring-1 ring-primary/20" : ""
              }`}
            >
              <CardContent className="p-4 space-y-3">
                {/* Title row */}
                <div className="flex items-start justify-between gap-2">
                  <button
                    onClick={() => setExpandedDua(isExpanded ? null : dua.id)}
                    className="text-left flex-1 group"
                  >
                    {showCatLabel && (
                      <span className="text-xs text-muted-foreground">
                        {dua.categoryIcon} {dua.categoryName}
                      </span>
                    )}
                    <p className="text-sm font-semibold group-hover:text-primary transition-colors">
                      {dua.title}
                    </p>
                  </button>

                  <div className="flex items-center gap-1 shrink-0">
                    {dua.repeat && (
                      <Badge
                        variant="outline"
                        className="text-xs gap-1 text-muted-foreground h-7"
                      >
                        <Repeat className="h-3 w-3" />
                        {dua.repeat}×
                      </Badge>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => toggleFavorite(dua.id)}
                    >
                      <Heart
                        className={`h-3.5 w-3.5 transition-colors ${
                          isFav
                            ? "fill-destructive text-destructive"
                            : "text-muted-foreground"
                        }`}
                      />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => copyArabic(dua)}
                    >
                      {copied === dua.id ? (
                        <Check className="h-3.5 w-3.5 text-primary" />
                      ) : (
                        <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => setExpandedDua(isExpanded ? null : dua.id)}
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Arabic text — always visible */}
                <p className="font-arabic text-2xl text-right leading-[2.2] text-foreground">
                  {dua.arabic}
                </p>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="space-y-3 border-t pt-3">
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                        Transliteration
                      </p>
                      <p className="text-sm italic text-foreground/80">
                        {dua.transliteration}
                      </p>
                    </div>

                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                        Translation
                      </p>
                      <p className="text-sm text-foreground">
                        {dua.translation}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-xs">
                        📚 {dua.reference}
                      </Badge>
                      {dua.repeat && (
                        <Badge variant="secondary" className="text-xs gap-1">
                          <Repeat className="h-3 w-3" />
                          Repeat {dua.repeat} time{dua.repeat > 1 ? "s" : ""}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Show translation hint when collapsed */}
                {!isExpanded && (
                  <button
                    onClick={() => setExpandedDua(dua.id)}
                    className="text-xs text-primary hover:underline"
                  >
                    Show translation & transliteration →
                  </button>
                )}
              </CardContent>
            </Card>
          );
        })}

        {visibleDuas.length === 0 && (
          <div className="text-center py-12 space-y-2">
            <p className="text-muted-foreground">
              {showFavoritesOnly
                ? "No saved favorites yet"
                : `No duas found matching "${search}"`}
            </p>
            {showFavoritesOnly && (
              <button
                onClick={() => setShowFavoritesOnly(false)}
                className="text-sm text-primary hover:underline"
              >
                Browse all duas
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DuasPage;
