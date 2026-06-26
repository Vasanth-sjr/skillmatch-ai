import {
  LayoutDashboard,
  Calendar,
  Users,
  Briefcase,
  MessageCircle,
  FileText,
  BarChart3,
  Settings,
  Search,
  LogOut,
  UserCircle,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { SkillMatchLogo } from "../SkillMatchLogo";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/AuthProvider";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";

const navigationItems = [
  { title: "Dashboard", url: "/hr/dashboard", icon: LayoutDashboard },
  { title: "Events", url: "/hr/events", icon: Calendar },
  { title: "Candidates", url: "/hr/candidates", icon: Users },
  { title: "Job Openings", url: "/hr/jobs", icon: Briefcase },
  { title: "Interviews", url: "/hr/interviews", icon: MessageCircle },
  { title: "Reviews", url: "/hr/reviews", icon: FileText },
  { title: "Reports", url: "/hr/reports", icon: BarChart3 },
  { title: "My Profile", url: "/hr/profile", icon: UserCircle },
  { title: "Settings", url: "/hr/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const { signOut } = useAuth();

  const isCollapsed = state === "collapsed";

  const isActive = (path: string) => {
    if (path === "/hr/dashboard") return currentPath === "/hr/dashboard";
    return currentPath.startsWith(path);
  };

  return (
    <Sidebar className={isCollapsed ? "w-14" : "w-64"} collapsible="icon">
      <SidebarHeader className="p-4 pb-3 border-b border-[--ag-border]">
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            <SkillMatchLogo size="sm" className="flex-shrink-0" />
            <div>
              <h2 className="font-['Syne'] font-extrabold text-[15px] text-[--ag-text] leading-tight tracking-tight">
                SkillMatch
              </h2>
              <p className="text-[11px] text-[--ag-muted] font-medium leading-tight">
                HR Portal
              </p>
            </div>
          </div>
        )}
        {isCollapsed && (
          <div className="mx-auto">
            <SkillMatchLogo size="sm" iconOnly />
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="px-3 py-2 flex flex-col">
        <SidebarGroup className="flex-1">
          <SidebarGroupLabel className={`${isCollapsed ? "sr-only" : ""} text-[11px] uppercase tracking-wider text-[--ag-muted] font-semibold mb-1`}>
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {navigationItems.map((item) => {
                const active = isActive(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-none text-sm transition-all duration-200 border-l-2",
                          active
                            ? "text-[--ag-accent] border-[--ag-accent] bg-[--ag-bg] font-bold"
                            : "text-[--ag-muted] border-transparent hover:text-[--ag-text] hover:bg-[--ag-accent-dim]",
                          isCollapsed && "justify-center px-2"
                        )}
                      >
                        <item.icon className={cn("h-[18px] w-[18px] flex-shrink-0", active && "text-[--ag-accent]")} />
                        {!isCollapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {!isCollapsed && (
          <div
            className="mt-4 p-4 border-t-2 border-[--ag-accent] bg-[--ag-bg] cursor-pointer"
            onClick={() => window.dispatchEvent(new CustomEvent('focus-global-search'))}
          >
            <div className="flex items-center gap-2.5 mb-1.5">
              <Search className="h-3.5 w-3.5 text-[--ag-accent]" />
              <span className="text-sm font-bold text-[--ag-text]">Quick Search</span>
            </div>
            <p className="text-[11px] text-[--ag-muted] leading-relaxed">
              Search candidates, jobs, and events quickly.
            </p>
          </div>
        )}

        <div className="mt-2 border-t border-[--ag-border] pt-2">
          <button
            onClick={signOut}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-none text-sm font-medium w-full",
              "text-[--ag-danger] hover:bg-[--ag-danger]/10 transition-all duration-200",
              isCollapsed && "justify-center px-2"
            )}
          >
            <LogOut className="h-[18px] w-[18px] flex-shrink-0" />
            {!isCollapsed && <span>Log out</span>}
          </button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
