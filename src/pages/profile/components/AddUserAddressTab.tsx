import { useNavigate } from 'react-router-dom';
import { authService } from '../../../api/services';
import LoadingLink from '../../../components/LoadingLink';
import { useI18n } from '../../../i18n/I18nProvider';
import { useCreateUserAddress } from '../../../hooks/useUserAddresses';
import { notify } from '../../../utils/notify';
import { cn } from '../../../lib/cn';
import UserAddressForm, { formValuesToCreatePayload, type UserAddressFormValues } from './UserAddressForm';

export default function AddUserAddressTab() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const createMutation = useCreateUserAddress();
  const saving = createMutation.isPending;

  const onSubmit = async (v: UserAddressFormValues) => {
    const payload = formValuesToCreatePayload(v);
    try {
      await createMutation.mutateAsync(payload);
      await authService.fetchCurrentUser();
      notify.success(t('profile_address_added'));
      navigate('/account/address');
    } catch (e) {
      const message = e instanceof Error ? e.message : t('profile_address_add_failed');
      notify.error(message);
    }
  };

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
      <UserAddressForm mode="create" isSubmitting={saving} onValidSubmit={onSubmit} />
    </div>
  );
}
