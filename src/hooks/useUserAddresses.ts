import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addressService } from '../api/services';
import type { CreateAddressRequest, UpdateAddressRequest } from '../api/types/auth.types';

export const userAddressesQueryKey = ['user', 'addresses'] as const;

export const userAddressDetailQueryKey = (id: number) => ['user', 'address', id] as const;

export function useUserAddresses(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: userAddressesQueryKey,
    queryFn: () => addressService.list(),
    enabled: options?.enabled ?? true
  });
}

export function useCreateUserAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateAddressRequest) => addressService.create(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: userAddressesQueryKey });
    }
  });
}

export function useUserAddressById(id: number | null) {
  const valid = id != null && id > 0;
  return useQuery({
    queryKey: valid ? userAddressDetailQueryKey(id) : (['user', 'address', 'none'] as const),
    queryFn: () => addressService.getById(id!),
    enabled: valid
  });
}

export function useUpdateUserAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { id: number | string; payload: UpdateAddressRequest }) =>
      addressService.update(params.id, params.payload),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: userAddressesQueryKey });
      void queryClient.invalidateQueries({ queryKey: userAddressDetailQueryKey(Number(variables.id)) });
    }
  });
}
