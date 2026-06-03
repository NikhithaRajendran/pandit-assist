import React, { useState, useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useColors } from '../utils/useColors';
import { useLanguage, LANGUAGES, Language } from '../i18n';
import type { RootStackParamList } from '../../App';

type Nav = NativeStackNavigationProp<RootStackParamList, 'LanguageSettings'>;

type Props = {
  onComplete?: () => void;
};

export default function LanguageSettingsScreen({ onComplete }: Props) {
  const { language, setLanguage, t } = useLanguage();
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const handleSelect = async (code: typeof language) => {
    await setLanguage(code);
    if (onComplete) {
      onComplete();
    } else {
      navigation.goBack();
    }
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 16 }]}>
      <Text style={styles.title}>{t('language.selectTitle')}</Text>

      <View style={styles.list}>
        {LANGUAGES.map((lang) => {
          const selected = lang.code === language;
          return (
            <TouchableOpacity
              key={lang.code}
              style={[styles.row, selected && styles.rowSelected]}
              onPress={() => handleSelect(lang.code)}
              activeOpacity={0.7}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={lang.nativeName}
            >
              <View style={styles.radio}>
                {selected && <View style={styles.radioInner} />}
              </View>
              <Text style={[styles.label, selected && styles.labelSelected]}>
                {lang.nativeName}
              </Text>
              {selected && (
                <Ionicons name="checkmark" size={20} color={colors.primary} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {!onComplete && (
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel={t('common.done')}
        >
          <Text style={styles.backBtnText}>{t('common.done')}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export function LanguagePickerModal({ onComplete }: { onComplete: () => void }) {
  const { setLanguage } = useLanguage();
  const [selected, setSelected] = useState<Language>('en');
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const handleContinue = async () => {
    await setLanguage(selected);
    onComplete();
  };

  const btnLabel =
    selected === 'ta' ? 'தொடர்க' : selected === 'hi' ? 'जारी रखें' : 'Continue';

  return (
    <View style={[styles.fullScreen, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }]}>
      <Text style={styles.title}>Select Language / மொழியைத் தேர்ந்தெடுக்கவும் / भाषा चुनें</Text>

      <View style={styles.list}>
        {LANGUAGES.map((lang) => {
          const isSel = lang.code === selected;
          return (
            <TouchableOpacity
              key={lang.code}
              style={[styles.row, isSel && styles.rowSelected]}
              onPress={() => setSelected(lang.code)}
              activeOpacity={0.7}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSel }}
              accessibilityLabel={lang.nativeName}
            >
              <View style={styles.radio}>
                {isSel && <View style={styles.radioInner} />}
              </View>
              <Text style={[styles.label, isSel && styles.labelSelected]}>
                {lang.nativeName}
              </Text>
              {isSel && (
                <Ionicons name="checkmark" size={20} color={colors.primary} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity style={styles.continueBtn} onPress={handleContinue} accessibilityRole="button" accessibilityLabel={btnLabel}>
        <Text style={styles.continueBtnText}>{btnLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}

const makeStyles = (c: ReturnType<typeof useColors>) => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: c.background,
    paddingHorizontal: 24,
  },
  fullScreen: {
    flex: 1,
    backgroundColor: c.background,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: c.text,
    textAlign: 'center',
    marginBottom: 32,
  },
  list: {
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: c.border,
  },
  rowSelected: {
    borderColor: c.primary,
    backgroundColor: c.primary + '18',
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: c.textSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: c.primary,
  },
  label: {
    flex: 1,
    fontSize: 18,
    color: c.text,
    fontWeight: '500',
  },
  labelSelected: {
    color: c.primary,
    fontWeight: '700',
  },
  backBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.primary,
    borderRadius: 10,
    height: 50,
    marginTop: 32,
  },
  backBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  continueBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.primary,
    borderRadius: 10,
    height: 50,
    marginTop: 32,
  },
  continueBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
