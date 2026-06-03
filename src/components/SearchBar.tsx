import React, { useState, useRef, useCallback } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/constants';

type Props = {
  placeholder?: string;
  onQueryChange: (query: string) => void;
  debounceMs?: number;
};

export default function SearchBar({
  placeholder = 'Search items...',
  onQueryChange,
  debounceMs = 300,
}: Props) {
  const [value, setValue] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = useCallback(
    (text: string) => {
      setValue(text);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => onQueryChange(text), debounceMs);
    },
    [onQueryChange, debounceMs]
  );

  return (
    <View style={styles.container}>
      <Ionicons name="search" size={18} color={COLORS.textSecondary} style={styles.icon} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textSecondary}
        value={value}
        onChangeText={handleChange}
        autoCorrect={false}
        returnKeyType="search"
      />
      {value.length > 0 && (
        <Ionicons
          name="close-circle"
          size={18}
          color={COLORS.textSecondary}
          onPress={() => handleChange('')}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  icon: { marginRight: 6 },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    paddingVertical: 0,
  },
});
