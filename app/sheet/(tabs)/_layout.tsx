import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { TabBarLabel } from '@/components/ui/tab-bar-label';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: true,
        tabBarButton: HapticTab,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Resumo',
          tabBarIcon: ({ color }) => <IconSymbol size={22} name="shield.fill" color={color} />,
          tabBarLabel: ({ color }) => <TabBarLabel label="Resumo" color={color} />,
        }}
      />
      <Tabs.Screen
        name="attributes"
        options={{
          title: 'Atributos',
          tabBarIcon: ({ color }) => <IconSymbol size={22} name="chart.bar.fill" color={color} />,
          tabBarLabel: ({ color }) => <TabBarLabel label="Atributos" color={color} />,
        }}
      />
      <Tabs.Screen
        name="inventory"
        options={{
          title: 'Inventário',
          tabBarIcon: ({ color }) => <IconSymbol size={22} name="bag.fill" color={color} />,
          tabBarLabel: ({ color }) => <TabBarLabel label="Inventário" color={color} />,
        }}
      />
      <Tabs.Screen
        name="features"
        options={{
          title: 'Características',
          tabBarIcon: ({ color }) => <IconSymbol size={22} name="list.bullet" color={color} />,
          tabBarLabel: ({ color }) => <TabBarLabel label="Características" color={color} />,
        }}
      />
      <Tabs.Screen
        name="spells"
        options={{
          title: 'Magias',
          tabBarIcon: ({ color }) => <IconSymbol size={22} name="wand.and.sparkles" color={color} />,
          tabBarLabel: ({ color }) => <TabBarLabel label="Magias" color={color} />,
        }}
      />
      <Tabs.Screen
        name="biography"
        options={{
          title: 'Biografia',
          tabBarIcon: ({ color }) => <IconSymbol size={22} name="square.and.pencil" color={color} />,
          tabBarLabel: ({ color }) => <TabBarLabel label="Biografia" color={color} />,
        }}
      />
    </Tabs>
  );
}
