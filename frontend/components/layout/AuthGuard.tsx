'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

interface AuthGuardProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

export function AuthGuard({ children, adminOnly = false }: AuthGuardProps) {
  const router = useRouter();
  const tokens = useAuthStore((s) => s.tokens);
  const isAdmin = useAuthStore((s) => s.isAdmin)();
  const hasHydrated = useAuthStore((s) => s._hasHydrated);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!tokens?.access) {
      router.replace('/login');
      return;
    }
    if (adminOnly && !isAdmin) {
      router.replace('/tasks');
    }
  }, [tokens, isAdmin, adminOnly, router, hasHydrated]);

  // Wait for Zustand to rehydrate from localStorage before rendering or redirecting.
  if (!hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/30">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      </div>
    );
  }

  if (!tokens?.access) return null;
  if (adminOnly && !isAdmin) return null;

  return <>{children}</>;
}
