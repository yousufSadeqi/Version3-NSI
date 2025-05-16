// Todo fix the camera permission cause it need full access instead of only camera permission 



import { StyleSheet, View, ScrollView, Alert, Text, ViewStyle, Pressable, Platform, TouchableOpacity, Dimensions, Image, ActivityIndicator } from 'react-native';
import React, { useState, useMemo, useEffect } from 'react';
import { colors, radius, spacingX, spacingY } from '@/constants/theme';
import { scale, verticalScale } from '@/utils/styling';
import ModalWrapper from '@/components/ModalWrapper';
import Header from '@/components/Header';
import BackButton from '@/components/BackButton';
import Typo from '@/components/Typo';
import Input from '@/components/input';
import { TransactionType, WalletType } from '@/types';
import Button from '@/components/Button';
import { useAuth } from '@/contexts/authContext';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import ImageUpload from '@/components/ImageUpload';
import CustomAlert from '@/components/CustomAlert';
import Animated, { FadeIn, FadeOut, FadeInDown, Layout } from 'react-native-reanimated';
import * as Icons from 'phosphor-react-native';
import { Dropdown } from 'react-native-element-dropdown';
import { expenseCategories, incomeCategory } from '@/constants/data';
import useFetchData from '@/hooks/useFetchData';
import { where } from 'firebase/firestore';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { createOrUpdateTransaction, deleteTransaction } from '@/service/transactionService';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import { useTheme } from '@/contexts/themeContext';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { Linking } from 'react-native';
import { processReceipt } from '@/service/ReceiptService';
import { uploadFileToCloudinary } from '@/service/ImageService';
import { ENDPOINTS } from '@/config/api';
import Modal from 'react-native-modal';
import Loading from '@/components/loading';
import ScreenWrapper from '@/components/ScreenWrapper';

// Camera Dimensision Full screen
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCAN_AREA_SIZE = SCREEN_WIDTH * 0.85;

type CategoryOption = {
  label: string;
  value: string;
  icon: () => JSX.Element;
};

type paramType = {
  id: string,
  type: string,
  amount: string,
  category: string,
  date: string,
  description: string,
  image: any,
  uid: string,
  walletId: string
};

type ReceiptData = {
  merchant?: string;
  amount?: number;
  date?: string;
  description?: string;
  category?: string;
  raw_text?: string;
  items?: Array<{name: string, price: number}>;
};

