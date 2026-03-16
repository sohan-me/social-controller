'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { submissionsService } from '@/services/submissions';

export function useSubmissions(params?: { status?: string; platform?: string }) {
  return useQuery({
    queryKey: ['submissions', params],
    queryFn: () => submissionsService.list(params),
  });
}

export function useCreateSubmission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) => submissionsService.create(formData),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['submissions'] });
      qc.invalidateQueries({ queryKey: ['my-numbers'] });
      toast.success('Submission sent for review');
    },
    onError: () => toast.error('Failed to submit'),
  });
}

export function useApproveSubmission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => submissionsService.approve(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['submissions'] });
      qc.invalidateQueries({ queryKey: ['analytics'] });
      toast.success('Submission approved');
    },
    onError: () => toast.error('Failed to approve'),
  });
}

export function useRejectSubmission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => submissionsService.reject(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['submissions'] });
      qc.invalidateQueries({ queryKey: ['analytics'] });
      toast.success('Submission rejected');
    },
    onError: () => toast.error('Failed to reject'),
  });
}

export function useUpdateSubmission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, formData }: { id: number; formData: FormData }) =>
      submissionsService.update(id, formData),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['submissions'] });
      qc.invalidateQueries({ queryKey: ['my-numbers'] });
      toast.success('Submission updated');
    },
    onError: () => toast.error('Failed to update submission'),
  });
}

export function useDeleteSubmission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => submissionsService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['submissions'] });
      qc.invalidateQueries({ queryKey: ['my-numbers'] });
      qc.invalidateQueries({ queryKey: ['analytics'] });
      toast.success('Submission deleted');
    },
    onError: () => toast.error('Failed to delete submission'),
  });
}
