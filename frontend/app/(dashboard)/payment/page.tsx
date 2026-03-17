'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { usersService } from '@/services/users';
import { walletService } from '@/services/wallet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Wallet, ArrowUpRight, Pencil, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { PaymentTransaction, WithdrawalRequest } from '@/types';

export default function PaymentPage() {
  const router = useRouter();
  const isAdmin = useAuthStore((s) => s.isAdmin)();
  useEffect(() => {
    if (typeof isAdmin === 'boolean' && !isAdmin) {
      router.replace('/wallet');
    }
  }, [isAdmin, router]);

  const qc = useQueryClient();
  const [userId, setUserId] = useState<string>('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: usersService.list,
  });
  const users = usersData?.results ?? [];

  const { data: transactionsData, isLoading: txLoading } = useQuery({
    queryKey: ['wallet-transactions'],
    queryFn: () => walletService.listTransactions(),
  });
  const transactions = Array.isArray(transactionsData) ? transactionsData : (transactionsData as unknown as { results?: PaymentTransaction[] })?.results ?? [];

  const { data: withdrawalsData, isLoading: withdrawalsLoading } = useQuery({
    queryKey: ['wallet-withdrawals'],
    queryFn: () => walletService.getWithdrawals(),
  });
  const withdrawals = Array.isArray(withdrawalsData) ? withdrawalsData : (withdrawalsData as unknown as { results?: WithdrawalRequest[] })?.results ?? [];

  const creditMutation = useMutation({
    mutationFn: () =>
      walletService.creditUser({
        user_id: Number(userId),
        amount_BDT: amount,
        note: note || 'Admin credit',
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wallet-transactions'] });
      toast.success('Amount assigned successfully');
      setUserId('');
      setAmount('');
      setNote('');
    },
    onError: (err: { response?: { data?: { user_id?: string[] } } }) => {
      const msg = err.response?.data?.user_id?.[0] || 'Failed to assign amount';
      toast.error(msg);
    },
  });

  const updateTransactionMutation = useMutation({
    mutationFn: ({ id, amount_BDT, note }: { id: number; amount_BDT?: string; note?: string }) =>
      walletService.updateTransaction(id, { amount_BDT, note }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wallet-transactions'] });
      toast.success('Transaction updated');
      setEditTx(null);
    },
    onError: () => toast.error('Failed to update transaction'),
  });

  const deleteTransactionMutation = useMutation({
    mutationFn: (id: number) => walletService.deleteTransaction(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wallet-transactions'] });
      toast.success('Transaction removed');
      setDeleteTx(null);
    },
    onError: () => toast.error('Failed to remove transaction'),
  });

  const [editTx, setEditTx] = useState<PaymentTransaction | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editNote, setEditNote] = useState('');
  const [deleteTx, setDeleteTx] = useState<PaymentTransaction | null>(null);

  const approveWithdrawalMutation = useMutation({
    mutationFn: (id: number) => walletService.approveWithdrawal(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wallet-withdrawals'] });
      qc.invalidateQueries({ queryKey: ['wallet-transactions'] });
      qc.invalidateQueries({ queryKey: ['wallet-me'] });
      qc.invalidateQueries({ queryKey: ['wallet-withdrawals-me'] });
      toast.success('Withdrawal approved');
    },
    onError: (err: { response?: { data?: { detail?: string } } }) => toast.error(err.response?.data?.detail || 'Failed to approve'),
  });

  const rejectWithdrawalMutation = useMutation({
    mutationFn: (id: number) => walletService.rejectWithdrawal(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wallet-withdrawals'] });
      qc.invalidateQueries({ queryKey: ['wallet-withdrawals-me'] });
      toast.success('Withdrawal rejected');
    },
    onError: () => toast.error('Failed to reject'),
  });

  if (typeof isAdmin === 'boolean' && !isAdmin) {
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !amount || Number(amount) <= 0) {
      toast.error('Select a user and enter a valid amount (BDT)');
      return;
    }
    creditMutation.mutate();
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground tracking-tight">Payment</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Assign money (BDT) to users</p>
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <p className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Wallet className="w-4 h-4 text-primary" />
            Assign amount to user
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">Select a user and enter amount in BDT. Currency: BDT</p>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="user">User</Label>
              <Select value={userId} onValueChange={setUserId} required>
                <SelectTrigger id="user" className="h-10 bg-background border-input">
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  {users
                    .filter((u) => u.role === 'user')
                    .map((u) => (
                      <SelectItem key={u.id} value={String(u.id)}>
                        {u.username}
                        {u.full_name ? ` — ${u.full_name}` : ''}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {usersLoading && <Skeleton className="h-10 w-full rounded-md" />}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="amount">Amount (BDT)</Label>
              <Input
                id="amount"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-10 bg-background border-input"
                required
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="note">Note (optional)</Label>
            <Input
              id="note"
              type="text"
              placeholder="e.g. Bonus, Refund"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="h-10 bg-background border-input"
            />
          </div>
          <Button
            type="submit"
            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
            disabled={creditMutation.isPending}
          >
            <ArrowUpRight className="w-4 h-4" />
            {creditMutation.isPending ? 'Assigning…' : 'Assign to user'}
          </Button>
        </form>
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <p className="text-sm font-semibold text-foreground">Withdrawal requests</p>
          <p className="text-xs text-muted-foreground mt-0.5">Approve or reject user withdrawal requests</p>
        </div>
        <div className="overflow-x-auto">
          {withdrawalsLoading ? (
            <div className="p-4 space-y-2">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : withdrawals.length === 0 ? (
            <p className="p-5 text-sm text-muted-foreground text-center">No withdrawal requests.</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-4">User</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-4">Amount (BDT)</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-4">Note</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-4">Status</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-4">Date</th>
                  <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.map((w) => (
                  <tr key={w.id} className="border-b border-border hover:bg-muted/30">
                    <td className="py-3 px-4 text-sm font-medium text-foreground">{w.user_username ?? `User #${w.user}`}</td>
                    <td className="py-3 px-4 text-sm font-semibold text-foreground">{Number(w.amount_BDT).toLocaleString('en-BD', { minimumFractionDigits: 2 })}</td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">{w.note || '—'}</td>
                    <td className="py-3 px-4">
                      <span
                        className={cn(
                          'inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase',
                          w.status === 'pending' && 'bg-amber-50 text-amber-600',
                          w.status === 'approved' && 'bg-emerald-50 text-emerald-600',
                          w.status === 'rejected' && 'bg-red-50 text-red-500'
                        )}
                      >
                        {w.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-muted-foreground">{new Date(w.created_at).toLocaleString()}</td>
                    <td className="py-3 px-4 text-right">
                      {w.status === 'pending' && (
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                            disabled={approveWithdrawalMutation.isPending}
                            onClick={() => approveWithdrawalMutation.mutate(w.id)}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:bg-red-50 hover:text-red-600"
                            disabled={rejectWithdrawalMutation.isPending}
                            onClick={() => rejectWithdrawalMutation.mutate(w.id)}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <p className="text-sm font-semibold text-foreground">Recent transactions</p>
          <p className="text-xs text-muted-foreground mt-0.5">All payment credits (BDT)</p>
        </div>
        <div className="overflow-x-auto">
          {txLoading ? (
            <div className="p-4 space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <p className="p-5 text-sm text-muted-foreground text-center">No transactions yet.</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-4">User</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-4">Amount (BDT)</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-4">Note</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-4">By</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-4">Date</th>
                  <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-border hover:bg-muted/30">
                    <td className="py-3 px-4 text-sm font-medium text-foreground">{tx.user_username}</td>
                    <td className="py-3 px-4 text-sm text-emerald-600 font-semibold">+{Number(tx.amount_BDT).toFixed(2)}</td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">{tx.note || '—'}</td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">{tx.created_by_username ?? '—'}</td>
                    <td className="py-3 px-4 text-xs text-muted-foreground">{new Date(tx.created_at).toLocaleString()}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                          title="Edit transaction"
                          onClick={() => {
                            setEditTx(tx);
                            setEditAmount(tx.amount_BDT);
                            setEditNote(tx.note ?? '');
                          }}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          title="Remove transaction"
                          onClick={() => setDeleteTx(tx)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Edit transaction dialog */}
      <Dialog open={!!editTx} onOpenChange={(open) => !open && setEditTx(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit transaction</DialogTitle>
          </DialogHeader>
          {editTx && (
            <div className="space-y-4 pt-2">
              <p className="text-sm text-muted-foreground">User: <span className="font-medium text-foreground">{editTx.user_username}</span></p>
              <div className="space-y-1.5">
                <Label htmlFor="edit-amount">Amount (BDT)</Label>
                <Input
                  id="edit-amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  className="h-10 bg-background border-input"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-note">Note</Label>
                <Input
                  id="edit-note"
                  type="text"
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  className="h-10 bg-background border-input"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setEditTx(null)}>Cancel</Button>
                <Button
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                  disabled={updateTransactionMutation.isPending || !editAmount || Number(editAmount) <= 0}
                  onClick={() =>
                    updateTransactionMutation.mutate({
                      id: editTx.id,
                      amount_BDT: editAmount,
                      note: editNote,
                    })
                  }
                >
                  {updateTransactionMutation.isPending ? 'Saving…' : 'Save'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete transaction confirm */}
      <Dialog open={!!deleteTx} onOpenChange={(open) => !open && setDeleteTx(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Remove transaction</DialogTitle>
          </DialogHeader>
          {deleteTx && (
            <div className="space-y-4 pt-2">
              <p className="text-sm text-muted-foreground">
                Remove this credit of <span className="font-semibold text-foreground">{Number(deleteTx.amount_BDT).toFixed(2)} BDT</span> for{' '}
                <span className="font-semibold text-foreground">{deleteTx.user_username}</span>? The amount will be deducted from the user&apos;s wallet.
              </p>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setDeleteTx(null)}>Cancel</Button>
                <Button
                  className="flex-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                  disabled={deleteTransactionMutation.isPending}
                  onClick={() => deleteTransactionMutation.mutate(deleteTx.id)}
                >
                  {deleteTransactionMutation.isPending ? 'Removing…' : 'Remove'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
