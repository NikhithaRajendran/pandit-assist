import { seedNameTranslations } from '../i18n/seedNames';
import { termDictionary } from '../i18n/termDictionary';
import Sanscript from '@indic-transliteration/sanscript';

const reverseLookup: Record<string, string> = {};

const seedNameLower: Record<string, string> = {};
for (const key of Object.keys(seedNameTranslations)) {
  seedNameLower[key.toLowerCase()] = key;
}

const termDictLower: Record<string, { ta: string; hi: string }> = {};
for (const [key, val] of Object.entries(termDictionary)) {
  termDictLower[key.toLowerCase()] = val;
}
for (const [en, { ta, hi }] of Object.entries(seedNameTranslations)) {
  for (const variant of ta.split(' / ')) {
    reverseLookup[variant.trim()] = en;
  }
  for (const variant of hi.split(' / ')) {
    reverseLookup[variant.trim()] = en;
  }
}

function hasTamil(text: string): boolean {
  return /[\u0B80-\u0BFF]/.test(text);
}

function hasDevanagari(text: string): boolean {
  return /[\u0900-\u097F]/.test(text);
}

function transliterate(text: string, to: 'tamil' | 'devanagari' | 'itrans'): string {
  try {
    const from = hasDevanagari(text) ? 'devanagari' : hasTamil(text) ? 'tamil' : 'itrans';
    return Sanscript.t(text, from, to);
  } catch {
    return text;
  }
}

function findPrefixKey(trimmed: string): { key: string; suffix: string } | null {
  if (seedNameTranslations[trimmed]) return { key: trimmed, suffix: '' };
  if (reverseLookup[trimmed]) return { key: reverseLookup[trimmed], suffix: '' };

  const sortedKeys = [...Object.keys(seedNameTranslations)].sort((a, b) => b.length - a.length);
  for (const key of sortedKeys) {
    if (trimmed.startsWith(key)) {
      const suffix = trimmed.slice(key.length).trim();
      return { key, suffix };
    }
  }

  const sortedReverse = [...Object.entries(reverseLookup)].sort(
    ([a], [b]) => b.length - a.length,
  );
  for (const [translated, enKey] of sortedReverse) {
    if (trimmed.startsWith(translated)) {
      const suffix = trimmed.slice(translated.length).trim();
      return { key: enKey, suffix };
    }
  }

  return null;
}

export function getNamesForEdit(trimmed: string): {
  nameEn: string;
  nameTa?: string;
  nameHi?: string;
} {
  const input = trimmed.trim();
  if (!input) return { nameEn: '' };

  const match = findPrefixKey(input);
  if (!match) {
    const isNonLatin = hasDevanagari(input) || hasTamil(input);
    return {
      nameEn: isNonLatin ? transliterate(input, 'itrans') : input,
      nameTa: transliterate(input, 'tamil'),
      nameHi: transliterate(input, 'devanagari'),
    };
  }

  const { key, suffix } = match;
  const entry = seedNameTranslations[key];

  if (!suffix) {
    return { nameEn: key, nameTa: entry.ta, nameHi: entry.hi };
  }

  const suffixLower = suffix.toLowerCase();
  const suffixDict = termDictLower[suffixLower];

  const suffixTa = suffixDict ? suffixDict.ta : transliterate(suffix, 'tamil');
  const suffixHi = suffixDict ? suffixDict.hi : transliterate(suffix, 'devanagari');
  const suffixEn = suffixDict ? suffix : transliterate(suffix, 'itrans');

  return {
    nameEn: suffixEn !== suffix ? `${key} ${suffixEn}` : `${key} ${suffix}`,
    nameTa: `${entry.ta} ${suffixTa}`,
    nameHi: `${entry.hi} ${suffixHi}`,
  };
}

function translateToken(token: string): { ta: string; hi: string } | null {
  const lower = token.toLowerCase();
  const seedKey = seedNameLower[lower];
  if (seedKey) {
    const entry = seedNameTranslations[seedKey];
    return { ta: entry.ta, hi: entry.hi };
  }
  const dictEntry = termDictLower[lower];
  if (dictEntry) return dictEntry;
  return null;
}

export function getItemNames(input: string): {
  nameEn: string;
  nameTa?: string;
  nameHi?: string;
} {
  const trimmed = input.trim();
  if (!trimmed) return { nameEn: '' };

  const exactSeed = seedNameTranslations[trimmed];
  if (exactSeed) return { nameEn: trimmed, nameTa: exactSeed.ta, nameHi: exactSeed.hi };

  const reverseKey = reverseLookup[trimmed];
  if (reverseKey) {
    const entry = seedNameTranslations[reverseKey];
    return { nameEn: reverseKey, nameTa: entry.ta, nameHi: entry.hi };
  }

  const tokens = trimmed.split(/\s+/);
  const taParts: string[] = [];
  const hiParts: string[] = [];
  let foundTranslation = false;

  for (const token of tokens) {
    const translation = translateToken(token);
    if (translation) {
      taParts.push(translation.ta);
      hiParts.push(translation.hi);
      foundTranslation = true;
    } else {
      taParts.push(token);
      hiParts.push(token);
    }
  }

  return {
    nameEn: trimmed,
    ...(foundTranslation ? { nameTa: taParts.join(' '), nameHi: hiParts.join(' ') } : {}),
  };
}
