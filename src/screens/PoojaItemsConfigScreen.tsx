import React, { useState, useCallback, useMemo, useRef, useLayoutEffect } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';

import { useApp } from '../context/AppContext';
import { useLanguage } from '../i18n';
import { COLORS } from '../utils/constants';
import SearchBar from '../components/SearchBar';
import InlineEditRow from '../components/InlineEditRow';
import type { RootStackParamList } from '../../App';

type Route = RouteProp<RootStackParamList, 'PoojaItemsConfig'>;

export default function PoojaItemsConfigScreen() {
  const { addPoojaItem, renamePoojaItem, deletePoojaItem, getPoojaItems, showToast, poojas } =
    useApp();
  const { t, getName, language } = useLanguage();
  const route = useRoute<Route>();
  const navigation = useNavigation<any>();
  const { poojaId } = route.params;

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
        ? items.filter((i) =>
            i.nameEn.toLowerCase().includes(searchQuery.toLowerCase()),
          )
        : items,
    [items, searchQuery],
  );

  const handleAdd = useCallback(() => {
    if (isSubmitting.current) return;
    isSubmitting.current = true;

    const result = addPoojaItem(poojaId, newItemName, language);
    if (result.success) {
      setNewItemName('');
      showToast(t('itemsConfig.toastAdded'), 'success');
      Keyboard.dismiss();
    } else if (result.error) {
      showToast(result.error, 'error');
    }

    setTimeout(() => { isSubmitting.current = false; }, 300);
  }, [addPoojaItem, poojaId, newItemName, showToast, t, language]);

  const handleRename = useCallback(
    (id: string, name: string) => {
      const result = renamePoojaItem(id, name, language);
      if (result.success) showToast(t('itemsConfig.toastRenamed'), 'success');
      return result;
    },
    [renamePoojaItem, showToast, t, language],
  );

  const handleDelete = useCallback(
    (id: string) => {
      deletePoojaItem(id);
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
      >
        <View style={styles.addRow}>
          <TextInput
            style={styles.addInput}
            placeholder={t('itemsConfig.addItemPlaceholder')}
            placeholderTextColor={COLORS.textSecondary}
            value={newItemName}
            onChangeText={setNewItemName}
            returnKeyType="done"
            onSubmitEditing={handleAdd}
          />
          <TouchableOpacity style={styles.addBtn} onPress={handleAdd} activeOpacity={0.8}>
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
          <Text style={styles.emptyText}>{t('itemsConfig.emptyTitle')}</Text>
        )}

        {filteredItems.length === 0 && items.length > 0 && (
          <Text style={styles.emptyText}>{t('itemsConfig.emptySearch')}</Text>
        )}

        {filteredItems.map((item) => (
          <InlineEditRow
            key={item.id}
            name={getName(item)}
            editValue={getName(item)}
            onSave={(newName) => handleRename(item.id, newName)}
            onDelete={() => handleDelete(item.id)}
          />
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16 },

  addRow: { flexDirection: 'row', gap: 10 },
  addInput: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    height: 48,
    fontSize: 16,
    color: COLORS.text,
  },
  addBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingHorizontal: 20,
  },
  addBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  searchSection: { marginTop: 16, marginBottom: 12 },

  emptyText: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: 32,
  },
});
