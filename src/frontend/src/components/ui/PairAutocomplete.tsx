import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Input } from "./input";

// ─── Instrument catalogue ────────────────────────────────────────────────────

interface Instrument {
  symbol: string;
  label?: string;
  category: string;
}

const INSTRUMENTS: Instrument[] = [
  // Forex Majors
  { symbol: "EUR/USD", category: "Forex Major" },
  { symbol: "GBP/USD", category: "Forex Major" },
  { symbol: "USD/JPY", category: "Forex Major" },
  { symbol: "USD/CHF", category: "Forex Major" },
  { symbol: "AUD/USD", category: "Forex Major" },
  { symbol: "USD/CAD", category: "Forex Major" },
  { symbol: "NZD/USD", category: "Forex Major" },
  // Forex Minors
  { symbol: "EUR/GBP", category: "Forex Minor" },
  { symbol: "EUR/JPY", category: "Forex Minor" },
  { symbol: "GBP/JPY", category: "Forex Minor" },
  { symbol: "EUR/AUD", category: "Forex Minor" },
  { symbol: "AUD/JPY", category: "Forex Minor" },
  { symbol: "CHF/JPY", category: "Forex Minor" },
  { symbol: "GBP/CHF", category: "Forex Minor" },
  { symbol: "EUR/CHF", category: "Forex Minor" },
  { symbol: "AUD/NZD", category: "Forex Minor" },
  // Forex Exotics
  { symbol: "USD/MXN", category: "Forex Exotic" },
  { symbol: "USD/SGD", category: "Forex Exotic" },
  { symbol: "USD/HKD", category: "Forex Exotic" },
  { symbol: "USD/NOK", category: "Forex Exotic" },
  { symbol: "USD/SEK", category: "Forex Exotic" },
  { symbol: "USD/DKK", category: "Forex Exotic" },
  { symbol: "USD/ZAR", category: "Forex Exotic" },
  { symbol: "USD/TRY", category: "Forex Exotic" },
  // Crypto
  { symbol: "BTC/USD", category: "Crypto" },
  { symbol: "ETH/USD", category: "Crypto" },
  { symbol: "BTC/USDT", category: "Crypto" },
  { symbol: "ETH/USDT", category: "Crypto" },
  { symbol: "SOL/USD", category: "Crypto" },
  { symbol: "SOL/USDT", category: "Crypto" },
  { symbol: "BNB/USD", category: "Crypto" },
  { symbol: "XRP/USD", category: "Crypto" },
  { symbol: "DOGE/USD", category: "Crypto" },
  { symbol: "ADA/USD", category: "Crypto" },
  { symbol: "AVAX/USD", category: "Crypto" },
  { symbol: "MATIC/USD", category: "Crypto" },
  { symbol: "LTC/USD", category: "Crypto" },
  { symbol: "DOT/USD", category: "Crypto" },
  { symbol: "LINK/USD", category: "Crypto" },
  // US Stocks & Indices
  { symbol: "SPY", label: "S&P 500 ETF", category: "US Stock/Index" },
  { symbol: "QQQ", label: "Nasdaq 100 ETF", category: "US Stock/Index" },
  { symbol: "AAPL", label: "Apple", category: "US Stock/Index" },
  { symbol: "TSLA", label: "Tesla", category: "US Stock/Index" },
  { symbol: "NVDA", label: "NVIDIA", category: "US Stock/Index" },
  { symbol: "MSFT", label: "Microsoft", category: "US Stock/Index" },
  { symbol: "AMZN", label: "Amazon", category: "US Stock/Index" },
  { symbol: "GOOGL", label: "Alphabet", category: "US Stock/Index" },
  { symbol: "META", label: "Meta Platforms", category: "US Stock/Index" },
  {
    symbol: "AMD",
    label: "Advanced Micro Devices",
    category: "US Stock/Index",
  },
  { symbol: "NFLX", label: "Netflix", category: "US Stock/Index" },
  { symbol: "SPX", label: "S&P 500 Index", category: "US Stock/Index" },
  { symbol: "NDX", label: "Nasdaq 100 Index", category: "US Stock/Index" },
  { symbol: "DJI", label: "Dow Jones", category: "US Stock/Index" },
  { symbol: "VIX", label: "Volatility Index", category: "US Stock/Index" },
  // Commodities
  { symbol: "XAUUSD", label: "Gold", category: "Commodity" },
  { symbol: "XAGUSD", label: "Silver", category: "Commodity" },
  { symbol: "USOIL", label: "WTI Crude Oil", category: "Commodity" },
  { symbol: "UKOIL", label: "Brent Crude Oil", category: "Commodity" },
  { symbol: "NATGAS", label: "Natural Gas", category: "Commodity" },
  // Futures
  { symbol: "ES", label: "E-mini S&P 500", category: "Futures" },
  { symbol: "NQ", label: "E-mini Nasdaq", category: "Futures" },
  { symbol: "YM", label: "E-mini Dow", category: "Futures" },
  { symbol: "RTY", label: "E-mini Russell 2000", category: "Futures" },
  { symbol: "CL", label: "Crude Oil Futures", category: "Futures" },
  { symbol: "GC", label: "Gold Futures", category: "Futures" },
  { symbol: "SI", label: "Silver Futures", category: "Futures" },
];

