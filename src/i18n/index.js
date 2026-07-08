import english from './en';
import french from './fr';
import spanish from './es';
import italian from './it';
import yoruba from './yo';
import hausa from './ha';
import igbo from './ig';
import extra from './extra';

export const DEFAULT_LOCALE = 'en';

export const Languages = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'French' },
  { code: 'es', label: 'Spanish' },
  { code: 'it', label: 'Italian' },
  { code: 'yo', label: 'Yoruba' },
  { code: 'ha', label: 'Hausa' },
  { code: 'ig', label: 'Igbo' },
];

export const Translations = {
  en: english,
  fr: french,
  es: spanish,
  it: italian,
  yo: yoruba,
  ha: hausa,
  ig: igbo,
};

export function translate(message, locale = DEFAULT_LOCALE) {
  // We're actually asking for 'something' to be translated
  if (message) {
    // The translation exists AND the message exists in this translation
    if (Translations[locale] && Translations[locale][message]) {
      return Translations[locale][message];

    } else if (extra[locale] && extra[locale][message]) {
      return extra[locale][message];

    // Otherwise try in the default translation
    } else if (Translations[DEFAULT_LOCALE] && Translations[DEFAULT_LOCALE][message]) {
      return Translations[DEFAULT_LOCALE][message];
    }
  }

  return message;
}
