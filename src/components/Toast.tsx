import React, { useEffect, useRef, useMemo } from 'react';
import { Animated, StyleSheet, Text, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../context/AppContext';
import { TOAST_DURATION } from '../utils/constants';
import { useColors } from '../utils/useColors';

export default function Toast() {
  const { toast } = useApp();
  const opacity = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  useEffect(() => {
    opacity.setValue(0);
    if (!toast) return;

    const fadeDuration = TOAST_DURATION * 0.1;
    const holdDuration = TOAST_DURATION * 0.8;

    const anim = Animated.sequence([
      Animated.timing(opacity, {
        toValue: 1,
        duration: fadeDuration,
        useNativeDriver: true,
      }),
      Animated.delay(holdDuration),
      Animated.timing(opacity, {
        toValue: 0,
        duration: fadeDuration,
        useNativeDriver: true,
      }),
    ]);
    anim.start();
    return () => anim.stop();
  }, [toast, opacity]);

  if (!toast) return null;

  const bgColor =
    toast.type === 'success'
      ? colors.success
      : toast.type === 'error'
      ? colors.danger
      : colors.textSecondary;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity,
          top: insets.top + 8,
          left: 16,
          width: width - 32,
          backgroundColor: bgColor,
        },
      ]}
    >
      <Text style={styles.text}>{toast.message}</Text>
    </Animated.View>
  );
}

const makeStyles = (_c: ReturnType<typeof useColors>) => StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 9999,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 6,
  },
  text: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
});
