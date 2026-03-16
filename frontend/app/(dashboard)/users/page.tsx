'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersService } from '@/services/users';
import { DataTable, Column } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { User } from '@/types';
import { Plus, Pencil, PowerOff, Power, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

function RoleBadge({ role }: { role: string }) {
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide',
      role === 'admin'
        ? 'bg-indigo-50 text-indigo-600 border border-indigo-100'
        : 'bg-slate-100 text-slate-500 border border-slate-200'
    )}>
      {role}
    </span>
  );
}

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

function EditUserDialog({ user, onClose }: { user: User; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ email: user.email, role: user.role });

  const updateMutation = useMutation({
    mutationFn: () => usersService.update(user.id, form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success('User updated'); onClose(); },
    onError: () => toast.error('Failed to update user'),
  });

  return (
    <div className="space-y-4 mt-2">
      <div className="space-y-1.5">
        <Label className="text-sm font-medium text-slate-700">Username</Label>
        <Input value={user.username} disabled className="h-9 bg-muted border-input text-muted-foreground" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-sm font-medium text-slate-700">Email</Label>
        <Input value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="h-9 bg-background border-input" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-sm font-medium text-slate-700">Role</Label>
        <Select value={form.role} onValueChange={(v) => setForm((f) => ({ ...f, role: v as 'admin' | 'user' }))}>
          <SelectTrigger className="h-9 bg-background border-input"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="user">User</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex gap-2 pt-1">
        <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
        <Button className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
          {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}

function DeleteConfirmDialog({ label, onConfirm, onClose }: { label: string; onConfirm: () => void; onClose: () => void }) {
  return (
    <div className="space-y-4 mt-2">
      <p className="text-sm text-slate-600">
        Are you sure you want to delete <span className="font-semibold text-slate-900">{label}</span>? This action cannot be undone.
      </p>
      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
        <Button className="flex-1 bg-red-500 hover:bg-red-600 text-white" onClick={onConfirm}>Delete</Button>
      </div>
    </div>
  );
}

function UserActions({ user }: { user: User }) {
  const qc = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const toggleActiveMutation = useMutation({
    mutationFn: () => usersService.update(user.id, { is_active: !user.is_active }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success(user.is_active ? 'User deactivated' : 'User activated'); },
    onError: () => toast.error('Failed to update status'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => usersService.delete(user.id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success('User deleted'); setDeleteOpen(false); },
    onError: () => toast.error('Failed to delete user'),
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
          <DialogHeader><DialogTitle>Edit User — {user.username}</DialogTitle></DialogHeader>
          <EditUserDialog user={user} onClose={() => setEditOpen(false)} />
        </DialogContent>
      </Dialog>

      <Button
        size="icon" variant="ghost"
        className={cn('h-8 w-8', user.is_active ? 'text-emerald-500 hover:text-red-500 hover:bg-red-50' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50')}
        title={user.is_active ? 'Deactivate' : 'Activate'}
        onClick={() => toggleActiveMutation.mutate()}
        disabled={toggleActiveMutation.isPending}
      >
        {user.is_active ? <PowerOff className="h-3.5 w-3.5" /> : <Power className="h-3.5 w-3.5" />}
      </Button>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogTrigger asChild>
          <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50" title="Delete">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Delete User</DialogTitle></DialogHeader>
          <DeleteConfirmDialog label={user.username} onConfirm={() => deleteMutation.mutate()} onClose={() => setDeleteOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function UsersPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['users'], queryFn: usersService.list });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ username: '', email: '', password: '', password2: '', role: 'user' });

  const createMutation = useMutation({
    mutationFn: () => usersService.create(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success('User created'); setOpen(false); setForm({ username: '', email: '', password: '', password2: '', role: 'user' }); },
    onError: () => toast.error('Failed to create user'),
  });

  const columns: Column<User>[] = [
    { key: 'id', header: 'ID' },
    { key: 'username', header: 'Username' },
    { key: 'email', header: 'Email' },
    { key: 'role', header: 'Role', render: (row) => <RoleBadge role={row.role} /> },
    { key: 'is_active', header: 'Status', render: (row) => <StatusBadge active={row.is_active as boolean} /> },
    { key: 'date_joined', header: 'Joined', render: (row) => <span className="text-slate-400 text-xs">{new Date(row.date_joined as string).toLocaleDateString()}</span> },
    { key: 'actions', header: 'Actions', render: (row) => <UserActions user={row} /> },
  ];

  return (
    <div className="space-y-5 max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Users</h1>
          <p className="text-sm text-slate-400 mt-0.5">Manage platform users and roles</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5"><Plus className="h-4 w-4" /> Add User</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>Create User</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-2">
              {(['username', 'email', 'password', 'password2'] as const).map((field) => (
                <div key={field} className="space-y-1.5">
                  <Label htmlFor={field} className="text-sm font-medium text-slate-700">
                    {field === 'password2' ? 'Confirm Password' : field.charAt(0).toUpperCase() + field.slice(1)}
                  </Label>
                  <Input id={field} type={field.includes('password') ? 'password' : 'text'} value={form[field]} onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))} className="h-9 bg-background border-input" />
                </div>
              ))}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-700">Role</Label>
                <Select value={form.role} onValueChange={(v) => setForm((f) => ({ ...f, role: v }))}>
                  <SelectTrigger className="h-9 bg-background border-input"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white mt-1" onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating…' : 'Create User'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <DataTable columns={columns} data={data?.results ?? []} isLoading={isLoading} emptyMessage="No users found." />
    </div>
  );
}
