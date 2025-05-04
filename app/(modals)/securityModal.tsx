import Typo from '@/components/Typo';
import { colors, spacingX, spacingY, radius } from '@/constants/theme';
import { useAuth } from '@/contexts/authContext';
import React from 'react';
import { View, ScrollView, StyleSheet, Pressable } from 'react-native';
import * as Icons from 'phosphor-react-native';
import { verticalScale } from '@/utils/styling';

const SecurityModal = () => {
  const { user } = useAuth();

  const SecuritySection = ({ title, icon, onPress }: { title: string; icon: React.ReactNode; onPress?: () => void }) => (
    <Pressable style={styles.section} onPress={onPress}>
      <View style={styles.sectionIcon}>{icon}</View>
      <View style={styles.sectionContent}>
        <Typo size={16} fontWeight="600" color={colors.white}>{title}</Typo>
        <Typo size={14} color={colors.neutral400}>Tap to manage</Typo>
      </View>
      <Icons.CaretRight size={20} color={colors.neutral500} />
    </Pressable>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Typo size={24} fontWeight="700" color={colors.white}>Privacy & Security</Typo>
        <Typo size={15} color={colors.neutral400}>Manage your account security and privacy settings</Typo>
      </View>

      <View style={styles.sectionGroup}>
        <Typo size={18} fontWeight="600" style={styles.groupTitle} color={colors.white}>Security</Typo>
        <SecuritySection 
          title="Two-Factor Authentication" 
          icon={<Icons.ShieldCheck size={24} color={colors.primary} />}
        />
        <SecuritySection 
          title="Change Password" 
          icon={<Icons.LockKey size={24} color={colors.primary} />}
        />
        <SecuritySection 
          title="Login History" 
          icon={<Icons.Clock size={24} color={colors.primary} />}
        />
      </View>

      <View style={styles.sectionGroup}>
        <Typo size={18} fontWeight="600" style={styles.groupTitle} color={colors.white}>Privacy</Typo>
        <SecuritySection 
          title="Data Collection" 
          icon={<Icons.Database size={24} color={colors.primary} />}
        />
        <SecuritySection 
          title="Location Services" 
          icon={<Icons.MapPin size={24} color={colors.primary} />}
        />
        <SecuritySection 
          title="Notification Preferences" 
          icon={<Icons.Bell size={24} color={colors.primary} />}
        />
      </View>

      <View style={styles.sectionGroup}>
        <Typo size={18} fontWeight="600" style={styles.groupTitle} color={colors.white}>Data Management</Typo>
        <SecuritySection 
          title="Export Data" 
          icon={<Icons.Download size={24} color={colors.primary} />}
        />
        <SecuritySection 
          title="Delete Account" 
          icon={<Icons.Trash size={24} color={colors.rose} />}
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

export default SecurityModal;
