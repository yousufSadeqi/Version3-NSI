import React from 'react';
import { Tabs } from 'expo-router';
import { CustomTabs } from '@/components/CustomTabs';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs/lib/typescript/src/types';
import { colors } from '@/constants/theme';

const TabsLayout = () => {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          backgroundColor: colors.neutral800, 
        },
      }}
      tabBar={(props: BottomTabBarProps) => <CustomTabs {...props} />}
    >

      <Tabs.Screen
        name="index" 
        options={{
          title: '',
        }}
      />
      <Tabs.Screen
        name="statistics" 
        options={{
          title: '',
        }}
      />
      <Tabs.Screen
        name="wallet" // Statistics - Third
        options={{
          title: '',
        }}
      />
      <Tabs.Screen
        name="Profile" // Profile - Last
        options={{
          title: '',
        }}
      />
    </Tabs>
  );
};

export default TabsLayout;
