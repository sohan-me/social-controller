'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { numbersService } from '@/services/numbers';
import { usersService } from '@/services/users';
import { contactsService } from '@/services/contacts';
import { useAuthStore } from '@/store/authStore';
import { useMyNumbers } from '@/hooks/useNumbers';
import { DataTable, Column } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { PhoneNumber, PhoneNumberWithSubmissions, Platform, AccountSubmission } from '@/types';
import { Plus, UserCheck, Phone, ExternalLink, ChevronDown, ChevronUp, Pencil, Trash2, AlertCircle, Mail, PhoneCall, Eye, EyeOff, Copy, Activity, MessageCircle, Zap, Instagram } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SubmissionForm } from '@/components/submissions/SubmissionForm';
import { useUpdateSubmission } from '@/hooks/useSubmissions';

// ─── Shared helpers ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    available: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    assigned: 'bg-blue-50 text-blue-600 border-blue-100',
    used: 'bg-slate-100 text-slate-400 border-slate-200',
    pending: 'bg-amber-50 text-amber-600 border-amber-100',
    approved: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    rejected: 'bg-red-50 text-red-500 border-red-100',
  };
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide border',
      styles[status] ?? 'bg-slate-100 text-slate-500 border-slate-200'
    )}>
      {status}
    </span>
  );
}

// ─── Platform metadata ──────────────────────────────────────────────────────

const PLATFORMS: {
  id: Platform;
  label: string;
  color: string;
  bg: string;
  border: string;
  signupUrl?: string;
}[] = [
  {
    id: 'gmail',
    label: 'Gmail',
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-100 hover:border-red-300',
    signupUrl: 'https://accounts.google.com/signup',
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    color: 'text-green-600',
    bg: 'bg-green-50',
    border: 'border-green-100 hover:border-green-300',
  },
  {
    id: 'imo',
    label: 'IMO',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-100 hover:border-blue-300',
  },
  {
    id: 'instagram',
    label: 'Instagram',
    color: 'text-pink-600',
    bg: 'bg-pink-50',
    border: 'border-pink-100 hover:border-pink-300',
  },
];

// ─── Platform card button ───────────────────────────────────────────────────

function openPopup(url: string) {
  const w = 520, h = 640;
  const left = Math.round(window.screenX + (window.outerWidth - w) / 2);
  const top  = Math.round(window.screenY + (window.outerHeight - h) / 2);
  window.open(url, 'gmail_signup', `width=${w},height=${h},left=${left},top=${top},resizable=yes,scrollbars=yes`);
}

