import { StyleSheet, View } from 'react-native'
import React from 'react'
import Typo from './Typo'
import { HeaderProps } from '@/types'
import { colors } from '@/constants/theme'

const Header = ({ title = '', leftIcon, rightIcon, style }: HeaderProps) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.leftContainer}>
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        {title && (
          <Typo
            size={22}
            fontWeight={'600'}
            style={styles.title}
          >
            {title}
          </Typo>
        )}
      </View>
      {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
    </View>
  )
}

export default Header

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  leftIcon: {
    paddingLeft: 10,
  },
  rightIcon: {
    paddingRight: 10,
  },
  title: {
    textAlign: 'center',
    flex: 1,
    marginRight: 10,
    color: colors.primary
  },
})
