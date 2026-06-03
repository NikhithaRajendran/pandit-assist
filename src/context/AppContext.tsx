import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { Pooja, PoojaItem } from '../types';
import {
  loadPoojas,
  savePoojas,
  loadPoojaItems,
  savePoojaItems,
  seedIfEmpty,
} from '../utils/storage';
import { generateId } from '../utils/id';
import { getNamesForEdit, getItemNames } from '../utils/nameUtils';
import type { Language } from '../i18n/types';

type ToastType = 'success' | 'error' | 'info';

type AppContextType = {
  poojas: Pooja[];
  poojaItems: Record<string, PoojaItem[]>;
  loading: boolean;
  toast: { message: string; type: ToastType } | null;
  showToast: (message: string, type: ToastType) => void;
  addPooja: (name: string, language: Language) => { success: boolean; error?: string };
  renamePooja: (id: string, name: string, language: Language) => { success: boolean; error?: string };
  deletePooja: (id: string) => void;
  addPoojaItem: (poojaId: string, name: string, language: Language) => { success: boolean; error?: string };
  renamePoojaItem: (id: string, newName: string, language: Language) => { success: boolean; error?: string };
  deletePoojaItem: (id: string) => void;
  getPoojaItems: (poojaId: string) => PoojaItem[];
  getPoojaItemCount: (poojaId: string) => number;
  refresh: () => Promise<void>;
};

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [poojas, setPoojas] = useState<Pooja[]>([]);
  const [poojaItems, setPoojaItems] = useState<Record<string, PoojaItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string, type: ToastType) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, type });
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  }, []);

  const refresh = useCallback(async () => {
    const p = await loadPoojas();
    const pi = await loadPoojaItems();
    setPoojas(p);
    setPoojaItems(pi);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const { poojas: seededPoojas, poojaItems: seededItems } = await seedIfEmpty();
        setPoojas(seededPoojas);
        setPoojaItems(seededItems);
      } catch {
        showToast('Failed to load data', 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, [showToast]);

  const syncPoojas = useCallback(async (updated: Pooja[]) => {
    setPoojas(updated);
    await savePoojas(updated);
  }, []);

  const syncPoojaItems = useCallback(async (updated: Record<string, PoojaItem[]>) => {
    setPoojaItems(updated);
    await savePoojaItems(updated);
  }, []);

  const addPooja = useCallback(
    (name: string, _language: Language): { success: boolean; error?: string } => {
      const trimmed = name.trim();
      if (!trimmed) return { success: false, error: 'Please enter a pooja name' };

      const names = getNamesForEdit(trimmed);
      const exists = poojas.some((p) => p.nameEn.toLowerCase() === names.nameEn.toLowerCase());
      if (exists) return { success: false, error: 'Pooja already exists' };

      const newPooja: Pooja = {
        id: generateId(),
        nameEn: names.nameEn,
        nameTa: names.nameTa,
        nameHi: names.nameHi,
      };
      syncPoojas([...poojas, newPooja]);
      return { success: true };
    },
    [poojas, syncPoojas],
  );

  const renamePooja = useCallback(
    (id: string, name: string, language: Language): { success: boolean; error?: string } => {
      const trimmed = name.trim();
      if (!trimmed) return { success: false, error: 'Name cannot be empty' };

      if (language === 'en') {
        const duplicate = poojas.some(
          (p) => p.id !== id && p.nameEn.toLowerCase() === trimmed.toLowerCase(),
        );
        if (duplicate) return { success: false, error: 'A pooja with this name already exists' };
      }

      const updated = poojas.map((p) => {
        if (p.id !== id) return p;
        if (language === 'ta') return { ...p, nameTa: trimmed };
        if (language === 'hi') return { ...p, nameHi: trimmed };
        return { ...p, nameEn: trimmed };
      });
      syncPoojas(updated);
      return { success: true };
    },
    [poojas, syncPoojas],
  );

  const deletePooja = useCallback(
    (id: string) => {
      const filtered = poojas.filter((p) => p.id !== id);
      syncPoojas(filtered);

      const { [id]: _, ...rest } = poojaItems;
      syncPoojaItems(rest);
    },
    [poojas, poojaItems, syncPoojas, syncPoojaItems],
  );

  const addPoojaItem = useCallback(
    (poojaId: string, name: string, _language: Language): { success: boolean; error?: string } => {
      const trimmed = name.trim();
      if (!trimmed) return { success: false, error: 'Please enter an item name' };

      const names = getItemNames(trimmed);
      const existing = poojaItems[poojaId] || [];
      const duplicate = existing.some(
        (i) => i.nameEn.toLowerCase() === names.nameEn.toLowerCase(),
      );
      if (duplicate) return { success: false, error: 'Item already exists in this pooja' };

      const newItem: PoojaItem = {
        id: generateId(),
        poojaId,
        nameEn: names.nameEn,
        nameTa: names.nameTa,
        nameHi: names.nameHi,
      };
      syncPoojaItems({
        ...poojaItems,
        [poojaId]: [...existing, newItem],
      });
      return { success: true };
    },
    [poojaItems, syncPoojaItems],
  );

  const renamePoojaItem = useCallback(
    (id: string, newName: string, language: Language): { success: boolean; error?: string } => {
      const trimmed = newName.trim();
      if (!trimmed) return { success: false, error: 'Name cannot be empty' };

      let foundPoojaId = '';
      const updated: Record<string, PoojaItem[]> = {};

      for (const [pid, items] of Object.entries(poojaItems)) {
        const targetItem = items.find((i) => i.id === id);
        if (targetItem) {
          foundPoojaId = pid;
          if (language === 'en') {
            const duplicate = items.some(
              (i) => i.id !== id && i.nameEn.toLowerCase() === trimmed.toLowerCase(),
            );
            if (duplicate) {
              return { success: false, error: 'An item with this name already exists' };
            }
          }
          updated[pid] = items.map((i) => {
            if (i.id !== id) return i;
            if (language === 'ta') return { ...i, nameTa: trimmed };
            if (language === 'hi') return { ...i, nameHi: trimmed };
            return { ...i, nameEn: trimmed };
          });
        } else {
          updated[pid] = items;
        }
      }

      if (!foundPoojaId) return { success: false, error: 'Item not found' };

      syncPoojaItems(updated);
      return { success: true };
    },
    [poojaItems, syncPoojaItems],
  );

  const deletePoojaItem = useCallback(
    (id: string) => {
      const updated: Record<string, PoojaItem[]> = {};
      for (const [pid, items] of Object.entries(poojaItems)) {
        updated[pid] = items.filter((i) => i.id !== id);
      }
      syncPoojaItems(updated);
    },
    [poojaItems, syncPoojaItems],
  );

  const getPoojaItems = useCallback(
    (poojaId: string): PoojaItem[] => {
      return poojaItems[poojaId] || [];
    },
    [poojaItems],
  );

  const getPoojaItemCount = useCallback(
    (poojaId: string): number => {
      return (poojaItems[poojaId] || []).length;
    },
    [poojaItems],
  );

  return (
    <AppContext.Provider
      value={{
        poojas,
        poojaItems,
        loading,
        toast,
        showToast,
        addPooja,
        renamePooja,
        deletePooja,
        addPoojaItem,
        renamePoojaItem,
        deletePoojaItem,
        getPoojaItems,
        getPoojaItemCount,
        refresh,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
