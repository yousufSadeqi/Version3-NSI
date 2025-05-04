import { firestore } from "@/config/firebase";
import { ResponseType, TransactionType, WalletType } from "@/types";
import { collection, doc, getDoc, setDoc, updateDoc, runTransaction, query, where, Timestamp, orderBy, getDocs } from "firebase/firestore";
import { uploadFileToCloudinary } from "./ImageService";
import { getLast12Months, getLast7Days, getYearsRange } from "@/utils/common";
import { scale } from "@/utils/styling";
import { colors } from "@/constants/theme";

export const createOrUpdateTransaction = async (
    transactionData: Partial<TransactionType>
): Promise<ResponseType> => {
    try {
        let { id, type, walletId, amount, image } = transactionData;
        amount = Number(amount);

        if (!amount || amount < 0 || !walletId || !type) {
            return { success: false, msg: 'Invalid transaction data' };
        }

        if (image) {
            const imageUploadRes = await uploadFileToCloudinary(image, 'transactions');
            if (!imageUploadRes.success) {
                return { success: false, msg: imageUploadRes.msg || 'Failed to upload receipt' };
            }
            transactionData.image = imageUploadRes.data;
        }

        if (id) {
            // Update existing transaction
            const existTransactionSnapshot = await getDoc(doc(firestore, 'transactions', id));
            if (!existTransactionSnapshot.exists()) {
                return { success: false, msg: 'Transaction not found' };
            }

            const existTransaction = existTransactionSnapshot.data() as TransactionType;

            const shouldRevertOriginal = existTransaction.type !== type ||
                existTransaction.amount !== amount ||
                existTransaction.walletId !== walletId;

            if (shouldRevertOriginal) {
                const res = await revertAndUpdateWallets(existTransaction, amount, type, walletId);
                if (!res.success) return res;
            }

            const transactionRef = doc(firestore, 'transactions', id);
            await updateDoc(transactionRef, {
                ...transactionData,
                amount,
            });

            return { success: true, data: { ...transactionData, id } };
        } else {
            // Create new transaction
            const res = await updateWalletForNewTransaction(walletId, amount, type);
            if (!res.success) return res;

            const transactionRef = doc(collection(firestore, 'transactions'));
            await setDoc(transactionRef, {
                ...transactionData,
                amount,
                createdAt: new Date(),
            });

            return { success: true, data: { ...transactionData, id: transactionRef.id } };
        }
    } catch (error: any) {
        return { success: false, msg: error.message || 'Transaction not successful' };
    }
};

const updateWalletForNewTransaction = async (
    walletId: string,
    amount: number,
    type: string
): Promise<ResponseType> => {
    try {
        const walletRef = doc(firestore, 'Wallets', walletId);
        const walletSnapshot = await getDoc(walletRef);
        if (!walletSnapshot.exists()) {
            return { success: false, msg: 'Wallet does not exist' };
        }

        const walletData = walletSnapshot.data() as WalletType;
        const currentAmount = Number(walletData.amount || 0);
        const currentIncome = Number(walletData.totalIncome || 0);
        const currentExpenses = Number(walletData.totalExpenses || 0);

        if (type === 'expense' && currentAmount - amount < 0) {
            return { success: false, msg: `Insufficient funds. Available balance: $${currentAmount}` };
        }

        const updateType = type === 'income' ? 'totalIncome' : 'totalExpenses';
        const updateWalletAmount = type === 'income' ? currentAmount + amount : currentAmount - amount;
        const updatedTotals = type === 'income' ? currentIncome + amount : currentExpenses + amount;

        await updateDoc(walletRef, {
            amount: updateWalletAmount,
            [updateType]: updatedTotals,
        });

        console.log(`[Wallet Update] Wallet ${walletId}: New amount $${updateWalletAmount}, ${updateType}: $${updatedTotals}`);

        return { success: true };
    } catch (error: any) {
        return { success: false, msg: error.message || 'Failed to update wallet' };
    }
};

