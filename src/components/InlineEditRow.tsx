import React, { useState, useRef } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/constants';

type Props = {
  name: string;
  editValue?: string;
  onSave: (newName: string) => { success: boolean; error?: string };
  onDelete: () => void;
  secondaryAction?: { label: string; onPress: () => void };
  badge?: { text: string };
};

export default function InlineEditRow({ name, editValue, onSave, onDelete, secondaryAction, badge }: Props) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(editValue ?? name);
  const inputRef = useRef<TextInput>(null);

  const handleStartEdit = () => {
    setEditText(editValue ?? name);
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setEditText(editValue ?? name);
  };

  const handleSave = () => {
    const result = onSave(editText);
    if (!result.success && result.error) {
      Alert.alert('Failed', result.error);
      return;
    }
    setEditing(false);
  };

  const handleDelete = () => {
    Alert.alert('Delete Item?', `Are you sure you want to delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: onDelete },
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
          <TouchableOpacity onPress={secondaryAction.onPress} style={styles.actionBtn}>
            <Text style={styles.secondaryLabel}>{secondaryAction.label}</Text>
          </TouchableOpacity>
        )}

        {editing ? (
          <>
            <TouchableOpacity onPress={handleSave} style={styles.actionBtn}>
              <Ionicons name="checkmark-circle" size={22} color={COLORS.success} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleCancelEdit} style={styles.actionBtn}>
              <Ionicons name="close-circle" size={22} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity onPress={handleStartEdit} style={styles.actionBtn}>
              <Ionicons name="pencil" size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDelete} style={styles.actionBtn}>
              <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  name: { flex: 1, fontSize: 16, color: COLORS.text, marginRight: 8 },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.primary,
    paddingVertical: 2,
    marginRight: 8,
  },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  badge: { fontSize: 14, color: COLORS.textSecondary, marginRight: 8 },
  actionBtn: { paddingHorizontal: 6, paddingVertical: 4 },
  secondaryLabel: { color: COLORS.primary, fontSize: 14, fontWeight: '600' },
});
