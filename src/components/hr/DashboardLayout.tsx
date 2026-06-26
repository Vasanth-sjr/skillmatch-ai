import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Button } from "@/components/ui/button";
import { Bell, User } from "lucide-react";
import { GlobalSearch } from "./GlobalSearch";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-[--ag-bg]">
        <AppSidebar />
        <main className="flex-1 flex flex-col">
          {/* Header */}
          <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b border-[--ag-border] bg-[--ag-surface]/95 backdrop-blur px-4">
            <SidebarTrigger className="ml-0 text-[--ag-muted] hover:text-[--ag-text]" />

            <div className="flex-1 flex items-center gap-4">
              <GlobalSearch />
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="relative text-[--ag-muted] hover:text-[--ag-text]">
                <Bell className="h-4 w-4" />
                <span className="absolute -top-1 -right-1 h-2 w-2 bg-[--ag-accent] rounded-full" />
              </Button>
              <Button variant="ghost" size="icon" className="text-[--ag-muted] hover:text-[--ag-text]">
                <User className="h-4 w-4" />
              </Button>
            </div>
          </header>

          {/* Content */}
          <div className="flex-1 p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}