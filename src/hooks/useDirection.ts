import { useTranslation } from 'react-i18next';
import { RTL_LANGUAGES } from '@/i18n';

export function useDirection() {
  const { i18n } = useTranslation();
  const isRtl = RTL_LANGUAGES.includes(i18n.language);
  return isRtl ? 'rtl' : 'ltr';
}
