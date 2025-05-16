import { StyleSheet, Text, View, ScrollView, Alert, Dimensions, TouchableOpacity, Pressable } from 'react-native';
import React, { useEffect, useState, useCallback, useMemo } from 'react';
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
import Animated, { 
  FadeIn, 
  FadeInDown, 
  FadeInUp, 
  useSharedValue, 
  withTiming, 
  useAnimatedStyle, 
  withSequence, 
  withDelay,
  interpolate,
  Extrapolate 
} from 'react-native-reanimated';
import { useTheme } from '@/contexts/themeContext';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

// Define chart data type to fix type errors
interface ChartDataItem {
  name: string;
  population: number;
  color: string;
  legendFontColor: string;
  legendFontSize: number;
  id: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const Statistics = () => {
  const { themeColors } = useTheme();
  const [activeIndex, setActiveIndex] = useState(0);
  const [chartLoading, setChartLoading] = useState(false);
  const { user } = useAuth();
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const [chartData, setChartData] = useState<ChartDataItem[]>([]);
  const [transaction, setTransaction] = useState<TransactionType[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<TransactionType[]>([]);
  
  const animatedValue = useSharedValue(0);
  const rotateValue = useSharedValue(0);
  const scaleValue = useSharedValue(1);

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
    animatedValue.value = 0;
    animatedValue.value = withTiming(1, { duration: 800 });
    rotateValue.value = withSequence(
      withTiming(0.1, { duration: 100 }),
      withTiming(0, { duration: 500 })
    );
    scaleValue.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withTiming(1, { duration: 500 })
    );
  }, [activeIndex]);

  useEffect(() => {
    if (selectedCategory) {
      const filtered = transaction.filter(txn => txn.category === selectedCategory);
      setFilteredTransactions(filtered);
    } else {
      setFilteredTransactions(transaction);
    }
  }, [selectedCategory, transaction]);

  const getWeeklyStats = async () => {
    setChartLoading(true);
    const res = await fetchWeeklyStats(user?.uid as string);
    setChartLoading(false);
    if (res.success) {
      setTransaction(res?.data?.transactions);
      setFilteredTransactions(res?.data?.transactions);
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
      setFilteredTransactions(res?.data?.transactions);
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
      setFilteredTransactions(res?.data?.transactions);
      generatePieChartData(res?.data?.transactions);
    } else {
      Alert.alert('Error', res.msg);
    }
  };

  const handleSegmentChange = (event: any) => {
    animatedValue.value = 0;
    setSelectedCategory(null);
    const newIndex = event.nativeEvent.selectedSegmentIndex;
    setActiveIndex(newIndex);
  };

  const generatePieChartData = (transactions: TransactionType[]) => {
    const categoryTotals: Record<string, number> = {};
  
    transactions.forEach(txn => {
      if (txn.category && !categoryTotals[txn.category]) { 
        categoryTotals[txn.category] = 0;
      }
      if (txn.category) {
        categoryTotals[txn.category] += txn.amount;
      }
    });
  
    const pieData = Object.entries(categoryTotals)
      .sort(([, a], [, b]) => b - a) 
      .map(([category, total]) => {
        const config = expenseCategories[category as keyof typeof expenseCategories] || incomeCategory;
        return {
          name: config?.label || category,
          population: total,
          color: config?.bgColor || colors.greenLight,
          legendFontColor: '#7F7F7F',
          legendFontSize: 15,
          id: category,
        };
      });
  
    setChartData(pieData);
  };
  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: animatedValue.value,
      transform: [
        { scale: scaleValue.value },
        { rotate: `${interpolate(rotateValue.value, [0, 1], [0, Math.PI * 2], Extrapolate.CLAMP)}rad` }
      ]
    };
  });

  const getSegmentLabel = () => {
    const labels = ['This Week', 'This Month', 'This Year'];
    return labels[activeIndex];
  };

  const getTotalAmount = () => {
    return chartData.reduce((sum, d) => sum + d.population, 0).toFixed(2);
  };

  const getIncomeVsExpense = useMemo(() => {
    let income = 0;
    let expense = 0;
    
    transaction.forEach(txn => {
      if (txn.type === 'income') {
        income += txn.amount;
      } else {
        expense += txn.amount;
      }
    });
    
    return { income, expense, balance: income - expense };
  }, [transaction]);

  const handleCategorySelect = (categoryId: string) => {
    if (selectedCategory === categoryId) {
      setSelectedCategory(null);
    } else {
      animatedValue.value = withSequence(
        withTiming(0.8, { duration: 100 }),
        withTiming(1, { duration: 300 })
      );
      setSelectedCategory(categoryId);
    }
  };

  const renderTimeSegments = () => {
    return (
      <View style={styles.timeSegmentContainer}>
        <View style={[styles.segmentWrapper, {backgroundColor: themeColors.surface}]}>
          <SegmentedControl
            values={['Weekly', 'Monthly', 'Annually']}
            selectedIndex={activeIndex}
            onChange={handleSegmentChange}
            tintColor={themeColors.primary}
            backgroundColor={themeColors.surface}
            appearance='dark'
            activeFontStyle={{...styles.segmentFontStyle, color: '#FFFFFF'}}
            style={styles.segmentStyle}
            fontStyle={{ ...styles.segmentFontStyle, color: themeColors.text }}
          />
        </View>
      </View>
    );
  };

  const renderSummaryCards = () => {
    return (
      <Animated.View 
        entering={FadeInDown.delay(100).duration(500)} 
        style={styles.summaryCardsContainer}
      >
        <Animated.View 
          entering={FadeInDown.delay(150).duration(500)}
          style={[styles.summaryCard, {backgroundColor: themeColors.surface}]}
        >
          <View style={styles.summaryIconContainer}>
            <MaterialCommunityIcons name="arrow-down" size={18} color={colors.green} />
          </View>
          <View>
            <Text style={[styles.summaryLabel, {color: themeColors.textSecondary}]}>Income</Text>
            <Text style={[styles.summaryValue, {color: themeColors.text}]}>${getIncomeVsExpense.income.toFixed(2)}</Text>
          </View>
        </Animated.View>
        
        <Animated.View 
          entering={FadeInDown.delay(200).duration(500)}
          style={[styles.summaryCard, {backgroundColor: themeColors.surface}]}
        >
          <View style={[styles.summaryIconContainer, {backgroundColor: `${colors.rose}20`}]}>
            <MaterialCommunityIcons name="arrow-up" size={18} color={colors.rose} />
          </View>
          <View>
            <Text style={[styles.summaryLabel, {color: themeColors.textSecondary}]}>Expense</Text>
            <Text style={[styles.summaryValue, {color: themeColors.text}]}>${getIncomeVsExpense.expense.toFixed(2)}</Text>
          </View>
        </Animated.View>
        
        <Animated.View 
          entering={FadeInDown.delay(250).duration(500)}
          style={[styles.summaryCard, {backgroundColor: themeColors.surface}]}
        >
          <View style={[styles.summaryIconContainer, {backgroundColor: `${colors.primary}20`}]}>
            <MaterialCommunityIcons 
              name={getIncomeVsExpense.balance >= 0 ? "bank" : "bank-off"} 
              size={18} 
              color={getIncomeVsExpense.balance >= 0 ? colors.primary : colors.rose} 
            />
          </View>
          <View>
            <Text style={[styles.summaryLabel, {color: themeColors.textSecondary}]}>Balance</Text>
            <Text 
              style={[
                styles.summaryValue, 
                {color: getIncomeVsExpense.balance >= 0 ? colors.green : colors.rose}
              ]}
            >
              ${Math.abs(getIncomeVsExpense.balance).toFixed(2)}
            </Text>
          </View>
        </Animated.View>
      </Animated.View>
    );
  };

  const renderPieChart = () => {
    return (
      <Animated.View 
        style={[styles.chartContainer, animatedStyle, { backgroundColor: themeColors.surface }]}
        entering={FadeInUp.delay(300).duration(500)}
      >
        {chartData.length > 0 ? (
          <>
            <View style={styles.chartHeaderContainer}>
              <Text style={[styles.chartHeader, {color: themeColors.text}]}>
                Spending Breakdown
              </Text>
              <Text style={[styles.periodLabel, { color: themeColors.textSecondary }]}>
                {getSegmentLabel()}
              </Text>
            </View>
            
            <View style={styles.chartWrapper}>
              <PieChart
                data={chartData}
                width={Dimensions.get('window').width - spacingX._40}
                height={240}
                chartConfig={{
                  backgroundColor: themeColors.surface,
                  backgroundGradientFrom: themeColors.surface,
                  backgroundGradientTo: themeColors.surface,
                  color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                  labelColor: () => themeColors.text,
                  style: {
                    borderRadius: 16,
                  },
                }}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="15"
                hasLegend={false}
                center={[10, 0]}
                absolute
                avoidFalseZero
              />
              
              {/* Donut Center Overlay */}
              <View style={styles.donutCenter}>
                <Animated.View 
                  entering={FadeIn.delay(500).duration(800)}
                  style={[styles.centerCircle, { backgroundColor: themeColors.surface }]}
                >
                  <Text style={[styles.centerLabel, { color: themeColors.textSecondary }]}>Total</Text>
                  <Text style={[styles.centerValue, { color: themeColors.text }]}>
                    ${getTotalAmount()}
                  </Text>
                  {selectedCategory && (
                    <TouchableOpacity
                      style={styles.resetButton}
                      onPress={() => setSelectedCategory(null)}
                    >
                      <Text style={styles.resetButtonText}>Reset Filter</Text>
                    </TouchableOpacity>
                  )}
                </Animated.View>
              </View>
            </View>
            
            {/* Legend */}
            <View style={styles.legendContainer}>
              {(showAllCategories ? chartData : chartData.slice(0, 4)).map((item, index) => (
                <AnimatedPressable
                  key={item.id}
                  entering={FadeInUp.delay(400 + index * 50).duration(400)}
                  style={[
                    styles.legendItem, 
                    selectedCategory === item.id && {
                      backgroundColor: `${item.color}20`,
                      borderRadius: radius._8
                    }
                  ]}
                  onPress={() => handleCategorySelect(item.id)}
                >
                  <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                  <View style={styles.legendTextContainer}>
                    <Text style={[
                      styles.legendText, 
                      { 
                        color: themeColors.text,
                        fontWeight: selectedCategory === item.id ? '700' : '500'
                      }
                    ]} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={[
                      styles.legendAmount, 
                      { 
                        color: selectedCategory === item.id ? item.color : themeColors.textSecondary,
                        fontWeight: selectedCategory === item.id ? '700' : '600'
                      }
                    ]}>
                      ${item.population.toFixed(2)}
                    </Text>
                  </View>
                </AnimatedPressable>
              ))}
              
              {chartData.length > 4 && (
                <TouchableOpacity 
                  style={styles.viewMoreButton}
                  onPress={() => setShowAllCategories(!showAllCategories)}
                >
                  <Text style={[styles.viewMoreText, {color: themeColors.primary}]}>
                    {showAllCategories ? 'Show Less' : `View ${chartData.length - 4} More`}
                  </Text>
                  <Ionicons 
                    name={showAllCategories ? 'chevron-up' : 'chevron-down'} 
                    size={16} 
                    color={themeColors.primary} 
                  />
                </TouchableOpacity>
              )}
            </View>
          </>
        ) : (
          <View style={[styles.noChart, { backgroundColor: themeColors.surfaceVariant }]}>
            <Ionicons name="analytics-outline" size={48} color={themeColors.textSecondary} style={{marginBottom: 10}} />
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
      </Animated.View>
    );
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
          {renderTimeSegments()}
          {renderSummaryCards()}
          {renderPieChart()}

          <Animated.View entering={FadeInUp.delay(400).duration(500)}>
            <TransactionList
              title={selectedCategory ? `${expenseCategories[selectedCategory as keyof typeof expenseCategories]?.label || selectedCategory} Transactions` : 'Recent Transactions'}
              emptyListMessage='No transactions found'
              data={filteredTransactions}
            />
          </Animated.View>
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
  timeSegmentContainer: {
    marginBottom: spacingY._5,
  },
  segmentWrapper: {
    borderRadius: radius._12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  segmentStyle: {
    height: scale(40),
  },
  segmentFontStyle: {
    fontSize: verticalScale(14),
    fontWeight: 'bold',
  },
  summaryCardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacingY._15,
  },
  summaryCard: {
    flex: 1,
    borderRadius: radius._15,
    padding: spacingY._15,
    marginHorizontal: spacingX._5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  summaryIconContainer: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    backgroundColor: `${colors.green}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacingY._10,
  },
  summaryLabel: {
    fontSize: verticalScale(12),
    fontWeight: '500',
    marginBottom: spacingY._3,
  },
  summaryValue: {
    fontSize: verticalScale(16),
    fontWeight: 'bold',
  },
  chartHeaderContainer: {
    marginBottom: spacingY._15,
    alignItems: 'center',
  },
  chartHeader: {
    fontSize: verticalScale(18),
    fontWeight: 'bold',
    marginBottom: spacingY._5,
  },
  periodLabel: {
    fontSize: verticalScale(14),
    fontWeight: '500',
    textAlign: 'center',
  },
  chartContainer: {
    padding: spacingY._20,
    borderRadius: radius._15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    marginBottom: spacingY._20,
  },
  chartWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacingY._15,
  },
  noChart: {
    height: verticalScale(240),
    borderRadius: radius._15,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacingY._20,
  },
  noDataText: {
    fontSize: verticalScale(16),
    fontWeight: '500',
  },
  chartLoadingContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: radius._15,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.1)',
    zIndex: 10,
  },
  donutCenter: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -50 }, { translateY: -50 }],
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerCircle: {
    width: scale(110),
    height: scale(110),
    borderRadius: scale(55),
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  centerLabel: {
    fontSize: verticalScale(12),
    fontWeight: '500',
    marginBottom: spacingY._5,
  },
  centerValue: {
    fontSize: verticalScale(22),
    fontWeight: 'bold',
  },
  legendContainer: {
    width: '100%',
    paddingHorizontal: spacingX._10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacingY._10,
    padding: spacingY._7,
    paddingHorizontal: spacingX._10,
  },
  legendColor: {
    width: scale(12),
    height: scale(12),
    borderRadius: scale(6),
    marginRight: spacingX._10,
  },
  legendTextContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  legendText: {
    fontSize: verticalScale(14),
    flex: 1,
    marginRight: spacingX._10,
  },
  legendAmount: {
    fontSize: verticalScale(14),
  },
  viewMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacingY._10,
  },
  viewMoreText: {
    fontSize: verticalScale(14),
    fontWeight: '600',
    marginRight: spacingX._5,
  },
  resetButton: {
    marginTop: spacingY._5,
    paddingVertical: spacingY._3,
    paddingHorizontal: spacingX._8,
    backgroundColor: colors.primary,
    borderRadius: radius._5,
  },
  resetButtonText: {
    color: 'white',
    fontSize: verticalScale(10),
    fontWeight: '600',
  },
});

export default Statistics;
