import { useEffect, useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useI18n } from '../../../i18n/I18nProvider';
import { useAuth } from '../../../app/auth/AuthProvider';
import {
  DEFAULT_PROVINCE_NAME,
  getWardNamesByProvinceName,
  PROVINCE_NAMES,
  resolveProvinceFromApiCity
} from '../../../data/vietnamAddressTree';
import type { CreateAddressRequest, UpdateAddressRequest, UserAddress } from '../../../api/types/auth.types';
import { cn } from '../../../lib/cn';

export type UserAddressFormValues = {
  fullName: string;
  company: string;
  phone: string;
  province: string;
  provinceCustom: string;
  ward: string;
  addressLine: string;
  addressKind: 'home' | 'office';
  isDefault: boolean;
};

const fieldClass = (error?: boolean, disabled?: boolean) =>
  cn(
    'h-10 w-full min-w-0 rounded-sm border bg-surface px-3 text-body text-text-primary',
    'placeholder:text-text-secondary',
    'transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-primary/15',
    error ? 'border-danger' : 'border-border focus:border-primary',
    disabled && 'cursor-not-allowed bg-background text-text-disabled'
  );

const textareaClass = (error?: boolean, disabled?: boolean) =>
  cn(
    fieldClass(error, disabled),
    'h-auto min-h-[100px] resize-y py-2.5'
  );

/** Từ `state` API (cũ: phường, quận) — ưu tiên tên phường. */
function wardFromLegacyState(state: string | null): string {
  if (!state?.trim()) return '';
  const parts = state.split(',').map((s) => s.trim()).filter(Boolean);
  if (parts.length >= 1) return parts[0] ?? '';
  return state.trim();
}

function toFormValues(
  user: ReturnType<typeof useAuth>['user'],
  initial: UserAddress | null | undefined
): UserAddressFormValues {
  const fullName = user?.userInfo?.fullName?.trim() || user?.username?.trim() || '';
  const phone = user?.userInfo?.telephone?.trim() || user?.phoneNumber?.trim() || '';
  if (!initial) {
    return {
      fullName,
      company: '',
      phone,
      province: DEFAULT_PROVINCE_NAME,
      provinceCustom: '',
      ward: '',
      addressLine: '',
      addressKind: 'home',
      isDefault: false
    };
  }
  const wardSaved = wardFromLegacyState(initial.state);
  const { province, provinceCustom } = resolveProvinceFromApiCity(initial.city);
  return {
    fullName,
    company: '',
    phone,
    province: province || 'Khác',
    provinceCustom,
    ward: wardSaved,
    addressLine: initial.addressLine,
    addressKind: 'home',
    isDefault: initial.isDefault
  };
}

function FormRow({
  label,
  required,
  children,
  alignStart
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  alignStart?: boolean;
}) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-1.5 tablet:grid-cols-[minmax(128px,168px),minmax(0,1fr)] tablet:gap-x-3',
        alignStart ? 'tablet:items-start' : 'tablet:items-center'
      )}
    >
      <label
        className={cn(
          'text-left text-body text-text-primary tablet:pt-2',
          alignStart && 'tablet:pt-2.5'
        )}
      >
        {label}
        {required ? <span className="text-danger"> *</span> : null}
      </label>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

type Props = {
  initialAddress?: UserAddress | null;
  isSubmitting: boolean;
  onValidSubmit: (values: UserAddressFormValues) => void | Promise<void>;
  /** Mặc định "edit" — nút gửi hiển thị Cập nhật; "create" hiển thị Thêm địa chỉ */
  mode?: 'create' | 'edit';
};

