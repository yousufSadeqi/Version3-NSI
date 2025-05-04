import { StyleSheet, View, ScrollView, Alert, Text } from 'react-native';
import React, { useState, useEffect } from 'react';
import { colors, spacingX } from '@/constants/theme';
import { scale, verticalScale } from '@/utils/styling';
import ModalWrapper from '@/components/ModalWrapper';
import Header from '@/components/Header';
import BackButton from '@/components/BackButton';
import { Image } from 'expo-image';
import Typo from '@/components/Typo';
import Input from '@/components/input';
import { WalletType } from '@/types';
import Button from '@/components/Button';
import { useAuth } from '@/contexts/authContext';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import ImageUpload from '@/components/ImageUpload';
import { createOrUpdateWallet } from '@/service/walletService';
import CustomAlert from '@/components/CustomAlert';
import { doc, deleteDoc } from 'firebase/firestore';
import { firestore } from '@/config/firebase';
import Animated, { 
  FadeIn, 
  FadeOut, 
  SlideInDown,
  Layout,
  BounceIn,
  FadeInDown
} from 'react-native-reanimated';
import * as Icons from 'phosphor-react-native'

interface WalletFormData {
  id?: string;
  name: string;
  imageUri?: string | null;
  amount: number;
}

const WalletModal = () => {
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const existingWallet = params.wallet ? JSON.parse(params.wallet as string) : null;
  
  const [wallet, setWallet] = useState<WalletFormData>({
    id: existingWallet?.id,
    name: existingWallet?.name || '',
    imageUri: existingWallet?.image,
    amount: existingWallet?.amount || 0
  });
  
  const [loading, setLoading] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const router = useRouter();

  const handleDeleteWallet = async () => {
    try {
      if (!wallet.id || !user?.uid) return;

      setLoading(true);
      const walletRef = doc(firestore, 'Wallets', wallet.id);
      await deleteDoc(walletRef);
      router.back();
    } catch (error) {
      console.error('Error deleting wallet:', error);
      Alert.alert('Error', 'Failed to delete wallet');
    } finally {
      setLoading(false);
    }
  };

  const showDeleteAlert = () => {
    setShowAlert(true);
  };

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
        setWallet(prev => ({
          ...prev,
          imageUri: result.assets[0].uri
        }));
      }
    } catch (error) {
      console.error("Image picker error:", error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const handleImageClear = () => {
    Alert.alert(
      'Remove Image',
      'Are you sure you want to remove this image?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setWallet(prev => ({ ...prev, imageUri: null }));
          }
        }
      ]
    );
  };

  const handleSaveWallet = async () => {
    try {
      if (!wallet.name) {
        Alert.alert('Error', 'Please enter a wallet name');
        return;
      }

      if (!user?.uid) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }

      setLoading(true);

      await createOrUpdateWallet(user.uid, {
        id: wallet.id,
        name: wallet.name,
        amount: wallet.amount,
        image: wallet.imageUri
      });
      
      router.back();
    } catch (error) {
      console.error('Error saving wallet:', error);
      Alert.alert('Error', 'Failed to save wallet');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalWrapper>
      <Header
        leftIcon={<BackButton />}
        title={existingWallet ? "Edit Wallet" : "Create Wallet"}
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
          <Animated.View entering={FadeInDown.delay(300)}>
            <ImageUpload
              file={wallet.imageUri}
              onSelect={onPickImage}
              onClear={handleImageClear}
            />
          </Animated.View>
          
          <View style={styles.form}>
            <Animated.View entering={FadeInDown.delay(400).springify()}>
              <Input
                placeholder="Enter wallet name"
                value={wallet.name}
                onChangeText={(text) => setWallet(prev => ({ ...prev, name: text }))}
                containerStyle={styles.input}
              />
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(500).springify()}>
              <Input
                placeholder="Enter amount"
                value={wallet.amount.toString()}
                onChangeText={(text) => {
                  const amount = parseFloat(text) || 0;
                  setWallet(prev => ({ ...prev, amount }));
                }}
                keyboardType="numeric"
                containerStyle={styles.input}
              />
            </Animated.View>
          </View>
        </Animated.View>
      </ScrollView>

      <Animated.View 
        style={styles.footer}
        entering={FadeInDown.delay(600)}
      >
        {existingWallet &&  !loading ?(
          <View style={styles.buttonRow}>
            <Button
              onPress={handleSaveWallet}
              loading={loading}
              style={styles.saveButton}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Text>
            </Button>
            <Button
              onPress={showDeleteAlert}
              style={styles.deleteButton}
            >
              <Icons.Trash
                color={colors.white}
                size={verticalScale(24)}
                weight='bold'
              />
            </Button>
          </View>
        ) : (
          <Button
            onPress={handleSaveWallet}
            loading={loading}
            style={styles.button}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Creating...' : 'Create Wallet'}
            </Text>
          </Button>
        )}
      </Animated.View>

      <CustomAlert
        visible={showAlert}
        title="Delete Wallet"
        message="Are you sure you want to delete this wallet? This action cannot be undone."
        type="warning"
        onClose={() => setShowAlert(false)}
        onConfirm={handleDeleteWallet}
      />
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

export default WalletModal;
