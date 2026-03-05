import React from 'react';
import { Icon, Label, NativeTabs } from 'expo-router/unstable-native-tabs';

export default function TabsLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Label>תקלות</Label>
        <Icon sf="wrench.and.screwdriver" md="build" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="people">
        <Label>אנשים</Label>
        <Icon sf="person.3" md="group" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <Label>פרופיל</Label>
        <Icon sf="person.crop.circle" md="person" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

