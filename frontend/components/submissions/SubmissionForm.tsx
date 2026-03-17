'use client';

import { useState, useRef } from 'react';
import { Platform } from '@/types';
import { useCreateSubmission } from '@/hooks/useSubmissions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SocialLogo } from '@/components/icons/SocialLogos';

interface SubmissionFormProps {
  phoneNumberId: number;
  phoneNumberDisplay: string;
  platform: Platform;
  onClose: () => void;
}

// Per-platform field definitions
// field2 = null means no second field (not needed for this platform)
const PLATFORM_CONFIG: Record<
  Platform,
  {
    field1Label: string;
    field1Placeholder: string;
    field2Label: string | null;
    field2Placeholder: string;
    field2IsPassword: boolean;
  }
> = {
  gmail: {
    field1Label: 'Email Address',
    field1Placeholder: 'example@gmail.com',
    field2Label: 'Password',
    field2Placeholder: 'Account password',
    field2IsPassword: true,
  },
  instagram: {
    field1Label: 'Email / Username',
    field1Placeholder: '@username or email',
    field2Label: 'Password',
    field2Placeholder: 'Account password',
    field2IsPassword: true,
  },
  whatsapp: {
    field1Label: 'Phone Number',
    field1Placeholder: '+1234567890',
    field2Label: 'Account Name',
    field2Placeholder: 'Display name on WhatsApp',
    field2IsPassword: false,
  },
  imo: {
    field1Label: 'Phone Number',
    field1Placeholder: '+1234567890',
    field2Label: 'Account Name',
    field2Placeholder: 'Display name on IMO',
    field2IsPassword: false,
  },
};

const PLATFORM_COLORS: Record<Platform, string> = {
  gmail:     'text-red-600',
  whatsapp:  'text-green-600',
  imo:       'text-blue-600',
  instagram: 'text-pink-600',
};

export function SubmissionForm({ phoneNumberId, phoneNumberDisplay, platform, onClose }: SubmissionFormProps) {
  const config = PLATFORM_CONFIG[platform];
  const [form, setForm] = useState({ field1: '', field2: '' });
  const fileRef = useRef<HTMLInputElement>(null);
  const { mutate: createSubmission, isPending } = useCreateSubmission();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('phone_number', String(phoneNumberId));
    fd.append('platform', platform);
    fd.append('username_or_email', form.field1);
    // Always send password field (empty string if not needed by platform)
    fd.append('password', form.field2);
    if (fileRef.current?.files?.[0]) {
      fd.append('screenshot', fileRef.current.files[0]);
    }
    createSubmission(fd, { onSuccess: onClose });
  };

  const platformName = platform.charAt(0).toUpperCase() + platform.slice(1);
  const colorClass = PLATFORM_COLORS[platform];

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <SocialLogo platform={platform} size={22} />
          Submit <span className={colorClass}>{platformName}</span> Account
        </DialogTitle>
        <p className="text-sm text-slate-500 mt-1">
          Number: <span className="font-medium text-slate-700">{phoneNumberDisplay}</span>
        </p>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-3 mt-2">
        {/* Field 1 — always shown */}
        <div className="space-y-1.5">
          <Label htmlFor="field1" className="text-sm font-medium text-slate-700">
            {config.field1Label}
          </Label>
          <Input
            id="field1"
            type="text"
            placeholder={config.field1Placeholder}
            value={form.field1}
            onChange={(e) => setForm((f) => ({ ...f, field1: e.target.value }))}
            className="h-9 bg-background border-input"
            required
          />
        </div>

        {/* Field 2 — shown for all platforms (password for Gmail/Instagram, account name for WA/IMO) */}
        {config.field2Label && (
          <div className="space-y-1.5">
            <Label htmlFor="field2" className="text-sm font-medium text-slate-700">
              {config.field2Label}
            </Label>
            <Input
              id="field2"
              type={config.field2IsPassword ? 'password' : 'text'}
              placeholder={config.field2Placeholder}
              value={form.field2}
              onChange={(e) => setForm((f) => ({ ...f, field2: e.target.value }))}
              className="h-9 bg-background border-input"
              required
            />
          </div>
        )}

        {/* Screenshot */}
        <div className="space-y-1.5">
          <Label htmlFor="screenshot" className="text-sm font-medium text-slate-700">
            Screenshot <span className="text-slate-400 font-normal">(optional)</span>
          </Label>
          <Input
            id="screenshot"
            type="file"
            accept="image/*"
            ref={fileRef}
            className="h-9 bg-background border-input text-sm"
          />
        </div>

        <div className="flex gap-2 pt-1">
          <Button
            type="submit"
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
            disabled={isPending}
          >
            {isPending ? 'Submitting…' : 'Submit'}
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </form>
    </>
  );
}
