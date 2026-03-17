'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { walletService } from '@/services/wallet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Wallet, ArrowDownLeft, ArrowUpRight, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function WalletPage() {
  const qc = useQueryClient();
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawNote, setWithdrawNote] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['wallet-me'],
    queryFn: walletService.getMyWallet,
  });
  const { data: withdrawals } = useQuery({
    queryKey: ['wallet-withdrawals-me'],
    queryFn: walletService.getMyWithdrawals,
  });

  const withdrawMutation = useMutation({
    mutationFn: () =>
      walletService.requestWithdrawal({
        amount_BDT: withdrawAmount,
        note: withdrawNote || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wallet-me'] });
      qc.invalidateQueries({ queryKey: ['wallet-withdrawals-me'] });
      toast.success('Withdrawal request submitted');
      setWithdrawAmount('');
      setWithdrawNote('');
    },
    onError: (err: { response?: { data?: Record<string, string[]> } }) => {
      const msg = err.response?.data?.amount_BDT?.[0] || err.response?.data?.detail || 'Failed to request withdrawal';
      toast.error(msg);
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-2xl">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  const wallet = data?.wallet;
  const transactions = data?.transactions ?? [];
  const balance = wallet ? Number(wallet.balance_BDT) : 0;
  const myWithdrawals = withdrawals ?? [];

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(withdrawAmount);
    if (!withdrawAmount || amt <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    if (amt > balance) {
      toast.error('Amount exceeds your balance');
      return;
    }
    withdrawMutation.mutate();
  };

  const withdrawalStatusStyles: Record<string, string> = {
    pending: 'bg-amber-50 text-amber-600 border-amber-100',
    approved: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    rejected: 'bg-red-50 text-red-500 border-red-100',
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground tracking-tight">Wallet</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Your balance, withdraw, and transaction history (BDT)</p>
      </div>

      <div className="bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-600 rounded-2xl border border-emerald-400/30 shadow-card p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center border border-white/30">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white/80 uppercase tracking-widest">Available balance</p>
            <p className="text-3xl font-bold tracking-tight">
              {balance.toLocaleString('en-BD', { minimumFractionDigits: 2 })} BDT
            </p>
          </div>
        </div>
        <p className="text-xs text-white/70">Currency: Bangladeshi Taka (BDT)</p>
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <p className="text-sm font-semibold text-foreground flex items-center gap-2">
            <ArrowUpRight className="w-4 h-4" /> Withdraw
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">Request a withdrawal; admin will approve it</p>
        </div>
        <form onSubmit={handleWithdraw} className="p-5 space-y-3">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-foreground">Amount (BDT)</Label>
            <Input
              type="number"
              min="0.01"
              step="0.01"
              placeholder="0.00"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              className="h-9 bg-background border-input"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-foreground">Note (optional)</Label>
            <Input
              placeholder="e.g. Bank transfer"
              value={withdrawNote}
              onChange={(e) => setWithdrawNote(e.target.value)}
              className="h-9 bg-background border-input"
            />
          </div>
          <Button type="submit" className="w-full" disabled={withdrawMutation.isPending}>
            {withdrawMutation.isPending ? 'Submitting…' : 'Request withdrawal'}
          </Button>
        </form>
      </div>

      {myWithdrawals.length > 0 && (
        <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <p className="text-sm font-semibold text-foreground">My withdrawal requests</p>
            <p className="text-xs text-muted-foreground mt-0.5">Status of your withdrawal requests</p>
          </div>
          <div className="divide-y divide-border">
            {myWithdrawals.map((w) => (
              <div key={w.id} className="flex items-center justify-between gap-4 px-5 py-4">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {Number(w.amount_BDT).toLocaleString('en-BD', { minimumFractionDigits: 2 })} BDT
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(w.created_at).toLocaleString()}
                    {w.reviewed_at && ` · Reviewed ${new Date(w.reviewed_at).toLocaleDateString()}`}
                  </p>
                  {w.note && <p className="text-xs text-muted-foreground mt-0.5">{w.note}</p>}
                </div>
                <span
                  className={cn(
                    'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase border',
                    withdrawalStatusStyles[w.status] ?? 'bg-slate-100 text-slate-600 border-slate-200'
                  )}
                >
                  {w.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <p className="text-sm font-semibold text-foreground">Transaction history</p>
          <p className="text-xs text-muted-foreground mt-0.5">Credits and withdrawals</p>
        </div>
        <div className="divide-y divide-border">
          {transactions.length === 0 ? (
            <p className="p-5 text-sm text-muted-foreground text-center">No transactions yet.</p>
          ) : (
            transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border',
                    tx.transaction_type === 'credit' ? 'bg-emerald-500/10 border-emerald-200' : 'bg-slate-100 border-slate-200'
                  )}>
                    {tx.transaction_type === 'credit' ? (
                      <ArrowDownLeft className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <ArrowUpRight className="w-5 h-5 text-slate-600" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {tx.transaction_type === 'credit' ? 'Credit' : 'Debit'} — {tx.note || 'Payment'}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3 h-3" />
                      {new Date(tx.created_at).toLocaleString()}
                      {tx.created_by_username && ` · by ${tx.created_by_username}`}
                    </p>
                  </div>
                </div>
                <p className={cn(
                  'text-sm font-bold shrink-0',
                  tx.transaction_type === 'credit' ? 'text-emerald-600' : 'text-slate-600'
                )}>
                  {tx.transaction_type === 'credit' ? '+' : '-'}{Number(tx.amount_BDT).toLocaleString('en-BD', { minimumFractionDigits: 2 })} BDT
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
