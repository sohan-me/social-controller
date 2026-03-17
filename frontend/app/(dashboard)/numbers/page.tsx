'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { numbersService } from '@/services/numbers';
import { contactsService } from '@/services/contacts';
import { useAuthStore } from '@/store/authStore';
import { useNumberList } from '@/hooks/useNumbers';
import { DataTable, Column } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { PhoneNumber, PhoneNumberListEntry } from '@/types';
import { Plus, Phone, ExternalLink, Pencil, Trash2, Mail, PhoneCall, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SocialLogo } from '@/components/icons/SocialLogos';

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

// ─── User: number row with expand to show social data ────────────────────────

function SharedNumberRow({ entry }: { entry: PhoneNumberListEntry }) {
  const [expanded, setExpanded] = useState(false);
  const hasSubmissions = entry.submissions.length > 0;

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div
        className="p-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/50 transition-colors"
        onClick={() => setExpanded((e) => !e)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            <Phone className="w-4.5 h-4.5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">{entry.number}</p>
            {entry.url ? (
              <a
                href={entry.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-xs text-primary hover:underline flex items-center gap-1 mt-0.5"
              >
                <ExternalLink className="w-3 h-3" />
                Open link
              </a>
            ) : (
              <span className="text-xs text-slate-400 mt-0.5">No link</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {hasSubmissions && (
            <span className="text-xs text-slate-500">
              {entry.submissions.length} account{entry.submissions.length !== 1 ? 's' : ''}
            </span>
          )}
          <button
            type="button"
            className="p-1.5 rounded-lg border border-border text-slate-500 hover:bg-slate-100 transition-colors"
            aria-label={expanded ? 'Collapse' : 'Expand'}
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>
      {expanded && (
        <div className="px-4 pb-4 pt-0 border-t border-border bg-slate-50/50">
          {entry.submissions.length === 0 ? (
            <p className="text-xs text-slate-500 py-2">No social accounts submitted for this number yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2 pt-3">
              {entry.submissions.map((s) => (
                <div
                  key={s.id}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs font-medium',
                    s.status === 'approved' && 'bg-emerald-50 border-emerald-100 text-emerald-700',
                    s.status === 'pending' && 'bg-amber-50 border-amber-100 text-amber-700',
                    s.status === 'rejected' && 'bg-red-50 border-red-100 text-red-600'
                  )}
                >
                  <SocialLogo platform={s.platform} size={16} />
                  <span className="capitalize">{s.platform}</span>
                  <StatusBadge status={s.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── User view ──────────────────────────────────────────────────────────────

function UserNumbersView() {
  const { data: numberList, isLoading } = useNumberList();
  const { data: contacts, isLoading: contactsLoading } = useQuery({
    queryKey: ['contacts'],
    queryFn: contactsService.list,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-24 bg-slate-100 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  const numbers = numberList ?? [];
  if (numbers.length === 0) {
    return (
      <div className="space-y-4 max-w-6xl">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
            <Phone className="w-5 h-5 text-slate-400" />
          </div>
          <p className="text-sm font-medium text-slate-600">No phone numbers added yet</p>
          <p className="text-xs text-slate-400 mt-1">Admin will add numbers with links; you can then pick one and create social accounts.</p>
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

  return (
    <div className="space-y-4 max-w-6xl">
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Numbers and links. Expand a row to see social accounts submitted for that number.
        </p>
        {numbers.map((entry) => (
          <SharedNumberRow key={entry.id} entry={entry} />
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
  const [form, setForm] = useState({ number: number.number, url: number.url ?? '', status: number.status ?? 'available' });

  const updateMutation = useMutation({
    mutationFn: () => numbersService.update(number.id, { ...form, url: form.url || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['numbers'] });
      qc.invalidateQueries({ queryKey: ['number-list'] });
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
        <Label className="text-sm font-medium text-slate-700">URL (optional)</Label>
        <Input
          value={form.url}
          onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
          placeholder="https://..."
          className="h-9 bg-background border-input"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-sm font-medium text-slate-700">Status</Label>
        <Select
          value={form.status}
          onValueChange={(v) => setForm((f) => ({ ...f, status: v as 'available' | 'assigned' | 'used' }))}
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
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['numbers'] }); qc.invalidateQueries({ queryKey: ['number-list'] }); toast.success('Number deleted'); setDeleteOpen(false); },
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
    key: 'url',
    header: 'URL',
    render: (row) => row.url ? (
      <a href={row.url} target="_blank" rel="noopener noreferrer" className="text-primary text-xs hover:underline truncate max-w-[160px] inline-block">{row.url}</a>
    ) : <span className="text-slate-300">—</span>,
  },
  { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status ?? 'available'} /> },
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

  const [addOpen, setAddOpen] = useState(false);
  const [newNumber, setNewNumber] = useState('');
  const [newUrl, setNewUrl] = useState('');

  const addMutation = useMutation({
    mutationFn: () => numbersService.create({ number: newNumber, url: newUrl || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['numbers'] });
      qc.invalidateQueries({ queryKey: ['number-list'] });
      toast.success('Phone number added');
      setAddOpen(false);
      setNewNumber('');
      setNewUrl('');
    },
    onError: () => toast.error('Failed to add number'),
  });

  return (
    <div className="space-y-5 max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Phone Numbers</h1>
          <p className="text-sm text-slate-400 mt-0.5">Add numbers with optional URL; users pick one to create social accounts</p>
        </div>
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
                  placeholder="01891897065"
                  value={newNumber}
                  onChange={(e) => setNewNumber(e.target.value)}
                  className="h-9 bg-background border-input"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-700">URL (optional)</Label>
                <Input
                  placeholder="https://abc.com"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
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
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Phone Numbers</h1>
        <p className="text-sm text-slate-400 mt-0.5">
          Numbers with links. Submit accounts from the Accounts page.
        </p>
      </div>
      <UserNumbersView />
    </div>
  );
}
