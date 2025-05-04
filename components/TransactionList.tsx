import { StyleSheet, TouchableOpacity, View } from 'react-native';
import React from 'react';
import Typo from './Typo';
import { TransactionItemProps, TransactionListType, TransactionType } from '@/types';
import { colors, radius, spacingX, spacingY } from '@/constants/theme';
import { FlashList } from '@shopify/flash-list';
import { verticalScale } from '@/utils/styling';
import Loading from './loading';
import { expenseCategories, incomeCategory } from '@/constants/data';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Timestamp } from 'firebase/firestore';
import { useRouter } from 'expo-router';
import * as Icons from 'phosphor-react-native';
import { useTheme } from '@/contexts/themeContext';

const TransactionList = ({
  data,
  title,
  loading,
  emptyListMessage,
}: TransactionListType) => {
  const { themeColors } = useTheme();
  const router = useRouter();

  const handleClick = (item: TransactionType) => {
    router.push({
      pathname: '/(modals)/transactionModal',
      params: {
        id: item.id,
        type: item.type,
        amount: item.amount,
        category: item.category,
        date: (item.date as Timestamp)?.toDate()?.toISOString(),
        description: item.description,
        image: item.image,
        uid: item.uid,
        walletId: item.walletId 
      }
    });
  };

  return (
    <View style={styles.container}>
      {title && (
        <View style={styles.header}>
          <Typo size={20} fontWeight={'600'} color={themeColors.text}>
            {title}
          </Typo>
          <TouchableOpacity 
            style={styles.filterButton}
            onPress={() => {/* Handle filter */}}
          >
            <Icons.Faders size={20} color={themeColors.textSecondary} />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.listContainer}>
        <FlashList
          data={data}
          renderItem={({ item, index }) => (
            <TransactionItem 
              item={item} 
              index={index} 
              handleClick={handleClick}
            />
          )}
          estimatedItemSize={200}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => !loading && (
            <View style={styles.emptyState}>
              <Icons.Receipt size={48} color={themeColors.textSecondary} weight="light" />
              <Typo size={16} color={themeColors.textSecondary} style={styles.emptyText}>
                {emptyListMessage}
              </Typo>
            </View>
          )}
        />
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <Loading />
        </View>
      )}
    </View>
  );
};

const TransactionItem = ({ item, index, handleClick }: TransactionItemProps) => {
  const { themeColors } = useTheme();
  let category = item?.type === 'income' ? incomeCategory : expenseCategories[item.category!];
  const IconComponent = category?.icon || Icons.CreditCard;

  const date = (item.date as Timestamp)?.toDate()?.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  });

  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(item.amount);

  // Determine the status icon based on transaction type
  const StatusIcon = item.type === 'income' ? Icons.ArrowUp : Icons.ArrowDown;
  const statusColor = item.type === 'income' ? colors.green : colors.rose;

  return (
    <Animated.View 
      entering={FadeInDown.delay(index * 50).springify().damping(14)}
    >
      <TouchableOpacity 
        style={[styles.transactionItem, { backgroundColor: themeColors.surface }]} 
        onPress={() => handleClick(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.iconContainer, { backgroundColor: category.bgColor }]}>
          <IconComponent size={24} weight="fill" color={colors.white} />
        </View>

        <View style={styles.contentContainer}>
          <View style={styles.mainInfo}>
            <Typo size={16} fontWeight="500" color={themeColors.text}>
              {category.label}
            </Typo>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={[styles.statusIconContainer, { backgroundColor: statusColor }]}>
            <StatusIcon size={10} color={colors.white} weight="bold" />
          </View>
          <Typo size={16} fontWeight="600" color={statusColor}>
            {item.type === 'income' ? '+' : '-'} {formattedAmount}
          </Typo>
          </View>


          </View>

          <View style={styles.secondaryInfo}>
            <Typo 
              size={13} 
              color={themeColors.textSecondary}
              style={styles.description}
            >
              {(item.description || 'No description').length > 25 
                ? (item.description || 'No description').substring(0, 25) + '...' 
                : (item.description || 'No description')}
            </Typo>
            <Typo size={13} color={themeColors.textSecondary}>
              {date}
            </Typo>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: spacingY._15,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacingY._10,
  },
  filterButton: {
    padding: spacingX._10,
    borderRadius: radius._10,
  },
  listContainer: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacingY._10,
    paddingVertical: spacingY._30,
  },
  emptyText: {
    textAlign: 'center',
    paddingHorizontal: spacingX._20,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacingY._12,
    marginBottom: spacingY._10,
    borderRadius: radius._15,
  },
  iconContainer: {
    width: verticalScale(44),
    height: verticalScale(44),
    borderRadius: radius._12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
    marginLeft: spacingX._12,
  },
  mainInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  secondaryInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  description: {
    flex: 1,
    marginRight: spacingX._10,
  },
  statusIconContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  }
  
});

export default TransactionList;
