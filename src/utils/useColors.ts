import { useColorScheme } from 'react-native';
import { COLORS, DARK_COLORS } from './constants';

export function useColors() {
  const scheme = useColorScheme();
  return scheme === 'dark' ? DARK_COLORS : COLORS;
}
