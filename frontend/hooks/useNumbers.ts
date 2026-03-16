'use client';

import { useQuery } from '@tanstack/react-query';
import { numbersService } from '@/services/numbers';

export function useMyNumbers() {
  return useQuery({
    queryKey: ['my-numbers'],
    queryFn: numbersService.myNumbers,
  });
}