export default function UserAddressForm({ initialAddress, isSubmitting, onValidSubmit, mode = 'edit' }: Props) {
  const { t } = useI18n();
  const { user } = useAuth();
  const defaults = useMemo(() => toFormValues(user, initialAddress ?? null), [user, initialAddress]);

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors }
  } = useForm<UserAddressFormValues>({
    mode: 'onBlur',
    defaultValues: defaults
  });

  const province = useWatch({ control, name: 'province' });
  /** Chỉ gộp phường đã lưu khi đang đúng tỉnh/TP ban đầu (tránh lẫn khi user đổi tỉnh). */
  const orphanWard = province === defaults.province ? defaults.ward : '';

  const baseWardList = useMemo(
    () => (province && province !== 'Khác' ? getWardNamesByProvinceName(province) : []),
    [province]
  );

  const wardList = useMemo(() => {
    if (!orphanWard) return baseWardList;
    if (baseWardList.includes(orphanWard)) return baseWardList;
    return [orphanWard, ...baseWardList].sort((a, b) => a.localeCompare(b, 'vi'));
  }, [baseWardList, orphanWard]);

  useEffect(() => {
    reset(defaults);
  }, [defaults, reset]);

  const { onChange: onProvinceChange, ...provinceRegister } = register('province');

  return (
    <form
      onSubmit={handleSubmit((v) => onValidSubmit(v))}
      className="m-0 flex flex-col gap-4 tablet:gap-4"
    >
      <FormRow label={t('profile_address_label_recipient_name')} required>
        <div>
          <input
            type="text"
            autoComplete="name"
            disabled={isSubmitting}
            placeholder={t('profile_address_placeholder_recipient_name')}
            className={fieldClass(Boolean(errors.fullName), isSubmitting)}
            {...register('fullName', { required: t('profile_address_err_full_name') })}
          />
          {errors.fullName ? <p className="mt-1 text-caption text-danger">{errors.fullName.message}</p> : null}
        </div>
      </FormRow>

      <FormRow label={t('profile_address_label_company')}>
        <input
          type="text"
          autoComplete="organization"
          disabled={isSubmitting}
          placeholder={t('profile_address_placeholder_company')}
          className={fieldClass(false, isSubmitting)}
          {...register('company')}
        />
      </FormRow>

      <FormRow label={t('profile_address_label_phone_short')} required>
        <div>
          <input
            type="tel"
            autoComplete="tel"
            disabled={isSubmitting}
            placeholder={t('profile_address_placeholder_phone')}
            className={fieldClass(Boolean(errors.phone), isSubmitting)}
            {...register('phone', {
              required: t('profile_address_err_phone_required'),
              minLength: { value: 8, message: t('profile_address_err_phone_invalid') }
            })}
          />
          {errors.phone ? <p className="mt-1 text-caption text-danger">{errors.phone.message}</p> : null}
        </div>
      </FormRow>

      <FormRow label={t('profile_address_label_province')} required>
        <div>
          <select
            disabled={isSubmitting}
            className={fieldClass(false, isSubmitting)}
            {...provinceRegister}
            onChange={(e) => {
              onProvinceChange(e);
              setValue('ward', '', { shouldValidate: false, shouldDirty: true });
            }}
          >
            {PROVINCE_NAMES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          {province === 'Khác' ? (
            <div className="mt-2">
              <input
                type="text"
                disabled={isSubmitting}
                placeholder={t('profile_address_placeholder_province_custom')}
                className={fieldClass(Boolean(errors.provinceCustom), isSubmitting)}
                {...register('provinceCustom', { required: t('profile_address_err_province') })}
              />
              {errors.provinceCustom ? (
                <p className="mt-1 text-caption text-danger">{errors.provinceCustom.message}</p>
              ) : null}
            </div>
          ) : null}
        </div>
      </FormRow>

      <FormRow label={t('profile_address_label_ward')} required>
        {province === 'Khác' ? (
          <div>
            <input
              type="text"
              disabled={isSubmitting}
              placeholder={t('profile_address_placeholder_ward')}
              className={fieldClass(Boolean(errors.ward), isSubmitting)}
              {...register('ward', { required: t('profile_address_err_ward_text') })}
            />
            {errors.ward ? <p className="mt-1 text-caption text-danger">{errors.ward.message}</p> : null}
          </div>
        ) : (
          <div>
            <select
              disabled={isSubmitting}
              className={fieldClass(Boolean(errors.ward), isSubmitting)}
              {...register('ward', { required: t('profile_address_err_ward_select') })}
            >
              <option value="">{t('profile_address_select_ward')}</option>
              {wardList.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
            {errors.ward ? <p className="mt-1 text-caption text-danger">{errors.ward.message}</p> : null}
          </div>
        )}
      </FormRow>

      <FormRow label={t('profile_address_label_detail')} required alignStart>
        <div>
          <textarea
            rows={4}
            disabled={isSubmitting}
            placeholder={t('profile_address_placeholder_detail')}
            className={textareaClass(Boolean(errors.addressLine), isSubmitting)}
            {...register('addressLine', { required: t('profile_address_err_detail') })}
          />
          {errors.addressLine ? (
            <p className="mt-1 text-caption text-danger">{errors.addressLine.message}</p>
          ) : null}
        </div>
      </FormRow>

      <FormRow label={t('profile_address_label_kind')} alignStart>
        <div
          className="flex flex-col gap-2 pt-0.5 tablet:flex-row tablet:flex-wrap tablet:items-center tablet:gap-6"
          role="radiogroup"
        >
          <label className="flex cursor-pointer items-center gap-2 text-body text-text-primary">
            <input
              type="radio"
              value="home"
              disabled={isSubmitting}
              className="size-4 border-border text-primary focus:ring-primary/30"
              {...register('addressKind')}
            />
            {t('profile_address_kind_home')}
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-body text-text-primary">
            <input
              type="radio"
              value="office"
              disabled={isSubmitting}
              className="size-4 border-border text-primary focus:ring-primary/30"
              {...register('addressKind')}
            />
            {t('profile_address_kind_office')}
          </label>
        </div>
      </FormRow>

      <div className="grid grid-cols-1 gap-1.5 tablet:grid-cols-[minmax(128px,168px),minmax(0,1fr)] tablet:gap-x-3 tablet:items-center">
        <div className="hidden tablet:block" />
        <label className="flex cursor-pointer items-start gap-2.5 text-body text-text-primary">
          <input
            type="checkbox"
            disabled={isSubmitting}
            className="mt-0.5 size-4 rounded-sm border-border text-primary focus:ring-primary/30"
            {...register('isDefault')}
          />
          {t('profile_address_set_default')}
        </label>
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-start gap-3 border-t border-border pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className={cn(
            'rounded-md border-0 bg-secondary px-8 py-2.5 text-body font-semibold text-text-primary',
            'shadow-sm transition duration-200',
            'hover:bg-secondary-dark',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary',
            'disabled:cursor-not-allowed disabled:opacity-50'
          )}
        >
          {isSubmitting
            ? t('profile_address_btn_saving')
            : mode === 'create'
              ? t('profile_address_btn_add')
              : t('profile_address_btn_update')}
        </button>
      </div>
    </form>
  );
}

export function formValuesToCreatePayload(v: UserAddressFormValues): CreateAddressRequest {
  const city = v.province === 'Khác' ? (v.provinceCustom || '').trim() : v.province.trim();
  const ward = v.ward.trim();
  return {
    addressLine: v.addressLine.trim(),
    city,
    state: ward || null,
    country: 'Việt Nam',
    zipCode: null,
    isDefault: v.isDefault
  };
}

export function formValuesToUpdatePayload(v: UserAddressFormValues): UpdateAddressRequest {
  return formValuesToCreatePayload(v);
}