// ─── Component ───────────────────────────────────────────────────────────────

interface PairAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  className?: string;
  hasError?: boolean;
  recentPairs?: string[];
  id?: string;
  "data-ocid"?: string;
}

const MAX_SUGGESTIONS = 8;

function filterInstruments(query: string): Instrument[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return INSTRUMENTS.filter(
    (inst) =>
      inst.symbol.toLowerCase().includes(q) ||
      inst.label?.toLowerCase().includes(q),
  ).slice(0, MAX_SUGGESTIONS);
}

export function PairAutocomplete({
  value,
  onChange,
  onBlur,
  placeholder = "EUR/USD, BTC/USDT…",
  className,
  hasError,
  recentPairs = [],
  id,
  "data-ocid": dataOcid,
}: PairAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Filter catalogue
  const catalogueSuggestions = filterInstruments(value);

  // Recent pairs that match the query (prepend with separator)
  const q = value.toLowerCase().trim();
  const matchedRecent = recentPairs
    .filter((p) => p.toLowerCase().includes(q) && q.length > 0)
    .slice(0, 3);

  // Build final list: recents first, then catalogue (de-duplicate)
  const recentSet = new Set(matchedRecent.map((r) => r.toUpperCase()));
  const dedupedCatalogue = catalogueSuggestions.filter(
    (inst) => !recentSet.has(inst.symbol.toUpperCase()),
  );

  // Unified flat list for keyboard nav
  interface SuggestionItem {
    symbol: string;
    label?: string;
    category: string;
    isRecent?: boolean;
  }
  const recentItems: SuggestionItem[] = matchedRecent.map((r) => ({
    symbol: r.toUpperCase(),
    category: "Recent",
    isRecent: true,
  }));
  const allSuggestions: SuggestionItem[] = [
    ...recentItems,
    ...dedupedCatalogue,
  ].slice(0, MAX_SUGGESTIONS);

  const showDropdown = open && allSuggestions.length > 0;

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const item = listRef.current.children[activeIndex] as HTMLElement;
      item?.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex]);

  const selectSuggestion = (symbol: string) => {
    onChange(symbol);
    setOpen(false);
    setActiveIndex(-1);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown) {
      if (e.key === "ArrowDown" && allSuggestions.length > 0) {
        setOpen(true);
        setActiveIndex(0);
        e.preventDefault();
      }
      return;
    }
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, allSuggestions.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, -1));
        break;
      case "Enter":
        e.preventDefault();
        if (activeIndex >= 0 && allSuggestions[activeIndex]) {
          selectSuggestion(allSuggestions[activeIndex].symbol);
        }
        break;
      case "Escape":
        setOpen(false);
        setActiveIndex(-1);
        break;
      case "Tab":
        setOpen(false);
        setActiveIndex(-1);
        break;
    }
  };

  // Category color map
  const categoryColor: Record<string, string> = {
    Recent: "#00ffff",
    "Forex Major": "#00ff41",
    "Forex Minor": "#00ff41",
    "Forex Exotic": "#00ff41",
    Crypto: "#b900ff",
    "US Stock/Index": "#00ffff",
    Commodity: "#f59e0b",
    Futures: "#f59e0b",
  };

  return (
    <div ref={containerRef} className="relative">
      <Input
        ref={inputRef}
        id={id}
        placeholder={placeholder}
        value={value}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={showDropdown}
        aria-autocomplete="list"
        aria-controls="pair-suggestions-list"
        aria-activedescendant={
          activeIndex >= 0 ? `pair-suggestion-${activeIndex}` : undefined
        }
        onChange={(e) => {
          onChange(e.target.value.toUpperCase());
          setOpen(true);
          setActiveIndex(-1);
        }}
        onFocus={() => {
          if (value.trim()) setOpen(true);
        }}
        onBlur={() => {
          // Delay so click on suggestion registers first
          setTimeout(() => {
            onBlur?.();
          }, 150);
        }}
        onKeyDown={handleKeyDown}
        className={cn(
          "bg-card/60 focus-visible:border-[#00ff41]/50 focus-visible:ring-[#00ff41]/20",
          hasError && "border-destructive",
          className,
        )}
        autoComplete="off"
        data-ocid={dataOcid}
      />

      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute z-50 left-0 right-0 mt-1.5 rounded-xl overflow-hidden"
            style={{
              background: "oklch(0.10 0.01 258 / 0.97)",
              border: "1px solid rgba(0,255,65,0.22)",
              boxShadow:
                "0 8px 32px rgba(0,0,0,0.5), 0 0 0 0.5px rgba(0,255,65,0.08), 0 0 20px rgba(0,255,65,0.06)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
            }}
          >
            <ul
              ref={listRef}
              id="pair-suggestions-list"
              className="max-h-64 overflow-y-auto py-1.5"
            >
              {/* Section headers when recents present */}
              {matchedRecent.length > 0 && (
                <li
                  className="px-3 pt-1 pb-0.5 text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: "#00ffff", opacity: 0.6 }}
                >
                  Recent
                </li>
              )}

              {allSuggestions.map((item, idx) => {
                // Insert "Suggestions" header after recents
                const isFirstNonRecent =
                  !item.isRecent &&
                  (idx === 0 || allSuggestions[idx - 1]?.isRecent);

                const color = categoryColor[item.category] ?? "#888";
                const isActive = idx === activeIndex;

                return (
                  <li
                    key={`${item.isRecent ? "recent" : "cat"}-${item.symbol}`}
                    id={`pair-suggestion-${idx}`}
                  >
                    {isFirstNonRecent && matchedRecent.length > 0 && (
                      <p
                        className="px-3 pt-2 pb-0.5 text-[10px] font-bold uppercase tracking-widest"
                        style={{ color: "#00ff41", opacity: 0.6 }}
                      >
                        Suggestions
                      </p>
                    )}
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        selectSuggestion(item.symbol);
                      }}
                      onMouseEnter={() => setActiveIndex(idx)}
                      className={cn(
                        "w-full flex items-center justify-between gap-3 px-3 py-2 text-left transition-colors duration-100",
                        isActive ? "bg-[#00ff41]/10" : "hover:bg-white/5",
                      )}
                      aria-label={`Select ${item.symbol}${item.label ? ` (${item.label})` : ""}`}
                      data-ocid={`pair-suggestion-${item.symbol.toLowerCase().replace(/\//g, "-")}`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className="font-mono text-sm font-semibold"
                          style={{
                            color: isActive ? "#fff" : "rgba(255,255,255,0.9)",
                          }}
                        >
                          {item.symbol}
                        </span>
                        {item.label && (
                          <span className="text-xs text-muted-foreground truncate">
                            {item.label}
                          </span>
                        )}
                      </div>
                      <span
                        className="text-[10px] font-semibold uppercase tracking-wide shrink-0 px-1.5 py-0.5 rounded-full"
                        style={{
                          color,
                          background: `${color}18`,
                          border: `1px solid ${color}30`,
                        }}
                      >
                        {item.isRecent ? "Recent" : item.category}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
