import React from 'react';
import { Stack } from 'expo-router';

export default function ModalsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        presentation: 'modal',
      }}
    >
      <Stack.Screen name="report-issue" />
      <Stack.Screen name="issue-details/[issueId]" />
      <Stack.Screen name="announcements" />
      <Stack.Screen name="create-announcement" />
      <Stack.Screen name="edit-profile" />
    </Stack>
  );
}

