import { StyleSheet, View, ScrollView, TouchableOpacity, Alert } from 'react-native';
import React, { useEffect, useState } from 'react';
import { colors, spacingX, spacingY, radius } from '@/constants/theme';
import { scale, verticalScale } from '@/utils/styling';
import ModalWrapper from '@/components/ModalWrapper';
import Header from '@/components/Header';
import BackButton from '@/components/BackButton';
import { Image } from 'expo-image';
import * as Icons from 'phosphor-react-native';
import Typo from '@/components/Typo';
import Input from '@/components/input';
import { UserDataType } from '@/types';
import { useAuth } from '@/contexts/authContext';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { updateUser } from '@/service/userService';
import Animated, { 
  FadeIn, 
  FadeInDown, 
  SlideInUp,
  useAnimatedStyle, 
  useSharedValue, 
  withSequence, 
  withTiming, 
  Easing 
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/themeContext';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const ProfileModal = () => {
  const { user, updateUserData } = useAuth();
  const { themeColors } = useTheme();
  const [userData, setUserData] = useState<UserDataType>({
    name: '', 
    image: null,
  });

  const [loading, setLoading] = useState(false);
  const router = useRouter();
  
  // Animation values
  const avatarScale = useSharedValue(1);
  const buttonScale = useSharedValue(1);
  
  useEffect(() => {
    if (!user) return;
    setUserData({
      name: user?.name || '',
      image: user?.image || null,
    });
  }, [user]);

  // Animation styles and handlers
  const avatarAnimStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: avatarScale.value }]
    };
  });
  
  const buttonAnimStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: buttonScale.value }]
    };
  });
  
  const animateAvatar = () => {
    avatarScale.value = withSequence(
      withTiming(1.05, { duration: 200, easing: Easing.inOut(Easing.ease) }),
      withTiming(1, { duration: 200, easing: Easing.inOut(Easing.ease) })
    );
  };
  
  const animateButton = () => {
    buttonScale.value = withSequence(
      withTiming(0.95, { duration: 100, easing: Easing.inOut(Easing.ease) }),
      withTiming(1, { duration: 100, easing: Easing.inOut(Easing.ease) })
    );
  };

  const onPickImage = async () => {
    animateAvatar();
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
        setUserData({ ...userData, image: result.assets[0].uri });
      }
    } catch (error) {
      console.error("Image picker error:", error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const onSubmit = async () => {
    animateButton();
    let { name, image } = userData;

    if (!name || !name.trim()) {
      Alert.alert('Missing Information', 'Please enter your name');
      return;
    }

    setLoading(true);
    
    try {
      const res = await updateUser(user?.uid as string, userData);
      if (res.success) {
        updateUserData(user?.uid as string);
        Alert.alert('Success', 'Profile updated successfully');
        router.back();
      } else {
        Alert.alert('Update Failed', res.msg);
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalWrapper style={styles.modalWrapper}>
      <View style={[styles.container, { backgroundColor: themeColors.background }]}>
        <Header 
          title="Edit Profile" 
          leftIcon={<BackButton />} 
          style={styles.header}
        />

        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View 
            style={styles.profileSection}
            entering={FadeInDown.duration(500).springify()}
          >
            <View style={styles.profileImageWrapper}>
              <LinearGradient
                colors={[colors.primary, colors.primaryDark]}
                style={styles.avatarGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              
              <Animated.View style={[styles.avatarContainer, avatarAnimStyle]}>
                <Image
                source={user?.image ? { uri: user.image } : require('../../assets/images/defaultAvatar.png')}
                style={styles.avatar}
                />
              </Animated.View>

              <TouchableOpacity 
                onPress={onPickImage} 
                style={[styles.editIcon, { backgroundColor: themeColors.surface }]}
              >
                <Icons.Camera size={22} color={colors.primary} weight="bold" />
              </TouchableOpacity>
            </View>
            
            <Animated.View 
              style={styles.nameDisplay}
              entering={SlideInUp.delay(300).springify()}
            >
              <Typo size={24} fontWeight={'700'} color={themeColors.text}>
                {user?.name || 'Your Name'}
              </Typo>
              <Typo size={14} color={themeColors.textSecondary}>
                {user?.email || 'your.email@example.com'}
              </Typo>
            </Animated.View>
          </Animated.View>

          <Animated.View 
            style={styles.form}
            entering={FadeIn.delay(400).duration(800)}
          >
            <View style={styles.inputSection}>
              <View style={styles.inputHeader}>
                <Icons.User size={18} color={themeColors.textSecondary} weight="fill" />
                <Typo color={themeColors.textSecondary}>Full Name</Typo>
              </View>
              
              <Input
                placeholder="Enter your name"
                value={userData.name}
                onChangeText={(value) => setUserData({ ...userData, name: value })}
                containerStyle={[styles.input, { backgroundColor: themeColors.surface }]}
              />
            </View>
          </Animated.View>
        </ScrollView>

        <Animated.View 
          style={[styles.footer, { borderTopColor: themeColors.border || colors.neutral700 }]}
          entering={FadeInDown.delay(500).duration(500)}
        >
          <AnimatedTouchable 
            onPress={onSubmit} 
            style={[styles.updateButton, buttonAnimStyle]}
            activeOpacity={0.9}
          >
            {loading ? (
              <Icons.CircleNotch size={24} color={colors.neutral900} weight="bold" />
            ) : (
              <Typo color={colors.neutral900} fontWeight={'700'} size={16}>
                Save Changes
              </Typo>
            )}
          </AnimatedTouchable>
        </Animated.View>
      </View>
    </ModalWrapper>
  );
};

export default ProfileModal;

const styles = StyleSheet.create({
  modalWrapper: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacingX._20,
    paddingTop: spacingY._10,
    paddingBottom: spacingY._15,
  },
  scrollContent: {
    paddingBottom: spacingY._30,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: spacingY._20,
  },
  profileImageWrapper: {
    position: 'relative',
    marginBottom: spacingY._20,
  },
  avatarGradient: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: 150,
    opacity: 0.15,
  },
  avatarContainer: {
    padding: 4,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  avatar: {
    height: verticalScale(140),
    width: verticalScale(140),
    borderRadius: 100,
  },
  editIcon: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    borderRadius: 50,
    padding: 12,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  nameDisplay: {
    alignItems: 'center',
    gap: 4,
  },
  form: {
    paddingHorizontal: spacingX._20,
    marginTop: spacingY._30,
  },
  inputSection: {
    gap: spacingY._10,
    marginBottom: spacingY._20,
  },
  inputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 4,
  },
  input: {
    borderRadius: radius._12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  footer: {
    paddingHorizontal: spacingX._20,
    paddingVertical: spacingY._15,
    borderTopWidth: 1,
  },
  updateButton: {
    height: verticalScale(56),
    borderRadius: radius._12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
