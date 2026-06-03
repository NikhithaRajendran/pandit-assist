import React, { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useApp } from '../context/AppContext';
import { useLanguage } from '../i18n';
import { useColors } from '../utils/useColors';
import type { RootStackParamList } from '../../App';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export default function HomeScreen() {
  const { poojas, getPoojaItemCount, refresh } = useApp();
  const { t, getName, language } = useLanguage();
  const navigation = useNavigation<Nav>();
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: t('app.name'),
      headerRight: () => (
        <TouchableOpacity
              onPress={() => navigation.navigate('Settings')}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel={t('common.settings')}
        >
          <Ionicons name="settings-outline" size={24} color="#fff" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, t, language]);

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <FlatList
        data={poojas}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="list-outline" size={48} color={colors.textSecondary} />
            <Text style={styles.emptyTitle}>{t('home.emptyTitle')}</Text>
            <Text style={styles.emptySubtitle}>{t('home.emptySubtitle')}</Text>
            <TouchableOpacity
              style={styles.settingsBtn}
          onPress={() => navigation.navigate('Settings')}
              accessibilityRole="button"
              accessibilityLabel={t('home.openSettings')}
            >
              <Ionicons name="settings-outline" size={16} color="#fff" />
              <Text style={styles.settingsBtnLabel}>{t('home.openSettings')}</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.7}
            onPress={() =>
              navigation.navigate('PoojaDetail', {
                poojaId: item.id,
                poojaName: item.nameEn,
              })
            }
            accessibilityRole="button"
            accessibilityLabel={getName(item)}
          >
            <View style={styles.cardLeft}>
              <Text style={styles.cardIcon}>🪔</Text>
              <View>
                <Text style={styles.cardName}>{getName(item)}</Text>
                <Text style={styles.cardCount}>
                  {t('home.itemsCount', { count: String(getPoojaItemCount(item.id)) })}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const makeStyles = (c: ReturnType<typeof useColors>) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.background },
  list: { padding: 16, flexGrow: 1 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: c.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: c.border,
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardIcon: { fontSize: 28 },
  cardName: { fontSize: 17, fontWeight: '700', color: c.text },
  cardCount: { fontSize: 13, color: c.textSecondary, marginTop: 2 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: c.text, marginTop: 12 },
  emptySubtitle: { fontSize: 14, color: c.textSecondary, textAlign: 'center', marginTop: 4 },
  settingsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.primary,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginTop: 16,
    gap: 6,
  },
  settingsBtnLabel: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
