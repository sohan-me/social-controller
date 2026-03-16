'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { authService } from '@/services/auth';
import { useAuthStore } from '@/store/authStore';

export function useLogin() {
  const router = useRouter();
  const { setTokens } = useAuthStore();

  return useMutation({
    mutationFn: ({ username, password }: { username: string; password: string }) =>
      authService.login(username, password),
    onSuccess: (data) => {
      setTokens(data);
      if (data.role === 'admin') {
        router.push('/dashboard');
      } else {
        router.push('/tasks');
      }
    },
    onError: () => {
      toast.error('Invalid username or password');
    },
  });
}

export function useLogout() {
  const router = useRouter();
  const { logout } = useAuthStore();

  return () => {
    logout();
    router.push('/login');
  };
}