const revertAndUpdateWallets = async (
    existTransaction: TransactionType,
    newTransactionAmount: number,
    newTransactionType: string,
    newWalletId: string
): Promise<ResponseType> => {
    try {
        const originalWalletRef = doc(firestore, 'Wallets', existTransaction.walletId);
        const newWalletRef = doc(firestore, 'Wallets', newWalletId);

        const [originalWalletSnapshot, newWalletSnapshot] = await Promise.all([
            getDoc(originalWalletRef),
            getDoc(newWalletRef)
        ]);

        if (!originalWalletSnapshot.exists()) {
            return { success: false, msg: 'Original wallet not found' };
        }
        if (!newWalletSnapshot.exists()) {
            return { success: false, msg: 'New wallet not found' };
        }

        const originalWallet = originalWalletSnapshot.data() as WalletType;
        const newWallet = newWalletSnapshot.data() as WalletType;

        const originalAmount = Number(originalWallet.amount || 0);
        const originalIncome = Number(originalWallet.totalIncome || 0);
        const originalExpenses = Number(originalWallet.totalExpenses || 0);
        const newWalletAmount = Number(newWallet.amount || 0);
        const newIncome = Number(newWallet.totalIncome || 0);
        const newExpenses = Number(newWallet.totalExpenses || 0);

        const revertType = existTransaction.type === 'income' ? 'totalIncome' : 'totalExpenses';
        const revertValue = Number(existTransaction.amount);
        const revertAmountChange = existTransaction.type === 'income' ? -revertValue : revertValue;
        const newOriginalAmount = originalAmount + revertAmountChange;
        const newRevertTotal = revertType === 'totalIncome' ? originalIncome - revertValue : originalExpenses - revertValue;

        const availableBalance = existTransaction.walletId === newWalletId
            ? newOriginalAmount
            : newWalletAmount;

        if (newTransactionType === 'expense' && availableBalance < newTransactionAmount) {
            return { success: false, msg: `Insufficient funds. Available balance: $${availableBalance}` };
        }

        await runTransaction(firestore, async (transaction) => {
            // Revert original wallet
            transaction.update(originalWalletRef, {
                amount: newOriginalAmount,
                [revertType]: newRevertTotal,
            });

            // Update new wallet if changed
            if (newWalletId !== existTransaction.walletId) {
                const newType = newTransactionType === 'income' ? 'totalIncome' : 'totalExpenses';
                const adjustedNewAmount = newTransactionType === 'income'
                    ? newWalletAmount + newTransactionAmount
                    : newWalletAmount - newTransactionAmount;
                const adjustedNewTotal = newTransactionType === 'income'
                    ? newIncome + newTransactionAmount
                    : newExpenses + newTransactionAmount;

                transaction.update(newWalletRef, {
                    amount: adjustedNewAmount,
                    [newType]: adjustedNewTotal,
                });
            } else {
                const updateType = newTransactionType === 'income' ? 'totalIncome' : 'totalExpenses';
                const combinedWalletAmount = newTransactionType === 'income'
                    ? newOriginalAmount + newTransactionAmount
                    : newOriginalAmount - newTransactionAmount;
                const combinedTotal = newTransactionType === 'income'
                    ? newRevertTotal + newTransactionAmount
                    : newRevertTotal + newTransactionAmount;

                transaction.update(originalWalletRef, {
                    amount: combinedWalletAmount,
                    [updateType]: combinedTotal,
                });
            }
        });

        console.log(`[Revert+Update Wallets] Original wallet: ${existTransaction.walletId}, New wallet: ${newWalletId}`);

        return { success: true };
    } catch (error: any) {
        return { success: false, msg: error.message || 'Failed to update wallets' };
    }
};

