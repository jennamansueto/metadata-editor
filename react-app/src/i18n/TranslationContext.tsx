import { createContext, useContext, type ReactNode } from 'react';

type Translations = Record<string, string>;

const TranslationContext = createContext<Translations>({});

export function TranslationProvider({
  translations,
  children,
}: {
  translations: Translations;
  children: ReactNode;
}) {
  return (
    <TranslationContext.Provider value={translations}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation() {
  const translations = useContext(TranslationContext);

  function t(key: string, params?: Record<string, string>): string {
    let value = translations[key] || key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        value = value.replace(`{${k}}`, v);
        value = value.replace(`%{${k}}`, v);
      });
    }
    return value;
  }

  return { t };
}
