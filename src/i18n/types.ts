export type TranslationMap = Record<string, string>;

export type Language = 'en' | 'ta' | 'hi';

export type LanguageOption = {
  code: Language;
  nativeName: string;
};
