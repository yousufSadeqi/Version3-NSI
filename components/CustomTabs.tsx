import React, { useEffect } from 'react';
import { View, StyleSheet, Pressable, Text, Dimensions } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs/lib/typescript/src/types';
import { colors, radius, spacingY } from '@/constants/theme';
import * as Icon from 'phosphor-react-native';
import { verticalScale } from '@/utils/styling';
import Animated, { 
  useAnimatedStyle, 
  withTiming, 
  useSharedValue, 
  withSpring,
  interpolateColor,
  withSequence,
  withDelay,
  Easing
} from 'react-native-reanimated';

type TabRoute = {
  key: string;
  name: string;
  params?: object;
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function CustomTabs({ state, descriptors, navigation }: BottomTabBarProps) {
  const buttonScale = useSharedValue(1);
  const buttonRotation = useSharedValue(0);
  const glowOpacity = useSharedValue(0);

    

  useEffect(() => {
    const pulseAnimation = () => {
      buttonScale.value = withSequence(
        withTiming(1.1, { duration: 300, easing: Easing.out(Easing.ease) }),
        withTiming(1, { duration: 300, easing: Easing.in(Easing.ease) })
      );
      
      buttonRotation.value = withSequence(
        withTiming(0.05, { duration: 150 }),
        withTiming(-0.05, { duration: 300 }),
        withTiming(0, { duration: 150 })
      );
      
      glowOpacity.value = withSequence(
        withTiming(0.6, { duration: 300 }),
        withTiming(0, { duration: 500 })
      );
    };
    
    setTimeout(pulseAnimation, 800);
    
    const interval = setInterval(pulseAnimation, 8000);
    return () => clearInterval(interval);
  }, []);

  const getTabIcon = (routeName: string, isFocused: boolean) => {
    const iconSize = verticalScale(24);
    const iconColor = isFocused ? colors.primary : colors.neutral400;
    const weight = isFocused ? "fill" : "regular";

    switch (routeName) {
      case 'index':
        return <Icon.HouseLine size={iconSize} color={iconColor} weight={weight} />;
      case 'statistics':
        return <Icon.ChartLineUp size={iconSize} color={iconColor} weight={weight} />;
      case 'wallet':
        return <Icon.CreditCard size={iconSize} color={iconColor} weight={weight} />;
      case 'Profile':
        return <Icon.UserCircle size={iconSize} color={iconColor} weight={weight} />;
      default:
        return <Icon.House size={iconSize} color={iconColor} weight={weight} />;
    }
  };

  const getTabLabel = (routeName: string) => {
    switch (routeName) {
      case 'index':
        return 'Home';
      case 'statistics':
        return 'Stats';
      case 'wallet':
        return 'Wallet';
      case 'Profile':
        return 'Profile';
      default:
        return '';
    }
  };

  const renderFloatingButton = () => {
    const buttonAnimatedStyle = useAnimatedStyle(() => {
      return {
        transform: [
          { scale: buttonScale.value },
          { rotate: `${buttonRotation.value * 360}deg` }
        ],
        backgroundColor: colors.primary,
      };
    });
    
    const glowAnimatedStyle = useAnimatedStyle(() => {
      return {
        opacity: glowOpacity.value,
      };
    });

    return (
      <View style={styles.floatingButtonContainer}>
        <Animated.View style={[styles.buttonGlow, glowAnimatedStyle]} />
        <View style={styles.buttonBackground} />
        <Pressable 
          style={styles.floatingButtonTouchable}
          onPress={() => {
            buttonScale.value = withSequence(
              withTiming(0.9, { duration: 100 }),
              withTiming(1.15, { duration: 150 }),
              withTiming(1, { duration: 200 })
            );
            
            buttonRotation.value = withSequence(
              withTiming(0.05, { duration: 100 }),
              withTiming(-0.05, { duration: 150 }),
              withTiming(0, { duration: 100 })
            );
            
            glowOpacity.value = withSequence(
              withTiming(0.7, { duration: 150 }),
              withTiming(0, { duration: 500 })
            );
            
            setTimeout(() => {
              navigation.navigate('(modals)/transactionModal');
            }, 250);
          }}
        >
          <Animated.View style={[styles.floatingButton, buttonAnimatedStyle]}>
            <Icon.Receipt size={verticalScale(28)} color={colors.white} weight="fill" />
            <View style={styles.floatingButtonRing} />
          </Animated.View>
        </Pressable>
      </View>
    );
  };
  const renderTabIndicator = () => {
    const tabWidth = SCREEN_WIDTH / state.routes.length;
    const translateX = useSharedValue(state.index * tabWidth);
    
    useEffect(() => {
      translateX.value = withSpring(state.index * tabWidth, {
        damping: 15,
        stiffness: 120,
      });
    }, [state.index]);
    
    const indicatorStyle = useAnimatedStyle(() => {
      return {
        transform: [{ translateX: translateX.value }],
      };
    });
    
    return (
      <Animated.View style={[styles.tabIndicator, indicatorStyle, { width: tabWidth }]} />
    );
  };

  return (
    <View style={styles.container}>
      {renderFloatingButton()}
      <View style={styles.tabBar}>
        {renderTabIndicator()}
        {state.routes.map((route: TabRoute, index: number) => {
          const isFocused = state.index === index;
          const label = getTabLabel(route.name);

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const animatedStyle = useAnimatedStyle(() => {
            return {
              transform: [
                { scale: withTiming(isFocused ? 1.1 : 1, { duration: 200 }) },
                { translateY: withTiming(isFocused ? -5 : 0, { duration: 200 }) }
              ],
              opacity: withTiming(isFocused ? 1 : 0.8, { duration: 200 }),
            };
          });

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              style={styles.tab}
              android_ripple={{ color: colors.neutral700, borderless: true, radius: 20 }}
            >
              <Animated.View style={[
                styles.tabItem,
                animatedStyle
              ]}>
                {getTabIcon(route.name, isFocused)}
                {isFocused && (
                  <Text style={styles.tabLabel}>{label}</Text>
                )}
              </Animated.View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.neutral900,
    position: 'relative',
  },
  tabBar: {
    flexDirection: 'row',
    height: verticalScale(60),
    backgroundColor: colors.neutral800,
    paddingBottom: spacingY._15,
    paddingTop: spacingY._15,
    borderTopWidth: 1,
    borderTopColor: colors.neutral700,
    borderTopLeftRadius: radius._20,
    borderTopRightRadius: radius._20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 10,
    position: 'relative',
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: radius._15,
    minWidth: verticalScale(48),
    minHeight: verticalScale(48),
  },
  tabLabel: {
    color: colors.primary,
    fontSize: 10,
    marginTop: 2,
    fontWeight: '600',
  },
  tabIndicator: {
    position: 'absolute',
    height: 3,
    backgroundColor: colors.primary,
    bottom: 0,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  floatingButtonContainer: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: verticalScale(30),
    zIndex: 10,
  },
  buttonBackground: {
    position: 'absolute',
    width: verticalScale(70),
    height: verticalScale(35),
    backgroundColor: colors.neutral800,
    bottom: 0,
    borderTopLeftRadius: verticalScale(35),
    borderTopRightRadius: verticalScale(35),
    zIndex: 1,
    alignSelf: 'center',
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.neutral700,
  },
  buttonGlow: {
    position: 'absolute',
    width: verticalScale(80),
    height: verticalScale(80),
    borderRadius: verticalScale(40),
    backgroundColor: colors.primary,
    opacity: 0,
    zIndex: 1,
    alignSelf: 'center',
    transform: [{ scale: 1.2 }],
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 20,
  },
  floatingButtonTouchable: {
    width: verticalScale(70),
    height: verticalScale(70),
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
  },
  floatingButton: {
    width: verticalScale(60),
    height: verticalScale(60),
    borderRadius: verticalScale(30),
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 12,
    borderWidth: 4,
    borderColor: colors.neutral800,
  },
  floatingButtonRing: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: verticalScale(30),
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
});
