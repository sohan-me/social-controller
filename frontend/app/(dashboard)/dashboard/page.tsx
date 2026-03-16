'use client';

import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '@/services/analytics';
import { contactsService } from '@/services/contacts';
import { useAuthStore } from '@/store/authStore';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Phone, FileCheck, TrendingUp, CheckCircle, XCircle, Clock, Activity, Zap, Instagram, MessageCircle, Mail, PhoneCall } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BRAND_NAME, LOGO_PATH } from '@/lib/site';

interface MetricCardProps {
  label: string;
  value: number | string;
  sub?: string;
  icon: React.ElementType;
  accent: string;
  iconBg: string;
  gradient: string;
  borderAccent: string;
}

function MetricCard({ label, value, sub, icon: Icon, accent, iconBg, gradient, borderAccent }: MetricCardProps) {
  return (
    <div
      className={cn(
        'relative rounded-2xl border overflow-hidden p-5 flex items-start justify-between shadow-card hover:shadow-xl transition-all duration-300',
        gradient,
        borderAccent
      )}
    >
      <div className="relative z-10">
        <p className="text-xs font-semibold text-white/80 uppercase tracking-widest mb-2">{label}</p>
        <p className={cn('text-3xl font-bold tracking-tight text-white drop-shadow-sm', accent)}>{value}</p>
        {sub && <p className="text-xs text-white/70 mt-1.5">{sub}</p>}
      </div>
      <div className={cn('relative z-10 w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 bg-white/20 backdrop-blur-sm border border-white/30', iconBg)}>
        <Icon className="w-6 h-6 text-white" strokeWidth={2.5} />
      </div>
    </div>
  );
}

const PLATFORM_META: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  gmail: { label: 'Gmail', icon: Activity, color: 'text-red-600', bg: 'bg-red-50' },
  whatsapp: { label: 'WhatsApp', icon: MessageCircle, color: 'text-green-600', bg: 'bg-green-50' },
  imo: { label: 'IMO', icon: Zap, color: 'text-blue-600', bg: 'bg-blue-50' },
  instagram: { label: 'Instagram', icon: Instagram, color: 'text-pink-600', bg: 'bg-pink-50' },
};

