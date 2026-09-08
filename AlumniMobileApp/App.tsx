import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator, NativeStackScreenProps } from '@react-navigation/native-stack';
import { createBottomTabNavigator, BottomTabScreenProps } from '@react-navigation/bottom-tabs';

import { SafeAreaProvider } from 'react-native-safe-area-context';

// Import Context
import { AppProvider, useAppContext } from './src/context/AppContext';

// Import Custom Glass Tab Bar
import GlassTabBar from './src/components/GlassTabBar';

// Import Screens
import WelcomeScreen from './src/screens/WelcomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import FeedsScreen from './src/screens/FeedsScreen';
import DirectoryScreen from './src/screens/DirectoryScreen';
import JobsScreen from './src/screens/JobsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import AlumniDetailScreen from './src/screens/AlumniDetailScreen';
import MessagesScreen from './src/screens/MessagesScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';
import ChangePasswordScreen from './src/screens/ChangePasswordScreen';
import JobApplyScreen from './src/screens/JobApplyScreen';

// --- 1. Navigation Parameter Types ---
export type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  MainTabs: { screen?: keyof TabParamList; params?: any } | undefined;
  AlumniDetail: { userId?: string; alumniId?: string };
  Messages: { recipientId?: string } | undefined;
  Settings: undefined;
  EditProfile: undefined;
  ChangePassword: undefined;
  JobApply: { job?: any } | undefined;
};

export type TabParamList = {
  Feeds: undefined;
  Directory: undefined;
  Jobs: undefined;
  Messages: { recipientId?: string } | undefined;
  Profile: undefined;
};

// Navigation type helpers
export type RootStackScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, T>;
export type TabScreenProps<T extends keyof TabParamList> = BottomTabScreenProps<TabParamList, T>;

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

// Bottom Tabs Navigator (Feeds, Directory, Jobs, Messages & Profile)
function MainTabs() {
  const { lang } = useAppContext();

  return (
    <Tab.Navigator
      initialRouteName="Feeds"
      tabBar={(props) => <GlassTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen
        name="Feeds"
        component={FeedsScreen}
        options={{ tabBarLabel: lang === 'mm' ? 'သတင်း' : 'Feeds' }}
      />
      <Tab.Screen
        name="Directory"
        component={DirectoryScreen}
        options={{ tabBarLabel: lang === 'mm' ? 'စာရင်း' : 'Directory' }}
      />
      <Tab.Screen
        name="Jobs"
        component={JobsScreen}
        options={{ tabBarLabel: lang === 'mm' ? 'အလုပ်' : 'Jobs' }}
      />
      <Tab.Screen
        name="Messages"
        component={MessagesScreen}
        options={{ tabBarLabel: lang === 'mm' ? 'မက်ဆေ့ခ်ျ' : 'Messages' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarLabel: lang === 'mm' ? 'ပရိုဖိုင်' : 'Profile' }}
      />
    </Tab.Navigator>
  );
}

// Wrapper Component to provide Context & Navigation
export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <NavigationContainer>
          <Stack.Navigator initialRouteName="Welcome" screenOptions={{ headerShown: false }}>
            {/* --- Auth & Onboarding Flow --- */}
            <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ animation: 'fade' }} />
            <Stack.Screen name="Login" component={LoginScreen} options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="Register" component={RegisterScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ animation: 'slide_from_right' }} />

            {/* --- Main Tab App Flow --- */}
            <Stack.Screen name="MainTabs" component={MainTabs} options={{ animation: 'fade' }} />

            {/* --- Detail & Auxiliary Screens --- */}
            <Stack.Screen name="AlumniDetail" component={AlumniDetailScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="Messages" component={MessagesScreen} options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="Settings" component={SettingsScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="JobApply" component={JobApplyScreen} options={{ animation: 'slide_from_bottom' }} />
          </Stack.Navigator>
        </NavigationContainer>
      </AppProvider>
    </SafeAreaProvider>
  );
}