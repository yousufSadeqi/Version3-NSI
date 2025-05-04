import { Platform, StyleSheet, View } from 'react-native'
import React from 'react'
import { ModalWrapperProps } from '@/types'
import { useTheme } from '@/contexts/themeContext'
import { spacingY } from '@/constants/theme'

const isIos = Platform.OS === 'ios';

const ModalWrapper = ({
    style, 
    children, 
    bg
}: ModalWrapperProps) => {
  const { themeColors } = useTheme();
  
  return (
    <View style={[
      styles.container, 
      { backgroundColor: bg || themeColors.background }, 
      style && style
    ]}>
      {children}
    </View>
  )
}

export default ModalWrapper

const styles = StyleSheet.create({
    container: {
        flex: 1, 
        paddingTop: isIos ? spacingY._15 : 20, 
        paddingBottom: isIos ? spacingY._20 : spacingY._10,
    }
})