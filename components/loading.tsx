import { ActivityIndicator, ActivityIndicatorProps, StyleSheet, View } from 'react-native';
import React from 'react';
import { colors } from '@/constants/theme';

const Loading = ({
  size = 'large',
  color = colors.primary
}: ActivityIndicatorProps) => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={color} />
    </View>
  );
};

export default Loading;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  }
});
