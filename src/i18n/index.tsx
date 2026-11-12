import { Segmented } from 'antd';
import type { Locale } from 'antd/es/locale';
import enUS from 'antd/locale/en_US';
import dayjs from 'dayjs';
import 'dayjs/locale/te';
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import * as auth from './auth';
import * as common from './common';
import * as health from './health';
import * as people from './people';
import * as reports from './reports';
import * as trade from './trade';

/**
 * Every user-facing string of the admin console, in English and Telugu, on the
 * platform portal's pattern. One file per area, each exporting `en` and a `te`
 * typed `typeof en`, so a key missing from Telugu — or a function taking
 * different arguments — fails `tsc` rather than showing English.
 *
 * Keys are prefixed by area (`org…`, `user…`, `vet…`, `dis…`, `rate…`,
 * `order…`, `audit…`, `rep…`, `auth…`, `pw…`, `fp…`) so the spreads below cannot shadow one another.
 */
const EN = { ...common.en, ...auth.en, ...people.en, ...health.en, ...trade.en, ...reports.en };
const TE: typeof EN = { ...common.te, ...auth.te, ...people.te, ...health.te, ...trade.te, ...reports.te };

export type Strings = typeof EN;
export type Lang = 'en' | 'te';

const KEY = 'kukku_lang';

function initialLang(): Lang {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === 'en' || saved === 'te') return saved;
  } catch {
    // Storage blocked: fall through to the browser's own preference.
  }
  return typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('te') ? 'te' : 'en';
}

/**
 * AntD ships no Telugu locale, so its own furniture — dialog buttons, empty
 * tables, pagination, date pickers — is translated here from the English one.
 */
const teAntd: Locale = {
  ...enUS,
  locale: 'te',
  Modal: { okText: 'సరే', cancelText: 'రద్దు', justOkText: 'సరే' },
  Popconfirm: { okText: 'సరే', cancelText: 'రద్దు' },
  Empty: { description: 'ఇంకా ఏమీ లేదు' },
  Table: {
    ...enUS.Table,
    filterConfirm: 'సరే',
    filterReset: 'రీసెట్',
    filterEmptyText: 'ఫిల్టర్లు లేవు',
    emptyText: 'ఇంకా ఏమీ లేదు',
    selectAll: 'అన్నీ ఎంచుకోండి',
    selectInvert: 'ఎంపిక తిప్పండి',
    sortTitle: 'క్రమం',
    expand: 'వివరాలు చూపండి',
    collapse: 'వివరాలు దాచండి',
    triggerDesc: 'తగ్గే క్రమంలో',
    triggerAsc: 'పెరిగే క్రమంలో',
    cancelSort: 'క్రమం తీసివేయండి',
  },
  Pagination: {
    ...enUS.Pagination,
    items_per_page: '/ పేజీ',
    jump_to: 'వెళ్ళండి',
    page: 'పేజీ',
    prev_page: 'మునుపటి పేజీ',
    next_page: 'తదుపరి పేజీ',
  },
  DatePicker: enUS.DatePicker && {
    ...enUS.DatePicker,
    lang: {
      ...enUS.DatePicker.lang,
      today: 'ఈ రోజు',
      now: 'ఇప్పుడు',
      ok: 'సరే',
      placeholder: 'తేదీ ఎంచుకోండి',
      rangePlaceholder: ['మొదటి తేదీ', 'చివరి తేదీ'],
    },
  },
  Form: enUS.Form && { ...enUS.Form, optional: '(ఐచ్ఛికం)' },
  Text: { edit: 'మార్చండి', copy: 'కాపీ', copied: 'కాపీ అయింది', expand: 'ఇంకా' },
};

interface LangState {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Strings;
  antd: Locale;
}

const LangContext = createContext<LangState>({ lang: 'en', setLang: () => {}, t: EN, antd: enUS });

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  const value = useMemo<LangState>(() => {
    // Set before children render, not in an effect after, so the first paint
    // in a language already has its month names.
    document.documentElement.lang = lang;
    dayjs.locale(lang === 'te' ? 'te' : 'en');
    return {
      lang,
      setLang: (l) => {
        setLangState(l);
        try {
          localStorage.setItem(KEY, l);
        } catch {
          // Remembering it is a convenience; this tab still switches.
        }
      },
      t: lang === 'te' ? TE : EN,
      antd: lang === 'te' ? teAntd : enUS,
    };
  }, [lang]);

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

/** The strings for the current language. */
export const useT = (): Strings => useContext(LangContext).t;
export const useLang = () => useContext(LangContext);

/** An API enum value's label, or the value itself when no label exists yet. */
export function label(map: Record<string, string>, value: string): string {
  return map[value] ?? value;
}

/** English / తెలుగు, each label in its own script so either reader can find it. */
export function LangSwitch({ size = 'small' }: { size?: 'small' | 'middle' | 'large' }) {
  const { lang, setLang, t } = useLang();
  return (
    <Segmented
      size={size}
      aria-label={t.language}
      value={lang}
      onChange={(v) => setLang(v as Lang)}
      options={[
        { label: 'English', value: 'en' },
        { label: 'తెలుగు', value: 'te' },
      ]}
    />
  );
}
