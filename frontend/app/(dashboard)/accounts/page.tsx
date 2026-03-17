'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { submissionsService } from '@/services/submissions';
import { useNumberList } from '@/hooks/useNumbers';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { KeyRound, ExternalLink } from 'lucide-react';
import { SubmissionForm } from '@/components/submissions/SubmissionForm';
import { SocialLogo } from '@/components/icons/SocialLogos';
import type { Platform } from '@/types';

/** Gmail signup via proxy (avoids opening Android Gmail app). */
function getProxyGmailSignupUrl(): string {
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
  return `${base.replace(/\/$/, '')}/proxy/gmail-signup/`;
}

function openGmailSignupPopup() {
  const w = 520, h = 640;
  const left = Math.round(window.screenX + (window.outerWidth - w) / 2);
  const top = Math.round(window.screenY + (window.outerHeight - h) / 2);
  window.open(getProxyGmailSignupUrl(), 'gmail_signup', `width=${w},height=${h},left=${left},top=${top},resizable=yes,scrollbars=yes`);
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: 'bg-amber-50 text-amber-600 border-amber-100',
    approved: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    rejected: 'bg-red-50 text-red-500 border-red-100',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide border',
        styles[status] ?? 'bg-slate-100 text-slate-500 border-slate-200'
      )}
    >
      {status}
    </span>
  );
}

function PlatformBadge({ platform }: { platform: string }) {
  const styles: Record<string, string> = {
    gmail: 'bg-red-50 text-red-600',
    whatsapp: 'bg-green-50 text-green-600',
    imo: 'bg-blue-50 text-blue-600',
    instagram: 'bg-pink-50 text-pink-600',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold capitalize',
        styles[platform] ?? 'bg-slate-100 text-slate-500'
      )}
    >
      <SocialLogo platform={platform as 'gmail' | 'whatsapp' | 'imo' | 'instagram'} size={14} />
      {platform}
    </span>
  );
}

const PLATFORMS: { id: Platform; label: string }[] = [
  { id: 'gmail', label: 'Gmail' },
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'imo', label: 'IMO' },
  { id: 'instagram', label: 'Instagram' },
];

