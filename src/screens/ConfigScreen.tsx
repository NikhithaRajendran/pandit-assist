import React, { useState, useCallback, useMemo, useRef, useLayoutEffect } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useApp } from '../context/AppContext';
import { useLanguage } from '../i18n';
import { useColors } from '../utils/useColors';
import SearchBar from '../components/SearchBar';
import InlineEditRow from '../components/InlineEditRow';
import type { RootStackParamList } from '../../App';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Config'>;

export default function ConfigScreen() {
  const {
    poojas,
    addPooja,
    renamePooja,
    deletePooja,
    getPoojaItemCount,
    showToast,
    refresh,
    reorderPooja,
  } = useApp();
  const { t, getName, language } = useLanguage();
  const navigation = useNavigation<Nav>();
  const colors = useColors();
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [newPoojaName, setNewPoojaName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const isSubmitting = useRef(false);

  useLayoutEffect(() => {
    navigation.setOptions({ title: t('config.title') });
  }, [navigation, t]);

  const filteredPoojas = useMemo(
    () =>
      searchQuery.trim()
        ? poojas.filter((p) => {
            const q = searchQuery.trim().toLowerCase();
            return p.nameEn.toLowerCase().includes(q) ||
              p.nameTa?.toLowerCase().includes(q) ||
              p.nameHi?.toLowerCase().includes(q);
          })
        : poojas,
    [poojas, searchQuery],
  );

  const handleAdd = useCallback(async () => {
    if (isSubmitting.current) return;
    isSubmitting.current = true;
    try {
      const result = await addPooja(newPoojaName);
      if (result.success) {
        setNewPoojaName('');
        showToast(t('config.toastAdded'), 'success');
        Keyboard.dismiss();
      } else if (result.error) {
        showToast(result.error, 'error');
      }
    } finally {
      isSubmitting.current = false;
    }
  },     [addPooja, newPoojaName, showToast, t, language]);

  const handleDragEnd = useCallback(
    ({ from, to }: { from: number; to: number }) => {
      if (from === to) return;
      // Map filtered indices back to original indices
      const origFrom = poojas.findIndex((p) => p.id === filteredPoojas[from].id);
      const origTo = poojas.findIndex((p) => p.id === filteredPoojas[to].id);
      reorderPooja(origFrom, origTo);
    },
    [poojas, filteredPoojas, reorderPooja],
  );

  const handleRename = useCallback(
    async (id: string, name: string): Promise<{ success: boolean; error?: string }> => {
      const result = await renamePooja(id, name, language);
      if (result.success) showToast(t('config.toastRenamed'), 'success');
      return result;
    },
    [renamePooja, showToast, t, language],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      await deletePooja(id);
      showToast(t('config.toastDeleted'), 'info');
    },
    [deletePooja, showToast, t],
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.screen}>
        <View style={styles.addRow}>
          <TextInput
            style={styles.addInput}
            placeholder={t('config.addPoojaPlaceholder')}
            placeholderTextColor={colors.textSecondary}
            value={newPoojaName}
            onChangeText={setNewPoojaName}
            returnKeyType="done"
            onSubmitEditing={handleAdd}
          />
          <TouchableOpacity style={styles.addBtn} onPress={handleAdd} activeOpacity={0.8} accessibilityRole="button" accessibilityLabel={t('config.add')}>
            <Text style={styles.addBtnText}>{t('config.add')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchSection}>
          <SearchBar
            placeholder={t('config.searchPlaceholder')}
            onQueryChange={setSearchQuery}
          />
        </View>

        {!poojas.length && (
          <View style={styles.emptyView}>
            <Ionicons name="list-outline" size={40} color={colors.textSecondary} />
            <Text style={styles.emptyText}>{t('config.emptyTitle')}</Text>
          </View>
        )}

        <DraggableFlatList
          data={filteredPoojas}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          onDragEnd={handleDragEnd}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
          ListEmptyComponent={
            poojas.length > 0 ? (
              <View style={styles.emptyView}>
                <Ionicons name="search-outline" size={40} color={colors.textSecondary} />
                <Text style={styles.emptyText}>{t('config.emptySearch')}</Text>
              </View>
            ) : null
          }
          renderItem={({ item, drag }: RenderItemParams<typeof filteredPoojas[0]>) => (
            <View style={item === undefined ? { opacity: 0 } : undefined}>
              <InlineEditRow
                name={getName(item)}
                editValue={getName(item)}
                onSave={(newName) => handleRename(item.id, newName)}
                onDelete={() => handleDelete(item.id)}
                badge={{ text: `(${getPoojaItemCount(item.id)})` }}
                confirmTitleKey="alert.deletePoojaTitle"
                confirmMessageKey="alert.deletePoojaMessage"
                secondaryAction={{
                  label: t('config.itemsButton'),
                  onPress: () =>
                    navigation.navigate('PoojaItemsConfig', {
                      poojaId: item.id,
                      poojaName: item.nameEn,
                    }),
                }}
                drag={drag}
                t={t}
              />
            </View>
          )}
        />

        <View style={{ height: 40 }} />
      </View>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (c: ReturnType<typeof useColors>) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.background, paddingHorizontal: 16, paddingTop: 16 },
  scrollContent: { paddingBottom: 40 },

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
