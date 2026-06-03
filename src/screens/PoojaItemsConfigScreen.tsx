import React, { useState, useCallback, useMemo, useRef, useLayoutEffect } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';

import { useApp } from '../context/AppContext';
import { useLanguage } from '../i18n';
import { useColors } from '../utils/useColors';
import SearchBar from '../components/SearchBar';
import InlineEditRow from '../components/InlineEditRow';
import type { RootStackParamList } from '../../App';

type Route = RouteProp<RootStackParamList, 'PoojaItemsConfig'>;
type Nav = NativeStackNavigationProp<RootStackParamList, 'PoojaItemsConfig'>;

export default function PoojaItemsConfigScreen() {
  const { addPoojaItem, renamePoojaItem, deletePoojaItem, getPoojaItems, showToast, poojas, refresh, movePoojaItem } =
    useApp();
  const { t, getName, language } = useLanguage();
  const route = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const { poojaId } = route.params;
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const pooja = useMemo(() => poojas.find((p) => p.id === poojaId), [poojas, poojaId]);

  const [newItemName, setNewItemName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const isSubmitting = useRef(false);

  useLayoutEffect(() => {
    navigation.setOptions({ title: t('itemsConfig.title', { name: pooja ? getName(pooja) : '' }) });
  }, [navigation, t, language, pooja, getName]);

  const items = useMemo(() => getPoojaItems(poojaId), [poojaId, getPoojaItems]);

  const filteredItems = useMemo(
    () =>
      searchQuery.trim()
        ? items.filter((i) => {
            const q = searchQuery.trim().toLowerCase();
            return i.nameEn.toLowerCase().includes(q) ||
              i.nameTa?.toLowerCase().includes(q) ||
              i.nameHi?.toLowerCase().includes(q);
          })
        : items,
    [items, searchQuery],
  );

  const handleAdd = useCallback(async () => {
    if (isSubmitting.current) return;
    isSubmitting.current = true;
    try {
      const result = await addPoojaItem(poojaId, newItemName);
      if (result.success) {
        setNewItemName('');
        showToast(t('itemsConfig.toastAdded'), 'success');
        Keyboard.dismiss();
      } else if (result.error) {
        showToast(result.error, 'error');
      }
    } finally {
      isSubmitting.current = false;
    }
  }, [addPoojaItem, poojaId, newItemName, showToast, t, language]);

  const handleRename = useCallback(
    async (id: string, name: string): Promise<{ success: boolean; error?: string }> => {
      const result = await renamePoojaItem(id, name, language);
      if (result.success) showToast(t('itemsConfig.toastRenamed'), 'success');
      return result;
    },
    [renamePoojaItem, showToast, t, language],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      await deletePoojaItem(id);
      showToast(t('itemsConfig.toastDeleted'), 'info');
    },
    [deletePoojaItem, showToast, t],
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View style={styles.addRow}>
          <TextInput
            style={styles.addInput}
            placeholder={t('itemsConfig.addItemPlaceholder')}
            placeholderTextColor={colors.textSecondary}
            value={newItemName}
            onChangeText={setNewItemName}
            returnKeyType="done"
            onSubmitEditing={handleAdd}
          />
          <TouchableOpacity style={styles.addBtn} onPress={handleAdd} activeOpacity={0.8} accessibilityRole="button" accessibilityLabel={t('itemsConfig.add')}>
            <Text style={styles.addBtnText}>{t('itemsConfig.add')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchSection}>
          <SearchBar
            placeholder={t('itemsConfig.searchPlaceholder')}
            onQueryChange={setSearchQuery}
          />
        </View>

        {!items.length && (
          <View style={styles.emptyView}>
            <Ionicons name="cube-outline" size={40} color={colors.textSecondary} />
            <Text style={styles.emptyText}>{t('itemsConfig.emptyTitle')}</Text>
          </View>
        )}

        {filteredItems.length === 0 && items.length > 0 && (
          <View style={styles.emptyView}>
            <Ionicons name="search-outline" size={40} color={colors.textSecondary} />
            <Text style={styles.emptyText}>{t('itemsConfig.emptySearch')}</Text>
          </View>
        )}

        {filteredItems.map((item, _filteredIdx) => {
          const origIdx = items.findIndex((i) => i.id === item.id);
          return (
            <InlineEditRow
              key={item.id}
              name={getName(item)}
              editValue={getName(item)}
              onSave={(newName) => handleRename(item.id, newName)}
              onDelete={() => handleDelete(item.id)}
              onMoveUp={origIdx > 0 ? () => movePoojaItem(poojaId, origIdx, 'up') : undefined}
              onMoveDown={origIdx < items.length - 1 ? () => movePoojaItem(poojaId, origIdx, 'down') : undefined}
              t={t}
            />
          );
        })}

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (c: ReturnType<typeof useColors>) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.background },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16 },

  addRow: { flexDirection: 'row', gap: 10 },
  addInput: {
    flex: 1,
    backgroundColor: c.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: c.border,
    paddingHorizontal: 12,
    height: 48,
    fontSize: 16,
    color: c.text,
  },
  addBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.primary,
    borderRadius: 8,
    paddingHorizontal: 20,
  },
  addBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  searchSection: { marginTop: 16, marginBottom: 12 },

  emptyView: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: {
    textAlign: 'center',
    color: c.textSecondary,
    fontSize: 14,
  },
});