const TransactionModal = () => {
  const { user } = useAuth();
  const router = useRouter();
  const existTransaction: paramType = useLocalSearchParams();
  const [isExistingTransaction, setIsExistingTransaction] = useState(false);
  const { isDarkMode, themeColors } = useTheme();
  const [activeIndex, setActiveIndex] = useState(0); // 0 for Manual, 1 for Auto
  // const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [cameraType, setCameraType] = useState<'front' | 'back'>('back');
  const [flash, setFlash] = useState<'on' | 'off'>('off');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const cameraRef = React.useRef<any>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  // const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [isProcessingReceipt, setIsProcessingReceipt] = useState(false);
  const [isServerOnline, setIsServerOnline] = useState(false);
  const [processingStep, setProcessingStep] = useState('Initializing...');
  const [receiptData, setReceiptData] = useState<any>(null);
  
  const [showFullScreenLoader, setShowFullScreenLoader] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [processingError, setProcessingError] = useState<string | null>(null);

  // New camera 
  const [isCameraOn, setCameraOn] = useState(false);
  const [facing, setFacing] = useState('back');
  const [photo, setPhoto] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleRetry = () => {
    setPhoto(null);
    setIsLoading(false);
  };


  const { data: wallets } = useFetchData<WalletType>('Wallets', [
    where('uid', '==', user?.uid),
  ]);
  const [transaction, setTransaction] = useState<TransactionType>({
    type: 'expense',
    amount: 0,
    description: '',
    category: '',
    date: new Date(),
    walletId: '', 
    image: null,
  });

  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [wallet, setWallet] = useState()

  const walletOptions = useMemo(() => 
    wallets?.map(wallet => ({
      label: `${wallet.name} ($${wallet.amount || 0})`,
      value: wallet.id || '',
    })) || [], 
    [wallets]
  );

  const categoryOptions = useMemo(() => {
    if (transaction.type === 'income') {
      return [{
        label: incomeCategory.label,
        value: incomeCategory.value,
        icon: () => (
          <incomeCategory.icon
            size={20}
            color={colors.white}
            weight="bold"
          />
        ),
      }];
    }

    return Object.entries(expenseCategories).map(([key, category]) => ({
      label: category.label,
      value: key,
      icon: () => (
        <category.icon
          size={20}
          color={colors.white}
          weight="bold"
        />
      ),
    }));
  }, [transaction.type]);

  const onPickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photo library');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets?.[0]) {
        setTransaction(prev => ({
          ...prev,
          image: result.assets[0].uri  // ✅ THIS is where you store the URI only
        }));
      }
    } catch (error) {
      console.error("Image picker error:", error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const handleImageClear = () => {
    Alert.alert('Remove Image', 'Are you sure you want to remove this image?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => setTransaction(prev => ({ ...prev, image: null })) }
    ]);
  };

  useEffect(() => {
    console.log('Transaction ID:', existTransaction.id);
    if (existTransaction.id) {
      setIsExistingTransaction(true);
      setTransaction({
        id: existTransaction.id,
        type: existTransaction.type,
        amount: Number(existTransaction.amount),
        description: existTransaction.description || '',
        category: existTransaction.category,
        date: new Date(existTransaction.date),
        walletId: existTransaction.walletId,
        image: existTransaction.image || null,
      });
    }
  }, []);

  useEffect(() => {
    checkServerStatus();
  }, []);

  const checkServerStatus = async () => {
    try {
      console.log('Checking server status at:', ENDPOINTS.HEALTH);
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), 5000) 
      );
      
      const fetchPromise = fetch(ENDPOINTS.HEALTH, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
      });
      
      const response = await Promise.race([fetchPromise, timeoutPromise]) as Response;
      
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }
      
      const result = await response.json();
      
      const isOnline = result.status === 'success' && result.server_status === 'online';
      setIsServerOnline(isOnline);
      console.log('Server status:', isOnline ? 'Online' : 'Offline');
      
      return isOnline;
    } catch (error) {
      console.error('Server is offline or unreachable:', error);
      console.error('Using server URL:', ENDPOINTS.HEALTH);
      setIsServerOnline(false);
      
      if (error instanceof TypeError) {
        console.error('Network error - likely no internet connection');
      } else if (error instanceof Error && error.message.includes('timeout')) {
        console.error('Connection timed out - server may be overloaded');
      }
      
      return false;
    }
  };
  // This is useless cause I found out that there is a function useCameraPermission that can do it for me
  // const handleCameraPermissionDenied = () => {
  //   Alert.alert(
  //     'Camera Permission Required',
  //     'Please enable camera access in your device settings to use the auto scan feature.',
  //     [
  //       { text: 'Cancel', style: 'cancel' },
  //       { 
  //         text: 'Open Settings', 
  //         onPress: () => {
  //           if (Platform.OS === 'ios') {
  //             Linking.openURL('app-settings:');
  //           } else {
  //             Linking.openSettings();
  //           }
  //         }
  //       }
  //     ]
  //   );
  // };

  const handleSaveTransaction = async () => {
    const {type, amount, description, category, date, walletId, image} = transaction;
    if (!amount || !description || !category || !walletId) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    if (!user?.uid) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    setLoading(true);
    try {
      const transactionData: TransactionType = {
        ...(isExistingTransaction && { id: existTransaction.id }),
        type, 
        amount, 
        description,
        category,
        date,
        uid: user.uid,
        walletId,
        image,
      };

      const res = await createOrUpdateTransaction(transactionData);
      if (res.success) {
        router.back();
      } else {
        Alert.alert('Error', res.msg || 'Failed to save transaction');
      }
    } catch (error) {
      console.error('Error saving transaction:', error);
      Alert.alert('Error', 'Failed to save transaction');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTransaction = () => {
    if (!existTransaction.id) {
      return;
    }

    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to delete this transaction? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const res = await deleteTransaction(existTransaction.id);
              if (res.success) {
                Alert.alert('Success', 'Transaction deleted successfully');
                router.back();
              } else {
                Alert.alert('Error', res.msg || 'Failed to delete transaction');
              }
            } catch (error) {
              console.error('Delete transaction error:', error);
              Alert.alert('Error', 'Failed to delete transaction');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const renderHeaderRight = () => {
    if (!existTransaction.id) return null;

    return (
      <TouchableOpacity
        onPress={handleDeleteTransaction}
        style={styles.deleteButton}
        disabled={loading}
      >
        <Icons.Trash size={24} color={colors.rose} weight="bold" />
      </TouchableOpacity>
    );
  };

  // const renderDropdownIcon = () => (
  //   <Icons.CaretDown size={20} color={colors.neutral300} weight="bold" />
  // );

  const renderLeftIcon = (visible?: boolean) => {
    const selectedCategory = categoryOptions.find(cat => cat.value === transaction.category);
    return selectedCategory?.icon?.() || null;
  };

  const renderItem = (item: any) => {
    return (
      <View style={styles.dropdownItem}>
        {item.icon && (
          <View style={styles.dropdownIconContainer}>
            {item.icon()}
          </View>
        )}
        <Text style={styles.dropItemText}>{item.label}</Text>
      </View>
    );
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    const isAndroid = Platform.OS === 'android';

    if (isAndroid) {
      if (event.type === 'set' && selectedDate) {
        setTransaction(prev => ({ ...prev, date: selectedDate }));
      }
      // Always close the picker on Android
      setShowDatePicker(false);
    } else {
      // iOS: updates live as user scrolls
      if (selectedDate) {
        setTransaction(prev => ({ ...prev, date: selectedDate }));
      }
    }
  };



  const handleSegmentChange = (event: any) => {
    setActiveIndex(event.nativeEvent.selectedSegmentIndex);
  };

  const handleNetworkError = (error: any) => {
    console.error('Network error when processing receipt:', error);
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Failed to connect to receipt processing server';
      
    setShowFullScreenLoader(false);
    setIsProcessing(false);
    setIsProcessingReceipt(false);
    setIsCameraActive(false);
    setCameraOn(false);
    
    Alert.alert(
      'Connection Error',
      'Unable to reach the receipt processing server. Would you like to manually enter transaction details instead?',
      [
        { 
          text: 'Try Again', 
          onPress: () => {
            checkServerStatus().then(isOnline => {
              if (isOnline) {
                Alert.alert('Server is online', 'You can try scanning again.');
              } else {
                Alert.alert('Server still offline', 'Please try again later or enter details manually.');
              }
            });
          }
        },
        { 
          text: 'Enter Manually', 
          onPress: () => {
            setActiveIndex(0);
            
            if (capturedImage) {
              setTransaction(prev => ({
                ...prev,
                image: capturedImage
              }));
            }
          }
        }
      ],
      { cancelable: false }
    );
  };

  const handleScanReceipt = async () => {
    try {
      const isOnline = await checkServerStatus();
      
      if (!isOnline) {
        Alert.alert(
          'Server Unavailable',
          'The receipt processing server is currently offline. Would you like to enter transaction details manually instead?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Try Again', onPress: checkServerStatus },
            { 
              text: 'Enter Manually', 
              onPress: () => setActiveIndex(0)
            }
          ]
        );
        return;
      }

      setTimeout(async () => {
        if (!cameraRef.current) {
          setIsCameraActive(false);
          Alert.alert('Error', 'Could not initialize camera. Please try again.');
          return;
        }
    
        try {
          setIsProcessing(true);
          const photo = await cameraRef.current.takePictureAsync({
            quality: 0.7,
            skipProcessing: true,
          });
          
          // Immediately disable camera after capturing
          setIsCameraActive(false);
          setShowFullScreenLoader(true);
          setCapturedImage(photo.uri);
          
          try {
            const uploadResult = await uploadFileToCloudinary(
              { uri: photo.uri, type: 'image/jpeg' },
              'Receipt Photos'
            );
            
            if (!uploadResult.success) {
              throw new Error(uploadResult.msg || 'Failed to upload image');
            }

            await processReceivedImage(photo.uri);
          } catch (uploadError) {
            console.error('Error uploading image:', uploadError);
            
            try {
              await processReceivedImage(photo.uri);
            } catch (processError) {
              handleNetworkError(processError);
            }
          }
        } catch (error) {
          console.error('Error taking picture:', error);
          setProcessingError('Failed to capture photo. Please try again.');
          setShowFullScreenLoader(false);
          setIsCameraActive(false);
        } finally {
          setIsProcessing(false);
        }
      }, 500); 
    } catch (error) {
      console.error('Error during server check:', error);
      handleNetworkError(error);
    }
  };

  const processReceivedImage = async (imageUri: string) => {
    if (!imageUri) {
      setProcessingError('No image captured');
      setShowFullScreenLoader(false);
      setIsCameraActive(false);
      setCameraOn(false);
      return;
    }

    setIsProcessingReceipt(true);
    setProcessingStep('Analyzing receipt...');
    
    try {
      console.log('Starting receipt processing with image:', imageUri.substring(0, 30) + '...');
      
      const timeoutDuration = 120000; //////////////60 secs todo/ make a function that base on the user device higher or lower the time
      let processingTimedOut = false;
      
      const timeoutId = setTimeout(() => {
        processingTimedOut = true;
        throw new Error('Receipt processing timed out. The server may be overloaded.');
      }, timeoutDuration);
      
      const receiptResult = await processReceipt(imageUri);
      
      clearTimeout(timeoutId);
      
      if (processingTimedOut) return;
      
      if (!receiptResult.success) {
        throw new Error(receiptResult.error || 'Failed to process receipt');
      }
      
      const data = receiptResult.data || {};
      
      setReceiptData(data);
      // Todo find out why it's giving the red underline while working compleletly fine
      const amount = typeof data.amount === 'number' ? data.amount : 0;
      const category = data.category || 'other';
      
      setTransaction(prev => ({
        ...prev,
        amount: amount,
        description: data.description || data.merchant || 'Receipt',
        category: category,
        walletId: wallet?.value,
        date: data.date ? new Date(data.date) : new Date(),
        image: imageUri
      }));
      setShowFullScreenLoader(false);
      setShowResultModal(true);
      console.log('Receipt data successfully processed and transaction state updated');
      
    } catch (error) {
      console.error('Error processing transaction:', error);
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (
        errorMessage.includes('network') || 
        errorMessage.includes('connection') || 
        errorMessage.includes('timeout') ||
        errorMessage.includes('No response from server')
      ) {
        handleNetworkError(error);
      } else {
        setProcessingError(errorMessage);
        setShowFullScreenLoader(false);
      }
    } finally {
      setIsProcessingReceipt(false);
      setIsCameraActive(false);
      setCameraOn(false);
    }
  };

  const toggleFlash = () => {
    setIsFlashOn(!isFlashOn);
  };
// for putting later 
  // const renderPreviewUI = () => {
  //   if (!capturedImage) return null;

  //   return (
  //     <View style={styles.previewContainer}>
  //       <Image 
  //         source={{ uri: capturedImage }} 
  //         style={styles.previewImage}
  //         resizeMode="contain"
  //       />
  //       <View style={styles.previewControls}>
  //         <TouchableOpacity 
  //           style={[styles.previewButton, styles.retakeButton]}
  //           onPress={handleRetake}
  //           disabled={isProcessingReceipt}
  //         >
  //           <Icons.ArrowCounterClockwise size={24} color={colors.white} weight="bold" />
  //           <Typo size={16} color={colors.white}>Retake</Typo>
  //         </TouchableOpacity>
          
  //         <TouchableOpacity 
  //           style={[styles.previewButton, styles.usePhotoButton]}
  //           onPress={handleUsePhoto}
  //           disabled={isProcessingReceipt}
  //         >
  //           {isProcessingReceipt ? (
  //             <>
  //               <Icons.CircleNotch size={24} color={colors.white} weight="bold" />
  //               <Typo size={16} color={colors.white}>{processingStep || 'Processing...'}</Typo>
  //             </>
  //           ) : (
  //             <>
  //               <Icons.Check size={24} color={colors.white} weight="bold" />
  //               <Typo size={16} color={colors.white}>Use Photo</Typo>
  //             </>
  //           )}
  //         </TouchableOpacity>
  //       </View>
  //     </View>
  //   );
  // };

      // if (isPreviewMode) {
    //   return renderPreviewUI();
    // }

  const renderCameraUI = () => {
    if (!permission) {
      return (
        <Animated.View 
          style={styles.autoScanContainer}
          entering={FadeIn.duration(500)}
        >
          <Icons.CircleNotch size={40} color={colors.primary} weight="bold" />
          <Typo size={16} color={colors.neutral300}>Requesting camera permission...</Typo>
        </Animated.View>
      );
    }

    if (!permission.granted) {
      return (
        <Animated.View 
          style={styles.autoScanContainer}
          entering={FadeIn.duration(500)}
        >
          <Icons.CameraSlash size={80} color={colors.neutral400} weight="thin" />
          <Typo size={18} color={colors.neutral300} style={styles.autoScanText}>
            Camera access denied
          </Typo>
          <Typo size={14} color={colors.neutral500} style={styles.autoScanSubtext}>
            Please enable camera access to use the auto scan feature
          </Typo>
          <Button 
            onPress={requestPermission}
            style={styles.permissionButton}
          >
            <Typo size={16} fontWeight="600" color={colors.white}>
              Open Settings
            </Typo>
          </Button>
        </Animated.View>
      );
    }



    // Display if server is offline --------------------------
    if (!isServerOnline) {
    return (
      <Animated.View 
          style={styles.autoScanContainer}
          entering={FadeIn.duration(500)}
        >
          <Icons.CloudSlash size={80} color={colors.rose} weight="thin" />
          <Typo size={18} color={colors.rose} style={styles.autoScanText}>
            Server connection failed
          </Typo>
          <Typo size={14} color={colors.neutral500} style={styles.autoScanSubtext}>
            The receipt processing server is currently unreachable. Please check your network connection and server status.
          </Typo>
          <Button 
            onPress={checkServerStatus}
            style={styles.permissionButton}
          >
            <Typo size={16} fontWeight="600" color={colors.white}>
              Retry Connection
            </Typo>
          </Button>
        </Animated.View>
      );
    }
    if (!wallet) {
      return (
        <Animated.View 
          style={styles.autoScanContainer}
          entering={FadeIn.duration(500)}
        >
          <Icons.Wallet size={50} color={colors.primary} weight="thin" />
    
          <Typo size={18} color={colors.primary} style={styles.autoScanText}>
            Set your wallet before adding an expense
          </Typo>
    
          <Typo size={14} color={colors.neutral500} style={styles.autoScanSubtext}>
            Select a wallet from the list below
          </Typo>
    
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icons.Wallet size={20} color={colors.neutral300} />
              <Typo size={14} color={colors.neutral300}>Wallet</Typo>
            </View>
    
            <View style={styles.walletList}>
        {walletOptions.map((item) => (
          <TouchableOpacity
            key={item.value}
            style={[
              styles.walletItem,
              // Todo find out why it's giving the red underline while working compleletly fine
              wallet?.value === item.value && styles.walletItemSelected,
            ]}
            onPress={() => {
              console.log(item)
              // Todo find out why it's giving the red underline while working compleletly fine
              setWallet(item)}}

          >
            <View style={styles.walletItemRow}>
              <Icons.Wallet size={20} color={colors.white} />
              <Typo size={16} color={colors.white} style={styles.walletItemText}>
                {item.label}
              </Typo>
            </View>
          </TouchableOpacity>
          ))}
        </View>
          </View>
        </Animated.View>
      );
    }
    
    setIsCameraActive(true);
    setCameraOn(true);
  };

  const renderFullScreenLoader = () => {
    if (!showFullScreenLoader) return null;
    
    return (
      <View style={styles.fullScreenOverlay}>
        <View style={styles.loaderContainer}>
          <Loading />
          <Typo size={18} color={colors.white} style={styles.loaderText}>
            {processingStep || 'Processing receipt...'}
          </Typo>
          {processingError && (
            <Typo size={14} color={colors.rose} style={styles.errorText}>
              {processingError}
            </Typo>
          )}
        </View>
      </View>
    );
  };

  const renderResultModal = () => {
    if (!receiptData) return null;
    
    return (
      <Modal
        isVisible={showResultModal}
        backdropOpacity={0.6}
        animationIn="fadeIn"
        animationOut="fadeOut"
        onBackdropPress={() => setShowResultModal(false)}
        style={styles.modal}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Typo size={20} fontWeight="600" color={colors.white}>
              Receipt Processed
            </Typo>
            <TouchableOpacity onPress={() => setShowResultModal(false)}>
              <Icons.X size={24} color={colors.white} weight="bold" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.resultDetails}>
            <View style={styles.resultRow}>
              <Typo size={14} color={colors.neutral400}>Merchant</Typo>
              <Typo size={16} color={colors.white}>{receiptData?.merchant || 'Unknown'}</Typo>
            </View>
            
            <View style={styles.resultRow}>
              <Typo size={14} color={colors.neutral400}>Amount</Typo>
              <Typo size={16} color={colors.white}>${receiptData?.amount || '0.00'}</Typo>
            </View>
            
            <View style={styles.resultRow}>
              <Typo size={14} color={colors.neutral400}>Date</Typo>
              <Typo size={16} color={colors.white}>
                {receiptData?.date ? format(new Date(receiptData.date), 'MMMM dd, yyyy') : 'Today'}
              </Typo>
            </View>


            
            <View style={styles.resultRow}>
              <Typo size={14} color={colors.neutral400}>Category</Typo>
              <Typo size={16} color={colors.white} style={{textTransform: 'capitalize'}}>
                {receiptData?.category || 'Other'}
              </Typo>
            </View>

            <View style={styles.resultRow}>
              <Typo size={14} color={colors.neutral400}>Description</Typo>
              <Typo size={16} color={colors.white}>{receiptData?.description || 'Unknown'}</Typo>
            </View>
          </View>
          
          <View style={styles.modalActions}>
              <TouchableOpacity 
              style={styles.modalButton}
              onPress={() => {
                setShowResultModal(false);
                setIsCameraActive(false);
                // Todo find out why it's giving the red underline while working compleletly fine
                setWallet(null);
                
                setActiveIndex(0); 
              }}
            >
              <Icons.PencilSimple size={20} color={colors.white} weight="bold" />
              <Typo size={16} color={colors.white}>Modify</Typo>
              </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.modalButton, styles.confirmButton]}
              onPress={handleSaveTransaction}
            >
              <Icons.Check size={20} color={colors.white} weight="bold" />
              <Typo size={16} color={colors.white}>Confirm</Typo>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };
  return ( 
    !isCameraActive || !wallet? (  
      <ModalWrapper>
        <Header 
          leftIcon={<BackButton />} 
          title={existTransaction.id ? 'Edit Transaction' : 'New Transaction'}
          rightIcon={renderHeaderRight()}
        />
        
        <View style={styles.segmentContainer}>
          <SegmentedControl
            values={['Manual Entry', 'Auto Scan']}
            selectedIndex={activeIndex}
            onChange={handleSegmentChange}
            tintColor={themeColors.neutral200}
            appearance={isDarkMode ? 'dark' : 'light'}
            style={styles.segmentControl}
          />
        </View>
        
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {activeIndex === 0 ? (
            <Animated.View style={styles.content} entering={FadeIn.duration(500)} layout={Layout.springify()}>
              <View style={styles.form}>
                {/* Transaction Type Selector */}
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Icons.Wallet size={20} color={colors.neutral300} />
                    <Typo size={14} color={colors.neutral300}>
                      Transaction Type
                    </Typo>
                  </View>
                  <View style={styles.typeSelector}>
                    <TouchableOpacity 
                      style={[
                        styles.typeOption,
                        transaction.type === 'expense' && styles.expenseTypeSelected
                      ]}
                      onPress={() => setTransaction(prev => ({ ...prev, type: 'expense', category: '' }))}
                    >
                      <Icons.ArrowCircleUp size={20} color={transaction.type === 'expense' ? colors.white : colors.rose} />
                      <Typo color={transaction.type === 'expense' ? colors.white : colors.rose}>Expense</Typo>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[
                        styles.typeOption,
                        transaction.type === 'income' && styles.incomeTypeSelected
                      ]}
                      onPress={() => setTransaction(prev => ({ ...prev, type: 'income', category: '' }))}
                    >
                      <Icons.ArrowCircleDown size={20} color={transaction.type === 'income' ? colors.white : colors.green} />
                      <Typo color={transaction.type === 'income' ? colors.white : colors.green}>Income</Typo>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Amount Input */}
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Icons.CurrencyDollar size={20} color={colors.neutral300} />
                    <Typo size={14} color={colors.neutral300}>Amount</Typo>
                  </View>
                  <Input
                    placeholder="0.00"
                    value={transaction.amount.toString()}
                    onChangeText={text => setTransaction(prev => ({ ...prev, amount: parseFloat(text) || 0 }))}
                    keyboardType="numeric"
                    containerStyle={styles.amountInput}
                    textAlign="center"
                    selectionColor={colors.primary}
                  />
                </View>

                {/* Category Selector */}
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Icons.TagSimple size={20} color={colors.neutral300} />
                    <Typo size={14} color={colors.neutral300}>Category</Typo>
                  </View>
                  <Dropdown
                    data={categoryOptions}
                    labelField="label"
                    valueField="value"
                    value={transaction.category}
                    onChange={item => setTransaction(prev => ({ ...prev, category: item.value }))}
                    placeholder="Select Category"
                    style={styles.dropdown}
                    placeholderStyle={styles.dropdownPlaceholder}
                    selectedTextStyle={styles.dropdownSelectedText}
                    containerStyle={styles.dropdownContainer}
                    activeColor={colors.neutral700}
                    renderItem={renderItem}
                    renderLeftIcon={renderLeftIcon}
                    renderRightIcon={() => (
                      <Icons.CaretDown 
                        size={20} 
                        color={colors.neutral400} 
                        weight="bold"
                        style={styles.dropdownIcon} 
                      />
                    )}
                  />
                </View>

                {/* Wallet Selector */}
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Icons.Wallet size={20} color={colors.neutral300} />
                    <Typo size={14} color={colors.neutral300}>Wallet</Typo>
                  </View>
                  <Dropdown
                    data={walletOptions}
                    labelField="label"
                    valueField="value"
                    value={transaction.walletId}
                    onChange={item => setTransaction(prev => ({ ...prev, walletId: item.value }))}
                    placeholder="Select Wallet"
                    style={styles.dropdown}
                    placeholderStyle={styles.dropdownPlaceholder}
                    selectedTextStyle={styles.dropdownSelectedText}
                    containerStyle={styles.dropdownContainer}
                    activeColor={colors.neutral700}
                    renderItem={renderItem}
                    renderLeftIcon={renderLeftIcon}
                    renderRightIcon={() => (
                      <Icons.CaretDown 
                        size={20} 
                        color={colors.neutral400} 
                        weight="bold"
                        style={styles.dropdownIcon} 
                      />
                    )}
                  />
                </View>

                {/* Date Picker */}
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Icons.Calendar size={20} color={colors.neutral300} />
                    <Typo size={14} color={colors.neutral300}>Date</Typo>
                  </View>
                  <Pressable 
                    style={styles.dateButton}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Typo color={colors.white}>
                      {format(transaction.date as Date, 'MMMM dd, yyyy')}
                    </Typo>
                  </Pressable>
                  {showDatePicker && (
                    <DateTimePicker
                      value={transaction.date as Date}
                      mode="date"
                      display='default'
                      onChange={handleDateChange}
                    />
                  )}
                </View>

                {/* Description Input */}
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Icons.TextT size={20} color={colors.neutral300} />
                    <Typo size={14} color={colors.neutral300}>Description</Typo>
                  </View>
                  <Input
                    placeholder="Add a note"
                    value={transaction.description}
                    onChangeText={text => setTransaction(prev => ({ ...prev, description: text }))}
                    containerStyle={styles.descriptionInput}
                    multiline
                    numberOfLines={4}
                  />
                </View>

                {/* Image Upload */}
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Icons.Image size={20} color={colors.neutral300} style={{
                      marginTop:25
                    }}/>
                    <Typo size={14} color={colors.neutral300} style={{
                      marginTop:25
                    }}>Receipt (Optional)</Typo>
                  </View>
                  <ImageUpload 
                    file={transaction?.image} 
                    onSelect={onPickImage} 
                    onClear={handleImageClear}
                  />
                </View>
              </View>
            </Animated.View>
          ) : (
            <Animated.View style={styles.content} entering={FadeIn.duration(500)}>
              {renderCameraUI()}
            </Animated.View>
          )}
        </ScrollView>

        {activeIndex === 0 && (
          <Animated.View 
            style={styles.footer} 
            entering={FadeInDown.delay(600)}
          >
            <Button 
              onPress={handleSaveTransaction} 
              loading={loading}
              style={styles.saveButton}
            >
              <Typo size={16} fontWeight="600" color={colors.white}>
                {loading ? 'Saving...' : 'Save Transaction'}
              </Typo>
            </Button>
          </Animated.View>
        )}

        {activeIndex === 1 && !isCameraActive && (
          <Animated.View 
            style={styles.scanButton} 
            entering={FadeInDown.delay(600)}
          >
            <Button 
              onPress={handleScanReceipt}
              style={styles.scanButtonStyle}
            >
              <Icons.Camera size={24} color={colors.white} weight="bold" />
              <Typo size={16} fontWeight="600" color={colors.white}>
                {isServerOnline ? 'Scan Receipt' : 'Server Offline'}
              </Typo>
            </Button>
          </Animated.View>
        )} 
        
        {/* Render our new components */}
      </ModalWrapper>
    ) : (
      <ScreenWrapper>
      <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={cameraType}
        enableTorch={isFlashOn}
      >
          <View style={styles.overlay}>
            <Animated.View entering={FadeIn.duration(500)} style={styles.scanArea}>
              <View style={styles.cornerTL} />
              <View style={styles.cornerTR} />
              <View style={styles.cornerBL} />
              <View style={styles.cornerBR} />
            </Animated.View>
            <Animated.Text entering={FadeIn.duration(500).delay(300)} style={styles.scanText}>
              Position the receipt within the frame
            </Animated.Text>
          </View>
          <View style={styles.controls}>
            <TouchableOpacity 
              style={styles.controlButton} 
              onPress={() => {
                setIsCameraActive(false);
                setCameraOn(false);
                // Todo find out why it's giving the red underline while working compleletly fine
                setWallet(null);
              }}
            >
              <Icons.X size={24} color={colors.white} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.controlButton, styles.captureButton]}
              onPress={handleScanReceipt}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <View style={styles.captureButtonInner} />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={toggleFlash}
            >
              <Icons.Flashlight 
                size={24} 
                color={colors.white} 
                weight={isFlashOn ? "fill" : "regular"} 
              />
            </TouchableOpacity>
          </View>
        </CameraView>

        {/* {photo && (
          <Animated.View entering={FadeInDown.duration(300)} style={styles.resultContainer}>
            <Text style={styles.resultText}>{isLoading ? 'Processing receipt...' : 'Receipt captured!'}</Text>
            <View style={styles.buttonGroup}>
              <TouchableOpacity style={[styles.button, styles.buttonSecondary]} onPress={handleRetry} disabled={isLoading}>
                <Text style={[styles.buttonText, styles.buttonTextSecondary]}>Retake</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.buttonPrimary]} onPress={() => router.back()} disabled={isLoading}>
                <Text style={styles.buttonText}>Use Photo</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )} */}
      </View>
      {renderFullScreenLoader()}
      {renderResultModal()}
    </ScreenWrapper>
    )
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: colors.neutral900,
  },
  content: {
    padding: spacingX._20,
  },
  form: {
    gap: spacingY._25,
  },
  section: {
    gap: spacingY._12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacingX._12,
    marginBottom: spacingY._5,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: spacingX._12,
  },
  typeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacingX._8,
    padding: spacingY._15,
    borderRadius: radius._12,
    borderWidth: 1,
    borderColor: colors.neutral700,
  },
  expenseTypeSelected: {
    backgroundColor: colors.rose,
    borderColor: colors.rose,
  },
  incomeTypeSelected: {
    backgroundColor: colors.green,
    borderColor: colors.green,
  },
  amountInput: {
    backgroundColor: colors.neutral800,
    height: 80,
    textAlign: 'center',
    borderRadius: radius._12,
    borderWidth: 1,
    borderColor: colors.neutral700,
  },
  dropdown: {
    height: verticalScale(54),
    backgroundColor: colors.neutral800,
    borderWidth: 1,
    borderColor: colors.neutral700,
    borderRadius: radius._12,
    paddingHorizontal: spacingX._15,
    paddingVertical: spacingY._10,
  },
  dropdownContainer: {
    backgroundColor: colors.neutral800,
    borderRadius: radius._12,
    borderWidth: 1,
    borderColor: colors.neutral700,
    marginTop: spacingY._10,
    padding: spacingX._8,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  dropdownPlaceholder: {
    fontSize: 16,
    color: colors.neutral400,
  },
  dropdownSelectedText: {
    fontSize: 16,
    color: colors.white,
    fontWeight: '500',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacingX._12,
    paddingVertical: spacingY._12,
    borderRadius: radius._8,
    marginVertical: 2,
    gap: spacingX._12,
  },
  dropdownIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.neutral700,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownIcon: {
    opacity: 0.7,
  },
  dropItemText: { 
    color: colors.white,
    fontSize: 16,
    fontWeight: '500',
  },
  dateButton: {
    height: 50,
    borderRadius: radius._12,
    padding: spacingX._15,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.neutral700,
    backgroundColor: colors.neutral800,
  },
  descriptionInput: {
    minHeight: 100,
    borderRadius: radius._12,
    padding: spacingX._15,
    backgroundColor: colors.neutral800,
    borderWidth: 1,
    borderColor: colors.neutral700,
  },
  footer: {
    padding: spacingX._20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    borderTopWidth: 1,
    borderTopColor: colors.neutral700,
    backgroundColor: colors.neutral900,
  },
  saveButton: {
    height: verticalScale(54),
    borderRadius: radius._12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary,
  },
  deleteButton: {
    padding: spacingX._10,
    marginRight: -spacingX._5,
  },
  segmentContainer: {
    paddingHorizontal: spacingX._20,
    paddingVertical: spacingY._15,
    backgroundColor: colors.neutral900,
    zIndex: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral800,
  },
  segmentControl: {
    height: 40,
  },
  autoScanContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacingY._40,
    gap: spacingY._20,
  },
  autoScanText: {
    marginTop: spacingY._20,
    textAlign: 'center',
  },
  autoScanSubtext: {
    textAlign: 'center',
    paddingHorizontal: spacingX._20,
  },
  permissionButton: {
    marginTop: spacingY._20,
    height: verticalScale(44),
    borderRadius: radius._12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacingX._20,
  },
  fullscreenCamera: {
    flex: 1,
    height: Dimensions.get('window').height * 0.9,
    backgroundColor: colors.black,
    borderRadius: 0,
    overflow: 'hidden',
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'space-between',
  },
  cameraTopControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacingX._20,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
  },
  cameraControlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.neutral800,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.neutral700,
  },
  cameraGuideText: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacingX._20,
  },
  previewContainer: {
    flex: 1,
    backgroundColor: colors.black,
    borderRadius: radius._20,
    overflow: 'hidden',
  },
  previewImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  previewControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacingX._20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderTopLeftRadius: radius._20,
    borderTopRightRadius: radius._20,
  },
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacingX._8,
    padding: spacingX._12,
    borderRadius: radius._12,
    minWidth: 120,
    justifyContent: 'center',
  },
  retakeButton: {
    backgroundColor: colors.neutral800,
    borderWidth: 1,
    borderColor: colors.neutral700,
  },
  usePhotoButton: {
    backgroundColor: colors.primary,
  },
  scanButton: {
    padding: spacingX._20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    backgroundColor: colors.neutral900,
  },
  scanButtonStyle: {
    height: verticalScale(54),
    borderRadius: radius._12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary,
    gap: spacingX._10,
  },
  fullScreenOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loaderContainer: {
    backgroundColor: colors.neutral800,
    borderRadius: radius._20,
    padding: spacingX._30,
    alignItems: 'center',
    justifyContent: 'center',
    width: '80%',
    gap: spacingY._15,
    borderWidth: 1,
    borderColor: colors.neutral700,
  },
  loaderText: {
    textAlign: 'center',
    marginTop: spacingY._15,
  },
  errorText: {
    textAlign: 'center',
    marginTop: spacingY._10,
  },
  modal: {
    margin: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.neutral800,
    borderRadius: radius._20,
    width: '85%',
    padding: spacingX._20,
    borderWidth: 1,
    borderColor: colors.neutral700,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacingY._15,
    paddingBottom: spacingY._12,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral700,
  },
  resultDetails: {
    gap: spacingY._15,
  },
  resultRow: {
    gap: spacingY._5,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacingY._25,
    gap: spacingX._12,
  },
  modalButton: {
    flex: 1,
    height: 48,
    borderRadius: radius._12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacingX._8,
    backgroundColor: colors.neutral700,
  },
  confirmButton: {
    backgroundColor: colors.primary,
  },

  // New wallet 
  walletList: {
    width: '100%',
    gap: 12,
  },
  
  walletItem: {
    backgroundColor: colors.neutral800,
    padding: 16,
    paddingRight:120,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.neutral700,
  },
  
  walletItemSelected: {
    borderColor: colors.rose,
    backgroundColor: colors.rose,
  },
  
  walletItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  
  walletItemText: {
    fontWeight: '400',
  },


  // New camera be careful

  container: {
      flex: 1,
      backgroundColor: colors.neutral900,
    },
    camera: {
      flex: 1,
      width: '100%',
    },
    overlay: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'center',
      alignItems: 'center',
    },
    scanArea: {
      width: SCAN_AREA_SIZE,
      height: SCAN_AREA_SIZE * 1.4,
      backgroundColor: 'transparent',
      borderRadius: 16,
      position: 'relative',
    },
    cornerTL: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: 40,
      height: 40,
      borderTopWidth: 4,
      borderLeftWidth: 4,
      borderColor: colors.primary,
      borderTopLeftRadius: 16,
    },
    cornerTR: {
      position: 'absolute',
      top: 0,
      right: 0,
      width: 40,
      height: 40,
      borderTopWidth: 4,
      borderRightWidth: 4,
      borderColor: colors.primary,
      borderTopRightRadius: 16,
    },
    cornerBL: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      width: 40,
      height: 40,
      borderBottomWidth: 4,
      borderLeftWidth: 4,
      borderColor: colors.primary,
      borderBottomLeftRadius: 16,
    },
    cornerBR: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: 40,
      height: 40,
      borderBottomWidth: 4,
      borderRightWidth: 4,
      borderColor: colors.primary,
      borderBottomRightRadius: 16,
    },
    scanText: {
      color: colors.white,
      fontSize: scale(16),
      marginTop: verticalScale(20),
      textAlign: 'center',
    },
    controls: {
      position: 'absolute',
      bottom: verticalScale(40),
      left: 0,
      right: 0,
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      paddingHorizontal: scale(20),
    },
    controlButton: {
      width: scale(50),
      height: scale(50),
      borderRadius: scale(25),
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.neutral700,
    },
    captureButton: {
      width: scale(70),
      height: scale(70),
      borderRadius: scale(35),
      backgroundColor: 'rgba(255,255,255,0.3)',
      borderWidth: 3,
      borderColor: colors.white,
    },
    captureButtonInner: {
      width: scale(54),
      height: scale(54),
      borderRadius: scale(27),
      backgroundColor: colors.white,
    },
    resultContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: colors.neutral800,
      padding: scale(20),
      borderTopLeftRadius: scale(20),
      borderTopRightRadius: scale(20),
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -3 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    resultText: {
      color: colors.white,
      fontSize: scale(16),
      marginBottom: verticalScale(15),
      textAlign: 'center',
    },
    buttonGroup: {
      flexDirection: 'row',
      gap: scale(10),
    },
    button: {
      flex: 1,
      padding: scale(15),
      borderRadius: scale(10),
      alignItems: 'center',
    },
    buttonPrimary: {
      backgroundColor: colors.primary,
    },
    buttonSecondary: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.neutral600,
    },
    buttonText: {
      color: colors.white,
      fontSize: scale(16),
      fontWeight: 'bold',
    },
    buttonTextSecondary: {
      color: colors.neutral400,
    },
    text: {
      color: colors.white,
      fontSize: scale(20),
      fontWeight: 'bold',
      marginTop: verticalScale(20),
      marginBottom: verticalScale(10),
    },
    subText: {
      color: colors.neutral400,
      fontSize: scale(14),
      textAlign: 'center',
      marginBottom: verticalScale(20),
      paddingHorizontal: scale(40),
    },
});

export default TransactionModal;