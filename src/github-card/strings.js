import { TRANSLATIONS } from "./i18n/translations.js";
import { KEYS } from "./core.js";

export const STRINGS = Object.fromEntries(
  Object.entries(TRANSLATIONS).map(([l, list]) => [l, Object.fromEntries(KEYS.map((k, i) => [k, list[i]]))])
);

export const LANGUAGES = [
  ["en", "English"], ["fr", "Français"], ["de", "Deutsch"], ["es", "Español"], ["sr", "Српски"], ["sr-Latn", "Srpski (latinica)"],
  ["it", "Italiano"], ["nl", "Nederlands"], ["pt", "Português (Portugal)"], ["pl", "Polski"], ["ro", "Română"], ["da", "Dansk"],
  ["sv", "Svenska"], ["bg", "Български"], ["ru", "Русский"], ["uk", "Українська"], ["hu", "Magyar"], ["sk", "Slovenčina"],
  ["cs", "Čeština"], ["sl", "Slovenščina"], ["lv", "Latviešu"], ["el", "Ελληνικά"],
];
