import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useI18n } from '../../../i18n/I18nProvider';
import { authService } from '../../../api/services';
import { Button } from '../../../components/ui';
import LoadingLink from '../../../components/LoadingLink';
import { useUpdateUserAddress, useUserAddressById } from '../../../hooks/useUserAddresses';
import { notify } from '../../../utils/notify';
import { cn } from '../../../lib/cn';
import UserAddressForm, { formValuesToUpdatePayload, type UserAddressFormValues } from './UserAddressForm';

export default function EditUserAddressTab() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { addressId } = useParams<{ addressId: string }>();
  const id = addressId != null && addressId !== '' ? Number(addressId) : NaN;
  const valid = Number.isFinite(id) && id > 0;
  const addressQuery = useUserAddressById(valid ? id : null);
  const updateMutation = useUpdateUserAddress();

  useEffect(() => {
    if (addressId != null && addressId !== '' && !valid) {
      notify.error(t('profile_address_invalid_id'));
      navigate('/account/address', { replace: true });
    }
  }, [addressId, valid, navigate, t]);

  if (!valid) {
    return null;
  }

  const onSubmit = async (v: UserAddressFormValues) => {
    const payload = formValuesToUpdatePayload(v);
    try {
      await updateMutation.mutateAsync({ id, payload });
      await authService.fetchCurrentUser();
      notify.success(t('profile_address_updated'));
      navigate('/account/address');
    } catch (e) {
      const message = e instanceof Error ? e.message : t('profile_address_update_failed');
      notify.error(message);
    }
  };

  if (addressQuery.isLoading) {
    return (
      <div className="w-full max-w-3xl space-y-4">
        <div className="h-4 w-40 animate-pulse rounded-sm bg-border" />
        <div className="h-[420px] animate-pulse rounded-md border border-border bg-background/80" />
      </div>
    );
  }

  if (addressQuery.isError) {
    const message =
      addressQuery.error instanceof Error ? addressQuery.error.message : t('profile_address_load_failed');
    return (
      <div className="w-full max-w-3xl space-y-4">
        <LoadingLink
          to="/account/address"
          className="inline-flex text-body font-medium text-primary"
        >
          {t('profile_address_back_to_book')}
        </LoadingLink>
        <div className="rounded-md border border-border bg-surface p-6 text-center text-body text-danger">
          {message}
        </div>
        <div className="flex justify-center">
          <Button type="button" variant="profilePrimary" onClick={() => void addressQuery.refetch()}>
            {t('profile_address_retry')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl">
      <div className="mb-3">
        <LoadingLink
          to="/account/address"
          className={cn(
            'inline-flex text-body font-medium text-primary',
            'transition-colors hover:text-primary-dark',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm'
          )}
        >
          {t('profile_address_back_to_book')}
        </LoadingLink>
      </div>
      <div
        className={cn(
          'rounded-md bg-surface p-5',
          'tablet:p-6 desktop:p-8'
        )}
      >
        <UserAddressForm
          initialAddress={addressQuery.data}
          isSubmitting={updateMutation.isPending}
          onValidSubmit={onSubmit}
        />
      </div>
    </div>
  );
}
