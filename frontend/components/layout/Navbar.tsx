'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';
import { SidebarContent } from './Sidebar';
import { cn } from '@/lib/utils';

export function Navbar() {
  const tokens = useAuthStore((s) => s.tokens);
  const [open, setOpen] = useState(false);

  return (
    <header className="h-14 border-b border-border/80 bg-card/90 backdrop-blur-md shadow-sm px-5 flex items-center justify-between shrink-0 sticky top-0 z-10">
      {/* Mobile hamburger */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden -ml-1 text-slate-600 hover:text-slate-900"
        onClick={() => setOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Desktop: page title slot placeholder */}
      <div className="hidden md:block" />

      {/* Right side: user chip — same colors for admin and user (unified panel styling) */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium bg-primary/10 border-primary/20 text-primary">
          <div className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold uppercase bg-primary text-primary-foreground">
            {tokens?.username?.[0] ?? 'U'}
          </div>
          <span>{tokens?.username}</span>
          <span className="hidden sm:inline px-1.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-primary/15 text-primary">
            {tokens?.role}
          </span>
        </div>
      </div>

      {/* Mobile drawer */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 p-0 border-0">
          <SidebarContent onNavClick={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </header>
  );
}
