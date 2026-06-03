import React, { useState, useRef, useCallback, useMemo } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../utils/useColors';

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
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

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
      <Ionicons name="search" size={18} color={colors.textSecondary} style={styles.icon} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        value={value}
        onChangeText={handleChange}
        autoCorrect={false}
        returnKeyType="search"
        accessibilityRole="search"
        accessibilityLabel={placeholder}
      />
      {value.length > 0 && (
        <TouchableOpacity
          onPress={() => handleChange('')}
          accessibilityRole="button"
          accessibilityLabel="Clear search"
        >
          <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const makeStyles = (c: ReturnType<typeof useColors>) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.background,
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
    borderWidth: 1,
    borderColor: c.border,
  },
  icon: { marginRight: 6 },
  input: {
    flex: 1,
    fontSize: 15,
    color: c.text,
    paddingVertical: 0,
  },
});
