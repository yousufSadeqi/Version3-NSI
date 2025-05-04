import { Dimensions, Platform, StatusBar, StyleSheet, View } from 'react-native';
import React from 'react';
import { ScreenWrapperProps } from '@/types';
import { useTheme } from '@/contexts/themeContext';

const { height } = Dimensions.get('window');

const ScreenWrapper = ({ style, children }: ScreenWrapperProps) => {
  const { themeColors, isDarkMode } = useTheme();
  let paddingTop = Platform.OS === 'ios' ? height * 0.06 : 5;

  return (
    <View style={[
      { 
        paddingTop, 
        flex: 1, 
        backgroundColor: themeColors.background 
      }, 
      style
    ]}>
      <StatusBar 
        barStyle={isDarkMode ? "light-content" : "dark-content"} 
        backgroundColor={themeColors.background} 
      />
      {children}
    </View>
  );
};

export default ScreenWrapper;

const styles = StyleSheet.create({});
