import React, { useLayoutEffect } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useApp } from '../context/AppContext';
import { useLanguage } from '../i18n';
import { COLORS } from '../utils/constants';
import type { RootStackParamList } from '../../App';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export default function HomeScreen() {
  const { poojas, getPoojaItemCount } = useApp();
  const { t, getName, language } = useLanguage();
  const navigation = useNavigation<Nav>();

  useLayoutEffect(() => {
    navigation.setOptions({
      title: t('app.name'),
      headerRight: () => (
        <TouchableOpacity
              onPress={() => navigation.navigate('Settings')}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
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
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="list-outline" size={48} color={COLORS.textSecondary} />
            <Text style={styles.emptyTitle}>{t('home.emptyTitle')}</Text>
            <Text style={styles.emptySubtitle}>{t('home.emptySubtitle')}</Text>
            <TouchableOpacity
              style={styles.settingsBtn}
          onPress={() => navigation.navigate('Settings')}
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
            <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  list: { padding: 16, flexGrow: 1 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardIcon: { fontSize: 28 },
  cardName: { fontSize: 17, fontWeight: '700', color: COLORS.text },
  cardCount: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginTop: 12 },
  emptySubtitle: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', marginTop: 4 },
  settingsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginTop: 16,
    gap: 6,
  },
  settingsBtnLabel: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
