import { generateId } from './id';

export const COLORS = {
  primary: '#FF6F00',
  primaryLight: '#FFA040',
  background: '#FFF8E7',
  card: '#FFFFFF',
  text: '#1A1A2E',
  textSecondary: '#6B7280',
  danger: '#DC2626',
  success: '#16A34A',
  border: '#E5E7EB',
};

export const STORAGE_KEYS = {
  poojas: '@pandit-assist/poojas',
  poojaItems: '@pandit-assist/pooja-items',
  seeded: '@pandit-assist/seeded-v4',
  lastGreeting: '@pandit-assist/last-greeting',
  language: '@pandit-assist/language',
};

export type SeedPooja = { name: string; items: string[] };

export const SEED_POOJAS: SeedPooja[] = [
  {
    name: 'Ganapathy Homam',
    items: [
      'Haldi', 'Kumkum', 'Coconuts', 'Agarbatti',
      'Camphor', 'Supari', 'Janeu', 'Rice', 'Ghee',
    ],
  },
  {
    name: 'Mangalya Pooja',
    items: [
      'Haldi', 'Kumkum', 'Coconuts', 'Flowers',
      'Mango Leaves', 'Rice', 'Ghee',
    ],
  },
  {
    name: 'Ayul Homa',
    items: [
      'Haldi', 'Kumkum', 'Coconuts', 'Agarbatti',
      'Camphor', 'Rice', 'Ghee', 'Darbha',
    ],
  },
];
