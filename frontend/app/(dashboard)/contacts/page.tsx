'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contactsService } from '@/services/contacts';
import { DataTable, Column } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { AdminContact } from '@/types';
import { Plus, Pencil, Trash2, Phone, Mail, PowerOff, Power } from 'lucide-react';
import { cn } from '@/lib/utils';

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide',
      active
        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
        : 'bg-red-50 text-red-400 border border-red-100'
    )}>
      <span className={cn('w-1.5 h-1.5 rounded-full', active ? 'bg-emerald-500' : 'bg-red-400')} />
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}

function EditContactDialog({ contact, onClose }: { contact: AdminContact; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ phone: contact.phone || '', email: contact.email || '', is_active: contact.is_active });

  const updateMutation = useMutation({
    mutationFn: () => contactsService.update(contact.id, form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contacts'] });
      toast.success('Contact updated');
      onClose();
    },
    onError: () => toast.error('Failed to update contact'),
  });

  return (
    <div className="space-y-4 mt-2">
      <div className="space-y-1.5">
        <Label className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
          <Phone className="w-3.5 h-3.5 text-slate-400" /> Phone Number
        </Label>
        <Input
          value={form.phone}
          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          placeholder="+1234567890"
          className="h-9 bg-background border-input"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
          <Mail className="w-3.5 h-3.5 text-slate-400" /> Email Address
        </Label>
        <Input
          type="email"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          placeholder="admin@example.com"
          className="h-9 bg-background border-input"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-sm font-medium text-slate-700">Status</Label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setForm((f) => ({ ...f, is_active: !f.is_active }))}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors',
              form.is_active
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-muted border-input text-muted-foreground'
            )}
          >
            {form.is_active ? <Power className="w-3.5 h-3.5" /> : <PowerOff className="w-3.5 h-3.5" />}
            <span className="text-sm font-medium">{form.is_active ? 'Active' : 'Inactive'}</span>
          </button>
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
        <Button
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
          onClick={() => updateMutation.mutate()}
          disabled={updateMutation.isPending || (!form.phone.trim() && !form.email.trim())}
        >
          {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}

function DeleteConfirmDialog({ onConfirm, onClose }: { label: string; onConfirm: () => void; onClose: () => void }) {
  return (
    <div className="space-y-4 mt-2">
      <p className="text-sm text-slate-600">
        Are you sure you want to delete this contact? This action cannot be undone.
      </p>
      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
        <Button className="flex-1 bg-red-500 hover:bg-red-600 text-white" onClick={onConfirm}>Delete</Button>
      </div>
    </div>
  );
}

function ContactActions({ contact }: { contact: AdminContact }) {
  const qc = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const toggleActiveMutation = useMutation({
    mutationFn: () => contactsService.update(contact.id, { is_active: !contact.is_active }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contacts'] });
      toast.success(contact.is_active ? 'Contact deactivated' : 'Contact activated');
    },
    onError: () => toast.error('Failed to update status'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => contactsService.delete(contact.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contacts'] });
      toast.success('Contact deleted');
      setDeleteOpen(false);
    },
    onError: () => toast.error('Failed to delete contact'),
  });

  return (
    <div className="flex items-center gap-1">
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogTrigger asChild>
          <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50" title="Edit">
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Edit Contact</DialogTitle></DialogHeader>
          <EditContactDialog contact={contact} onClose={() => setEditOpen(false)} />
        </DialogContent>
      </Dialog>

      <Button
        size="icon"
        variant="ghost"
        className={cn(
          'h-8 w-8',
          contact.is_active
            ? 'text-emerald-500 hover:text-red-500 hover:bg-red-50'
            : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
        )}
        title={contact.is_active ? 'Deactivate' : 'Activate'}
        onClick={() => toggleActiveMutation.mutate()}
        disabled={toggleActiveMutation.isPending}
      >
        {contact.is_active ? <PowerOff className="h-3.5 w-3.5" /> : <Power className="h-3.5 w-3.5" />}
      </Button>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogTrigger asChild>
          <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50" title="Delete">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Delete Contact</DialogTitle></DialogHeader>
          <DeleteConfirmDialog label="" onConfirm={() => deleteMutation.mutate()} onClose={() => setDeleteOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ContactsPage() {
  const qc = useQueryClient();
  const { data: contacts, isLoading } = useQuery({ queryKey: ['contacts'], queryFn: contactsService.list });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ phone: '', email: '', is_active: true });

  const createMutation = useMutation({
    mutationFn: () => contactsService.create(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contacts'] });
      toast.success('Contact created');
      setOpen(false);
      setForm({ phone: '', email: '', is_active: true });
    },
    onError: () => toast.error('Failed to create contact'),
  });

  const columns: Column<AdminContact>[] = [
    { key: 'id', header: 'ID' },
    {
      key: 'phone',
      header: 'Phone',
      render: (row) => (
        <div className="flex items-center gap-2">
          {row.phone ? (
            <>
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-sm">{row.phone}</span>
            </>
          ) : (
            <span className="text-slate-300 text-sm">—</span>
          )}
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      render: (row) => (
        <div className="flex items-center gap-2">
          {row.email ? (
            <>
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-sm">{row.email}</span>
            </>
          ) : (
            <span className="text-slate-300 text-sm">—</span>
          )}
        </div>
      ),
    },
    { key: 'is_active', header: 'Status', render: (row) => <StatusBadge active={row.is_active} /> },
    {
      key: 'created_at',
      header: 'Created',
      render: (row) => <span className="text-slate-400 text-xs">{new Date(row.created_at).toLocaleDateString()}</span>,
    },
    { key: 'actions', header: 'Actions', render: (row) => <ContactActions contact={row} /> },
  ];

  return (
    <div className="space-y-5 max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Admin Contacts</h1>
          <p className="text-sm text-slate-400 mt-0.5">Manage contact information shown to users</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5">
              <Plus className="h-4 w-4" /> Add Contact
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Add Admin Contact</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-2">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" /> Phone Number
                </Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="+1234567890"
                  className="h-9 bg-background border-input"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" /> Email Address
                </Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="admin@example.com"
                  className="h-9 bg-background border-input"
                />
              </div>
              <p className="text-xs text-slate-500">
                At least one of phone or email must be provided.
              </p>
              <Button
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white mt-1"
                onClick={() => createMutation.mutate()}
                disabled={createMutation.isPending || (!form.phone.trim() && !form.email.trim())}
              >
                {createMutation.isPending ? 'Creating…' : 'Create Contact'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <DataTable
        columns={columns}
        data={contacts ?? []}
        isLoading={isLoading}
        emptyMessage="No contacts found. Add your first contact to get started."
      />
    </div>
  );
}

