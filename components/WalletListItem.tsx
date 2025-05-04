import { StyleSheet, View, TouchableOpacity } from 'react-native'
import React from 'react'
import { WalletType } from '@/types'
import { Image } from 'expo-image'
import { colors, radius, spacingX, spacingY } from '@/constants/theme'
import Typo from './Typo'
import * as Icons from 'phosphor-react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { useRouter } from 'expo-router'
import { useTheme } from '@/contexts/themeContext'
import { WalletListItemProps } from '@/types'

const WalletListItem = ({ wallet, index = 0, onPress }: WalletListItemProps) => {
  const router = useRouter();
  const { themeColors } = useTheme();
  
  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push({
        pathname: '/(modals)/WalletModal',
        params: { wallet: JSON.stringify(wallet) }
      });
    }
  };

  const getDefaultIcon = () => {
    return <Icons.Wallet size={24} color={colors.primary} weight="fill" />
  }

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 100).springify()}
    >
      <TouchableOpacity 
        style={[styles.container, { backgroundColor: themeColors.surface }]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <View style={styles.leftContent}>
          <View style={[styles.iconContainer, { backgroundColor: themeColors.surfaceVariant }]}>
            {wallet.image ? (
              <Image
                source={{ uri: wallet.image }}
                style={styles.image}
                contentFit="cover"
              />
            ) : (
              getDefaultIcon()
            )}
          </View>
          <View style={styles.textContainer}>
            <Typo size={16} fontWeight="600" color={themeColors.text}>{wallet.name}</Typo>
          </View>
        </View>
        
        <View style={styles.rightContent}>
          <Typo 
            size={16} 
            fontWeight="600" 
            color={themeColors.primary}
          >
            ${wallet.amount?.toFixed(2) || '0.00'}
          </Typo>
        </View>
      </TouchableOpacity>
    </Animated.View>
  )
}

export default WalletListItem

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacingY._12,
    borderRadius: radius._12,
    marginBottom: spacingY._10,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: radius._10,
    backgroundColor: colors.neutral700,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacingX._12,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: radius._10,
  },
  textContainer: {
    flex: 1,
  },
  rightContent: {
    paddingLeft: spacingX._12,
  }
})