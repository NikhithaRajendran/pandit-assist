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
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useApp } from '../context/AppContext';
import { useLanguage } from '../i18n';
import { COLORS } from '../utils/constants';
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
  } = useApp();
  const { t, getName, language } = useLanguage();
  const navigation = useNavigation<Nav>();

  const [newPoojaName, setNewPoojaName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const isSubmitting = useRef(false);

  useLayoutEffect(() => {
    navigation.setOptions({ title: t('config.title') });
  }, [navigation, t]);

  const filteredPoojas = useMemo(
    () =>
      searchQuery.trim()
        ? poojas.filter((p) =>
            p.nameEn.toLowerCase().includes(searchQuery.toLowerCase()),
          )
        : poojas,
    [poojas, searchQuery],
  );

  const handleAdd = useCallback(() => {
    if (isSubmitting.current) return;
    isSubmitting.current = true;

    const result = addPooja(newPoojaName, language);
    if (result.success) {
      setNewPoojaName('');
      showToast(t('config.toastAdded'), 'success');
      Keyboard.dismiss();
    } else if (result.error) {
      showToast(result.error, 'error');
    }

    setTimeout(() => { isSubmitting.current = false; }, 300);
  }, [addPooja, newPoojaName, showToast, t, language]);

  const handleRename = useCallback(
    (id: string, name: string) => {
      const result = renamePooja(id, name, language);
      if (result.success) showToast(t('config.toastRenamed'), 'success');
      return result;
    },
    [renamePooja, showToast, t, language],
  );

  const handleDelete = useCallback(
    (id: string) => {
      deletePooja(id);
      showToast(t('config.toastDeleted'), 'info');
    },
    [deletePooja, showToast, t],
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
            placeholder={t('config.addPoojaPlaceholder')}
            placeholderTextColor={COLORS.textSecondary}
            value={newPoojaName}
            onChangeText={setNewPoojaName}
            returnKeyType="done"
            onSubmitEditing={handleAdd}
          />
          <TouchableOpacity style={styles.addBtn} onPress={handleAdd} activeOpacity={0.8}>
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
          <Text style={styles.emptyText}>{t('config.emptyTitle')}</Text>
        )}

        {filteredPoojas.length === 0 && poojas.length > 0 && (
          <Text style={styles.emptyText}>{t('config.emptySearch')}</Text>
        )}

        {filteredPoojas.map((pooja) => (
          <InlineEditRow
            key={pooja.id}
            name={getName(pooja)}
            editValue={getName(pooja)}
            onSave={(newName) => handleRename(pooja.id, newName)}
            onDelete={() => handleDelete(pooja.id)}
            badge={{ text: `(${getPoojaItemCount(pooja.id)})` }}
            secondaryAction={{
              label: t('config.itemsButton'),
              onPress: () =>
                navigation.navigate('PoojaItemsConfig', {
                  poojaId: pooja.id,
                  poojaName: pooja.nameEn,
                }),
            }}
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
