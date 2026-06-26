import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SkillMatchLogo } from "@/components/SkillMatchLogo";

const navItems = [
  { name: "Home", href: "/" },
  { name: "About", href: "#about" },
  { name: "Features", href: "#features" },
  { name: "Pricing", href: "#pricing" },
  { name: "Contact", href: "#contact" },
];

export function LandingNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-[--ag-surface]/95 backdrop-blur-sm border-b border-[--ag-border]">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <SkillMatchLogo size="sm" />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="text-sm font-semibold text-[--ag-muted] hover:text-[--ag-accent] transition-colors"
              >
                {item.name}
              </a>
            ))}
          </nav>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" className="font-semibold">Login</Button>
            </Link>
            <Link to="/register">
              <Button variant="hero" size="sm" className="font-bold rounded-none bg-[--ag-accent] text-[#07080F] hover:brightness-110 tracking-widest uppercase">Analyze my profile</Button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-3 border-t border-[--ag-border]">
            {navItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="block px-2 py-2 text-sm font-semibold text-[--ag-muted] hover:text-[--ag-accent]"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.name}
              </a>
            ))}
            <div className="flex flex-col gap-2 pt-2">
              <Link to="/login">
                <Button variant="ghost" className="w-full font-semibold">Login</Button>
              </Link>
              <Link to="/register">
                <Button variant="hero" className="w-full font-bold rounded-none bg-[--ag-accent] text-[#07080F] hover:brightness-110 tracking-widest uppercase">Analyze my profile</Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
