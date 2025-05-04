import { StyleSheet, Text, View, ScrollView, Alert, Dimensions } from 'react-native';
import React, { useEffect, useState } from 'react';
import ScreenWrapper from '@/components/ScreenWrapper';
import { colors, radius, spacingX, spacingY } from '@/constants/theme';
import { scale, verticalScale } from '@/utils/styling';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import { PieChart } from 'react-native-chart-kit';
import Header from '@/components/Header';
import Loading from '@/components/loading';
import { useAuth } from '@/contexts/authContext';
import { fetchAnnuallyStats, fetchMonthlyStats, fetchWeeklyStats } from '@/service/transactionService';
import TransactionList from '@/components/TransactionList';
import { TransactionType } from '@/types';
import { expenseCategories, incomeCategory } from '@/constants/data';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useTheme } from '@/contexts/themeContext';

const Statistics = () => {
  const { themeColors } = useTheme();
  const [activeIndex, setActiveIndex] = useState(0);
  const [chartLoading, setChartLoading] = useState(false);
  const { user } = useAuth();

  const [chartData, setChartData] = useState([]);
  const [transaction, setTransaction] = useState<TransactionType[]>([]);

  // Update chartData when activeIndex changes
  const updateChartData = (index: number) => {
    switch (index) {
      case 0:
        getWeeklyStats();
        break;
      case 1:
        getMonthlyStats();
        break;
      case 2:
        getAnnuallyStats();
        break;
      default:
        setChartData([]);
    }
  };


  useEffect(() => {
    updateChartData(activeIndex);
  }, [activeIndex]);

  const getWeeklyStats = async () => {
    setChartLoading(true);
    const res = await fetchWeeklyStats(user?.uid as string);
    setChartLoading(false);
    if (res.success) {
      setTransaction(res?.data?.transactions);
      generatePieChartData(res?.data?.transactions);
    } else {
      Alert.alert('Error', res.msg);
    }
  };

  

  const getMonthlyStats = async () => {
    setChartLoading(true);
    const res = await fetchMonthlyStats(user?.uid as string);
    setChartLoading(false);
    if (res.success) {
      setTransaction(res?.data?.transactions);
      generatePieChartData(res?.data?.transactions);
    } else {
      Alert.alert('Error', res.msg);
    }
  };

  const getAnnuallyStats = async () => {
    setChartLoading(true);
    const res = await fetchAnnuallyStats(user?.uid as string);
    setChartLoading(false);
    if (res.success) {
      setTransaction(res?.data?.transactions);
      generatePieChartData(res?.data?.transactions);
    } else {
      Alert.alert('Error', res.msg);
    }
  };

  const handleSegmentChange = (event: any) => {
    const newIndex = event.nativeEvent.selectedSegmentIndex;
    setActiveIndex(newIndex);
  };

  const generatePieChartData = (transactions: TransactionType[]) => {
    const categoryTotals: Record<string, number> = {};
  
    transactions.forEach(txn => {
      if (!categoryTotals[txn.category]) { 
        categoryTotals[txn.category] = 0;
      }
      // solve it later don't know why it's red also the pieData
      categoryTotals[txn.category] += txn.amount;
    });
  
    const pieData = Object.entries(categoryTotals)
      .sort(([, a], [, b]) => b - a) 
      .map(([category, total]) => {
        const config = expenseCategories[category] || incomeCategory;
        return {
          name: config?.label || category,
          population: total,
          color: config?.bgColor || colors.greenLight,
          legendFontColor: '#7F7F7F',
          legendFontSize: 15,
        };
      });
  
    setChartData(pieData);
  };
  

  return (
    <ScreenWrapper>
      <View style={[styles.container, { backgroundColor: themeColors.background }]}>
        <View style={styles.header}>
          <Header title='Statistics' />
        </View>

        <ScrollView
          contentContainerStyle={[styles.scrollContent, { backgroundColor: themeColors.background }]}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View 
            entering={FadeIn.duration(500)}
            style={[styles.card, { backgroundColor: themeColors.surface }]}
          >
            <SegmentedControl
              values={['Weekly', 'Monthly', 'Annually']}
              selectedIndex={activeIndex}
              onChange={handleSegmentChange}
              tintColor={themeColors.primary}
              backgroundColor={themeColors.surfaceVariant}
              appearance='dark'
              activeFontStyle={styles.segmentFontStyle}
              style={styles.segmentStyle}
              fontStyle={{ ...styles.segmentFontStyle, color: themeColors.text }}
            />

            <View style={styles.chartContainer}>
              {chartData.length > 0 ? (
                <PieChart
                  data={chartData}
                  width={Dimensions.get('window').width - spacingX._40}
                  height={220}
                  chartConfig={{
                    backgroundColor: themeColors.surface,
                    backgroundGradientFrom: themeColors.surface,
                    backgroundGradientTo: themeColors.surface,
                    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                    labelColor: () => themeColors.text,
                    style: {
                      borderRadius: radius._20,
                    },
                  }}
                  accessor="population"
                  backgroundColor="transparent"
                  paddingLeft="15"
                  absolute
                  hasLegend={true}
                  center={[0, 0]}
                />
              ) : (
                <View style={[styles.noChart, { backgroundColor: themeColors.surfaceVariant }]}>
                  <Text style={[styles.noDataText, { color: themeColors.textSecondary }]}>
                    No expense data available
                  </Text>
                </View>
              )}

              {chartLoading && (
                <View style={[styles.chartLoadingContainer, { backgroundColor: themeColors.surfaceVariant }]}>
                  <Loading color={themeColors.primary} />
                </View>
              )}
            </View>
          </Animated.View>

          <TransactionList
            title='Transactions'
            emptyListMessage='No transactions found'
            data={transaction}
          />
        </ScrollView>
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacingX._20,
    paddingVertical: spacingY._5,
  },
  header: {
    marginBottom: spacingY._10,
  },
  scrollContent: {
    gap: spacingY._20,
    paddingTop: spacingY._5,
    paddingBottom: verticalScale(100),
  },
  card: {
    borderRadius: radius._20,
    padding: spacingY._20,
    gap: spacingY._20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  segmentStyle: {
    height: scale(37),
  },
  segmentFontStyle: {
    fontSize: verticalScale(13),
    fontWeight: 'bold',
  },
  chartContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacingY._20,
    borderRadius: radius._12,
  },
  noChart: {
    height: verticalScale(210),
    borderRadius: radius._12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataText: {
    fontSize: verticalScale(16),
    fontWeight: '500',
  },
  chartLoadingContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: radius._12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Statistics;
