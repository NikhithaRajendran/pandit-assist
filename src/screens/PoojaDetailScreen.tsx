import React, { useState, useCallback, useEffect, useMemo, useLayoutEffect } from 'react';
import {
  Alert,
  FlatList,
  Keyboard,
  Linking,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, usePreventRemove } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';

import { SessionItem } from '../types';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../i18n';
import { COLORS } from '../utils/constants';
import { loadLastGreeting, saveLastGreeting } from '../utils/storage';
import type { RootStackParamList } from '../../App';

type Nav = NativeStackNavigationProp<RootStackParamList, 'PoojaDetail'>;
type Route = RouteProp<RootStackParamList, 'PoojaDetail'>;

export default function PoojaDetailScreen() {
  const { getPoojaItems, showToast, poojas } = useApp();
  const { t, getName, language } = useLanguage();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const insets = useSafeAreaInsets();
  const { poojaId, poojaName } = route.params;

  const pooja = useMemo(() => poojas.find((p) => p.id === poojaId), [poojas, poojaId]);

  const [sessionItems, setSessionItems] = useState<SessionItem[]>([]);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [greeting, setGreeting] = useState('');
  const [shareText, setShareText] = useState('');

  useEffect(() => {
    const items = getPoojaItems(poojaId);
    setSessionItems(
      items.map((i) => ({
        id: i.id,
        nameEn: i.nameEn,
        nameTa: i.nameTa,
        nameHi: i.nameHi,
        quantity: '',
        isRequired: true,
      })),
    );
  }, [poojaId, getPoojaItems]);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => { show.remove(); hide.remove(); };
  }, []);

  useEffect(() => {
    loadLastGreeting().then((g) => {
      setGreeting(g || t('share.greeting'));
    });
  }, [t]);

  useLayoutEffect(() => {
    navigation.setOptions({ title: pooja ? getName(pooja) : poojaName });
  }, [navigation, pooja, poojaName, getName]);

  const hasUnsavedChanges = useMemo(
    () => sessionItems.some((i) => i.quantity.trim().length > 0),
    [sessionItems],
  );

  usePreventRemove(hasUnsavedChanges, ({ data }) => {
    Alert.alert(t('poojaDetail.discardTitle'), t('poojaDetail.discardMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('poojaDetail.discard'),
        style: 'destructive',
        onPress: () => navigation.dispatch(data.action),
      },
    ]);
  });

  const allChecked = useMemo(
    () => sessionItems.every((i) => i.isRequired),
    [sessionItems],
  );

  const toggleAll = useCallback(() => {
    setSessionItems((prev) =>
      prev.map((i) => ({ ...i, isRequired: !allChecked })),
    );
  }, [allChecked]);

  const toggleItem = useCallback((id: string) => {
    setSessionItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, isRequired: !i.isRequired } : i)),
    );
  }, []);

  const updateQuantity = useCallback((id: string, qty: string) => {
    setSessionItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, quantity: qty } : i)),
    );
  }, []);

  const checkedItems = useMemo(() => sessionItems.filter((i) => i.isRequired), [sessionItems]);
  const shareEnabled = checkedItems.length > 0;

  const formatMessage = useCallback(
    (greet: string) => {
      const lines = checkedItems.map((item, idx) => {
        const suffix = item.quantity.trim()
          ? ` - ${item.quantity.trim()}`
          : '';
        return `${idx + 1}. ${getName(item)}${suffix}`;
      });
      return [
        `\uD83D\uDE4F ${greet},`,
        '',
        t('share.requestPrefix', { name: pooja ? getName(pooja) : poojaName }),
        '',
        ...lines,
        '',
        t('share.changeRequest'),
        '',
        t('share.dhanyawad'),
      ].join('\n');
    },
    [checkedItems, pooja, poojaName, t, getName],
  );

  const openShareModal = useCallback(() => {
    if (!shareEnabled) {
      showToast(t('poojaDetail.noSelection'), 'error');
      return;
    }
    loadLastGreeting().then((g) => {
      const greet = g || t('share.greeting');
      setGreeting(greet);
      setShareText(formatMessage(greet));
      setShareModalVisible(true);
    });
  }, [shareEnabled, showToast, t, formatMessage]);

  const handleSendWhatsApp = useCallback(async () => {
    const encoded = encodeURIComponent(shareText);
    await saveLastGreeting(greeting.trim() || t('share.greeting'));
    setShareModalVisible(false);

    try {
      await Linking.openURL(`whatsapp://send?text=${encoded}`);
    } catch {
      try {
        await Linking.openURL(`https://api.whatsapp.com/send?text=${encoded}`);
      } catch {
        showToast(t('toast.whatsappUnavailable'), 'error');
      }
    }
  }, [shareText, greeting, showToast, t]);

  const handleGreetingChange = useCallback(
    (g: string) => {
      setGreeting(g);
      setShareText(formatMessage(g.trim() || t('share.greeting')));
    },
    [formatMessage, t],
  );

  const listHeader = (
    <View style={styles.headerSection}>
      {sessionItems.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="cube-outline" size={36} color={COLORS.textSecondary} />
          <Text style={styles.emptyTitle}>{t('poojaDetail.noItemsTitle')}</Text>
          <Text style={styles.emptySubtitle}>{t('poojaDetail.noItemsSubtitle')}</Text>
          <TouchableOpacity
            style={styles.addItemsBtn}
            onPress={() =>
              navigation.navigate('PoojaItemsConfig', { poojaId, poojaName: pooja?.nameEn || poojaName })
            }
          >
            <Text style={styles.addItemsBtnLabel}>{t('poojaDetail.addItems')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <TouchableOpacity style={styles.toggleAllBtn} onPress={toggleAll}>
            <Ionicons
              name={allChecked ? 'checkbox' : 'square-outline'}
              size={20}
              color={COLORS.primary}
            />
            <Text style={styles.toggleAllText}>
              {allChecked ? t('poojaDetail.deselectAll') : t('poojaDetail.selectAll')}
            </Text>
          </TouchableOpacity>
          <Text style={styles.hint}>{t('poojaDetail.checkItemsHint')}</Text>
        </>
      )}
    </View>
  );

  const listFooter = <View style={{ height: 80 }} />;

  const renderItem = ({ item }: { item: SessionItem }) => (
    <View style={styles.itemRow}>
      <TouchableOpacity onPress={() => toggleItem(item.id)} style={styles.checkArea}>
        <Ionicons
          name={item.isRequired ? 'checkbox' : 'square-outline'}
          size={22}
          color={item.isRequired ? COLORS.primary : COLORS.textSecondary}
        />
      </TouchableOpacity>
      <Text style={styles.itemName} numberOfLines={1}>
        {getName(item)}
      </Text>
      <TextInput
        style={styles.qtyInput}
        placeholder={t('poojaDetail.qtyPlaceholder')}
        placeholderTextColor={COLORS.border}
        value={item.quantity}
        onChangeText={(text) => updateQuantity(item.id, text)}
        returnKeyType="done"
      />
    </View>
  );

  return (
    <View style={styles.screen}>
      {Platform.OS === 'ios' ? (
        <View style={{ flex: 1 }}>
          <FlatList
            data={sessionItems}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            ListHeaderComponent={listHeader}
            ListFooterComponent={listFooter}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
          />
        </View>
      ) : (
        <FlatList
          data={sessionItems}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListHeaderComponent={listHeader}
          ListFooterComponent={listFooter}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
        />
      )}

      {!keyboardVisible && (
        <View style={[styles.shareWrapper, { paddingBottom: insets.bottom + 8 }]}>
          <TouchableOpacity
            style={[styles.shareBtn, !shareEnabled && styles.shareBtnDisabled]}
            onPress={openShareModal}
            activeOpacity={0.8}
          >
            <Ionicons name="logo-whatsapp" size={20} color="#fff" />
            <Text style={styles.shareBtnText}>
              {t('poojaDetail.shareButton', { name: pooja ? getName(pooja) : poojaName })}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <Modal
        visible={shareModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setShareModalVisible(false)}
      >
        <View style={styles.shareModalBackdrop}>
          <View style={[styles.shareModal, { paddingBottom: insets.bottom + 16 }]}>
            <Text style={styles.shareModalTitle}>{t('poojaDetail.shareTitle')}</Text>

            <Text style={styles.shareLabel}>{t('poojaDetail.greetingLabel')}</Text>
            <TextInput
              style={styles.greetingInput}
              value={greeting}
              onChangeText={handleGreetingChange}
              placeholder={t('share.greeting')}
              placeholderTextColor={COLORS.textSecondary}
            />

            <Text style={styles.shareLabel}>{t('poojaDetail.messageLabel')}</Text>
            <TextInput
              style={styles.previewInput}
              value={shareText}
              onChangeText={setShareText}
              multiline
              textAlignVertical="top"
            />

            <View style={styles.shareActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShareModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.sendBtn} onPress={handleSendWhatsApp}>
                <Ionicons name="logo-whatsapp" size={18} color="#fff" />
                <Text style={styles.sendBtnText}>{t('common.save')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  listContent: { paddingHorizontal: 16, paddingTop: 12 },

  headerSection: { paddingBottom: 8 },

  toggleAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  toggleAllText: { fontSize: 15, fontWeight: '600', color: COLORS.primary },
  hint: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 8, marginLeft: 4 },

  emptyCard: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginTop: 12 },
  emptySubtitle: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', marginTop: 4 },
  addItemsBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginTop: 16,
  },
  addItemsBtnLabel: { color: '#fff', fontSize: 15, fontWeight: '600' },

  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  checkArea: { paddingRight: 8, paddingVertical: 4 },
  itemName: { flex: 1, fontSize: 16, color: COLORS.text, marginRight: 8, flexShrink: 1 },
  qtyInput: {
    width: 100,
    maxWidth: 120,
    height: 40,
    paddingVertical: 0,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    paddingHorizontal: 8,
    fontSize: 15,
    color: COLORS.text,
    textAlign: 'right',
    lineHeight: 18,
  },

  shareWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 8,
    backgroundColor: COLORS.background,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#25D366',
    borderRadius: 10,
    height: 52,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  shareBtnDisabled: { backgroundColor: COLORS.textSecondary, opacity: 0.6 },
  shareBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  shareModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  shareModal: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  shareModalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  shareLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 4,
    marginTop: 8,
  },
  greetingInput: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 16,
    color: COLORS.text,
  },
  previewInput: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 12,
    minHeight: 140,
    borderWidth: 1,
    borderColor: COLORS.border,
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
    textAlignVertical: 'top',
  },
  shareActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  cancelBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cancelBtnText: { fontSize: 16, color: COLORS.textSecondary, fontWeight: '600' },
  sendBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#25D366',
    borderRadius: 8,
    height: 48,
    gap: 6,
  },
  sendBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
