'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { proxyService } from '@/services/proxy';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Server, Trash2, Upload } from 'lucide-react';

export default function ProxiesPage() {
  const router = useRouter();
  const isAdmin = useAuthStore((s) => s.isAdmin)();
  useEffect(() => {
    if (typeof isAdmin === 'boolean' && !isAdmin) {
      router.replace('/numbers');
    }
  }, [isAdmin, router]);

  const qc = useQueryClient();
  const [bulkText, setBulkText] = useState('');

  const { data: proxies, isLoading } = useQuery({
    queryKey: ['proxies'],
    queryFn: proxyService.list,
  });

  const bulkMutation = useMutation({
    mutationFn: (text: string) => proxyService.bulkCreate(text),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['proxies'] });
      toast.success(`${res.created} proxy(ies) added. ${res.errors.length ? `${res.errors.length} invalid.` : ''}`);
      setBulkText('');
    },
    onError: () => toast.error('Failed to add proxies'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => proxyService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['proxies'] });
      toast.success('Proxy removed');
    },
    onError: () => toast.error('Failed to remove proxy'),
  });

  if (typeof isAdmin === 'boolean' && !isAdmin) return null;

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground tracking-tight">Proxies</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Upload proxies for Gmail signup (ip:port:username:password). One per line or comma-separated.
        </p>
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <p className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Upload className="w-4 h-4" /> Bulk add
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Paste proxies: each line or comma-separated. Format: 31.59.20.176:6754:username:password
          </p>
        </div>
        <div className="p-5 space-y-3">
          <Label className="text-sm font-medium text-foreground">Proxies (one per line or comma-separated)</Label>
          <textarea
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            placeholder="31.59.20.176:6754:user1:pass1&#10;31.59.20.176:6755:user2:pass2"
            className="min-h-[120px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-mono"
            rows={5}
          />
          <Button
            onClick={() => bulkMutation.mutate(bulkText)}
            disabled={!bulkText.trim() || bulkMutation.isPending}
          >
            {bulkMutation.isPending ? 'Adding…' : 'Add proxies'}
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <p className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Server className="w-4 h-4" /> Proxy list
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Used randomly when users create Gmail (signup via proxy)
          </p>
        </div>
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-4 space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 w-full rounded-lg" />
              ))}
            </div>
          ) : !proxies?.length ? (
            <p className="p-5 text-sm text-muted-foreground text-center">No proxies yet. Add some above.</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-4">Host</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-4">Port</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-4">Username</th>
                  <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {proxies.map((p) => (
                  <tr key={p.id} className="border-b border-border hover:bg-muted/30">
                    <td className="py-3 px-4 text-sm font-medium text-foreground">{p.host}</td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">{p.port}</td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">{p.username || '—'}</td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => deleteMutation.mutate(p.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
