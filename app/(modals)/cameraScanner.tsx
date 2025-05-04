import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Alert, Platform, Linking, Dimensions } from 'react-native';
import React, { useState, useRef } from 'react';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as Icons from 'phosphor-react-native';
import { router } from 'expo-router';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { colors } from '@/constants/theme';
import { scale, verticalScale } from '@/utils/styling';
import ScreenWrapper from '@/components/ScreenWrapper';
import { uploadFileToCloudinary } from '@/service/ImageService';
import { useReceiptProcessing } from '@/hooks/useReceiptProcessing';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCAN_AREA_SIZE = SCREEN_WIDTH * 0.85;

const CameraScanner = () => {
  const [photo, setPhoto] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [flash, setFlash] = useState(false);
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<any>(null);
  const { isProcessing, receiptData } = useReceiptProcessing(photo);

  const takePicture = async () => {
    if (!cameraRef.current) return;
    
    try {
      setIsLoading(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        skipProcessing: true,
      });
      setPhoto(photo.uri);

      // Upload to Cloudinary
      const uploadResult = await uploadFileToCloudinary(
        { uri: photo.uri, type: 'image/jpeg' },
        'Receipt Photos'
      );

      if (!uploadResult.success) {
        throw new Error(uploadResult.msg);
      }

      // Navigate to transactionModal with the receipt data
      router.push({
        pathname: '/AutoTransaction',
        params: {
          receiptImageUrl: uploadResult.data.url,
          mode: 'scan',
          receiptImage: photo.uri,
          ...(receiptData && { receiptData: JSON.stringify(receiptData) })
        }
      });
    } catch (error) {
      console.error('Error taking/uploading picture:', error);
      Alert.alert('Error', 'Failed to capture and upload photo. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    setPhoto(null);
    setIsLoading(false);
  };

  if (!permission) {
    return (
      <ScreenWrapper>
        <View style={styles.container}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.text}>Requesting camera permission...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  if (!permission.granted) {
    return (
      <ScreenWrapper>
        <View style={styles.container}>
          <Icons.Camera size={64} color={colors.neutral400} />
          <Text style={styles.text}>Camera access is required</Text>
          <Text style={styles.subText}>Please enable camera permissions in your device settings to use this feature.</Text>
          <View style={styles.buttonGroup}>
            <TouchableOpacity 
              style={[styles.button, styles.buttonSecondary]}
              onPress={() => router.back()}
            >
              <Text style={[styles.buttonText, styles.buttonTextSecondary]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.button, styles.buttonPrimary]}
              onPress={requestPermission}
            >
              <Text style={styles.buttonText}>Grant Access</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={facing}
          enableTorch={flash}
        >
          <View style={styles.overlay}>
            <Animated.View 
              entering={FadeIn.duration(500)}
              style={styles.scanArea}
            >
              <View style={styles.cornerTL} />
              <View style={styles.cornerTR} />
              <View style={styles.cornerBL} />
              <View style={styles.cornerBR} />
            </Animated.View>

            <Animated.Text 
              entering={FadeIn.duration(500).delay(300)}
              style={styles.scanText}
            >
              Position the receipt within the frame
            </Animated.Text>
          </View>
          
          <View style={styles.controls}>
            <TouchableOpacity 
              style={styles.controlButton}
              onPress={() => setFlash(!flash)}
            >
              <Icons.Flashlight
                size={24}
                color={colors.white}
                weight={flash ? "fill" : "regular"}
              />
            </TouchableOpacity>

            {!photo && (
              <TouchableOpacity 
                style={[styles.controlButton, styles.captureButton]}
                onPress={takePicture}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <View style={styles.captureButtonInner} />
                )}
              </TouchableOpacity>
            )}

            <TouchableOpacity 
              style={styles.controlButton}
              onPress={() => setFacing(current => (current === 'back' ? 'front' : 'back'))}
            >
              <Icons.CameraRotate size={24} color={colors.white} />
            </TouchableOpacity>
          </View>
        </CameraView>

        {photo && (
          <Animated.View 
            entering={FadeInDown.duration(300)}
            style={styles.resultContainer}
          >
            <Text style={styles.resultText}>
              {isLoading ? 'Processing receipt...' : 'Receipt captured!'}
            </Text>
            <View style={styles.buttonGroup}>
              <TouchableOpacity 
                style={[styles.button, styles.buttonSecondary]}
                onPress={handleRetry}
                disabled={isLoading}
              >
                <Text style={[styles.buttonText, styles.buttonTextSecondary]}>
                  Retake
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.button, styles.buttonPrimary]}
                onPress={() => {
                  // Navigate back with the URL
                  router.back();
                }}
                disabled={isLoading}
              >
                <Text style={styles.buttonText}>
                  Use Photo
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}
      </View>
    </ScreenWrapper>
  );
};

export default CameraScanner;

const styles = StyleSheet.create({
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
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    width: SCAN_AREA_SIZE,
    height: SCAN_AREA_SIZE * 1.4, // Make it taller for receipt
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
    shadowOffset: {
      width: 0,
      height: -3,
    },
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
