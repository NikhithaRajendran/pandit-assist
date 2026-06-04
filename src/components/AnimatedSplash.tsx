import React, { useEffect, useRef, useState } from 'react';
import { Animated, AccessibilityInfo, Image, StyleSheet, Text } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../i18n';

SplashScreen.preventAutoHideAsync();

export default function AnimatedSplash({ onFinish }: { onFinish: () => void }) {
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const [ready, setReady] = useState(false);
  const { loading } = useApp();
  const { initialLoading } = useLanguage();
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMinTimeElapsed(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!initialLoading && !loading && minTimeElapsed) {
      setReady(true);
    }
  }, [initialLoading, loading, minTimeElapsed]);

  useEffect(() => {
    if (!ready) return;

    (async () => {
      const reduceMotion = await AccessibilityInfo.isReduceMotionEnabled();
      const duration = reduceMotion ? 0 : 500;

      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.9,
          duration,
          useNativeDriver: true,
        }),
      ]).start(async () => {
        await SplashScreen.hideAsync();
        onFinish();
      });
    })();
  }, [ready, opacity, scale, onFinish]);

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        styles.container,
        { opacity, transform: [{ scale }] },
      ]}
      pointerEvents={ready ? 'none' : 'auto'}
    >
      <Image
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        source={require('../../assets/android-icon-monochrome.png')}
        style={styles.icon}
        resizeMode="contain"
      />
      <Text style={styles.title}>Pandit Assist</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FF6F00',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    elevation: 9999,
  },
  icon: {
    width: 130,
    height: 130,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});
