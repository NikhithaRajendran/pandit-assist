import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Appearance, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, DARK_COLORS } from '../utils/constants';

type Props = {
  children: ReactNode;
  t?: (key: string, params?: Record<string, string>) => string;
};

type State = {
  hasError: boolean;
  error: Error | null;
};

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      const { t } = this.props;
      const c = Appearance.getColorScheme() === 'dark' ? DARK_COLORS : COLORS;
      return (
        <View style={styles(c).container}>
          <Text style={styles(c).icon}>⚠️</Text>
          <Text style={styles(c).title}>{t ? t('error.title') : 'Something went wrong'}</Text>
          <Text style={styles(c).message}>
            {this.state.error?.message || (t ? t('error.unknown') : 'An unexpected error occurred')}
          </Text>
          <TouchableOpacity style={styles(c).retryBtn} onPress={this.handleRetry} activeOpacity={0.8}>
            <Text style={styles(c).retryText}>{t ? t('error.retry') : 'Retry'}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = (c: typeof COLORS) => StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.background,
    padding: 32,
  },
  icon: { fontSize: 48, marginBottom: 16 },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: c.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: c.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  retryBtn: {
    backgroundColor: c.primary,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  retryText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