export default function DashboardPage() {
  const isAdmin = useAuthStore((s) => s.isAdmin)();
  const { data, isLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: analyticsService.dashboard,
  });

  const { data: contacts, isLoading: contactsLoading } = useQuery({
    queryKey: ['contacts'],
    queryFn: contactsService.list,
    enabled: !isAdmin, // Only fetch contacts for non-admin users
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-7 w-36 rounded-lg" />
          <Skeleton className="h-4 w-52 rounded-lg mt-2" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-56 rounded-2xl" />
          <Skeleton className="h-56 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const approvalRate = data.submissions.approval_rate;

  return (
    <div className="space-y-8 max-w-6xl">
      <div className="relative flex items-start gap-4">
        <div className="relative w-16 h-16 shrink-0 rounded-xl overflow-hidden bg-card border border-border shadow-card">
          <Image
            src={LOGO_PATH}
            alt={BRAND_NAME}
            fill
            className="object-contain p-0.5"
            sizes="64px"
          />
        </div>
        <div>
          <div className="h-1 w-16 rounded-full bg-gradient-to-r from-primary to-primary/60 mb-2" />
          <h1 className="font-display text-3xl font-bold text-foreground tracking-tight">Overview</h1>
          <p className="text-sm text-muted-foreground mt-1">Platform activity at a glance</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
        <MetricCard
          label="Total Users"
          value={data.users.total}
          sub={`${data.users.active} active`}
          icon={Users}
          accent=""
          iconBg=""
          gradient="bg-gradient-to-br from-violet-600 via-violet-500 to-indigo-600"
          borderAccent="border-violet-400/30"
        />
        <MetricCard
          label="Phone Numbers"
          value={data.phone_numbers.total}
          sub={`${data.phone_numbers.available} available`}
          icon={Phone}
          accent=""
          iconBg=""
          gradient="bg-gradient-to-br from-sky-500 via-sky-500 to-blue-600"
          borderAccent="border-sky-400/30"
        />
        <MetricCard
          label="Submissions"
          value={data.submissions.total}
          sub={`${data.submissions.created_today} today`}
          icon={FileCheck}
          accent=""
          iconBg=""
          gradient="bg-gradient-to-br from-emerald-500 via-emerald-500 to-teal-600"
          borderAccent="border-emerald-400/30"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Phone number breakdown */}
        <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border bg-gradient-to-r from-sky-500/5 to-transparent">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center">
                  <Phone className="w-4 h-4 text-white" />
                </span>
                Phone Numbers
              </p>
              <span className="text-xs font-medium text-sky-600 bg-sky-500/10 border border-sky-200 px-2.5 py-1 rounded-full">
                {data.phone_numbers.total} total
              </span>
            </div>
          </div>
          <div className="p-4 grid grid-cols-3 gap-3">
            {[
              { label: 'Available', val: data.phone_numbers.available, gradient: 'from-emerald-500 to-teal-600', text: 'text-white', sub: 'text-emerald-100' },
              { label: 'Assigned', val: data.phone_numbers.assigned, gradient: 'from-blue-500 to-indigo-600', text: 'text-white', sub: 'text-blue-100' },
              { label: 'Used', val: data.phone_numbers.used, gradient: 'from-slate-400 to-slate-500', text: 'text-white', sub: 'text-slate-200' },
            ].map(({ label, val, gradient, text, sub }) => (
              <div key={label} className={cn('rounded-xl p-4 text-center bg-gradient-to-br shadow-md border border-white/20', gradient)}>
                <p className={cn('text-2xl font-bold', text)}>{val}</p>
                <p className={cn('text-[11px] font-semibold mt-1 uppercase tracking-wide', sub)}>{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Submission summary */}
        <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border bg-gradient-to-r from-emerald-500/5 to-transparent">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                  <FileCheck className="w-4 h-4 text-white" />
                </span>
                Submissions
              </p>
              <span
                className={cn(
                  'text-xs font-semibold px-2.5 py-1 rounded-full border',
                  approvalRate >= 70
                    ? 'bg-emerald-500/10 text-emerald-700 border-emerald-200'
                    : approvalRate >= 40
                    ? 'bg-amber-500/10 text-amber-700 border-amber-200'
                    : 'bg-red-500/10 text-red-600 border-red-200'
                )}
              >
                {approvalRate}% approval
              </span>
            </div>
          </div>
          <div className="p-4 grid grid-cols-2 gap-3">
            {[
              { label: 'Approved', val: data.submissions.approved, icon: CheckCircle, gradient: 'from-emerald-500 to-teal-600', iconColor: 'text-white' },
              { label: 'Rejected', val: data.submissions.rejected, icon: XCircle, gradient: 'from-red-500 to-rose-600', iconColor: 'text-white' },
              { label: 'Pending', val: data.submissions.pending, icon: Clock, gradient: 'from-amber-500 to-orange-500', iconColor: 'text-white' },
              { label: 'Today', val: data.submissions.created_today, icon: TrendingUp, gradient: 'from-violet-500 to-indigo-600', iconColor: 'text-white' },
            ].map(({ label, val, icon: Icon, gradient, iconColor }) => (
              <div key={label} className={cn('rounded-xl p-4 flex items-center gap-4 bg-gradient-to-br shadow-md border border-white/20', gradient)}>
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <Icon className={cn('w-5 h-5', iconColor)} strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-xl font-bold text-white">{val}</p>
                  <p className="text-[11px] font-semibold text-white/80 uppercase tracking-wide">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {data.by_platform.length > 0 && (
        <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <p className="text-sm font-semibold text-foreground">By Platform</p>
          </div>
          <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {data.by_platform.map((item) => {
              const meta = PLATFORM_META[item.platform] ?? {
                label: item.platform,
                icon: Activity,
                color: 'text-slate-600',
                bg: 'bg-muted',
              };
              const gradients: Record<string, string> = {
                gmail: 'from-red-500 to-rose-600',
                whatsapp: 'from-green-500 to-emerald-600',
                imo: 'from-blue-500 to-indigo-600',
                instagram: 'from-pink-500 to-rose-500',
              };
              const gradient = gradients[item.platform] ?? 'from-slate-500 to-slate-600';
              const Icon = meta.icon;
              return (
                <div
                  key={item.platform}
                  className={cn(
                    'rounded-xl p-5 flex flex-col items-center gap-3 text-center bg-gradient-to-br shadow-md border border-white/20 hover:shadow-lg transition-all duration-300',
                    gradient
                  )}
                >
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center border border-white/30">
                    <Icon className="w-6 h-6 text-white" strokeWidth={2.5} />
                  </div>
                  <p className="text-2xl font-bold text-white">{item.count}</p>
                  <p className="text-xs font-semibold text-white/90 uppercase tracking-wide">{meta.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Admin Contacts Section - Only show for non-admin users */}
      {!isAdmin && (
        <>
          {contactsLoading ? (
            <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl border-2 border-primary/20 shadow-card p-6">
              <Skeleton className="h-6 w-40 mb-3" />
              <Skeleton className="h-4 w-64 mb-4" />
              <div className="space-y-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 rounded-xl bg-white/50" />
                ))}
              </div>
            </div>
          ) : contacts && contacts.length > 0 ? (
            <div className="bg-gradient-to-br from-primary/5 via-primary/5 to-primary/10 rounded-2xl border-2 border-primary/20 shadow-card p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shrink-0 shadow-sm">
                  <PhoneCall className="w-5 h-5 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-bold text-foreground mb-1">Need Help?</h3>
                  <p className="text-sm text-muted-foreground">Contact admin for inquiries, support, or assistance</p>
                </div>
              </div>
              <div className="space-y-3">
                {contacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="rounded-xl p-4 bg-card border-2 border-border hover:border-primary/30 hover:shadow-card transition-all duration-200"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      {contact.phone && (
                        <a
                          href={`tel:${contact.phone}`}
                          className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-primary/10 hover:bg-primary/15 border border-primary/20 hover:border-primary/30 transition-all group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0 group-hover:bg-primary/90 transition-colors">
                            <PhoneCall className="w-4 h-4 text-primary-foreground" />
                          </div>
                          <div>
                            <p className="text-xs font-medium text-primary uppercase tracking-wide">Phone</p>
                            <p className="text-sm font-semibold text-foreground group-hover:text-primary">
                              {contact.phone}
                            </p>
                          </div>
                        </a>
                      )}
                      {contact.email && (
                        <a
                          href={`mailto:${contact.email}`}
                          className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-primary/10 hover:bg-primary/15 border border-primary/20 hover:border-primary/30 transition-all group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0 group-hover:bg-primary/90 transition-colors">
                            <Mail className="w-4 h-4 text-primary-foreground" />
                          </div>
                          <div>
                            <p className="text-xs font-medium text-primary uppercase tracking-wide">Email</p>
                            <p className="text-sm font-semibold text-foreground group-hover:text-primary">
                              {contact.email}
                            </p>
                          </div>
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
