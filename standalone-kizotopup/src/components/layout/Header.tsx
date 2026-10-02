import { Link } from "wouter";
import { ChevronRight, ClipboardList, Menu, Search, Send, X } from "lucide-react";
import { useState } from "react";
import { BrandMark } from "@/components/BrandMark";

interface HeaderProps {
  search?: string;
  onSearchChange?: (v: string) => void;
}

export function Header({ search = "", onSearchChange }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const hasSearch = Boolean(onSearchChange);

  const searchField = (
    <div className="relative w-full">
      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="text"
        placeholder="Search for games..."
         className="h-9 w-full rounded-full border border-white/10 bg-white/[0.04] pl-10 pr-4 text-xs font-medium text-foreground outline-none transition-all duration-200 placeholder:text-muted-foreground/70 focus:border-primary/50 focus:bg-white/[0.06] focus:ring-2 focus:ring-primary/20 sm:h-10 sm:text-sm"
        value={search}
        onChange={(e) => onSearchChange?.(e.target.value)}
        data-testid="input-search-games"
      />
    </div>
  );
  return (
    <header className="fixed inset-x-0 top-0 z-50 w-full">
       <div className="absolute inset-0 border-b border-white/8 bg-background/95 shadow-[0_4px_18px_rgba(0,0,0,0.16)] backdrop-blur-xl" />
       <div className="ornament-header" aria-hidden="true" />
       <div className="relative mx-auto flex max-w-[1440px] items-center px-4 sm:px-6 lg:px-10 md:h-[82px]">
         <div className="flex h-[68px] w-full items-center justify-between md:h-full">
           <Link href="/" className="group -ml-1 flex shrink-0 items-center sm:ml-0">
             <BrandMark size="sm" className="transition-transform duration-300 group-hover:scale-[1.02] md:scale-110" />
          </Link>

           <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
             {hasSearch && <div className="hidden w-[min(28vw,360px)] md:block">{searchField}</div>}
             <nav className="hidden items-center gap-3 text-[13px] font-medium text-foreground/85 xl:flex 2xl:gap-5">
              <a href="https://t.me/vindavit" target="_blank" rel="noreferrer" className="transition hover:text-primary">Help Center</a>
              <Link href="/track-order" className="transition hover:text-primary">Track order</Link>
            </nav>
            {hasSearch && (
              <button
                type="button"
                aria-label={searchOpen ? "Close search" : "Open search"}
                aria-expanded={searchOpen}
                onClick={() => {
                  setSearchOpen((open) => !open);
                  setMenuOpen(false);
                }}
            className="focus-ring flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-muted-foreground transition hover:border-primary/30 hover:bg-white/[0.08] hover:text-primary sm:h-12 sm:w-12 md:hidden"
              >
                <Search className="h-5 w-5" strokeWidth={2.5} />
              </button>
            )}
            <button
              type="button"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              onClick={() => {
                setMenuOpen((open) => !open);
                setSearchOpen(false);
              }}
              className="focus-ring flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-muted-foreground transition hover:border-primary/30 hover:bg-white/[0.08] hover:text-primary sm:h-12 sm:w-12 md:hidden"
            >
              {menuOpen ? <X className="h-5 w-5" strokeWidth={2.5} /> : <Menu className="h-5 w-5" strokeWidth={2.5} />}
            </button>
          </div>
        </div>

        {hasSearch && searchOpen && (
          <div className="absolute right-3 top-[72px] z-20 w-[min(360px,calc(100vw-1.5rem))] rounded-2xl border border-white/10 bg-background/98 p-1.5 shadow-2xl backdrop-blur-xl sm:right-4 md:hidden">
            {searchField}
          </div>
        )}

        {menuOpen && (
          <nav
            aria-label="Mobile navigation"
            className="mobile-menu-panel absolute right-3 top-[72px] z-10 w-[min(220px,calc(100vw-1.5rem))] max-h-[calc(100dvh-6.5rem)] overflow-y-auto rounded-2xl border border-white/10 p-1.5 shadow-2xl backdrop-blur-xl sm:right-4 sm:p-2 md:hidden"
          >
            <a href="https://t.me/vindavit" target="_blank" rel="noreferrer" onClick={() => setMenuOpen(false)} className="mobile-menu-link">
              <span className="mobile-menu-icon">
                <Send className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="flex-1">Contact us</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground/60" aria-hidden="true" />
            </a>
            <Link href="/track-order" onClick={() => setMenuOpen(false)} className="mobile-menu-link">
              <span className="mobile-menu-icon">
                <ClipboardList className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="flex-1">Track order</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground/60" aria-hidden="true" />
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
