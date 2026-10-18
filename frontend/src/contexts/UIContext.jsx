import React, { useState } from 'react';
import api from '../services/api';
import { UIContext } from './UIContextState';

const STORAGE_LANG_KEY = 'vestige_lang';
const VALID_LANGS = ['en', 'ta', 'te', 'ja'];

export function UIProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    try {
      const cached = localStorage.getItem(STORAGE_LANG_KEY);
      if (cached && VALID_LANGS.includes(cached)) {
        return cached;
      }
    } catch {
      // Ignore localStorage errors
    }
    return 'en';
  });

  const [theme, setTheme] = useState('vintage');

  const setLanguage = (newLang) => {
    if (!VALID_LANGS.includes(newLang)) return;
    setLanguageState(newLang);
    try {
      localStorage.setItem(STORAGE_LANG_KEY, newLang);
    } catch {
      // Ignore localStorage write error
    }

    // If authenticated, asynchronously persist to user profile
    const token = localStorage.getItem('vestige_auth_token');
    if (token) {
      api.patch('/users/me/language', { language: newLang }).catch((err) => {
        console.warn('Could not sync language preference with backend profile:', err?.message || err);
      });
    }
  };

  const syncUserLanguage = (userPreferredLang) => {
    if (userPreferredLang && VALID_LANGS.includes(userPreferredLang) && userPreferredLang !== language) {
      setLanguageState(userPreferredLang);
      try {
        localStorage.setItem(STORAGE_LANG_KEY, userPreferredLang);
      } catch {
        // Ignore
      }
    }
  };

  return (
    <UIContext.Provider value={{ language, setLanguage, syncUserLanguage, theme, setTheme }}>
      {children}
    </UIContext.Provider>
  );
}

export default UIProvider;
