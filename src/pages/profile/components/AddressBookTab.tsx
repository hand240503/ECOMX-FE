import { Check, Plus } from 'lucide-react';
import { Button } from '../../../components/ui';
import LoadingLink from '../../../components/LoadingLink';
import { useI18n } from '../../../i18n/I18nProvider';
import { cn } from '../../../lib/cn';
import { useAuth } from '../../../app/auth/AuthProvider';
import { useUserAddresses } from '../../../hooks/useUserAddresses';
import type { UserAddress } from '../../../api/types/auth.types';
import { formatAddressDetail } from '../../../domain/address/formatAddressDetail';

function AddAddressDashedCta({ className }: { className?: string }) {
  const { t } = useI18n();
  return (
    <LoadingLink
      to="/account/address/new"
      className={cn(
        'flex w-full min-h-[60px] items-center justify-center gap-2 rounded-sm border border-dashed',
        'border-border bg-surface',
        'py-5 text-body font-medium text-primary transition-colors duration-200',
        'hover:border-primary hover:bg-primary-light/30',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        className
      )}
    >
      <Plus className="size-5 shrink-0 stroke-[2.5]" strokeWidth={2.5} aria-hidden />
      {t('profile_address_add_new')}
    </LoadingLink>
  );
}

function AddressCard({
  address,
  recipientName,
  phoneDisplay
}: {
  address: UserAddress;
  recipientName: string;
  phoneDisplay: string;
}) {
  const { t } = useI18n();
  return (
    <div
      className={cn(
        'rounded-sm border border-border bg-background/80',
        'p-4 tablet:p-5'
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1">
          <span className="text-body font-bold uppercase tracking-tight text-text-primary">
            {recipientName}
          </span>
          {address.isDefault ? (
            <span className="inline-flex items-center gap-1 text-body font-medium text-success">
              <Check className="size-4 shrink-0 stroke-[2.5]" strokeWidth={2.5} aria-hidden />
              {t('profile_address_default_badge')}
            </span>
          ) : null}
        </div>
        <LoadingLink
          to={`/account/address/${address.id}/edit`}
          className={cn(
            'shrink-0 text-body font-normal text-primary',
            'transition-colors hover:text-primary-dark hover:underline',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 rounded-sm'
          )}
        >
          {t('profile_address_edit')}
        </LoadingLink>
      </div>

      <p className="mb-0 mt-4 text-body leading-relaxed text-text-primary">
        <span className="text-text-secondary">{t('profile_address_line_label')} </span>
        {formatAddressDetail(address)}
      </p>
      <p className="mb-0 mt-2 text-body leading-relaxed text-text-primary">
        <span className="text-text-secondary">{t('profile_address_phone_label')} </span>
        {phoneDisplay}
      </p>
    </div>
  );
}

function AddressListSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true">
      {[0, 1].map((key) => (
        <div
          key={key}
          className="animate-pulse rounded-sm border border-border bg-background/80 p-4 tablet:p-5"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="h-4 w-48 max-w-[60%] rounded-sm bg-border" />
            <div className="h-4 w-16 rounded-sm bg-border" />
          </div>
          <div className="mt-4 h-3 w-full rounded-sm bg-border" />
          <div className="mt-2 h-3 w-40 rounded-sm bg-border" />
        </div>
      ))}
    </div>
  );
}

export default function AddressBookTab() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { data, isLoading, isError, error, refetch, isFetching } = useUserAddresses();

  const recipientName = (
    user?.userInfo?.fullName?.trim() ||
    user?.username?.trim() ||
    t('profile_address_guest_name')
  ).toUpperCase();
  const phoneDisplay =
    user?.userInfo?.telephone?.trim() || user?.phoneNumber?.trim() || '—';

  if (isLoading) {
    return (
      <div className="w-full space-y-4">
        <div
          className="flex w-full min-h-[60px] items-center justify-center gap-2 rounded-sm border border-dashed border-border bg-surface py-5 animate-pulse"
          aria-busy="true"
        >
          <div className="size-5 rounded-sm bg-border" />
          <div className="h-4 w-44 max-w-[70%] rounded-sm bg-border" />
        </div>
        <AddressListSkeleton />
      </div>
    );
  }

  if (isError) {
    const message = error instanceof Error ? error.message : t('profile_address_error_load_list');
    return (
      <div className="w-full space-y-4">
        <AddAddressDashedCta />
        <div
          className={cn('rounded-sm border border-border bg-background/80 p-5 text-center', 'tablet:p-6')}
        >
          <p className="m-0 text-body text-danger">{message}</p>
          <Button
            type="button"
            variant="profilePrimary"
            className="mt-4 rounded-sm"
            onClick={() => void refetch()}
            loading={isFetching}
          >
            {t('profile_address_retry')}
          </Button>
        </div>
      </div>
    );
  }

  const list = data ?? [];

  return (
    <div className="w-full space-y-4">
      <AddAddressDashedCta />

      {list.length === 0 ? (
        <p className="m-0 text-body text-text-secondary">{t('profile_address_empty')}</p>
      ) : (
        <ul className="m-0 list-none space-y-4 p-0">
          {list.map((address) => (
            <li key={address.id}>
              <AddressCard
                address={address}
                recipientName={recipientName}
                phoneDisplay={phoneDisplay}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
