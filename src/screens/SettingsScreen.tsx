import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useLanguage, getLanguageLabel } from '../i18n';
import { COLORS } from '../utils/constants';
import type { RootStackParamList } from '../../App';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Settings'>;

export default function SettingsScreen() {
  const { t, language } = useLanguage();
  const navigation = useNavigation<Nav>();

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <TouchableOpacity
        style={styles.row}
        onPress={() => navigation.navigate('Config')}
        activeOpacity={0.7}
      >
        <Text style={styles.icon}>📋</Text>
        <Text style={styles.label}>{t('settings.managePoojas')}</Text>
        <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.row}
        onPress={() => navigation.navigate('LanguageSettings')}
        activeOpacity={0.7}
      >
        <Text style={styles.icon}>🌐</Text>
        <Text style={styles.label}>{t('config.languageRow')}</Text>
        <Text style={styles.value}>{getLanguageLabel(language)}</Text>
        <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
  },
  icon: { fontSize: 24 },
  label: { flex: 1, fontSize: 17, fontWeight: '600', color: COLORS.text },
  value: { fontSize: 15, color: COLORS.textSecondary, marginRight: 4 },
});
