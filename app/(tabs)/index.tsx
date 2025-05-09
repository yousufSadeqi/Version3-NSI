import { StyleSheet, View, ScrollView, TouchableOpacity, Image } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { colors, radius, spacingX, spacingY } from '@/constants/theme';
import HomeCard from '@/components/HomeCard';
import { useAuth } from '@/contexts/authContext';
import useFetchData from '@/hooks/useFetchData';
import { TransactionType, WalletType } from '@/types';
import { limit, orderBy, where } from 'firebase/firestore';
import ScreenWrapper from '@/components/ScreenWrapper';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Loading from '@/components/loading';
import Typo from '@/components/Typo';
import { verticalScale } from '@/utils/styling';
import * as Icons from 'phosphor-react-native';
import TransactionList from '@/components/TransactionList';
import { useTheme } from '@/contexts/themeContext';
import SegmentedControl from '@react-native-segmented-control/segmented-control';

const Index = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const { isDarkMode, toggleTheme, themeColors } = useTheme();
  const [activeIndex, setActiveIndex] = useState(0); // <- Segment state

  // useless for the moment
  // const [data, setData] = useState([{}])

  // useEffect(() => {
  //   fetch('/members').then(
  //     res => res.json()
  //   ).then(
  //     data => {
  //       setData(data) 
  //       console.log(data)
  //     }
  //   )
  // })

  if (!user) {
    router.replace('/welcome');
    return null;
  }

  const { data: wallets, loading } = useFetchData<WalletType>('Wallets', [
    where('uid', '==', user.uid),
  ]);

  const transactionConstraints = [
    where('uid', '==', user.uid),
    orderBy('date', 'desc'),
    limit(30),
  ];

  const {
    data: recentTransaction,
    loading: transactionLoading,
  } = useFetchData<TransactionType>('transactions', transactionConstraints);

  const getTotalBalance = () =>
    wallets?.reduce((sum, wallet) => sum + (wallet.amount || 0), 0) || 0;

  const getTotalIncome = () =>
    wallets?.reduce((sum, wallet) => (wallet.amount && wallet.amount > 0 ? sum + wallet.amount : sum), 0) || 0;

  const getTotalExpenses = () =>
    wallets?.reduce((sum, wallet) => (wallet.amount && wallet.amount < 0 ? sum - Math.abs(wallet.amount) : sum), 0) || 0;

  const toggleMenu = () => setMenuOpen(!menuOpen);

  const handleSegmentChange = (event: any) => {
    setActiveIndex(event.nativeEvent.selectedSegmentIndex);
  };

  const filteredTransactions = () => {
    if (!recentTransaction) return [];
    if (activeIndex === 1) {
      return recentTransaction.filter((item) => item.type == 'income'); // Income
    }
    if (activeIndex === 2) {
      return recentTransaction.filter((item) => item.type == 'expense'); // Expense
    }
    return recentTransaction; // All
  };

  return (
    <ScreenWrapper>
      <View style={[styles.container, { backgroundColor: themeColors.background }]}>
        {/* New Header */}
        <View style={[styles.header, { backgroundColor: themeColors.surface }]}>
          <TouchableOpacity 
            style={[styles.themeToggle, { backgroundColor: themeColors.background }]} 
            onPress={toggleTheme}
          >
            {isDarkMode ? (
              <Icons.Moon weight="fill" size={22} color={themeColors.textSecondary} />
            ) : (
              <Icons.Sun weight="fill" size={22} color={themeColors.textSecondary} />
            )}
          </TouchableOpacity>

          <View style={styles.logoContainer}>
            <Typo 
              size={24} 
              fontWeight="700" 
              color={themeColors.primary}
              style={styles.appName}
            >
              Expensify
            </Typo>
            <Icons.ChartPieSlice size={24} color={colors.primary} weight="fill" />
          </View>

          <TouchableOpacity 
            style={[styles.searchIcon, { backgroundColor: themeColors.background }]} 
            onPress={() => router.push('/(modals)/searchModal')}
          >
            <Icons.MagnifyingGlass
              size={22}
              color={themeColors.textSecondary}
              weight="bold"
            />
          </TouchableOpacity>
        </View>

        {/* Scroll Content */}
        <ScrollView 
          style={styles.scrollViewStyle} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {loading ? (
            <Loading />
          ) : (
            <Animated.View 
              entering={FadeInDown.duration(500)} 
              style={styles.content}
            >
              <HomeCard />
            </Animated.View>
          )}

          {/* Segmented Control */}
          <View style={{ paddingHorizontal: spacingX._20, marginTop: spacingY._20, marginBottom: spacingY._15}}>
            <SegmentedControl
              values={['All', 'Income', 'Expense']}
              selectedIndex={activeIndex}
              onChange={handleSegmentChange}
              tintColor={themeColors.neutral200}
              appearance={isDarkMode ? 'dark' : 'light'}
            />
          </View>

          {/* Recent Transactions */}
          <TransactionList
            data={filteredTransactions()}
            loading={transactionLoading}
            emptyListMessage="No Transactions found"
          />
        </ScrollView>

        {/* Floating Action Menu */}
        {menuOpen && (
          <View style={styles.actionMenu}>
            <Animated.View entering={FadeInDown.duration(300).delay(100)}>
              <TouchableOpacity
                style={[styles.optionButton, styles.optionButtonFirst]}
                onPress={() => {
                  toggleMenu();
                  router.push('/(modals)/transactionModal');
                }}
              >
                <Icons.PencilSimple size={24} weight="bold" color={colors.black} />
              </TouchableOpacity>
            </Animated.View>

            <Animated.View entering={FadeInDown.duration(300).delay(200)}>
              <TouchableOpacity
                style={[styles.optionButton, styles.optionButtonSecond ]}
                onPress={() => {
                  toggleMenu();
                  router.push('/(modals)/cameraScanner');
                }}
              >
                <Icons.Camera size={24} weight="bold" color={colors.black}  />
              </TouchableOpacity>
            </Animated.View>
          </View>
        )}

        {/* Main Floating Button  */}
        {/* <TouchableOpacity 
          style={styles.floatingButton} 
          onPress={toggleMenu}
        >
          <Icons.Plus
            color={colors.black}
            weight="bold"
            size={verticalScale(24)}     remove it for the momennt due to utilisation of the alternative in the custom tab
          />
        </TouchableOpacity> */}
      </View>
    </ScreenWrapper>
  );
};

