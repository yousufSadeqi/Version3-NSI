import { StyleSheet, View, TouchableOpacity, ScrollView } from 'react-native';
import React from 'react';
import ScreenWrapper from '@/components/ScreenWrapper';
import { colors, spacingX, spacingY, radius } from '@/constants/theme';
import { verticalScale } from '@/utils/styling';
import { useAuth } from '@/contexts/authContext';
import Typo from '@/components/Typo';
import { Image } from 'react-native';
import * as Icons from 'phosphor-react-native';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { signOut } from 'firebase/auth';
import { auth } from '@/config/firebase';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/themeContext';

const Profile = () => {
  const { user } = useAuth();
  const router = useRouter();
  const { themeColors } = useTheme();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace('/(auth)/welcome');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const menuItems = [
    {
      id: 'account',
      title: 'Account',
      items: [
        {
          icon: <Icons.User size={22} color={themeColors.text} weight="fill" />,
          label: 'Edit Profile',
          route: '/(modals)/profileModal',
        },
        {
          icon: <Icons.Bell size={22} color={themeColors.text} weight="fill" />,
          label: 'Notifications',
          route: '/(modals)/notificationsModal',
        },
      ],
    },
    {
      id: 'security',
      title: 'Security',
      items: [
        {
          icon: <Icons.Lock size={22} color={themeColors.text} weight="fill" />,
          label: 'Privacy & Security',
          route: '/(modals)/securityModal',
        },
        {
          icon: <Icons.Shield size={22} color={themeColors.text} weight="fill" />,
          label: 'Password',
          route: '/(modals)/PasscodeModal',
        },
      ],
    },
    {
      id: 'preferences',
      title: 'Preferences',
      items: [
        {
          icon: <Icons.Question size={22} color={themeColors.text} weight="fill" />,
          label: 'Help & Support',
          route: '/(modals)/supportModal',
        },
        {
          icon: <Icons.Info size={22} color={themeColors.text} weight="fill" />,
          label: 'About',
          route: '/(modals)/AboutModal',
        },
      ],
    },
  ];

  return (
    <ScreenWrapper>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <Animated.View 
          entering={FadeInDown.duration(500)} 
          style={[styles.header, { backgroundColor: themeColors.surface }]}
        >
          <View style={styles.profileInfo}>
            <Image
              source={user?.image ? { uri: user.image } : require('../../assets/images/defaultAvatar.png')}
              style={styles.avatar}
            />
            <View style={styles.userInfo}>
              <Typo size={24} fontWeight="600" color={themeColors.text}>
                {user?.name || 'User'}
              </Typo>
              <Typo size={14} color={themeColors.textSecondary}>
                {user?.email}
              </Typo>
            </View>
          </View>
          <TouchableOpacity 
            style={[styles.editButton, { backgroundColor: themeColors.surfaceVariant }]}
            onPress={() => router.push('/(modals)/profileModal')}
          >
            <Icons.PencilSimple size={20} color={themeColors.primary} weight="fill" />
          </TouchableOpacity>
        </Animated.View>

        {/* Menu Sections */}
        <View style={styles.menuContainer}>
          {menuItems.map((section, sectionIndex) => (
            <Animated.View 
              key={section.id}
              entering={FadeInDown.delay(200 * sectionIndex)}
              style={[styles.menuSection, { backgroundColor: themeColors.surface }]}
            >
              <Typo 
                size={14} 
                color={themeColors.textSecondary} 
                style={styles.sectionTitle}
              >
                {section.title}
              </Typo>
              
              {section.items.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.menuItem, { 
                    borderBottomColor: themeColors.surfaceVariant,
                    borderBottomWidth: index === section.items.length - 1 ? 0 : 1 
                  }]}
                  onPress={() => router.push(item.route)}
                >
                  {item.icon}
                  <Typo size={16} color={themeColors.text} style={{ flex: 1, marginLeft: spacingX._12 }}>
                    {item.label}
                  </Typo>
                  <Icons.CaretRight size={20} color={themeColors.textSecondary} weight="bold" />
                </TouchableOpacity>
              ))}
            </Animated.View>
          ))}
        </View>

        {/* Logout Button */}
        <Animated.View 
          entering={FadeInDown.delay(800)}
          style={styles.logoutContainer}
        >
          <TouchableOpacity 
            style={[styles.logoutButton, { backgroundColor: themeColors.rose }]}
            onPress={handleLogout}
          >
            <Icons.SignOut size={22} color={colors.white} weight="bold" />
            <Typo size={16} color={colors.white} style={{ marginLeft: spacingX._10 }}>
              Log out
            </Typo>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacingX._20,
    marginBottom: spacingY._20,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: verticalScale(60),
    height: verticalScale(60),
    borderRadius: verticalScale(30),
    marginRight: spacingX._15,
  },
  userInfo: {
    gap: 4,
  },
  editButton: {
    padding: spacingX._10,
    borderRadius: radius._12,
  },
  menuContainer: {
    paddingHorizontal: spacingX._20,
    gap: spacingY._20,
  },
  menuSection: {
    borderRadius: radius._20,
    overflow: 'hidden',
  },
  sectionTitle: {
    padding: spacingX._15,
    paddingBottom: spacingY._10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacingX._15,
  },
  logoutContainer: {
    padding: spacingX._20,
    marginTop: spacingY._20,
    marginBottom: spacingY._30,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacingY._15,
    borderRadius: radius._15,
  },
});

export default Profile;
