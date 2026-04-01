import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";

export function AppLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center border-b border-border/40 glass-strong px-4 gap-4 sticky top-0 z-30">
            <SidebarTrigger />
            <div className="flex-1" />
            <ThemeToggle />
            {user && (
              <span className="text-xs text-muted-foreground truncate max-w-[200px]">{user.email}</span>
            )}
          </header>
          <main className="flex-1 overflow-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
