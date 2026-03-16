'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useLogin } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BRAND_NAME, TAGLINE, META_DESCRIPTION, LOGO_PATH } from '@/lib/site';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { mutate: login, isPending } = useLogin();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login({ username, password });
  };

  return (
    <div className="min-h-screen flex">
      {/* Left decorative panel — hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 flex-col justify-between p-12 relative overflow-hidden">
        {/* Gradient blob */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div className="absolute top-1/4 -left-20 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-0 w-80 h-80 bg-violet-600/15 rounded-full blur-3xl" />
        </div>

        {/* Brand */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="relative w-16 h-16 shrink-0">
            <Image
              src={LOGO_PATH}
              alt={BRAND_NAME}
              fill
              className="object-contain"
              sizes="64px"
              priority
            />
          </div>
          <span className="text-white font-semibold text-lg tracking-tight">{BRAND_NAME}</span>
        </div>

        {/* Tagline */}
        <div className="relative z-10">
          <p className="font-display text-3xl font-bold text-white leading-snug mb-3">
            {TAGLINE}
          </p>
          <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
            {META_DESCRIPTION}
          </p>
        </div>

        {/* Footer */}
        <p className="text-slate-600 text-xs relative z-10">
          © {new Date().getFullYear()} {BRAND_NAME}
        </p>
      </div>

      {/* Right: form */}
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100/80 p-6 relative overflow-hidden lg:overflow-visible">
        {/* Mobile decorative background */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none lg:hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-violet-600/10 rounded-full blur-3xl" />
        </div>

        <div className="w-full max-w-sm relative z-10">
          {/* Desktop logo */}
          <div className="flex items-center gap-3 mb-8 hidden lg:flex">
            <div className="relative w-16 h-16 shrink-0">
              <Image
                src={LOGO_PATH}
                alt={BRAND_NAME}
                fill
                className="object-contain"
                sizes="64px"
                priority
              />
            </div>
            <span className="font-semibold text-foreground text-lg tracking-tight">{BRAND_NAME}</span>
          </div>

          {/* Mobile brand */}
          <div className="mb-10 lg:hidden text-center">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="relative w-20 h-20 shrink-0">
                <Image
                  src={LOGO_PATH}
                  alt={BRAND_NAME}
                  fill
                  className="object-contain"
                  sizes="80px"
                  priority
                />
              </div>
              <span className="font-semibold text-foreground text-xl tracking-tight">{BRAND_NAME}</span>
            </div>
          </div>

          {/* Form card */}
          <div className="bg-card rounded-2xl border border-border shadow-card p-6 md:p-8">
            <div className="mb-7">
              <h1 className="font-display text-2xl font-bold text-foreground tracking-tight">Welcome back</h1>
              <p className="text-muted-foreground text-sm mt-1">Sign in to your account to continue</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="username" className="text-sm font-medium text-foreground">
                  Username
                </Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoFocus
                  className="h-10 bg-background border-input focus:border-ring focus:ring-ring/20"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm font-medium text-foreground">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-10 bg-background border-input focus:border-ring focus:ring-ring/20"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-medium mt-2"
                disabled={isPending}
              >
                {isPending ? 'Signing in…' : 'Sign in'}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
