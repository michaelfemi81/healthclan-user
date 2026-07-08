import { DEFAULT_LOCALE, translate } from '.';
import { useStorageState } from '../constants/useStorageState';

export function useTranslation() {
    const [[, savedLocale]] = useStorageState('locale');
    const locale = savedLocale || DEFAULT_LOCALE;

    return {
        locale,
        t: (message: string) => translate(message, locale),
    };
}
