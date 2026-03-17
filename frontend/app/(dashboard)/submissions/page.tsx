'use client';

import { useState } from 'react';
import { useSubmissions, useApproveSubmission, useRejectSubmission, useUpdateSubmission, useDeleteSubmission } from '@/hooks/useSubmissions';
import { DataTable, Column } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AccountSubmission, Platform } from '@/types';
import { CheckCircle, XCircle, Eye, EyeOff, Copy, Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SocialLogo } from '@/components/icons/SocialLogos';
import { toast } from 'sonner';

// ─── Per-platform labels ──────────────────────────────────────────────────────

const PLATFORM_LABELS: Record<Platform, { field1: string; field2: string | null; field2IsPassword: boolean }> = {
  gmail:     { field1: 'Email',            field2: 'Password',      field2IsPassword: true  },
  instagram: { field1: 'Email / Username', field2: 'Password',      field2IsPassword: true  },
  whatsapp:  { field1: 'Phone Number',     field2: 'Account Name',  field2IsPassword: false },
  imo:       { field1: 'Phone Number',     field2: 'Account Name',  field2IsPassword: false },
};

// ─── Badges ───────────────────────────────────────────────────────────────────

function SubmissionStatus({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending:  'bg-amber-50 text-amber-600 border-amber-100',
    approved: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    rejected: 'bg-red-50 text-red-500 border-red-100',
  };
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide border', styles[status] ?? 'bg-slate-100 text-slate-500 border-slate-200')}>
      {status}
    </span>
  );
}

function PlatformBadge({ platform }: { platform: string }) {
  const styles: Record<string, string> = {
    gmail: 'bg-red-50 text-red-600', whatsapp: 'bg-green-50 text-green-600',
    imo: 'bg-blue-50 text-blue-600', instagram: 'bg-pink-50 text-pink-600',
  };
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold capitalize', styles[platform] ?? 'bg-slate-100 text-slate-500')}>
      <SocialLogo platform={platform as 'gmail' | 'whatsapp' | 'imo' | 'instagram'} size={14} />
      {platform}
    </span>
  );
}

// ─── Credential row with reveal + copy ───────────────────────────────────────

