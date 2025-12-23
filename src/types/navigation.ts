export type AuthStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  ProfileSetup: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  People: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  // Auth Screens
  Onboarding: undefined;
  Login: undefined;
  ProfileSetup: undefined;
  
  // Main Flow
  Main: { screen?: keyof MainTabParamList };
  
  // Modals / Details
  CreateIssue: undefined;
  IssueDetails: { issueId: string };
  CommitteePanel: undefined;
  CommitteeAnnouncements: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
