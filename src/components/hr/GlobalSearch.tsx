import { useState, useEffect, useRef } from "react";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { search } from "@/lib/hrApi";

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<Record<string, { id: string, title: string, subtitle?: string }[]>>({});
  const [isOpen, setIsOpen] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced search effect
  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setResults({});
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(() => {
      const performSearch = async () => {
        setIsSearching(true);
        try {
          const res = await search(query);
          setResults(res);
          setIsOpen(true);
        } catch (e) {
          console.error("Search failed", e);
        } finally {
          setIsSearching(false);
        }
      };
      performSearch();
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Handle clicking outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const hasResults = Object.keys(results).length > 0;

  // Listen for a custom event from the sidebar "Quick Search" button to focus this input
  useEffect(() => {
    const handleFocusSearch = () => {
      inputRef.current?.focus();
    };
    window.addEventListener("focus-global-search", handleFocusSearch);
    return () => window.removeEventListener("focus-global-search", handleFocusSearch);
  }, []);

  return (
    <div className="relative max-w-sm flex-1" ref={containerRef}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        ref={inputRef}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => {
          if (query.trim().length >= 2) setIsOpen(true);
        }}
        placeholder="Search candidates, jobs, events..."
        className="pl-9 bg-muted/50 border-0 focus-visible:ring-1"
      />
      
      {/* Search dropdown indicator inside input */}
      {isSearching && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Results Dropdown Popover */}
      {isOpen && (query.trim().length >= 2) && (
        <div className="absolute w-full mt-2 bg-popover text-popover-foreground border bg-background rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200 p-2">
          {!isSearching && !hasResults ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              <p>No results found for "{query}"</p>
            </div>
          ) : (
            <div className="max-h-[350px] overflow-y-auto">
              {Object.entries(results).map(([category, items]) => (
                <div key={category} className="mb-3 last:mb-0">
                  <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-muted/30 -mx-2 mb-1">
                    {category}
                  </div>
                  <ul className="space-y-1">
                    {items.map((item) => (
                      <li key={item.id}>
                        <button 
                          onClick={() => {
                            setIsOpen(false);
                            setQuery("");
                            // In a real app this would navigate to the item
                          }}
                          className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground transition-colors flex flex-col items-start gap-0.5"
                        >
                          <span className="font-medium">{item.title}</span>
                          {item.subtitle && (
                            <span className="text-xs text-muted-foreground">{item.subtitle}</span>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
