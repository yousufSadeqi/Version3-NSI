export interface ThemeColors {
  // Base colors
  primary: string;
  primaryLight: string;
  primaryDark: string;
  
  // Text colors
  text: string;
  textLight: string;
  textLighter: string;
  textSecondary: string;
  
  // Surface colors
  background: string;
  surface: string;
  surfaceVariant: string;
  
  // Status colors
  white: string;
  black: string;
  rose: string;
  green: string;
  
  // Neutral colors
  neutral50: string;
  neutral100: string;
  neutral200: string;
  neutral300: string;
  neutral400: string;
  neutral500: string;
  neutral600: string;
  neutral700: string;
  neutral800: string;
  neutral900: string;
}

export interface TransactionItemProps {
  item: TransactionType;
  index: number;
  handleClick: (item: TransactionType) => void;
  themeColors: ThemeColors;
} 