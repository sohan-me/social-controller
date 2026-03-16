'use client';

import { useQuery } from '@tanstack/react-query';
import { walletService } from '@/services/wallet';
import { Skeleton } from '@/components/ui/skeleton';
import { Wallet, ArrowDownLeft, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PaymentTransaction } from '@/types';

export default function WalletPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['wallet-me'],
    queryFn: walletService.getMyWallet,
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

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground tracking-tight">Wallet</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Your balance and transaction history (BDT)</p>
      </div>

      <div className="bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-600 rounded-2xl border border-emerald-400/30 shadow-card p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center border border-white/30">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white/80 uppercase tracking-widest">Available balance</p>
            <p className="text-3xl font-bold tracking-tight">
              {wallet ? Number(wallet.balance_BDT).toLocaleString('en-BD', { minimumFractionDigits: 2 }) : '0.00'} BDT
            </p>
          </div>
        </div>
        <p className="text-xs text-white/70">Currency: Bangladeshi Taka (BDT)</p>
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <p className="text-sm font-semibold text-foreground">Transaction history</p>
          <p className="text-xs text-muted-foreground mt-0.5">Credits assigned to you by admin</p>
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
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-200">
                    <ArrowDownLeft className="w-5 h-5 text-emerald-600" />
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
