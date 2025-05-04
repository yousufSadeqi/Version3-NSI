import { StyleSheet, View, TouchableOpacity, Dimensions, Platform } from 'react-native';
import React, { useState, useEffect } from 'react';
import ModalWrapper from '@/components/ModalWrapper';
import { colors, radius, spacingX, spacingY } from '@/constants/theme';
import Typo from '@/components/Typo';
import * as Icons from 'phosphor-react-native';
import { useTheme } from '@/contexts/themeContext';
import Animated, { 
  FadeIn, 
  FadeInDown, 
  SlideInUp, 
  useAnimatedStyle, 
  useSharedValue, 
  withSequence, 
  withTiming,
  Easing,
  Layout
} from 'react-native-reanimated';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');
const PIN_LENGTH = 6;

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface PasscodeModalProps {
  mode: 'set' | 'verify' | 'change';
  onSuccess?: () => void;
  onCancel?: () => void;
}

const PasscodeModal = ({ mode, onSuccess, onCancel }: PasscodeModalProps) => {
  const router = useRouter();
  const { themeColors } = useTheme();
  const [pin, setPin] = useState<string>('');
  const [confirmPin, setConfirmPin] = useState<string>('');
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string>('');
  const [attempts, setAttempts] = useState(0);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
  
  // Animation values
  const iconScale = useSharedValue(1);
  const buttonScale = useSharedValue(1);
  const errorShake = useSharedValue(0);

  useEffect(() => {
    checkBiometrics();
    checkPasscodeStatus();
  }, []);

  const checkPasscodeStatus = async () => {
    const hasPasscode = await SecureStore.getItemAsync('hasPasscode');
    if (hasPasscode === 'true' && mode === 'verify') {
      checkBiometrics();
    }
  };

  const checkBiometrics = async () => {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    if (compatible) {
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (enrolled) {
        setIsBiometricEnabled(true);
        if (mode === 'verify') {
          const result = await LocalAuthentication.authenticateAsync({
            promptMessage: 'Authenticate to access app',
            fallbackLabel: 'Use passcode',
          });
          if (result.success) {
            onSuccess?.();
          }
        }
      }
    }
  };

  const handleNumberPress = (number: string) => {
    setError('');
    if (pin.length < PIN_LENGTH) {
      const newPin = pin + number;
      setPin(newPin);
      
      // Animate button press
      animateButton();

      if (newPin.length === PIN_LENGTH) {
        if (mode === 'set' && !isConfirming) {
          setIsConfirming(true);
          setPin('');
          animateIcon();
          return;
        }
        handlePinComplete(newPin);
      }
    }
  };

  const handlePinComplete = async (newPin: string) => {
    try {
      if (mode === 'verify') {
        const storedPin = await SecureStore.getItemAsync('userPasscode');
        if (newPin === storedPin) {
          animateIcon();
          onSuccess?.();
          router.back();
          return;
        }
        
        setAttempts(prev => prev + 1);
        triggerErrorShake();
        
        if (attempts >= 4) {
          setError('Too many attempts. Try again later.');
          setTimeout(() => {
            onCancel?.();
            router.back();
          }, 2000);
          return;
        }
        
        setError('Incorrect passcode. Try again.');
        setPin('');
      } else if (mode === 'set') {
        if (isConfirming) {
          if (newPin === confirmPin) {
            await SecureStore.setItemAsync('userPasscode', newPin);
            await SecureStore.setItemAsync('hasPasscode', 'true');
            animateIcon();
            onSuccess?.();
            router.back();
          } else {
            triggerErrorShake();
            setError('Passcodes do not match. Try again.');
            setPin('');
            setConfirmPin('');
            setIsConfirming(false);
          }
        } else {
          setConfirmPin(newPin);
          setPin('');
          animateIcon();
        }
      }
    } catch (error) {
      triggerErrorShake();
      setError('Something went wrong. Please try again.');
      setPin('');
    }
  };

  const handleBackspace = () => {
    if (pin.length > 0) {
      setPin(prev => prev.slice(0, -1));
      setError('');
      animateButton();
    }
  };

  const handleBiometricAuth = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to access app',
        fallbackLabel: 'Use passcode',
      });
      if (result.success) {
        onSuccess?.();
      }
    } catch (error) {
      console.error('Biometric authentication error:', error);
    }
  };
  
  const handleOkPress = async () => {
    if (pin.length === PIN_LENGTH) {
      if (mode === 'set') {
        if (!isConfirming) {
          setConfirmPin(pin);
          setPin('');
          setIsConfirming(true);
          animateIcon();
        } else {
          await handlePinComplete(pin);
        }
      } else if (mode === 'verify') {
        await handlePinComplete(pin);
      }
    } else {
      triggerErrorShake();
      setError('Please enter complete passcode');
    }
  };
  
  // Animation styles and handlers
  const iconAnimStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: iconScale.value }]
    };
  });
  
  const errorAnimStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: errorShake.value }]
    };
  });
  
  const animateIcon = () => {
    iconScale.value = withSequence(
      withTiming(1.2, { duration: 200, easing: Easing.inOut(Easing.ease) }),
      withTiming(1, { duration: 200, easing: Easing.inOut(Easing.ease) })
    );
  };
  
  const animateButton = () => {
    buttonScale.value = withSequence(
      withTiming(0.95, { duration: 50, easing: Easing.inOut(Easing.ease) }),
      withTiming(1, { duration: 100, easing: Easing.inOut(Easing.ease) })
    );
  };
  
  const triggerErrorShake = () => {
    errorShake.value = withSequence(
      withTiming(10, { duration: 50 }),
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(-10, { duration: 50 }),
      withTiming(0, { duration: 50 })
    );
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <ModalWrapper>
      <View style={[styles.container, { backgroundColor: themeColors.background }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleBack}
        >
          <Icons.CaretLeft size={24} color={themeColors.text} weight="bold" />
        </TouchableOpacity>

        <Animated.View 
          entering={FadeInDown.springify()}
          style={styles.header}
        >
          <Animated.View style={[styles.iconContainer, iconAnimStyle]}>
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              style={styles.iconGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <Icons.ShieldCheck 
              size={64} 
              color={themeColors.primary} 
              weight="fill" 
              style={styles.icon}
            />
          </Animated.View>
          
          <Animated.View 
            style={[styles.textContainer, errorAnimStyle]}
            entering={SlideInUp.delay(200).springify()}
          >
            <Typo size={28} fontWeight="700" color={themeColors.text} style={styles.title}>
              {mode === 'set' 
                ? isConfirming 
                  ? 'Confirm Passcode' 
                  : 'Set Passcode'
                : 'Enter Passcode'
              }
            </Typo>
            {error ? (
              <Animated.View entering={FadeIn.duration(300)}>
                <Typo size={14} color={colors.rose} style={styles.error}>
                  {error}
                </Typo>
              </Animated.View>
            ) : (
              <Typo size={14} color={themeColors.textSecondary} style={styles.subtitle}>
                Enter {PIN_LENGTH}-digit passcode
              </Typo>
            )}
          </Animated.View>
        </Animated.View>

        <Animated.View 
          style={styles.dotsContainer}
          entering={FadeInDown.delay(300).springify()}
        >
          {[...Array(PIN_LENGTH)].map((_, i) => (
            <Animated.View
              key={i}
              style={[
                styles.dot,
                { 
                  backgroundColor: i < pin.length 
                    ? themeColors.primary 
                    : themeColors.surface 
                },
                i < pin.length && styles.activeDot
              ]}
              entering={FadeIn.delay(i * 100)}
              layout={Layout.springify()}
            />
          ))}
        </Animated.View>

        {isBiometricEnabled && mode === 'verify' && (
          <Animated.View 
            style={styles.biometricContainer}
            entering={FadeInDown.delay(400)}
          >
            <TouchableOpacity 
              style={styles.biometricButton}
              onPress={handleBiometricAuth}
            >
              <Icons.Fingerprint size={32} color={themeColors.primary} weight="fill" />
              <Typo size={14} color={themeColors.primary} style={styles.biometricText}>
                Use Biometric
              </Typo>
            </TouchableOpacity>
          </Animated.View>
        )}

        <Animated.View 
          style={styles.keypadContainer}
          entering={FadeInDown.delay(400).springify()}
        >
          <View style={styles.keypadRow}>
            <AnimatedTouchable
              style={[styles.key, { backgroundColor: themeColors.surface }]}
              onPress={() => handleNumberPress('1')}
              activeOpacity={0.7}
            >
              <Typo size={28} fontWeight="700" color={themeColors.text}>1</Typo>
            </AnimatedTouchable>
            
            <AnimatedTouchable
              style={[styles.key, { backgroundColor: themeColors.surface }]}
              onPress={() => handleNumberPress('2')}
              activeOpacity={0.7}
            >
              <Typo size={28} fontWeight="700" color={themeColors.text}>2</Typo>
            </AnimatedTouchable>
            
            <AnimatedTouchable
              style={[styles.key, { backgroundColor: themeColors.surface }]}
              onPress={() => handleNumberPress('3')}
              activeOpacity={0.7}
            >
              <Typo size={28} fontWeight="700" color={themeColors.text}>3</Typo>
            </AnimatedTouchable>
          </View>
          
          <View style={styles.keypadRow}>
            <AnimatedTouchable
              style={[styles.key, { backgroundColor: themeColors.surface }]}
              onPress={() => handleNumberPress('4')}
              activeOpacity={0.7}
            >
              <Typo size={28} fontWeight="700" color={themeColors.text}>4</Typo>
            </AnimatedTouchable>
            
            <AnimatedTouchable
              style={[styles.key, { backgroundColor: themeColors.surface }]}
              onPress={() => handleNumberPress('5')}
              activeOpacity={0.7}
            >
              <Typo size={28} fontWeight="700" color={themeColors.text}>5</Typo>
            </AnimatedTouchable>
            
            <AnimatedTouchable
              style={[styles.key, { backgroundColor: themeColors.surface }]}
              onPress={() => handleNumberPress('6')}
              activeOpacity={0.7}
            >
              <Typo size={28} fontWeight="700" color={themeColors.text}>6</Typo>
            </AnimatedTouchable>
          </View>
          
          <View style={styles.keypadRow}>
            <AnimatedTouchable
              style={[styles.key, { backgroundColor: themeColors.surface }]}
              onPress={() => handleNumberPress('7')}
              activeOpacity={0.7}
            >
              <Typo size={28} fontWeight="700" color={themeColors.text}>7</Typo>
            </AnimatedTouchable>
            
            <AnimatedTouchable
              style={[styles.key, { backgroundColor: themeColors.surface }]}
              onPress={() => handleNumberPress('8')}
              activeOpacity={0.7}
            >
              <Typo size={28} fontWeight="700" color={themeColors.text}>8</Typo>
            </AnimatedTouchable>
            
            <AnimatedTouchable
              style={[styles.key, { backgroundColor: themeColors.surface }]}
              onPress={() => handleNumberPress('9')}
              activeOpacity={0.7}
            >
              <Typo size={28} fontWeight="700" color={themeColors.text}>9</Typo>
            </AnimatedTouchable>
          </View>
          
          <View style={styles.keypadRow}>
            <AnimatedTouchable
              style={[styles.key, styles.okButton, { backgroundColor: themeColors.surface }]}
              onPress={handleOkPress}
              activeOpacity={0.7}
            >
              <Typo size={16} fontWeight="600" color={themeColors.primary}>OK</Typo>
            </AnimatedTouchable>
            
            <AnimatedTouchable
              style={[styles.key, { backgroundColor: themeColors.surface }]}
              onPress={() => handleNumberPress('0')}
              activeOpacity={0.7}
            >
              <Typo size={28} fontWeight="700" color={themeColors.text}>0</Typo>
            </AnimatedTouchable>
            
            <AnimatedTouchable
              style={[styles.key, styles.backspaceKey, { backgroundColor: themeColors.surface }]}
              onPress={handleBackspace}
              onLongPress={() => setPin('')}
              activeOpacity={0.7}
            >
              <Icons.Backspace size={24} color={themeColors.text} weight="bold" />
            </AnimatedTouchable>
          </View>
        </Animated.View>
        
        {mode === 'verify' && (
          <Animated.View 
            style={styles.cancelContainer}
            entering={FadeIn.delay(600)}
          >
            <TouchableOpacity onPress={onCancel}>
              <Typo size={16} color={themeColors.primary} fontWeight="600">
                Cancel
              </Typo>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>
    </ModalWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacingX._20,
    justifyContent: 'space-between',
    backgroundColor: colors.neutral900,
  },
  backButton: {
    position: 'absolute',
    top: spacingY._20,
    left: spacingX._20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.neutral800,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.neutral700,
  },
  header: {
    alignItems: 'center',
    gap: spacingY._15,
    marginTop: spacingY._40,
  },
  iconContainer: {
    position: 'relative',
    marginBottom: spacingY._10,
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconGradient: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 60,
    opacity: 0.2,
    zIndex: -1,
  },
  icon: {
    padding: 10,
  },
  textContainer: {
    alignItems: 'center',
    gap: spacingY._7,
    paddingHorizontal: spacingX._20,
  },
  title: {
    marginBottom: spacingY._5,
    textAlign: 'center',
  },
  subtitle: {
    opacity: 0.7,
    textAlign: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacingX._20,
    marginVertical: spacingY._30,
  },
  dot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.primaryLight,
    backgroundColor: 'transparent',
  },
  activeDot: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
    transform: [{ scale: 1.1 }],
  },
  biometricContainer: {
    alignItems: 'center',
    marginBottom: spacingY._20,
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacingX._8,
    padding: spacingX._12,
    paddingHorizontal: spacingX._20,
    borderRadius: radius._12,
    backgroundColor: colors.neutral800,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  biometricText: {
    fontWeight: '600',
  },
  keypadContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Platform.OS === 'ios' ? spacingY._40 : spacingY._30,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: spacingY._15,
  },
  key: {
    width: (width - spacingX._20 * 2 - spacingX._15 * 2) / 3,
    aspectRatio: 1.2,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radius._20,
    backgroundColor: colors.neutral800,
    borderWidth: 1,
    borderColor: colors.neutral700,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  okButton: {
    backgroundColor: colors.neutral800,
    borderColor: colors.primary,
    borderWidth: 1,
  },
  emptyKey: {
    width: (width - spacingX._20 * 2 - spacingX._15 * 2) / 3,
    aspectRatio: 1.2,
  },
  backspaceKey: {
    backgroundColor: colors.neutral800,
    borderColor: colors.neutral700,
  },
  error: {
    marginTop: spacingY._5,
    textAlign: 'center',
    color: colors.rose,
  },
  cancelContainer: {
    alignItems: 'center',
    marginBottom: spacingY._30,
  },
  cancelButton: {
    padding: spacingX._12,
    paddingHorizontal: spacingX._20,
    borderRadius: radius._12,
    backgroundColor: colors.neutral800,
    borderWidth: 1,
    borderColor: colors.neutral700,
  },
});

export default PasscodeModal; 