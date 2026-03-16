'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { useQuery } from '@tanstack/react-query';
import { usersService } from '@/services/users';
import {
  LayoutDashboard,
  Users,
  Phone,
  FileCheck,
  LogOut,
  UserCircle,
  Contact,
  Banknote,
  Wallet,
} from 'lucide-react';
import { useLogout } from '@/hooks/useAuth';
import { BRAND_NAME, LOGO_PATH } from '@/lib/site';

const adminNavItems = [
  { href: '/dashboard', label: 'Dashboard',    icon: LayoutDashboard },
  { href: '/users',     label: 'Users',         icon: Users           },
  { href: '/numbers',   label: 'Phone Numbers', icon: Phone           },
  { href: '/submissions', label: 'Submissions', icon: FileCheck       },
  { href: '/payment',   label: 'Payment',       icon: Banknote        },
  { href: '/contacts', label: 'Admin Contacts', icon: Contact       },
  { href: '/profile', label: 'My Profile',          icon: UserCircle },
];

const userNavItems = [
  { href: '/numbers', label: 'Numbers & Accounts', icon: Phone      },
  { href: '/wallet',  label: 'Wallet',              icon: Wallet     },
  { href: '/profile', label: 'My Profile',          icon: UserCircle },
];

interface SidebarContentProps {
  onNavClick?: () => void;
}

export function SidebarContent({ onNavClick }: SidebarContentProps) {
  const pathname = usePathname();
  const isAdmin = useAuthStore((s) => s.isAdmin)();
  const tokens = useAuthStore((s) => s.tokens);
  const logout = useLogout();
  const navItems = isAdmin ? adminNavItems : userNavItems;

  // Fetch user profile for profile image
  const { data: userProfile } = useQuery({
    queryKey: ['me'],
    queryFn: usersService.getMe,
    enabled: !!tokens?.access,
  });

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-slate-950 to-slate-900 text-slate-100">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-slate-800/60">
        <div className="flex items-center gap-2.5">
          <div className="relative w-12 h-12 shrink-0">
            <Image
              src={LOGO_PATH}
              alt={BRAND_NAME}
              fill
              className="object-contain"
              sizes="48px"
              priority
            />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-semibold text-white tracking-tight leading-tight truncate">
              {BRAND_NAME}
            </h1>
            <p className="text-[10px] text-slate-500 mt-0 leading-tight">
              {isAdmin ? 'Admin Panel' : 'User Portal'}
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <p className="px-2 mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-600">
          {isAdmin ? 'Management' : 'Overview'}
        </p>
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavClick}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-primary/15 text-primary-foreground/90 border border-primary/20'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100 border border-transparent'
              )}
            >
              <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-primary-foreground/80' : 'text-slate-500')} />
              {label}
              {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />}
            </Link>
          );
        })}
      </nav>

      {/* User + sign out */}
      <div className="px-3 py-4 border-t border-slate-800/60 space-y-1">
        <Link
          href="/profile"
          onClick={onNavClick}
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-slate-900/60 border border-slate-800/40 mb-2 hover:bg-slate-800/60 transition-colors"
        >
          <div className="w-6 h-6 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0 overflow-hidden">
            {userProfile?.profile_image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img 
                src={userProfile.profile_image_url} 
                alt={userProfile.username || 'User'} 
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-[10px] font-semibold text-primary-foreground/80 uppercase">
                {tokens?.username?.[0] ?? 'U'}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-200 truncate leading-tight">
              {userProfile?.full_name || tokens?.username}
            </p>
            {userProfile?.full_name && (
              <p className="text-[10px] text-slate-500 truncate leading-tight">@{tokens?.username}</p>
            )}
            <p className="text-[10px] text-slate-500 capitalize leading-tight">{tokens?.role}</p>
          </div>
        </Link>
        <button
          onClick={() => { logout(); onNavClick?.(); }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-500 hover:bg-red-500/10 hover:text-red-400 border border-transparent hover:border-red-500/15 transition-all duration-150"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden md:flex w-72 shrink-0 min-h-screen flex-col bg-gradient-to-b from-slate-950 to-slate-900">
      <SidebarContent />
    </aside>
  );
}
