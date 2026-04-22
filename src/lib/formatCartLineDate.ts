import { format, isValid, parseISO } from 'date-fns';
import type { Locale } from 'date-fns';
import { enUS, vi } from 'date-fns/locale';
import type { Lang } from '../utils/i18n';

const localeByLang: Record<Lang, Locale> = {
  vi,
  en: enUS
};

/**
 * Định dạng `addedAt` (ISO-8601) trên dòng giỏ hàng.
 * Trả "—" nếu chuỗi không hợp lệ.
 */
export function formatCartLineAddedAt(iso: string | undefined, lang: Lang): string {
  if (iso == null || iso.trim() === '') return '—';
  const d = parseISO(iso);
  if (!isValid(d)) return '—';
  return format(d, 'PPp', { locale: localeByLang[lang] });
}
