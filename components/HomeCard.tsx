import { StyleSheet, View } from 'react-native';
import React from 'react';
import { colors, radius, spacingX, spacingY } from '@/constants/theme';
import { verticalScale } from '@/utils/styling';
import Typo from './Typo';
import * as Icons from 'phosphor-react-native';
import { formatCurrency } from '@/utils/currency';
import { useAuth } from '@/contexts/authContext';
import { TransactionType, WalletType } from '@/types';
import useFetchData from '@/hooks/useFetchData';
import { orderBy, where } from 'firebase/firestore';
import { useTheme } from '@/contexts/themeContext';
import { LinearGradient } from 'expo-linear-gradient';

const HomeCard = () => {
  const { user } = useAuth();
  const { themeColors } = useTheme();

  const { data: wallets } = useFetchData<WalletType>('Wallets', [
    where('uid', '==', user?.uid),
  ]);

  const getTotals = () => {
    if (!wallets?.length) return { balance: 0, income: 0, expense: 0 };
    return wallets.reduce(
      (totals, wallet) => ({
        balance: totals.balance + (wallet.amount || 0),
        income: totals.income + (wallet.totalIncome || 0),
        expense: totals.expense + (wallet.totalExpenses || 0),
      }),
      { balance: 0, income: 0, expense: 0 }
    );
  };

  const totals = getTotals();

  return (
    <LinearGradient
      colors={[themeColors.primary, colors.greenDark]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      {/* Balance Section */}
      <View style={styles.balanceSection}>
        <View style={styles.balanceHeader}>
          <Icons.Wallet size={28} color={colors.white} weight="duotone" />
          <Typo size={16} color={colors.white} style={{ opacity: 0.9 }}>
            Total Balance
          </Typo>
        </View>
        <Typo size={42} fontWeight="700" color={colors.white}>
          {formatCurrency(totals.balance)}
        </Typo>
      </View>

      {/* Stats Section */}
      <View style={styles.statsSection}>
        {/* Income */}
        <View style={[styles.statItem, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
          <View style={styles.statHeader}>
            <Icons.ArrowCircleUp size={24} color={colors.white} weight="duotone" />
            <Typo size={14} color={colors.white} style={{ opacity: 0.9 }}>
              Income
            </Typo>
          </View>
          <Typo size={20} color={colors.white} fontWeight="600">
            {formatCurrency(totals.income)}
          </Typo>
          <View style={styles.percentageContainer}>
            <Icons.TrendUp size={16} color={colors.greenLight} />
            <Typo size={12} color={colors.greenLight}>
              {totals.income > 0 ? '+' : ''}{((totals.income / (totals.income + totals.expense)) * 100).toFixed(1)}%
            </Typo>
          </View>
        </View>

        {/* Expenses */}
        <View style={[styles.statItem, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
          <View style={styles.statHeader}>
            <Icons.ArrowCircleDown size={24} color={colors.white} weight="duotone" />
            <Typo size={14} color={colors.white} style={{ opacity: 0.9 }}>
              Expenses
            </Typo>
          </View>
          <Typo size={20} color={colors.white} fontWeight="600">
            {formatCurrency(totals.expense)}
          </Typo>
          <View style={styles.percentageContainer}>
            <Icons.TrendDown size={16} color={colors.roseLight} />
            <Typo size={12} color={colors.roseLight}>
              {((totals.expense / (totals.income + totals.expense)) * 100).toFixed(1)}%
            </Typo>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: radius._20,
    padding: spacingY._25,
    gap: spacingY._25,
  },
  balanceSection: {
    gap: spacingY._10,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacingX._10,
  },
  statsSection: {
    flexDirection: 'row',
    gap: spacingX._15,
  },
  statItem: {
    flex: 1,
    borderRadius: radius._15,
    padding: spacingY._15,
    gap: spacingY._10,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacingX._8,
  },
  percentageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacingX._10,
  },
});

export default HomeCard;
