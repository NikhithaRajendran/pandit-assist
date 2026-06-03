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
import { TOAST_DURATION } from '../utils/constants';
import type { Language } from '../i18n/types';

type ToastType = 'success' | 'error' | 'info';

type AppContextType = {
  poojas: Pooja[];
  poojaItems: Record<string, PoojaItem[]>;
  loading: boolean;
  toast: { message: string; type: ToastType } | null;
  showToast: (message: string, type: ToastType) => void;
  addPooja: (name: string) => Promise<{ success: boolean; error?: string }>;
  renamePooja: (id: string, name: string, language: Language) => Promise<{ success: boolean; error?: string }>;
  deletePooja: (id: string) => Promise<{ success: boolean }>;
  addPoojaItem: (poojaId: string, name: string) => Promise<{ success: boolean; error?: string }>;
  renamePoojaItem: (id: string, newName: string, language: Language) => Promise<{ success: boolean; error?: string }>;
  deletePoojaItem: (id: string) => Promise<{ success: boolean }>;
  movePooja: (index: number, direction: 'up' | 'down') => Promise<boolean>;
  movePoojaItem: (poojaId: string, index: number, direction: 'up' | 'down') => Promise<boolean>;
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
    toastTimer.current = setTimeout(() => setToast(null), TOAST_DURATION);
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

  const syncPoojas = useCallback(async (updated: Pooja[]): Promise<boolean> => {
    setPoojas(updated);
    const ok = await savePoojas(updated);
    if (!ok) {
      showToast('Failed to save changes', 'error');
      refresh();
    }
    return ok;
  }, [showToast, refresh]);

  const syncPoojaItems = useCallback(async (updated: Record<string, PoojaItem[]>): Promise<boolean> => {
    setPoojaItems(updated);
    const ok = await savePoojaItems(updated);
    if (!ok) {
      showToast('Failed to save changes', 'error');
      refresh();
    }
    return ok;
  }, [showToast, refresh]);

  const addPooja = useCallback(
    async (name: string): Promise<{ success: boolean; error?: string }> => {
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
      const ok = await syncPoojas([...poojas, newPooja]);
      return { success: ok };
    },
    [poojas, syncPoojas],
  );

  const renamePooja = useCallback(
    async (id: string, name: string, language: Language): Promise<{ success: boolean; error?: string }> => {
      const trimmed = name.trim();
      if (!trimmed) return { success: false, error: 'Name cannot be empty' };

      const duplicate = poojas.some((p) => {
        if (p.id === id) return false;
        if (language === 'ta') return p.nameTa?.toLowerCase() === trimmed.toLowerCase();
        if (language === 'hi') return p.nameHi?.toLowerCase() === trimmed.toLowerCase();
        return p.nameEn.toLowerCase() === trimmed.toLowerCase();
      });
      if (duplicate) return { success: false, error: 'A pooja with this name already exists' };

      const updated = poojas.map((p) => {
        if (p.id !== id) return p;
        if (language === 'ta') return { ...p, nameTa: trimmed };
        if (language === 'hi') return { ...p, nameHi: trimmed };
        return { ...p, nameEn: trimmed };
      });
      const ok = await syncPoojas(updated);
      return { success: ok };
    },
    [poojas, syncPoojas],
  );

  const deletePooja = useCallback(
    async (id: string): Promise<{ success: boolean }> => {
      const filtered = poojas.filter((p) => p.id !== id);
      const { [id]: _removed, ...restItems } = poojaItems;

      setPoojas(filtered);
      setPoojaItems(restItems);

      const [poojaOk, itemsOk] = await Promise.all([
        savePoojas(filtered),
        savePoojaItems(restItems),
      ]);

      if (!poojaOk || !itemsOk) {
        showToast('Failed to save changes', 'error');
        refresh();
        return { success: false };
      }

      return { success: true };
    },
    [poojas, poojaItems, showToast, refresh],
  );

  const addPoojaItem = useCallback(
    async (poojaId: string, name: string): Promise<{ success: boolean; error?: string }> => {
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
      const ok = await syncPoojaItems({
        ...poojaItems,
        [poojaId]: [...existing, newItem],
      });
      return { success: ok };
    },
    [poojaItems, syncPoojaItems],
  );

  const renamePoojaItem = useCallback(
    async (id: string, newName: string, language: Language): Promise<{ success: boolean; error?: string }> => {
      const trimmed = newName.trim();
      if (!trimmed) return { success: false, error: 'Name cannot be empty' };

      let foundPoojaId = '';
      const updated: Record<string, PoojaItem[]> = {};

      for (const [pid, items] of Object.entries(poojaItems)) {
        const targetItem = items.find((i) => i.id === id);
        if (targetItem) {
          foundPoojaId = pid;

          const duplicate = items.some((i) => {
            if (i.id === id) return false;
            if (language === 'ta') return i.nameTa?.toLowerCase() === trimmed.toLowerCase();
            if (language === 'hi') return i.nameHi?.toLowerCase() === trimmed.toLowerCase();
            return i.nameEn.toLowerCase() === trimmed.toLowerCase();
          });
          if (duplicate) {
            return { success: false, error: 'An item with this name already exists' };
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

      const ok = await syncPoojaItems(updated);
      return { success: ok };
    },
    [poojaItems, syncPoojaItems],
  );

  const deletePoojaItem = useCallback(
    async (id: string): Promise<{ success: boolean }> => {
      const updated: Record<string, PoojaItem[]> = {};
      let found = false;
      for (const [pid, items] of Object.entries(poojaItems)) {
        const filtered = items.filter((i) => i.id !== id);
        if (filtered.length !== items.length) found = true;
        updated[pid] = filtered;
      }
      if (!found) return { success: false };

      const ok = await syncPoojaItems(updated);
      return { success: ok };
    },
    [poojaItems, syncPoojaItems],
  );

  const movePooja = useCallback(
    async (index: number, direction: 'up' | 'down'): Promise<boolean> => {
      if (index < 0 || index >= poojas.length) return false;
      if (direction === 'up' && index === 0) return false;
      if (direction === 'down' && index === poojas.length - 1) return false;

      const updated = [...poojas];
      const swapIndex = direction === 'up' ? index - 1 : index + 1;
      [updated[index], updated[swapIndex]] = [updated[swapIndex], updated[index]];
      return syncPoojas(updated);
    },
    [poojas, syncPoojas],
  );

  const movePoojaItem = useCallback(
    async (poojaId: string, index: number, direction: 'up' | 'down'): Promise<boolean> => {
      const items = poojaItems[poojaId] || [];
      if (index < 0 || index >= items.length) return false;
      if (direction === 'up' && index === 0) return false;
      if (direction === 'down' && index === items.length - 1) return false;

      const updatedItems = [...items];
      const swapIndex = direction === 'up' ? index - 1 : index + 1;
      [updatedItems[index], updatedItems[swapIndex]] = [updatedItems[swapIndex], updatedItems[index]];
      return syncPoojaItems({ ...poojaItems, [poojaId]: updatedItems });
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
        movePooja,
        movePoojaItem,
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
