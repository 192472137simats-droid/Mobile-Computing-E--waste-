import { useUI } from '../contexts/useUI';
import { translations } from './translations';

/**
 * Custom translation hook connected to UIContext
 */
export function useTranslation() {
  const { language = 'en', setLanguage } = useUI() || {};

  const t = (key, fallback = '') => {
    const currentDict = translations[language] || translations.en;
    if (currentDict && currentDict[key]) {
      return currentDict[key];
    }
    // Fallback to English
    if (translations.en && translations.en[key]) {
      return translations.en[key];
    }
    return fallback || key;
  };

  return { t, language, setLanguage };
}

export default useTranslation;