export const deleteTransaction = async (transactionId: string): Promise<ResponseType> => {
    try {
        // Get transaction reference
        const transactionRef = doc(firestore, 'transactions', transactionId);
        const transactionSnapshot = await getDoc(transactionRef);

        if (!transactionSnapshot.exists()) {
            return { success: false, msg: 'Transaction not found' };
        }

        const transaction = transactionSnapshot.data() as TransactionType;
        const walletRef = doc(firestore, 'Wallets', transaction.walletId);
        const walletSnapshot = await getDoc(walletRef);

        if (!walletSnapshot.exists()) {
            return { success: false, msg: 'Associated wallet not found' };
        }

        const wallet = walletSnapshot.data() as WalletType;
        const currentAmount = Number(wallet.amount || 0);
        const currentIncome = Number(wallet.totalIncome || 0);
        const currentExpenses = Number(wallet.totalExpenses || 0);
        const transactionAmount = Number(transaction.amount);

        // Calculate new wallet values
        const updateType = transaction.type === 'income' ? 'totalIncome' : 'totalExpenses';
        const walletAmountChange = transaction.type === 'income' ? -transactionAmount : transactionAmount;
        const newWalletAmount = currentAmount + walletAmountChange;
        const newTotal = transaction.type === 'income' 
            ? currentIncome - transactionAmount 
            : currentExpenses - transactionAmount;

        // Use transaction to ensure atomic updates
        await runTransaction(firestore, async (firestoreTransaction) => {
            // Delete the transaction
            firestoreTransaction.delete(transactionRef);

            // Update the wallet
            firestoreTransaction.update(walletRef, {
                amount: newWalletAmount,
                [updateType]: newTotal,
            });
        });

        console.log(`[Delete Transaction] ID: ${transactionId}, Type: ${transaction.type}, Amount: $${transactionAmount}`);
        console.log(`[Wallet Update] ID: ${transaction.walletId}, New Amount: $${newWalletAmount}, ${updateType}: $${newTotal}`);

        return { 
            success: true, 
            msg: 'Transaction deleted successfully',
            data: { id: transactionId }
        };
    } catch (error: any) {
        console.error('[Delete Transaction Error]:', error);
        return { 
            success: false, 
            msg: error.message || 'Failed to delete transaction'
        };
    }
};


///////////////////////////////////////////



export const fetchWeeklyStats = async (uid: string): Promise<ResponseType> => {
  try {
    const db = firestore;
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);

    const transactionQuery = query(
      collection(db, 'transactions'),
      where('uid', '==', uid),
      where('date', '>=', Timestamp.fromDate(sevenDaysAgo)),
      where('date', '<=', Timestamp.fromDate(today)),
      orderBy('date', 'desc')
    );

    const querySnapshot = await getDocs(transactionQuery);
    const weeklyData = getLast7Days();
    const transactions: TransactionType[] = [];

    querySnapshot.forEach((docSnap) => {
      const transaction = docSnap.data() as TransactionType;
      transaction.id = docSnap.id;
      transactions.push(transaction);

      const rawDate = transaction.date instanceof Timestamp
        ? transaction.date.toDate()
        : new Date(transaction.date);

      const transactionDate = rawDate.toISOString().split('T')[0];
      const dayData = weeklyData.find(day => day.date === transactionDate);

      if (dayData) {
        if (transaction.type === 'income') {
          dayData.income += transaction.amount;
        } else if (transaction.type === 'expense') {
          dayData.expense += transaction.amount;
        }
      }
    });

    const stats = weeklyData.flatMap((day) => [
      {
        value: day.income,
        label: day.day,
        spacing: scale(4),
        labelWidth: scale(30),
        frontColor: colors.primary
      },
      {
        value: day.expense,
        frontColor: colors.rose
      }
    ]);

    return {
      success: true,
      msg: 'Transactions fetched successfully',
      data: {
        stats,
        transactions
      }
    };
  } catch (error: any) {
    console.error('[Fetch Weekly Stats Error]:', error);
    return {
      success: false,
      msg: error.message || 'Failed to fetch weekly stats'
    };
  }
};

