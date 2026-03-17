'use client';

import { useQuery } from '@tanstack/react-query';
import { numbersService } from '@/services/numbers';

export function useMyNumbers() {
  return useQuery({
    queryKey: ['my-numbers'],
    queryFn: numbersService.myNumbers,
  });
}

/** Shared list of all numbers with url and approved submissions (for users to pick one). */
export function useNumberList() {
  return useQuery({
    queryKey: ['number-list'],
    queryFn: numbersService.getNumberList,
  });
}
