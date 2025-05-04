import { StyleSheet, Text, TextStyle, View } from 'react-native'
import React from 'react'
import { TypoProps } from '@/types'
import { colors } from '@/constants/theme'
import { verticalScale } from '@/utils/styling'

const Typo = ({
    size, 
    color = colors.text,
    children,
    fontWeight = '400',
    style,
    textProps = {},
}: TypoProps) => {

    const textStyle : TextStyle = {
        fontSize : size? verticalScale(size): verticalScale(18),
        color, 
        fontWeight,
    }
  return (
    <Text style={[textStyle, style]} {...textProps}>
        {children}
    </Text>
  )
}

export default Typo

const styles = StyleSheet.create({})