import { StyleSheet, TouchableOpacity, View } from 'react-native';
import React, { useEffect } from 'react';
import ScreenWrapper from '@/components/ScreenWrapper';
import Typo from '@/components/Typo';
import { colors, spacingX, spacingY } from '@/constants/theme';
import { verticalScale } from '@/utils/styling';
import Button from '@/components/Button';
import Animated, { 
  FadeIn, 
  FadeInDown, 
  useAnimatedStyle, 
  useSharedValue, 
  withRepeat, 
  withTiming,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import * as Icons from 'phosphor-react-native';

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

const Welcome = () => {
  const router = useRouter();
  const floatAnimation = useSharedValue(0);
  const gradientPosition = useSharedValue(0);
  
  useEffect(() => {
    floatAnimation.value = withRepeat(
      withTiming(1, { duration: 2000 }), 
      -1, 
      true
    );
    
    gradientPosition.value = withRepeat(
      withTiming(1, { duration: 3000 }), 
      -1, 
      true
    );
  }, []);
  
  const imageAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: interpolate(floatAnimation.value, [0, 1], [0, 15], Extrapolate.CLAMP) }
      ]
    };
  });
  
  const gradientAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(gradientPosition.value, [0, 0.5, 1], [0.7, 0.9, 0.7], Extrapolate.CLAMP),
    };
  });

  return (
    <ScreenWrapper style={styles.screenWrapper}>
      <StatusBar style="light" />
      
      {/* Background gradient */}
      <AnimatedLinearGradient 
        colors={[colors.neutral900, colors.primary, colors.neutral900]} 
        style={[styles.backgroundGradient, gradientAnimatedStyle]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      <View style={styles.container}>
        {/* Top section with login button */}
        <View style={styles.topSection}>
          <Animated.View 
            entering={FadeIn.duration(800).delay(200)}
            style={styles.logoContainer}
          >
            <Typo size={28} fontWeight="800" color={colors.primary}>
              Expensify
            </Typo>
            <Icons.ChartPieSlice size={24} color={colors.primary} weight="fill" />
          </Animated.View>
          
          <TouchableOpacity 
            onPress={() => router.push('/(auth)/login')} 
            style={styles.loginButton}
          >
            <Animated.View 
              entering={FadeIn.duration(800).delay(400)}
              style={styles.loginButtonInner}
            >
              <Typo fontWeight="600" color={colors.primary}>Sign in</Typo>
            </Animated.View>
          </TouchableOpacity>
        </View>

        {/* Image section */}
        <Animated.View 
          entering={FadeIn.duration(1000)} 
          style={[styles.imageContainer, imageAnimatedStyle]}
        >
          <Animated.Image
            resizeMode="contain"
            style={styles.welcomeImage}
            source={require('../../assets/images/welcome.png')}
          />
        </Animated.View>

        {/* Footer */}
        <View style={styles.footer}>
          <Animated.View 
            entering={FadeInDown.duration(1000).springify().damping(12)} 
            style={styles.headingContainer}
          >
            <Typo size={32} fontWeight="800" color={colors.primary}>
              Take charge today
            </Typo>
            <Typo size={32} fontWeight="800" color={colors.white}>
              Live better tomorrow
            </Typo>
          </Animated.View>

          <Animated.View 
            entering={FadeInDown.duration(1000).delay(100).springify().damping(12)} 
            style={styles.subtitleContainer}
          >
            <Typo size={17} color={colors.neutral300}>
              Finance must be arranged to set a better
            </Typo>
            <Typo size={17} color={colors.neutral300}>
              lifestyle in the future
            </Typo>
          </Animated.View>

          <Animated.View 
            entering={FadeInDown.duration(1000).delay(200).springify().damping(12)} 
            style={styles.buttonContainer}
          >
            <Button 
              onPress={() => router.push('/(auth)/register')}
              style={styles.getStartedButton}
            >
              <Typo size={18} color={colors.neutral900} fontWeight="600">
                Get Started
              </Typo>
              <Icons.ArrowRight weight="bold" size={20} color={colors.neutral900} />
            </Button>
          </Animated.View>
        </View>
      </View>
    </ScreenWrapper>
  );
};

export default Welcome;

const styles = StyleSheet.create({
  screenWrapper: {
    backgroundColor: colors.neutral900,
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.8,
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingTop: spacingY._7,
  },
  topSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacingX._20,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loginButton: {
    borderRadius: 30,
    overflow: 'hidden',
  },
  loginButtonInner: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  imageContainer: {
    alignItems: 'center',
    marginTop: verticalScale(50),
  },
  welcomeImage: {
    width: '100%',
    height: verticalScale(300),
  },
  footer: {
    backgroundColor: 'rgba(24, 24, 27, 0.8)',
    alignItems: 'center',
    paddingTop: verticalScale(30),
    paddingBottom: verticalScale(45),
    gap: spacingY._20,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: -5 },
    elevation: 20,
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  headingContainer: {
    alignItems: 'center',
  },
  subtitleContainer: {
    alignItems: 'center',
    gap: 2,
    opacity: 0.9,
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: spacingX._25,
  },
  getStartedButton: {
    height: 56,
    borderRadius: 28,
    flexDirection: 'row',
    gap: 8,
  },
});