export default function AccountsPage() {
  const router = useRouter();
  const isAdmin = useAuthStore((s) => s.isAdmin)();
  const [selectedNumberId, setSelectedNumberId] = useState<string>('');
  const [submitDialog, setSubmitDialog] = useState<{ platform: Platform } | null>(null);

  useEffect(() => {
    if (typeof isAdmin === 'boolean' && isAdmin) {
      router.replace('/submissions');
    }
  }, [isAdmin, router]);

  const { data: numberList, isLoading: numbersLoading } = useNumberList();
  const { data: submissions, isLoading: submissionsLoading } = useQuery({
    queryKey: ['submissions-mine'],
    queryFn: submissionsService.mine,
  });

  const numbers = numberList ?? [];
  const selectedEntry = numbers.find((n) => String(n.id) === selectedNumberId);
  const list = submissions ?? [];

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Accounts</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Select the number you used, create an account if needed, then submit it here. Your submissions appear below.
        </p>
      </div>

      {/* Add account: number dropdown + platform actions */}
      <div className="bg-card rounded-2xl border border-border p-5 space-y-5">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">I used this number</label>
          {numbersLoading ? (
            <Skeleton className="h-10 w-full max-w-xs rounded-md" />
          ) : (
            <Select value={selectedNumberId} onValueChange={setSelectedNumberId}>
              <SelectTrigger className="w-full max-w-xs h-10 bg-background border-input">
                <SelectValue placeholder="Select number" />
              </SelectTrigger>
              <SelectContent>
                {numbers.map((entry) => (
                  <SelectItem key={entry.id} value={String(entry.id)}>
                    {entry.number}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium text-slate-700">Add account</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {/* Gmail: Create (proxy) + Submit */}
            <div className="rounded-xl border border-red-100 bg-red-50/50 p-3 space-y-2">
              <div className="flex items-center gap-2">
                <SocialLogo platform="gmail" size={20} />
                <p className="text-xs font-semibold text-red-700 uppercase tracking-wide">Gmail</p>
              </div>
              <p className="text-xs text-slate-600">Create a new Gmail, then submit the credentials.</p>
              <p className="text-[11px] text-slate-500 italic">Opens in browser via proxy — won’t open the phone app; uses admin-configured proxies.</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={openGmailSignupPopup}
                  className="border-red-200 text-red-700 hover:bg-red-100 hover:border-red-300"
                >
                  <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                  Create Gmail
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!selectedEntry}
                  onClick={() => setSubmitDialog({ platform: 'gmail' })}
                  className="border-red-200 text-red-700 hover:bg-red-100 hover:border-red-300"
                >
                  Submit Gmail
                </Button>
              </div>
            </div>
            {/* WhatsApp, IMO, Instagram: Submit only */}
            {PLATFORMS.filter((p) => p.id !== 'gmail').map((p) => (
              <div
                key={p.id}
                className={cn(
                  'rounded-xl border p-3 space-y-2',
                  p.id === 'whatsapp' && 'border-green-100 bg-green-50/50',
                  p.id === 'imo' && 'border-blue-100 bg-blue-50/50',
                  p.id === 'instagram' && 'border-pink-100 bg-pink-50/50'
                )}
              >
                <div className="flex items-center gap-2">
                  <SocialLogo platform={p.id} size={20} />
                  <p className={cn(
                    'text-xs font-semibold uppercase tracking-wide',
                    p.id === 'whatsapp' && 'text-green-700',
                    p.id === 'imo' && 'text-blue-700',
                    p.id === 'instagram' && 'text-pink-700'
                  )}>
                    {p.label}
                  </p>
                </div>
                <p className="text-xs text-slate-600">Submit your {p.label} account for the selected number.</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!selectedEntry}
                  onClick={() => setSubmitDialog({ platform: p.id })}
                  className={cn(
                    p.id === 'whatsapp' && 'border-green-200 text-green-700 hover:bg-green-100',
                    p.id === 'imo' && 'border-blue-200 text-blue-700 hover:bg-blue-100',
                    p.id === 'instagram' && 'border-pink-200 text-pink-700 hover:bg-pink-100'
                  )}
                >
                  Submit {p.label}
                </Button>
              </div>
            ))}
          </div>
        </div>

        {!selectedEntry && numbers.length > 0 && (
          <p className="text-xs text-slate-500">Select a number above to submit an account.</p>
        )}
        {numbers.length === 0 && !numbersLoading && (
          <p className="text-xs text-slate-500">No numbers available yet. Admin adds numbers on the Phone Numbers page.</p>
        )}
      </div>

      {/* Submit dialog */}
      {selectedEntry && submitDialog && (
        <Dialog open={!!submitDialog} onOpenChange={() => setSubmitDialog(null)}>
          <DialogContent className="sm:max-w-md">
            <SubmissionForm
              phoneNumberId={selectedEntry.id}
              phoneNumberDisplay={selectedEntry.number}
              platform={submitDialog.platform}
              onClose={() => setSubmitDialog(null)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* My submissions */}
      <div>
        <h2 className="text-sm font-semibold text-slate-800 mb-3">Your submissions</h2>
        {submissionsLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-xl" />
            ))}
          </div>
        ) : list.length === 0 ? (
          <div className="bg-slate-50 rounded-xl border border-border p-6 text-center">
            <KeyRound className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-xs text-slate-500">No submissions yet. Use the form above to submit an account.</p>
          </div>
        ) : (
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="divide-y divide-border">
              {list.map((s) => (
                <div
                  key={s.id}
                  className="px-5 py-4 flex flex-wrap items-center justify-between gap-4"
                >
                  <div className="flex flex-wrap items-center gap-3 min-w-0">
                    <PlatformBadge platform={s.platform} />
                    <div>
                      <p className="text-sm font-medium text-slate-800">{s.phone_number_display}</p>
                      <p className="text-xs text-slate-500 truncate max-w-[240px]">
                        {s.username_or_email}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={s.status} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
