import Typo from '@/components/Typo';
import { colors, spacingX, spacingY, radius } from '@/constants/theme';
import React from 'react';
import { View, ScrollView, StyleSheet, Pressable, Linking } from 'react-native';
import * as Icons from 'phosphor-react-native';
import { verticalScale } from '@/utils/styling';
import { PieChart } from 'react-native-chart-kit';

const AboutModal = () => {
  const AboutSection = ({ title, icon, onPress, subtitle }: { 
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

  const handleWebsitePress = () => {
    // Todo making the linking account for these handles
    Linking.openURL('');
  };

  const handlePrivacyPress = () => {
    Linking.openURL('');
  };

  const handleTermsPress = () => {
    Linking.openURL('');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logoContainer}>
        <Icons.ChartPieSlice size={50} color={colors.white} weight="fill" />
        </View>
        <Typo size={24} fontWeight="700" color={colors.white}>Expensify</Typo>
        <Typo size={15} color={colors.neutral400}>Version 1.0.0</Typo>
      </View>

      <View style={styles.sectionGroup}>
        <Typo size={18} fontWeight="600" style={styles.groupTitle} color={colors.white}>About</Typo>
        <AboutSection 
          title="Our Story" 
          icon={<Icons.Book size={24} color={colors.primary} />}
          subtitle="Learn about our mission and vision"
        />
        <AboutSection 
          title="Team" 
          icon={<Icons.Users size={24} color={colors.primary} />}
          subtitle="Meet the people behind Expensify"
        />
        <AboutSection 
          title="Careers" 
          icon={<Icons.Briefcase size={24} color={colors.primary} />}
          subtitle="Join our growing team"
        />
      </View>

      <View style={styles.sectionGroup}>
        <Typo size={18} fontWeight="600" style={styles.groupTitle} color={colors.white}>Legal</Typo>
        <AboutSection 
          title="Privacy Policy" 
          icon={<Icons.ShieldCheck size={24} color={colors.primary} />}
          subtitle="How we protect your data"
          onPress={handlePrivacyPress}
        />
        <AboutSection 
          title="Terms of Service" 
          icon={<Icons.FileText size={24} color={colors.primary} />}
          subtitle="Our terms and conditions"
          onPress={handleTermsPress}
        />
        <AboutSection 
          title="Licenses" 
          icon={<Icons.Certificate size={24} color={colors.primary} />}
          subtitle="Open source licenses"
        />
      </View>

      <View style={styles.sectionGroup}>
        <Typo size={18} fontWeight="600" style={styles.groupTitle} color={colors.white}>Connect</Typo>
        <AboutSection 
          title="Website" 
          icon={<Icons.Globe size={24} color={colors.primary} />}
          subtitle="Visit our website"
          onPress={handleWebsitePress}
        />
        <AboutSection 
          title="Social Media" 
          icon={<Icons.ShareNetwork size={24} color={colors.primary} />}
          subtitle="Follow us on social media"
        />
      </View>

      <View style={styles.footer}>
        <Typo size={14} color={colors.neutral500} style={styles.copyright}>
          © 2024 Expensify. All rights reserved.
        </Typo>
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
    alignItems: 'center',
  },
  logoContainer: {
    width: verticalScale(80),
    height: verticalScale(80),
    borderRadius: radius._20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacingY._10,
  },
  logo: {
    width: '80%',
    height: '80%',
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
  footer: {
    padding: spacingX._20,
    paddingTop: spacingY._30,
    alignItems: 'center',
  },
  copyright: {
    textAlign: 'center',
  },
});

export default AboutModal;
