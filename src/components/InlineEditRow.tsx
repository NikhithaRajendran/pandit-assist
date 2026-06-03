import React, { useState, useRef, useMemo } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../utils/useColors';

type Props = {
  name: string;
  editValue?: string;
  onSave: (newName: string) => Promise<{ success: boolean; error?: string }>;
  onDelete: () => void;
  secondaryAction?: { label: string; onPress: () => void };
  badge?: { text: string };
  t?: (key: string, params?: Record<string, string>) => string;
  confirmTitleKey?: string;
  confirmMessageKey?: string;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
};

export default function InlineEditRow({ name, editValue, onSave, onDelete, secondaryAction, badge, t, confirmTitleKey = 'alert.deleteTitle', confirmMessageKey = 'alert.deleteMessage', onMoveUp, onMoveDown }: Props) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(editValue ?? name);
  const inputRef = useRef<TextInput>(null);
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const handleStartEdit = () => {
    setEditText(editValue ?? name);
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setEditText(editValue ?? name);
  };

  const handleSave = async () => {
    const result = await onSave(editText);
    if (!result.success && result.error) {
      Alert.alert(t ? t('common.failed') : 'Failed', result.error);
      return;
    }
    setEditing(false);
  };

  const handleDelete = () => {
    const title = t ? t(confirmTitleKey) : 'Delete Item?';
    const message = t ? t(confirmMessageKey, { name }) : `Are you sure you want to delete "${name}"?`;
    const cancelLabel = t ? t('common.cancel') : 'Cancel';
    const deleteLabel = t ? t('alert.deleteConfirm') : 'Delete';
    Alert.alert(title, message, [
      { text: cancelLabel, style: 'cancel' },
      { text: deleteLabel, style: 'destructive', onPress: onDelete },
    ]);
  };

  return (
    <View style={styles.container}>
      {editing ? (
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={editText}
          onChangeText={setEditText}
          onSubmitEditing={handleSave}
          returnKeyType="done"
          autoFocus
        />
      ) : (
        <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">
          {name}
        </Text>
      )}

      {badge && !editing && (
        <Text style={styles.badge}>{badge.text}</Text>
      )}

      <View style={styles.actions}>
        {secondaryAction && !editing && (
          <TouchableOpacity
            onPress={secondaryAction.onPress}
            style={styles.actionBtn}
            accessibilityRole="button"
            accessibilityLabel={secondaryAction.label}
          >
            <Text style={styles.secondaryLabel}>{secondaryAction.label}</Text>
          </TouchableOpacity>
        )}

        {editing ? (
          <>
            <TouchableOpacity
              onPress={handleSave}
              style={styles.actionBtn}
              accessibilityRole="button"
              accessibilityLabel="Save"
            >
              <Ionicons name="checkmark-circle" size={22} color={colors.success} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleCancelEdit}
              style={styles.actionBtn}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
            >
              <Ionicons name="close-circle" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </>
        ) : (
          <>
            {onMoveUp && (
              <TouchableOpacity
                onPress={onMoveUp}
                style={styles.actionBtn}
                accessibilityRole="button"
                accessibilityLabel="Move up"
              >
                <Ionicons name="chevron-up" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
            {onMoveDown && (
              <TouchableOpacity
                onPress={onMoveDown}
                style={styles.actionBtn}
                accessibilityRole="button"
                accessibilityLabel="Move down"
              >
                <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={handleStartEdit}
              style={styles.actionBtn}
              accessibilityRole="button"
              accessibilityLabel="Edit"
            >
              <Ionicons name="pencil" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleDelete}
              style={styles.actionBtn}
              accessibilityRole="button"
              accessibilityLabel="Delete"
            >
              <Ionicons name="trash-outline" size={18} color={colors.danger} />
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const makeStyles = (c: ReturnType<typeof useColors>) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.card,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: c.border,
  },
  name: { flex: 1, fontSize: 16, color: c.text, marginRight: 8 },
  input: {
    flex: 1,
    fontSize: 16,
    color: c.text,
    borderBottomWidth: 1,
    borderBottomColor: c.primary,
    paddingVertical: 2,
    marginRight: 8,
  },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  badge: { fontSize: 14, color: c.textSecondary, marginRight: 8 },
  actionBtn: { paddingHorizontal: 6, paddingVertical: 4 },
  secondaryLabel: { color: c.primary, fontSize: 14, fontWeight: '600' },
});
