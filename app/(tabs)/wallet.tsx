import { StyleSheet, TouchableOpacity, View } from 'react-native'
import React from 'react'
import ScreenWrapper from '@/components/ScreenWrapper'
import { colors, radius, spacingX, spacingY } from '@/constants/theme'
import { verticalScale } from '@/utils/styling'
import Typo from '@/components/Typo'
import * as Icons from 'phosphor-react-native'
import { useRouter } from 'expo-router'
import useFetchData from '@/hooks/useFetchData'
import { WalletType } from '@/types'
import { useAuth } from '@/contexts/authContext'
import { orderBy, where } from 'firebase/firestore'
import Loading from '@/components/loading'
import WalletListItem from '@/components/WalletListItem'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { useTheme } from '@/contexts/themeContext'

const Wallet = () => {
  const router = useRouter()
  const { user } = useAuth(); 
  const { themeColors } = useTheme();

  const { data: wallet, error, loading } = useFetchData<WalletType>('Wallets', [
    where('uid', '==', user?.uid), 
    orderBy('created', 'desc'),
  ]);

  const getTotalBalance = () => {
    return wallet?.reduce((sum, walletItem) => sum + (walletItem.amount || 0), 0) || 0;
  };

  return (
    <ScreenWrapper style={{ backgroundColor: themeColors.background }}>
      <View style={styles.container}>
        {/* Header Section */}
        <View style={styles.header}>
          <Typo size={28} fontWeight="600" color={themeColors.text}>
            My Wallets
          </Typo>
          <TouchableOpacity 
            style={[styles.addButton, { backgroundColor: themeColors.surface }]}
            onPress={() => router.push('/(modals)/WalletModal')}
          >
            <Icons.Plus weight="bold" color={themeColors.primary} size={22} />
          </TouchableOpacity>
        </View>

        {/* Balance Card */}
        <View style={[styles.balanceCard, { backgroundColor: themeColors.primary }]}>
          <View style={styles.balanceHeader}>
            <Icons.Wallet weight="fill" color={colors.white} size={28} />
            <Typo size={16} color={colors.white} style={{ opacity: 0.9 }}>
              Total Balance
            </Typo>
          </View>
          <Typo size={42} fontWeight="600" color={colors.white}>
            ${getTotalBalance().toFixed(2)}
          </Typo>
        </View>

        {/* Wallets List */}
        <View style={[styles.walletsContainer, { backgroundColor: themeColors.surface }]}>
          <View style={styles.walletsHeader}>
            <Typo size={18} fontWeight="600" color={themeColors.text}>
              All Wallets
            </Typo>
            <Typo size={14} color={themeColors.textSecondary}>
              {wallet?.length || 0} wallets
            </Typo>
          </View>

          {loading && <Loading />}
          {error && <Typo size={16} color={colors.rose}>{error}</Typo>}
          
          {!loading && !error && (
            wallet && wallet.length > 0 ? (
              <Animated.FlatList
                data={wallet}
                renderItem={({ item }) => (
                  <Animated.View entering={FadeInDown.springify()}>
                    <WalletListItem wallet={item} />
                  </Animated.View>
                )}
                keyExtractor={(item) => item.id || ''}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
              />
            ) : (
              <View style={styles.emptyState}>
                <Icons.Wallet size={48} color={themeColors.textSecondary} weight="light" />
                <Typo size={16} color={themeColors.textSecondary}>
                  No wallets found
                </Typo>
              </View>
            )
          )}
        </View>
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacingX._20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacingY._20,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  balanceCard: {
    padding: spacingY._25,
    borderRadius: radius._20,
    marginBottom: spacingY._20,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacingX._10,
    marginBottom: spacingY._15,
  },
  walletsContainer: {
    flex: 1,
    borderRadius: radius._20,
    padding: spacingY._20,
  },
  walletsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacingY._15,
  },
  listContent: {
    gap: spacingY._12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacingY._10,
    paddingVertical: spacingY._30,
  }
});

export default Wallet;