function CredentialRow({ label, value, secret = false }: { label: string; value: string; secret?: boolean }) {
  const [revealed, setRevealed] = useState(false);
  const copy = () => { navigator.clipboard.writeText(value); toast.success(`${label} copied`); };
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-200 font-mono break-all">{secret && !revealed ? '••••••••••••' : value}</span>
        <div className="flex items-center gap-1 shrink-0">
          {secret && (
            <button onClick={() => setRevealed((v) => !v)} className="p-1 rounded hover:bg-slate-700 text-slate-500 hover:text-slate-200 transition-colors" title={revealed ? 'Hide' : 'Reveal'}>
              {revealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          )}
          <button onClick={copy} className="p-1 rounded hover:bg-slate-700 text-slate-500 hover:text-slate-200 transition-colors" title="Copy">
            <Copy className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Edit submission dialog ───────────────────────────────────────────────────

function EditSubmissionDialog({ submission, onClose }: { submission: AccountSubmission; onClose: () => void }) {
  const labels = PLATFORM_LABELS[submission.platform as Platform] ?? { field1: 'Account', field2: 'Password', field2IsPassword: true };
  const [field1, setField1] = useState(submission.username_or_email);
  const [field2, setField2] = useState(submission.password ?? '');
  const fileRef = useState<HTMLInputElement | null>(null);
  const updateMutation = useUpdateSubmission();

  const handleSave = () => {
    const fd = new FormData();
    fd.append('username_or_email', field1);
    fd.append('password', field2);
    updateMutation.mutate({ id: submission.id, formData: fd }, { onSuccess: onClose });
  };

  return (
    <div className="space-y-4 mt-2">
      <div className="space-y-1.5">
        <Label className="text-sm font-medium text-slate-700">{labels.field1}</Label>
        <Input value={field1} onChange={(e) => setField1(e.target.value)} className="h-9 bg-background border-input" />
      </div>
      {labels.field2 && (
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-slate-700">{labels.field2}</Label>
          <Input type={labels.field2IsPassword ? 'password' : 'text'} value={field2} onChange={(e) => setField2(e.target.value)} className="h-9 bg-background border-input" />
        </div>
      )}
      <div className="flex gap-2 pt-1">
        <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
        <Button className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white" onClick={handleSave} disabled={updateMutation.isPending}>
          {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
  void fileRef;
}

// ─── Detail dialog ────────────────────────────────────────────────────────────

function SubmissionDetailDialog({ submission, open, onClose }: { submission: AccountSubmission; open: boolean; onClose: () => void }) {
  const approve = useApproveSubmission();
  const reject  = useRejectSubmission();
  const labels  = PLATFORM_LABELS[submission.platform as Platform] ?? { field1: 'Account', field2: 'Password', field2IsPassword: true };

  const infoField = (label: string, value: React.ReactNode) => (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</span>
      <span className="text-sm text-slate-700">{value}</span>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold flex items-center gap-2">
            Submission #{submission.id} <PlatformBadge platform={submission.platform} />
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-xl border border-border">
            {infoField('Status', <SubmissionStatus status={submission.status} />)}
            {infoField('Phone Number', submission.phone_number_display)}
            {infoField('Submitted', new Date(submission.created_at).toLocaleString())}
            {infoField('Reviewed By', submission.reviewed_by_username ?? <span className="text-slate-300">—</span>)}
            {submission.reviewed_at && infoField('Reviewed At', new Date(submission.reviewed_at).toLocaleString())}
          </div>

          <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Credentials</p>
            <CredentialRow label={labels.field1} value={submission.username_or_email} />
            {labels.field2 && submission.password
              ? <CredentialRow label={labels.field2} value={submission.password} secret={labels.field2IsPassword} />
              : labels.field2
                ? <div className="flex flex-col gap-0.5"><span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{labels.field2}</span><span className="text-xs text-slate-600 italic">Not provided</span></div>
                : null
            }
          </div>

          {submission.screenshot && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Screenshot</span>
              <a href={submission.screenshot} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-sm text-indigo-500 hover:text-indigo-700 font-medium underline-offset-2 hover:underline">
                <Eye className="h-4 w-4" /> View Screenshot
              </a>
            </div>
          )}

          {submission.status === 'pending' && (
            <div className="flex gap-2 pt-1 border-t border-border">
              <Button className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white gap-1.5" onClick={() => { approve.mutate(submission.id); onClose(); }} disabled={approve.isPending}>
                <CheckCircle className="h-4 w-4" /> Approve
              </Button>
              <Button variant="outline" className="flex-1 border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600 gap-1.5" onClick={() => { reject.mutate(submission.id); onClose(); }} disabled={reject.isPending}>
                <XCircle className="h-4 w-4" /> Reject
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Row actions ──────────────────────────────────────────────────────────────

function SubmissionActions({ row }: { row: AccountSubmission }) {
  const [detailOpen, setDetailOpen] = useState(false);
  const [editOpen,   setEditOpen]   = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const approve = useApproveSubmission();
  const reject  = useRejectSubmission();
  const deleteMutation = useDeleteSubmission();

  return (
    <div className="flex items-center gap-1">
      <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50" title="View details" onClick={() => setDetailOpen(true)}>
        <Eye className="h-3.5 w-3.5" />
      </Button>

      <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-amber-600 hover:bg-amber-50" title="Edit submission" onClick={() => setEditOpen(true)}>
        <Pencil className="h-3.5 w-3.5" />
      </Button>

      {row.status === 'pending' && (
        <>
          <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50" onClick={() => approve.mutate(row.id)} disabled={approve.isPending} title="Approve">
            <CheckCircle className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8 text-red-400 hover:text-red-500 hover:bg-red-50" onClick={() => reject.mutate(row.id)} disabled={reject.isPending} title="Reject">
            <XCircle className="h-4 w-4" />
          </Button>
        </>
      )}

      <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50" title="Delete" onClick={() => setDeleteOpen(true)}>
        <Trash2 className="h-3.5 w-3.5" />
      </Button>

      <SubmissionDetailDialog submission={row} open={detailOpen} onClose={() => setDetailOpen(false)} />

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Edit Submission #{row.id}</DialogTitle></DialogHeader>
          <EditSubmissionDialog submission={row} onClose={() => setEditOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Delete Submission</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <p className="text-sm text-slate-600">Delete submission <span className="font-semibold">#{row.id}</span> for <span className="font-semibold capitalize">{row.platform}</span>? This cannot be undone.</p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setDeleteOpen(false)}>Cancel</Button>
              <Button className="flex-1 bg-red-500 hover:bg-red-600 text-white" onClick={() => deleteMutation.mutate(row.id)} disabled={deleteMutation.isPending}>
                {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SubmissionsPage() {
  const { data, isLoading } = useSubmissions();

  const columns: Column<AccountSubmission>[] = [
    { key: 'id', header: 'ID' },
    { key: 'platform', header: 'Platform', render: (row) => <PlatformBadge platform={row.platform} /> },
    { key: 'username_or_email', header: 'Account' },
    { key: 'phone_number_display', header: 'Phone' },
    { key: 'status', header: 'Status', render: (row) => <SubmissionStatus status={row.status} /> },
    { key: 'reviewed_by_username', header: 'Reviewed By', render: (row) => row.reviewed_by_username ?? <span className="text-slate-300">—</span> },
    { key: 'actions', header: 'Actions', render: (row) => <SubmissionActions row={row} /> },
  ];

  return (
    <div className="space-y-5 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Submissions</h1>
        <p className="text-sm text-slate-400 mt-0.5">Review and approve account submissions</p>
      </div>
      <DataTable columns={columns} data={data?.results ?? []} isLoading={isLoading} emptyMessage="No submissions yet." />
    </div>
  );
}
