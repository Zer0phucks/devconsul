"use client";

import { ResponsiveSidebar } from "./responsive-sidebar";
import { MobileNav } from "./mobile-nav";
import { useKeyboardShortcuts, commonShortcuts } from "@/lib/hooks/use-keyboard-shortcuts";
import { KeyboardShortcutsDialog } from "@/components/ui/keyboard-shortcuts-dialog";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const [showShortcuts, setShowShortcuts] = useState(false);

  const shortcuts = [
    commonShortcuts.search(() => {
      // TODO: Implement global search
      console.log("Search triggered");
    }),
    commonShortcuts.newItem(() => {
      router.push("/dashboard/projects?new=true");
    }),
    commonShortcuts.help(() => {
      setShowShortcuts(true);
    }),
    {
      key: "d",
      ctrl: true,
      handler: () => router.push("/dashboard"),
      description: "Go to dashboard",
      global: true,
    },
    {
      key: "p",
      ctrl: true,
      handler: () => router.push("/dashboard/projects"),
      description: "Go to projects",
      global: true,
    },
    {
      key: "a",
      ctrl: true,
      handler: () => router.push("/dashboard/analytics"),
      description: "Go to analytics",
      global: true,
    },
  ];

  useKeyboardShortcuts(shortcuts);

  return (
    <div className="flex h-screen bg-background">
      <ResponsiveSidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center justify-between p-4 border-b">
          <h1 className="text-lg font-semibold">Full Self Publishing</h1>
          <MobileNav />
        </header>

        {/* Main content */}
        <main
          id="main-content"
          className="flex-1 overflow-y-auto"
          role="main"
        >
          <div className="container mx-auto p-4 md:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>

      <KeyboardShortcutsDialog shortcuts={shortcuts} />
    </div>
  );
}
