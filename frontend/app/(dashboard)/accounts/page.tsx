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
import { KeyRound } from 'lucide-react';
import { SubmissionForm } from '@/components/submissions/SubmissionForm';
import type { Platform } from '@/types';

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
        'inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold capitalize',
        styles[platform] ?? 'bg-slate-100 text-slate-500'
      )}
    >
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
          Select the number you used, then submit a social account. Your submissions appear below.
        </p>
      </div>

      {/* Submit form: number dropdown + platform buttons */}
      <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
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
        <div className="flex flex-wrap gap-2">
          {PLATFORMS.map((p) => (
            <Button
              key={p.id}
              variant="outline"
              size="sm"
              disabled={!selectedEntry}
              onClick={() => setSubmitDialog({ platform: p.id })}
              className={cn(
                p.id === 'gmail' && 'border-red-200 text-red-700 hover:bg-red-50',
                p.id === 'whatsapp' && 'border-green-200 text-green-700 hover:bg-green-50',
                p.id === 'imo' && 'border-blue-200 text-blue-700 hover:bg-blue-50',
                p.id === 'instagram' && 'border-pink-200 text-pink-700 hover:bg-pink-50'
              )}
            >
              Submit {p.label}
            </Button>
          ))}
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