function PlatformButton({
  platform,
  hasSubmission,
  phoneNumber,
  compact = false,
}: {
  platform: typeof PLATFORMS[number];
  hasSubmission: boolean;
  phoneNumber: PhoneNumberWithSubmissions;
  compact?: boolean;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);

  if (hasSubmission) return null;

  return (
    <>
      <div className={cn('flex items-center gap-1 shrink-0', !compact && 'flex-col w-full')}>
        {/* Create button — only for platforms that have a signup URL (Gmail) */}
        {platform.signupUrl && (
          <button
            onClick={() => openPopup(platform.signupUrl!)}
            className={cn(
              'flex items-center justify-center gap-1 rounded-lg border transition-all duration-150 cursor-pointer hover:shadow-sm whitespace-nowrap',
              compact ? 'px-2 py-1 text-[11px] font-semibold' : 'p-2.5 w-full text-xs font-semibold',
              'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900'
            )}
            title={`Open ${platform.label} signup`}
          >
            <ExternalLink className="w-3 h-3 opacity-70 shrink-0" />
            {compact ? 'Create' : 'Create'}
          </button>
        )}

        {/* Submit button — opens submission dialog, no redirect */}
        <button
          onClick={() => setDialogOpen(true)}
          className={cn(
            'flex items-center justify-center gap-1 rounded-lg border transition-all duration-150 cursor-pointer hover:shadow-sm whitespace-nowrap',
            compact ? 'px-2 py-1 text-[11px] font-semibold' : 'p-2.5 w-full text-xs font-semibold',
            platform.bg,
            platform.border,
          )}
          title={`Submit ${platform.label} account`}
        >
          <span className={cn(platform.color, 'whitespace-nowrap')}>{compact ? 'Submit' : platform.label}</span>
        </button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <SubmissionForm
            phoneNumberId={phoneNumber.id}
            phoneNumberDisplay={phoneNumber.number}
            platform={platform.id}
            onClose={() => setDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── User edit pending submission ────────────────────────────────────────────

const PLATFORM_CONFIG_EDIT: Record<Platform, { field1Label: string; field2Label: string | null; field2IsPassword: boolean }> = {
  gmail:     { field1Label: 'Email Address',    field2Label: 'Password',     field2IsPassword: true  },
  instagram: { field1Label: 'Email / Username', field2Label: 'Password',     field2IsPassword: true  },
  whatsapp:  { field1Label: 'Phone Number',     field2Label: 'Account Name', field2IsPassword: false },
  imo:       { field1Label: 'Phone Number',     field2Label: 'Account Name', field2IsPassword: false },
};

function EditPendingSubmission({ submission, onClose }: { submission: AccountSubmission; onClose: () => void }) {
  const cfg = PLATFORM_CONFIG_EDIT[submission.platform as Platform] ?? { field1Label: 'Account', field2Label: 'Password', field2IsPassword: true };
  const [field1, setField1] = useState(submission.username_or_email);
  const [field2, setField2] = useState(submission.password ?? '');
  const updateMutation = useUpdateSubmission();

  const handleSave = () => {
    const fd = new FormData();
    fd.append('username_or_email', field1);
    fd.append('password', field2);
    updateMutation.mutate({ id: submission.id, formData: fd }, { onSuccess: onClose });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
        You can edit this submission while it is still pending review.
      </div>
      <div className="space-y-1.5">
        <Label className="text-sm font-medium text-slate-700">{cfg.field1Label}</Label>
        <Input value={field1} onChange={(e) => setField1(e.target.value)} className="h-9 bg-background border-input" />
      </div>
      {cfg.field2Label && (
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-slate-700">{cfg.field2Label}</Label>
          <Input type={cfg.field2IsPassword ? 'password' : 'text'} value={field2} onChange={(e) => setField2(e.target.value)} className="h-9 bg-background border-input" />
        </div>
      )}
      <div className="flex gap-2 pt-1">
        <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
        <Button className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground" onClick={handleSave} disabled={updateMutation.isPending}>
          {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}

// ─── Number overall status ──────────────────────────────────────────────────

function NumberStatusBadge({ submissionCount }: { submissionCount: number }) {
  if (submissionCount === 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
        New
      </span>
    );
  }
  if (submissionCount < PLATFORMS.length) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-600 border border-amber-100">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
        In Progress
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
      All Done
    </span>
  );
}

const SUBMISSION_STATUS_STYLES: Record<string, { dot: string; text: string; bg: string; border: string }> = {
  approved: { dot: 'bg-emerald-500', text: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
  pending:  { dot: 'bg-amber-400',   text: 'text-amber-600',   bg: 'bg-amber-50',   border: 'border-amber-100'   },
  rejected: { dot: 'bg-red-400',     text: 'text-red-500',     bg: 'bg-red-50',     border: 'border-red-100'     },
};

// ─── Edit button for pending submission ──────────────────────────────────────

function PendingEditButton({ submission }: { submission: AccountSubmission }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="p-1 rounded-md hover:bg-amber-100 text-amber-500 transition-colors"
        title="Edit pending submission"
      >
        <Pencil className="w-3 h-3" />
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="capitalize">Edit {submission.platform} Submission</DialogTitle>
          </DialogHeader>
          <EditPendingSubmission submission={submission} onClose={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Credential display with reveal + copy (user view) ───────────────────────

function SubmissionCredentials({ submission }: { submission: AccountSubmission }) {
  const [revealed, setRevealed] = useState(false);
  const platformLabels: Record<string, { field2?: string; field2IsPassword?: boolean }> = {
    gmail: { field2: 'Password', field2IsPassword: true },
    whatsapp: { field2: 'Account name', field2IsPassword: false },
    imo: { field2: 'Account name', field2IsPassword: false },
    instagram: { field2: 'Password', field2IsPassword: true },
  };
  const labels = platformLabels[submission.platform] ?? { field2: 'Password', field2IsPassword: true };
  const hasPassword = submission.password != null && submission.password !== '';
  const copyAccount = () => { navigator.clipboard.writeText(submission.username_or_email); toast.success('Account copied'); };
  const copyPassword = () => { if (submission.password) { navigator.clipboard.writeText(submission.password); toast.success('Password copied'); } };
  return (
    <div className="flex flex-col gap-1.5 min-w-0 flex-1">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-xs text-slate-600 font-medium truncate" title={submission.username_or_email}>
          {submission.username_or_email}
        </span>
        <button type="button" onClick={copyAccount} className="p-1 rounded hover:bg-slate-200 text-slate-500 hover:text-slate-700 shrink-0" title="Copy account">
          <Copy className="w-3 h-3" />
        </button>
      </div>
      {hasPassword && (
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-mono text-slate-500 truncate">
            {labels.field2IsPassword && !revealed ? '••••••••••••' : submission.password}
          </span>
          {labels.field2IsPassword && (
            <button type="button" onClick={() => setRevealed((v) => !v)} className="p-1 rounded hover:bg-slate-200 text-slate-500 hover:text-slate-700 shrink-0" title={revealed ? 'Hide' : 'Reveal'}>
              {revealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            </button>
          )}
          <button type="button" onClick={copyPassword} className="p-1 rounded hover:bg-slate-200 text-slate-500 hover:text-slate-700 shrink-0" title="Copy password">
            <Copy className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Single phone number card (user view) ──────────────────────────────────

function PhoneNumberCard({ pn }: { pn: PhoneNumberWithSubmissions }) {
  const [expanded, setExpanded] = useState(true);

  const submissionsByPlatform = Object.fromEntries(
    pn.submissions.map((s) => [s.platform, s])
  );

  const approvedCount = pn.submissions.filter((s) => s.status === 'approved').length;
  const pendingCount  = pn.submissions.filter((s) => s.status === 'pending').length;
  const rejectedCount = pn.submissions.filter((s) => s.status === 'rejected').length;

  return (
    <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
      {/* Card header */}
      <button
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/40 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            <Phone className="w-4.5 h-4.5 text-primary" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-slate-800">{pn.number}</p>
              <NumberStatusBadge submissionCount={pn.submissions.length} />
            </div>
            {/* Progress dots */}
            <div className="flex items-center gap-1.5 mt-1.5">
              {PLATFORMS.map((p) => {
                const sub = submissionsByPlatform[p.id];
                const style = sub ? SUBMISSION_STATUS_STYLES[sub.status] : null;
                return (
                  <div key={p.id} className="flex items-center gap-0.5">
                    <span
                      className={cn(
                        'w-2 h-2 rounded-full',
                        style ? style.dot : 'bg-slate-200'
                      )}
                      title={`${p.label}: ${sub ? sub.status : 'not submitted'}`}
                    />
                  </div>
                );
              })}
              <span className="text-[10px] text-slate-400 ml-1">
                {pn.submissions.length}/{PLATFORMS.length} submitted
                {approvedCount > 0 && ` · ${approvedCount} approved`}
              </span>
            </div>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        )}
      </button>

      {/* Expanded body */}
      {expanded && (
        <div className="border-t border-border px-5 pb-5 pt-4 space-y-4">
          {/* Summary counters */}
          {pn.submissions.length > 0 && (
            <div className="flex items-center gap-3">
              {approvedCount > 0 && (
                <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />{approvedCount} Approved
                </span>
              )}
              {pendingCount > 0 && (
                <span className="flex items-center gap-1 text-xs font-medium text-amber-600">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />{pendingCount} Pending
                </span>
              )}
              {rejectedCount > 0 && (
                <span className="flex items-center gap-1 text-xs font-medium text-red-500">
                  <span className="w-2 h-2 rounded-full bg-red-400" />{rejectedCount} Rejected
                </span>
              )}
            </div>
          )}

          {/* Per-platform rows */}
          <div className="space-y-2">
            {PLATFORMS.map((p) => {
              const sub = submissionsByPlatform[p.id];
              const style = sub ? SUBMISSION_STATUS_STYLES[sub.status] : null;

              return (
                <div
                  key={p.id}
                  className={cn(
                    'flex items-center justify-between rounded-xl px-3.5 py-3 border transition-all gap-2',
                    style ? `${style.bg} ${style.border}` : 'bg-muted border-border'
                  )}
                >
                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                    <span className={cn('text-xs font-bold w-16 sm:w-20 shrink-0 capitalize pt-0.5', style ? style.text : 'text-slate-500')}>
                      {p.label}
                    </span>
                    {sub ? (
                      <SubmissionCredentials submission={sub} />
                    ) : (
                      <span className="text-xs text-slate-400 italic truncate pt-0.5">Not submitted yet</span>
                    )}
                  </div>

                  {sub ? (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={cn(
                        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide border whitespace-nowrap',
                        style?.bg, style?.text, style?.border
                      )}>
                        <span className={cn('w-1.5 h-1.5 rounded-full', style?.dot)} />
                        {sub.status}
                      </span>
                      {sub.status === 'pending' && (
                        <PendingEditButton submission={sub} />
                      )}
                    </div>
                  ) : (
                    <div className="shrink-0">
                      <PlatformButton platform={p} hasSubmission={false} phoneNumber={pn} compact />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── User view ──────────────────────────────────────────────────────────────

function UserNumbersView() {
  const { data, isLoading } = useMyNumbers();
  const { data: contacts, isLoading: contactsLoading } = useQuery({
    queryKey: ['contacts'],
    queryFn: contactsService.list,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-36 bg-slate-100 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="space-y-4 max-w-6xl">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
            <Phone className="w-5 h-5 text-slate-400" />
          </div>
          <p className="text-sm font-medium text-slate-600">No phone numbers assigned yet</p>
          <p className="text-xs text-slate-400 mt-1">Ask your admin to assign a number to you.</p>
        </div>
        
        {/* Admin Contacts Section */}
        {contactsLoading ? (
          <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl border-2 border-primary/20 shadow-card p-6">
            <Skeleton className="h-6 w-40 mb-3" />
            <Skeleton className="h-4 w-64 mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-xl bg-white/50" />
              ))}
            </div>
          </div>
        ) : contacts && contacts.length > 0 ? (
          <div className="bg-gradient-to-br from-primary/5 via-primary/5 to-primary/10 rounded-2xl border-2 border-primary/20 shadow-card p-6">
            <div className="flex items-start gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shrink-0 shadow-sm">
                <PhoneCall className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-foreground mb-1">Need Help?</h3>
                <p className="text-sm text-muted-foreground">Contact admin for inquiries, support, or assistance</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {contacts.flatMap((contact) => {
                const items = [];
                if (contact.phone) {
                  items.push(
                    <a
                      key={`${contact.id}-phone`}
                      href={`tel:${contact.phone}`}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl bg-card border-2 border-primary/20 hover:border-primary/30 hover:shadow-card transition-all duration-200 group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center shrink-0 group-hover:bg-primary/90 transition-colors shadow-sm">
                        <PhoneCall className="w-5 h-5 text-primary-foreground" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-primary uppercase tracking-wide mb-0.5">Phone</p>
                        <p className="text-sm font-semibold text-foreground group-hover:text-primary">
                          {contact.phone}
                        </p>
                      </div>
                    </a>
                  );
                }
                if (contact.email) {
                  items.push(
                    <a
                      key={`${contact.id}-email`}
                      href={`mailto:${contact.email}`}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl bg-card border-2 border-primary/20 hover:border-primary/30 hover:shadow-card transition-all duration-200 group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center shrink-0 group-hover:bg-primary/90 transition-colors shadow-sm">
                        <Mail className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-primary uppercase tracking-wide mb-0.5">Email</p>
                        <p className="text-sm font-semibold text-foreground group-hover:text-primary">
                          {contact.email}
                        </p>
                      </div>
                    </a>
                  );
                }
                return items;
              })}
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  const allSubmissions = data.flatMap((pn) => pn.submissions);
  const totalApproved = allSubmissions.filter((s) => s.status === 'approved').length;
  const totalPending  = allSubmissions.filter((s) => s.status === 'pending').length;

  const approvedByPlatform = PLATFORMS.map((p) => ({
    ...p,
    count: allSubmissions.filter((s) => s.platform === p.id && s.status === 'approved').length,
  }));

  const PLATFORM_ICONS: Record<Platform, React.ElementType> = {
    gmail: Activity,
    whatsapp: MessageCircle,
    imo: Zap,
    instagram: Instagram,
  };

  return (
    <div className="space-y-4 max-w-6xl">
      {/* Summary strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border border-border shadow-card px-4 py-4 text-center">
          <p className="text-2xl font-bold text-slate-900">{data.length}</p>
          <p className="text-xs text-slate-500 uppercase tracking-wide mt-1">Numbers</p>
        </div>
        <div className="bg-card rounded-xl border border-border shadow-card px-4 py-4 text-center">
          <p className="text-2xl font-bold text-emerald-600">{totalApproved}</p>
          <p className="text-xs text-slate-500 uppercase tracking-wide mt-1">Approved</p>
        </div>
        <div className="bg-card rounded-xl border border-border shadow-card px-4 py-4 text-center">
          <p className="text-2xl font-bold text-amber-500">{totalPending}</p>
          <p className="text-xs text-slate-500 uppercase tracking-wide mt-1">Pending</p>
        </div>
        <div className="bg-card rounded-xl border border-border shadow-card px-4 py-4 text-center">
          <p className="text-2xl font-bold text-slate-700">
            {allSubmissions.length}
          </p>
          <p className="text-xs text-slate-500 uppercase tracking-wide mt-1">Total Accounts</p>
        </div>
      </div>

      {/* Approved by platform (user view) */}
      <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <p className="text-sm font-semibold text-foreground">Approved by platform</p>
          <p className="text-xs text-muted-foreground mt-0.5">Your approved accounts per platform</p>
        </div>
        <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {approvedByPlatform.map(({ id, label, count, bg, color }) => {
            const Icon = PLATFORM_ICONS[id];
            return (
              <div
                key={id}
                className={cn(
                  'rounded-xl p-4 flex flex-col items-center gap-2 text-center border border-border',
                  bg
                )}
              >
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center border border-white/60 shadow-sm', bg)}>
                  <Icon className={cn('w-5 h-5', color)} />
                </div>
                <p className={cn('text-2xl font-bold', color)}>{count}</p>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {data.map((pn) => (
          <PhoneNumberCard key={pn.id} pn={pn} />
        ))}
      </div>

      {/* Admin Contacts Section */}
      {contactsLoading ? (
        <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl border-2 border-primary/20 shadow-card p-6">
          <Skeleton className="h-6 w-40 mb-3" />
          <Skeleton className="h-4 w-64 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl bg-white/50" />
            ))}
          </div>
        </div>
      ) : contacts && contacts.length > 0 ? (
        <div className="bg-gradient-to-br from-primary/5 via-primary/5 to-primary/10 rounded-2xl border-2 border-primary/20 shadow-card p-6">
          <div className="flex items-start gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shrink-0 shadow-sm">
              <PhoneCall className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-foreground mb-1">Need Help?</h3>
              <p className="text-sm text-muted-foreground">Contact admin for inquiries, support, or assistance</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {contacts.flatMap((contact) => {
              const items = [];
              if (contact.phone) {
                items.push(
                  <a
                    key={`${contact.id}-phone`}
                    href={`tel:${contact.phone}`}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl bg-card border-2 border-primary/20 hover:border-primary/30 hover:shadow-card transition-all duration-200 group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center shrink-0 group-hover:bg-primary/90 transition-colors shadow-sm">
                      <PhoneCall className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-primary uppercase tracking-wide mb-0.5">Phone</p>
                      <p className="text-sm font-semibold text-foreground group-hover:text-primary">
                        {contact.phone}
                      </p>
                    </div>
                  </a>
                );
              }
              if (contact.email) {
                items.push(
                  <a
                    key={`${contact.id}-email`}
                    href={`mailto:${contact.email}`}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl bg-card border-2 border-primary/20 hover:border-primary/30 hover:shadow-card transition-all duration-200 group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center shrink-0 group-hover:bg-primary/90 transition-colors shadow-sm">
                      <Mail className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-primary uppercase tracking-wide mb-0.5">Email</p>
                      <p className="text-sm font-semibold text-foreground group-hover:text-primary">
                        {contact.email}
                      </p>
                    </div>
                  </a>
                );
              }
              return items;
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

// ─── Edit number dialog ─────────────────────────────────────────────────────

function EditNumberDialog({ number, onClose }: { number: PhoneNumber; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ number: number.number, status: number.status });

  const updateMutation = useMutation({
    mutationFn: () => numbersService.update(number.id, form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['numbers'] });
      toast.success('Phone number updated');
      onClose();
    },
    onError: () => toast.error('Failed to update phone number'),
  });

  return (
    <div className="space-y-4 mt-2">
      <div className="space-y-1.5">
        <Label className="text-sm font-medium text-slate-700">Phone Number</Label>
        <Input
          value={form.number}
          onChange={(e) => setForm((f) => ({ ...f, number: e.target.value }))}
          placeholder="+1234567890"
          className="h-9 bg-background border-input"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-sm font-medium text-slate-700">Status</Label>
        <Select
          value={form.status}
          onValueChange={(v) => setForm((f) => ({ ...f, status: v as PhoneNumber['status'] }))}
        >
          <SelectTrigger className="h-9 bg-background border-input"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="assigned">Assigned</SelectItem>
            <SelectItem value="used">Used</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex gap-2 pt-1">
        <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
        <Button
          className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
          onClick={() => updateMutation.mutate()}
          disabled={updateMutation.isPending}
        >
          {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}

function NumberActions({ number }: { number: PhoneNumber }) {
  const qc = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: () => numbersService.delete(number.id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['numbers'] }); toast.success('Number deleted'); setDeleteOpen(false); },
    onError: () => toast.error('Failed to delete number'),
  });

  return (
    <div className="flex items-center gap-1">
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogTrigger asChild>
          <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10" title="Edit number">
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="text-lg font-semibold">Edit Phone Number</DialogTitle></DialogHeader>
          <EditNumberDialog number={number} onClose={() => setEditOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogTrigger asChild>
          <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50" title="Delete number">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Delete Phone Number</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <p className="text-sm text-slate-600">
              Delete <span className="font-semibold text-slate-900">{number.number}</span>? All associated submissions will also be removed.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setDeleteOpen(false)}>Cancel</Button>
              <Button className="flex-1 bg-red-500 hover:bg-red-600 text-white" onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}>
                {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Admin columns ──────────────────────────────────────────────────────────

const adminColumns: Column<PhoneNumber>[] = [
  { key: 'id', header: 'ID' },
  { key: 'number', header: 'Number' },
  {
    key: 'assigned_to_username',
    header: 'Assigned To',
    render: (row) => row.assigned_to_username ?? <span className="text-slate-300">—</span>,
  },
  { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
  {
    key: 'created_at',
    header: 'Added',
    render: (row) => (
      <span className="text-slate-400 text-xs">{new Date(row.created_at).toLocaleDateString()}</span>
    ),
  },
  {
    key: 'actions',
    header: 'Actions',
    render: (row) => <NumberActions number={row} />,
  },
];

// ─── Admin view ─────────────────────────────────────────────────────────────

function AdminNumbersView() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['numbers'], queryFn: numbersService.list });
  const { data: usersData } = useQuery({ queryKey: ['users'], queryFn: usersService.list });

  const [addOpen, setAddOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [newNumber, setNewNumber] = useState('');
  const [assignForm, setAssignForm] = useState({ phone_number_id: '', user_id: '' });

  const addMutation = useMutation({
    mutationFn: () => numbersService.create(newNumber),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['numbers'] });
      toast.success('Phone number added');
      setAddOpen(false);
      setNewNumber('');
    },
    onError: () => toast.error('Failed to add number'),
  });

  const assignMutation = useMutation({
    mutationFn: () => numbersService.assign(Number(assignForm.phone_number_id), Number(assignForm.user_id)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['numbers'] });
      toast.success('Number assigned');
      setAssignOpen(false);
    },
    onError: () => toast.error('Failed to assign number'),
  });

  return (
    <div className="space-y-5 max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Phone Numbers</h1>
          <p className="text-sm text-slate-400 mt-0.5">Add and assign numbers to users</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="gap-1.5 border-slate-200 text-slate-600 hover:text-slate-900">
                <UserCheck className="h-4 w-4" /> Assign
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader><DialogTitle className="text-lg font-semibold">Assign Number to User</DialogTitle></DialogHeader>
              <div className="space-y-3 mt-2">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-slate-700">Phone Number</Label>
                  <Select value={assignForm.phone_number_id} onValueChange={(v) => setAssignForm((f) => ({ ...f, phone_number_id: v }))}>
                    <SelectTrigger className="h-9 bg-background border-input"><SelectValue placeholder="Select number" /></SelectTrigger>
                    <SelectContent>
                      {data?.results.filter((n) => n.status === 'available').map((n) => (
                        <SelectItem key={n.id} value={String(n.id)}>{n.number}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-slate-700">User</Label>
                  <Select value={assignForm.user_id} onValueChange={(v) => setAssignForm((f) => ({ ...f, user_id: v }))}>
                    <SelectTrigger className="h-9 bg-background border-input"><SelectValue placeholder="Select user" /></SelectTrigger>
                    <SelectContent>
                      {usersData?.results.filter((u) => u.role === 'user').map((u) => (
                        <SelectItem key={u.id} value={String(u.id)}>{u.username}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" onClick={() => assignMutation.mutate()} disabled={assignMutation.isPending}>
                  {assignMutation.isPending ? 'Assigning…' : 'Assign Number'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5">
                <Plus className="h-4 w-4" /> Add Number
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader><DialogTitle className="text-lg font-semibold">Add Phone Number</DialogTitle></DialogHeader>
              <div className="space-y-3 mt-2">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-slate-700">Phone Number</Label>
                  <Input
                    placeholder="+1234567890"
                    value={newNumber}
                    onChange={(e) => setNewNumber(e.target.value)}
                    className="h-9 bg-background border-input"
                  />
                </div>
                <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" onClick={() => addMutation.mutate()} disabled={addMutation.isPending}>
                  {addMutation.isPending ? 'Adding…' : 'Add Number'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <DataTable
        columns={adminColumns}
        data={data?.results ?? []}
        isLoading={isLoading}
        emptyMessage="No phone numbers yet."
      />
    </div>
  );
}

// ─── Page root ───────────────────────────────────────────────────────────────

export default function NumbersPage() {
  const isAdmin = useAuthStore((s) => s.isAdmin)();

  if (isAdmin) {
    return <AdminNumbersView />;
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Phone Numbers</h1>
        <p className="text-sm text-slate-400 mt-0.5">
          Create social accounts under your assigned numbers
        </p>
      </div>
      <UserNumbersView />
    </div>
  );
}
