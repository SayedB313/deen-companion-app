import { useState } from "react";
import { duaCategories, type DuaCategory, type Dua } from "@/data/duas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronUp, Search, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const DuasPage = () => {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [expandedCategory, setExpandedCategory] = useState<string | null>("morning");
  const [expandedDua, setExpandedDua] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const filteredCategories = search.trim()
    ? duaCategories
        .map((cat) => ({
          ...cat,
          duas: cat.duas.filter(
            (d) =>
              d.title.toLowerCase().includes(search.toLowerCase()) ||
              d.translation.toLowerCase().includes(search.toLowerCase()) ||
              d.transliteration.toLowerCase().includes(search.toLowerCase())
          ),
        }))
        .filter((cat) => cat.duas.length > 0)
    : duaCategories;

  const copyArabic = (dua: Dua) => {
    navigator.clipboard.writeText(dua.arabic);
    setCopied(dua.id);
    toast({ title: "Copied", description: "Arabic text copied to clipboard" });
    setTimeout(() => setCopied(null), 2000);
  };

  const totalDuas = duaCategories.reduce((s, c) => s + c.duas.length, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Duas & Adhkar</h1>
        <p className="text-muted-foreground">{totalDuas} supplications from authentic sources</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search duas..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Category pills */}
      <div className="flex flex-wrap gap-2">
        {duaCategories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => {
              setExpandedCategory(expandedCategory === cat.id ? null : cat.id);
              setSearch("");
            }}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-all ${
              expandedCategory === cat.id
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-accent"
            }`}
          >
            {cat.icon} {cat.name}
          </button>
        ))}
      </div>

      {/* Duas */}
      <div className="space-y-3">
        {filteredCategories.map((cat) => {
          const isExpanded = expandedCategory === cat.id || search.trim().length > 0;
          return (
            <Card key={cat.id}>
              <CardHeader
                className="pb-2 cursor-pointer"
                onClick={() => setExpandedCategory(isExpanded && !search ? null : cat.id)}
              >
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    {cat.icon} {cat.name}
                    <Badge variant="secondary" className="text-xs font-normal">{cat.duas.length}</Badge>
                  </CardTitle>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </CardHeader>
              {isExpanded && (
                <CardContent className="space-y-3 pt-0">
                  {cat.duas.map((dua) => {
                    const duaExpanded = expandedDua === dua.id;
                    return (
                      <div
                        key={dua.id}
                        className="rounded-lg border p-4 space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <button
                            onClick={() => setExpandedDua(duaExpanded ? null : dua.id)}
                            className="text-left flex-1"
                          >
                            <p className="text-sm font-medium">{dua.title}</p>
                          </button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 shrink-0"
                            onClick={() => copyArabic(dua)}
                          >
                            {copied === dua.id ? (
                              <Check className="h-3.5 w-3.5 text-primary" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </div>

                        {/* Arabic always shown */}
                        <p className="font-arabic text-2xl text-right leading-[2.2] text-foreground">
                          {dua.arabic}
                        </p>

                        {duaExpanded && (
                          <div className="space-y-2 border-t pt-3">
                            <p className="text-sm text-muted-foreground italic">{dua.transliteration}</p>
                            <p className="text-sm">{dua.translation}</p>
                            <Badge variant="outline" className="text-xs">{dua.reference}</Badge>
                          </div>
                        )}

                        {!duaExpanded && (
                          <button
                            onClick={() => setExpandedDua(dua.id)}
                            className="text-xs text-primary hover:underline"
                          >
                            Show translation →
                          </button>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              )}
            </Card>
          );
        })}

        {filteredCategories.length === 0 && (
          <p className="text-center text-muted-foreground py-8">No duas found matching "{search}"</p>
        )}
      </div>
    </div>
  );
};

export default DuasPage;
