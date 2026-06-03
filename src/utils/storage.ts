import AsyncStorage from '@react-native-async-storage/async-storage';
import { Pooja, PoojaItem } from '../types';
import { STORAGE_KEYS, SEED_POOJAS } from './constants';
import { generateId } from './id';
import { seedNameTranslations } from '../i18n/seedNames';
import type { Language } from '../i18n/types';

export async function loadPoojas(): Promise<Pooja[]> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEYS.poojas);
    if (json) {
      const parsed = JSON.parse(json);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return [];
}

export async function savePoojas(items: Pooja[]): Promise<boolean> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.poojas, JSON.stringify(items));
    return true;
  } catch {
    return false;
  }
}

export async function loadPoojaItems(): Promise<Record<string, PoojaItem[]>> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEYS.poojaItems);
    if (json) {
      const parsed = JSON.parse(json);
      if (typeof parsed === 'object' && parsed !== null) return parsed;
    }
  } catch {}
  return {};
}

export async function savePoojaItems(
  items: Record<string, PoojaItem[]>,
): Promise<boolean> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.poojaItems, JSON.stringify(items));
    return true;
  } catch {
    return false;
  }
}

export async function seedIfEmpty(): Promise<{
  poojas: Pooja[];
  poojaItems: Record<string, PoojaItem[]>;
}> {
  try {
    const seeded = await AsyncStorage.getItem(STORAGE_KEYS.seeded);
    const existingPoojas = await loadPoojas();
    const existingItems = await loadPoojaItems();

    if (seeded === 'true' && existingPoojas.length > 0) {
      return { poojas: existingPoojas, poojaItems: existingItems };
    }

    const poojas: Pooja[] = [];
    const poojaItems: Record<string, PoojaItem[]> = {};

    for (const seed of SEED_POOJAS) {
      const poojaId = generateId();
      const pEntry = seedNameTranslations[seed.name];
      poojas.push({
        id: poojaId,
        nameEn: seed.name,
        nameTa: pEntry?.ta,
        nameHi: pEntry?.hi,
      });
      poojaItems[poojaId] = seed.items.map((name) => {
        const iEntry = seedNameTranslations[name];
        return {
          id: generateId(),
          poojaId,
          nameEn: name,
          nameTa: iEntry?.ta,
          nameHi: iEntry?.hi,
        };
      });
    }

    await savePoojas(poojas);
    await savePoojaItems(poojaItems);
    await AsyncStorage.setItem(STORAGE_KEYS.seeded, 'true');

    return { poojas, poojaItems };
  } catch {
    return { poojas: [], poojaItems: {} };
  }
}

export async function loadLastGreeting(): Promise<string> {
  try {
    const val = await AsyncStorage.getItem(STORAGE_KEYS.lastGreeting);
    return val || 'Pranam';
  } catch {
    return 'Pranam';
  }
}

export async function saveLastGreeting(greeting: string): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.lastGreeting, greeting);
  } catch {}
}

export async function loadLanguage(): Promise<Language | null> {
  try {
    const val = await AsyncStorage.getItem(STORAGE_KEYS.language);
    if (val === 'en' || val === 'ta' || val === 'hi') return val;
  } catch {}
  return null;
}

export async function saveLanguage(lang: Language): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.language, lang);
  } catch {}
}
