import { scale, verticalScale } from "@/utils/styling";

export const colors = {
  // Primary Colors
  primary: '#FF8C42', // Warm orange
  primaryLight: '#FFB088', // Light orange
  primaryDark: '#E67A35', // Dark orange

  // Accent Colors
  accent: '#FF5733', // Vibrant coral
  accentLight: '#FF8C75', // Light coral
  accentDark: '#E63E1C', // Dark coral

  // Success/Error States
  green: '#4CAF50',
  greenLight: '#81C784',
  greenDark: '#388E3C',
  
  rose: '#FF4B4B',
  roseLight: '#FF7373',
  roseDark: '#E63939',

  // Neutral Colors - Light Mode
  white: '#FFFFFF',
  neutral50: '#F9FAFB',
  neutral100: '#F3F4F6',
  neutral200: '#E5E7EB',
  neutral300: '#D1D5DB',
  neutral400: '#9CA3AF',
  neutral500: '#6B7280',
  neutral600: '#4B5563',
  neutral700: '#374151',
  neutral800: '#1F2937',
  neutral900: '#111827',
  black: '#000000',
  textWhite: 'white', 

  // Category Colors
  food: '#FF9F1C',      
  transport: '#2EC4B6', 
  shopping: '#E71D36',  
  bills: '#011627',     
  health: '#41B3A3',    
  education: '#8338EC', 
  entertainment: '#FB5607', 
  other: '#7209B7',    

  // Gradients
  gradientStart: '#FF8C42',
  gradientEnd: '#FFB088',

};

export const spacingX = {
  _3: 3,
  _5: 5,
  _7: 7,
  _8: 8,
  _10: 10,
  _12: 12,
  _15: 15,
  _20: 20,
  _25: 25,
  _30: 30,
  _35: 35,
  _40: 40,
};

export const spacingY = {
  _3: 3,
  _5: 5,
  _7: 7,
  _10: 10,
  _12: 12,
  _15: 15,
  _20: 20,
  _25: 25,
  _30: 30,
  _35: 35,
  _40: 40,
};

export const radius = {
  _3: 3,
  _5: 5,
  _8: 8,
  _10: 10,
  _12: 12,
  _15: 15,
  _20: 20,
  _25: 25,
  _30: 30,
};

export const lightTheme = {
  text: colors.neutral900,
  textSecondary: colors.neutral600,
  background: colors.white,
  surface: colors.neutral50,
  border: colors.neutral200,
  primary: colors.primary,
  neutral100: colors.neutral100,
  neutral200: colors.neutral200,
  neutral300: colors.neutral300,
};

export const darkTheme = {
  text: colors.white,
  textSecondary: colors.neutral400,
  background: colors.neutral900,
  surface: colors.neutral800,
  border: colors.neutral700,
  primary: colors.primary,
  neutral100: colors.neutral800,
  neutral200: colors.neutral700,
  neutral300: colors.neutral600,
};

export type ThemeColors = typeof lightTheme;
