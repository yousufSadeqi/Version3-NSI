import Typo from '@/components/Typo';
import { colors, spacingX, spacingY, radius } from '@/constants/theme';
import React from 'react';
import { View, ScrollView, StyleSheet, Pressable, Linking } from 'react-native';
import * as Icons from 'phosphor-react-native';
import { verticalScale } from '@/utils/styling';

const SupportModal = () => {
  const SupportSection = ({ title, icon, onPress, subtitle }: { 
    title: string; 
    icon: React.ReactNode; 
    onPress?: () => void;
    subtitle?: string;
  }) => (
    <Pressable style={styles.section} onPress={onPress}>
      <View style={styles.sectionIcon}>{icon}</View>
      <View style={styles.sectionContent}>
        <Typo size={16} fontWeight="600" color={colors.white}>{title}</Typo>
        {subtitle && <Typo size={14} color={colors.neutral400}>{subtitle}</Typo>}
      </View>
      <Icons.CaretRight size={20} color={colors.neutral500} />
    </Pressable>
  );

  const handleEmailPress = () => {
    // Todo make a linking account so it work 
    Linking.openURL('yousufsadeqi333@gmail.com');
  };

  const handleChatPress = () => {
    // Todo -- Implement chat functionality
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Typo size={24} fontWeight="700" color={colors.white}>Support Center</Typo>
        <Typo size={15} color={colors.neutral400}>Get help with your account and app</Typo>
      </View>

      <View style={styles.sectionGroup}>
        <Typo size={18} fontWeight="600" style={styles.groupTitle} color={colors.white}>Help & Support</Typo>
        <SupportSection 
          title="FAQs" 
          icon={<Icons.Question size={24} color={colors.primary} />}
          subtitle="Find answers to common questions"
        />
        <SupportSection 
          title="User Guide" 
          icon={<Icons.BookOpen size={24} color={colors.primary} />}
          subtitle="Learn how to use the app"
        />
        <SupportSection 
          title="Tutorials" 
          icon={<Icons.PlayCircle size={24} color={colors.primary} />}
          subtitle="Watch video guides"
        />
      </View>

      <View style={styles.sectionGroup}>
        <Typo size={18} fontWeight="600" style={styles.groupTitle} color={colors.white}>Contact Us</Typo>
        <SupportSection 
          title="Email Support" 
          icon={<Icons.Envelope size={24} color={colors.primary} />}
          subtitle="Get help via email"
          onPress={handleEmailPress}
        />
        <SupportSection 
          title="Live Chat" 
          icon={<Icons.ChatCircle size={24} color={colors.primary} />}
          subtitle="Chat with our support team"
          onPress={handleChatPress}
        />
        <SupportSection 
          title="Report a Bug" 
          icon={<Icons.Bug size={24} color={colors.primary} />}
          subtitle="Help us improve the app"
        />
      </View>

      <View style={styles.sectionGroup}>
        <Typo size={18} fontWeight="600" style={styles.groupTitle} color={colors.white}>Community</Typo>
        <SupportSection 
          title="Community Forum" 
          icon={<Icons.Users size={24} color={colors.primary} />}
          subtitle="Connect with other users"
        />
        <SupportSection 
          title="Feature Requests" 
          icon={<Icons.Lightbulb size={24} color={colors.primary} />}
          subtitle="Suggest new features"
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral900,
  },
  header: {
    padding: spacingX._20,
    paddingTop: spacingY._30,
    gap: spacingY._5,
  },
  sectionGroup: {
    padding: spacingX._20,
    gap: spacingY._15,
  },
  groupTitle: {
    marginBottom: spacingY._10,
  },
  section: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral800,
    padding: spacingX._15,
    borderRadius: radius._10,
    gap: spacingX._15,
  },
  sectionIcon: {
    width: verticalScale(40),
    height: verticalScale(40),
    borderRadius: radius._20,
    backgroundColor: colors.neutral700,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionContent: {
    flex: 1,
    gap: spacingY._5,
  },
});

export default SupportModal;