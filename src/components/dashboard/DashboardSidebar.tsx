import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Calendar,
  User,
  Briefcase,
  Video,
  Star,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  LogOut,
  Brain,
  ClipboardList,
  ClipboardCheck,
  Printer,
  Map,
} from "lucide-react";
import { useState } from "react";
import { SkillMatchLogo } from "@/components/SkillMatchLogo";
import { useAuth } from "@/components/AuthProvider";

const navigationItems = [
  { name: "Dashboard",           href: "/dashboard",    icon: LayoutDashboard },
  { name: "Career Roadmap",      href: "/roadmap",      icon: Map             },
  { name: "My Profile",          href: "/profile",      icon: User            },
  { name: "My Applications",     href: "/applications", icon: ClipboardList   },
  { name: "Career Opportunities",href: "/careers",      icon: Briefcase       },
  { name: "AI Analysis",         href: "/ai-analysis",  icon: Brain           },
  { name: "ATS Checker",         href: "/ats-check",    icon: ClipboardCheck  },
  { name: "Skill Reviews",       href: "/skill-reviews",icon: Star            },
  { name: "Mock Interviews",     href: "/interviews",   icon: Video           },
  { name: "Learning Resources",  href: "/events",       icon: Calendar        },
  { name: "My Resume",           href: "/resume",       icon: Printer         },
  { name: "Settings",            href: "/settings",     icon: Settings        },
];

export function DashboardSidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const { signOut } = useAuth();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-[--ag-surface] border-r border-[--ag-border] transition-all duration-300 flex flex-col",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-[--ag-border]">
        {!collapsed && (
          <Link to="/" className="flex items-center gap-2">
            <SkillMatchLogo size="sm" />
          </Link>
        )}
        {collapsed && (
          <div className="mx-auto">
            <SkillMatchLogo size="sm" iconOnly />
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "p-1.5 rounded-none hover:bg-[--ag-accent-dim] text-[--ag-muted] hover:text-[--ag-accent] transition-colors",
            collapsed && "mx-auto mt-2"
          )}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronLeft className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1 p-3 flex-1">
        {navigationItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-none text-sm transition-all duration-200 relative",
                isActive
                  ? "text-[--ag-accent] border-l-2 border-[--ag-accent] pl-3 bg-[--ag-bg] font-bold"
                  : "text-[--ag-muted] hover:text-[--ag-text] font-medium border-l-2 border-transparent",
                collapsed && "justify-center px-2"
              )}
              title={collapsed ? item.name : undefined}
            >
              <div className={cn("absolute left-0 top-0 w-[2px] h-full transition-colors", isActive ? "bg-[--ag-accent]" : "bg-transparent")} />
              <item.icon className={cn("h-5 w-5 shrink-0", isActive && "text-[--ag-accent]")} />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="p-3 border-t border-[--ag-border]">
        {!collapsed && (
          <div className="rounded-none bg-[--ag-bg] p-4 mb-3 border-t-2 border-[--ag-accent]">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-[--ag-accent]" />
              <span className="text-sm font-bold text-[--ag-text]">AI Assistant</span>
            </div>
            <p className="text-xs text-[--ag-muted]">
              Get personalized learning recommendations powered by AI.
            </p>
          </div>
        )}
        <button
          onClick={signOut}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-none text-sm font-medium w-full",
            "text-[--ag-danger] hover:bg-[--ag-danger]/10 transition-all duration-200",
            collapsed && "justify-center px-2"
          )}
          title={collapsed ? "Log out" : undefined}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Log out</span>}
        </button>
      </div>
    </aside>
  );
}