export default Index;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral900,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacingX._20,
    paddingVertical: spacingY._12,
    borderBottomWidth: 1,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacingX._8,
  },
  logo: {
    width: 28,
    height: 28,
    resizeMode: 'contain',
  },
  appName: {
    letterSpacing: 0.5,
  },
  themeToggle: {
    padding: spacingX._10,
    borderRadius: radius._12,
  },
  searchIcon: {
    padding: spacingX._10,
    borderRadius: radius._12,
  },
  scrollViewStyle: {
    flex: 1,
    paddingBottom: verticalScale(100),
  },
  scrollContent: {
    paddingTop: spacingY._10,
  },
  content: {
    padding: spacingX._20,
    gap: spacingY._20,
  },
  floatingButton: {
    height: verticalScale(56),
    width: verticalScale(56),
    borderRadius: 28,
    position: 'absolute',
    bottom: verticalScale(30),
    right: verticalScale(30),
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  actionMenu: {
    position: 'absolute',
    bottom: verticalScale(100),
    right: verticalScale(30),
    gap: verticalScale(12),
  },
  optionButton: {
    height: verticalScale(48),
    width: verticalScale(48),
    borderRadius: 24,
    backgroundColor: colors.primary ,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: colors.green,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  optionButtonFirst: {
    backgroundColor: colors.primary,
  },
  optionButtonSecond: {
    backgroundColor: colors.primary,
  },
});
