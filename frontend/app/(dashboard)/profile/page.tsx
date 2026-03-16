'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersService } from '@/services/users';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Camera, User, Phone, MapPin, Mail, Save, UserCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ProfilePage() {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: usersService.getMe,
  });

  const [form, setForm] = useState({ email: '', full_name: '', phone_number: '', address: '' });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setForm({
        email: profile.email ?? '',
        full_name: profile.full_name ?? '',
        phone_number: profile.phone_number ?? '',
        address: profile.address ?? '',
      });
    }
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      fd.append('email', form.email);
      fd.append('full_name', form.full_name);
      fd.append('phone_number', form.phone_number);
      fd.append('address', form.address);
      if (fileRef.current?.files?.[0]) {
        fd.append('profile_image', fileRef.current.files[0]);
      }
      return usersService.updateMe(fd);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['me'] });
      toast.success('Profile updated');
    },
    onError: () => toast.error('Failed to update profile'),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const avatarSrc = previewUrl ?? profile?.profile_image_url ?? null;
  const initials = profile?.username?.[0]?.toUpperCase() ?? 'U';

  if (isLoading) {
    return (
      <div className="max-w-2xl space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-14 bg-muted rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground tracking-tight">My Profile</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Update your personal information</p>
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
        {/* Avatar section */}
        <div className="px-6 py-6 border-b border-border flex items-center gap-5">
          <div className="relative">
            <div className={cn(
              'w-20 h-20 rounded-2xl overflow-hidden flex items-center justify-center shrink-0',
              avatarSrc ? '' : 'bg-primary/10 border-2 border-primary/20'
            )}>
              {avatarSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarSrc} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-primary">{initials}</span>
              )}
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-primary hover:bg-primary/90 border-2 border-card flex items-center justify-center transition-colors"
              title="Change photo"
            >
              <Camera className="w-3 h-3 text-primary-foreground" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </div>
          <div>
            <p className="text-base font-semibold text-foreground">
              {profile?.full_name || profile?.username}
            </p>
            {profile?.full_name && (
              <p className="text-sm text-muted-foreground">@{profile?.username}</p>
            )}
            <p className="text-sm text-muted-foreground capitalize">{profile?.role}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Member since {profile?.date_joined ? new Date(profile.date_joined).toLocaleDateString() : '—'}
            </p>
          </div>
        </div>

        {/* Form fields */}
        <div className="px-6 py-6 space-y-5">
          {/* Username (read-only) */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-foreground flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-muted-foreground" /> Username
            </Label>
            <Input value={profile?.username ?? ''} disabled className="h-10 bg-muted border-input text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Username cannot be changed.</p>
          </div>

          {/* Full Name */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-foreground flex items-center gap-1.5">
              <UserCircle className="w-3.5 h-3.5 text-muted-foreground" /> Full Name
            </Label>
            <Input
              type="text"
              value={form.full_name}
              onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
              className="h-10 bg-background border-input"
              placeholder="Your full name"
            />
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-foreground flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-muted-foreground" /> Email
            </Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="h-10 bg-background border-input"
              placeholder="your@email.com"
            />
          </div>

          {/* Phone number */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-foreground flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-muted-foreground" /> Phone Number
            </Label>
            <Input
              type="tel"
              value={form.phone_number}
              onChange={(e) => setForm((f) => ({ ...f, phone_number: e.target.value }))}
              className="h-10 bg-background border-input"
              placeholder="+1234567890"
            />
          </div>

          {/* Address */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-foreground flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-muted-foreground" /> Address
            </Label>
            <Textarea
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              className="bg-background border-input resize-none"
              placeholder="Your address"
              rows={3}
            />
          </div>

          <Button
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground gap-2 h-10"
            onClick={() => updateMutation.mutate()}
            disabled={updateMutation.isPending}
          >
            <Save className="w-4 h-4" />
            {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
}
