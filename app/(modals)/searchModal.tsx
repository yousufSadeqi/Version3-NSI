import { StyleSheet, View, ScrollView, Alert, Text } from 'react-native';
import React, { useState, useEffect } from 'react';
import { colors } from '@/constants/theme';
import { scale } from '@/utils/styling';
import ModalWrapper from '@/components/ModalWrapper';
import Header from '@/components/Header';
import BackButton from '@/components/BackButton';
import Input from '@/components/input';
import { TransactionType, WalletType } from '@/types';
import { useAuth } from '@/contexts/authContext';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { doc, deleteDoc, where, orderBy } from 'firebase/firestore';
import Animated, { 
  FadeIn, 
  Layout,
  FadeInDown
} from 'react-native-reanimated';
import useFetchData from '@/hooks/useFetchData';
import TransactionList from '@/components/TransactionList';

const searchModal = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false) 
  const router = useRouter() 
  const [search, setSearch] = useState(''); 

  const transactionConstraints = [
    where('uid', '==', user?.uid),
    orderBy('date', 'desc'),
  ];

  const {
    data: allTransactions,
    loading: transactionLoading,
  } = useFetchData<TransactionType>('transactions', transactionConstraints);

  const filteredTransaction = allTransactions.filter((item) => {
    if(search.length>1) {
      if(
        item.category?.toLowerCase()?.includes(search?.toLowerCase()) || 
        item.type?.toLowerCase()?.includes(search?.toLowerCase()) || 
        item.description?.toLowerCase()?.includes(search?.toLowerCase()) 
      ){
        return true;
      }
      return false
    }
    return true; 
  })


  return (
    <ModalWrapper style={{backgroundColor:colors.neutral900}}>
      <Header
        leftIcon={<BackButton />}
        title={'Search'}
      />
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View 
          style={styles.content}
          entering={FadeIn.duration(500)}
          layout={Layout.springify()}
        >
          <View style={styles.form}>
            <Animated.View entering={FadeInDown.delay(400).springify()}>
              <Input
                placeholder='shoes...'
                value={search}
                placeholderTextColor={colors.neutral400}
                onChangeText={(value) => setSearch(value )}
                containerStyle={{backgroundColor: colors.neutral800}}
              />
            </Animated.View>
          </View>
        </Animated.View>

        <View> 
          <TransactionList
            loading={transactionLoading} 
            data = {filteredTransaction}
            emptyListMessage='No result found'

          > 

          </TransactionList>
        </View>
      </ScrollView>
    </ModalWrapper>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: colors.neutral900,
  },
  content: {
    padding: 20,
    gap: 24,
  },
  form: {
    gap: 16,
  },
  input: {
    backgroundColor: colors.neutral800,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.neutral700,
  },
  footer: {
    padding: 20,
    paddingBottom: scale(34),
    backgroundColor: colors.neutral900,
    borderTopWidth: 1,
    borderTopColor: colors.neutral800,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  button: {
    height: 56,
    borderRadius: 12,
    backgroundColor: colors.primary,
  },
  saveButton: {
    flex: 1,
    height: 56,
    borderRadius: 12,
    backgroundColor: colors.primary,
  },
  deleteButton: {
    width: 100,
    height: 56,
    borderRadius: 12,
    backgroundColor: colors.rose,
  },
  buttonText: {
    color: colors.neutral900,
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default searchModal;