export const fetchMonthlyStats = async (uid: string): Promise<ResponseType> => {
  try {
    const db = firestore;
    const today = new Date();
    const twelveMonthsAgo = new Date(today);
    twelveMonthsAgo.setFullYear(today.getFullYear() - 1);

    const transactionQuery = query(
      collection(db, 'transactions'),
      where('uid', '==', uid),
      where('date', '>=', Timestamp.fromDate(twelveMonthsAgo)),
      where('date', '<=', Timestamp.fromDate(today)),
      orderBy('date', 'desc')
    );

    const querySnapshot = await getDocs(transactionQuery);
    const monthlyData = getLast12Months();
    const transactions: TransactionType[] = [];

    querySnapshot.forEach((docSnap) => {
      const transaction = docSnap.data() as TransactionType;
      transaction.id = docSnap.id;
      transactions.push(transaction);

      const rawDate = transaction.date instanceof Timestamp
        ? transaction.date.toDate()
        : new Date(transaction.date);

      const monthName = rawDate.toLocaleString('default', { month: 'short' });
      const year = rawDate.getFullYear();
      const label = `${monthName} ${year}`;

      const monthData = monthlyData.find(month => month.month === label);

      if (monthData) {
        if (transaction.type === 'income') {
          monthData.income += transaction.amount;
        } else if (transaction.type === 'expense') {
          monthData.expense += transaction.amount;
        }
      }
    });

    const stats = monthlyData.flatMap((month) => [
      {
        value: month.income,
        label: month.month,
        spacing: scale(4),
        labelWidth: scale(30),
        frontColor: colors.primary
      },
      {
        value: month.expense,
        frontColor: colors.rose
      }
    ]);

    return {
      success: true,
      msg: 'Transactions fetched successfully',
      data: {
        stats,
        transactions
      }
    };
  } catch (error: any) {
    console.error('[Fetch Monthly Stats Error]:', error);
    return {
      success: false,
      msg: error.message || 'Failed to fetch monthly stats'
    };
  }
};

export const fetchAnnuallyStats = async (uid: string): Promise<ResponseType> => {
  try {
    const db = firestore;
    const today = new Date();
    const oneYearAgo = new Date(today);
    oneYearAgo.setFullYear(today.getFullYear() - 1);

    const transactionQuery = query(
      collection(db, 'transactions'),
      where('uid', '==', uid),
      orderBy('date', 'desc')
    );

    const querySnapshot = await getDocs(transactionQuery);
    const transactions: TransactionType[] = [];

    const firstTransaction = querySnapshot.docs.reduce((earliest, doc) => {
      const transactionDate = doc.data().date.toDate();
      return transactionDate < earliest ? transactionDate : earliest;
    }, new Date());

    const firstYear = firstTransaction.getFullYear();
    const currentYear = today.getFullYear();

    const yearlyData = getYearsRange(firstYear, currentYear);

    querySnapshot.forEach((docSnap) => {
      const transaction = docSnap.data() as TransactionType;
      transaction.id = docSnap.id;
      transactions.push(transaction);

      const rawDate = transaction.date instanceof Timestamp
        ? transaction.date.toDate()
        : new Date(transaction.date);

      const year = rawDate.getFullYear();
      const yearData = yearlyData.find(item => item.year === year);

      if (yearData) {
        if (transaction.type === 'income') {
          yearData.income += transaction.amount;
        } else if (transaction.type === 'expense') {
          yearData.expense += transaction.amount;
        }
      }
    });

    const stats = yearlyData.flatMap((year) => [
      {
        value: year.income,
        label: year.year.toString(),
        spacing: scale(4),
        labelWidth: scale(35),
        frontColor: colors.primary
      },
      {
        value: year.expense,
        frontColor: colors.rose
      }
    ]);

    return {
      success: true,
      msg: 'Transactions fetched successfully',
      data: {
        stats,
        transactions
      }
    };
  } catch (error: any) {
    console.error('[Fetch Annually Stats Error]:', error);
    return {
      success: false,
      msg: error.message || 'Failed to fetch annually stats'
    };
  }
};
