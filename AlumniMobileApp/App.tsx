import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator, NativeStackScreenProps } from '@react-navigation/native-stack';
import { createBottomTabNavigator, BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// Import Context
import { AppProvider, useAppContext } from './src/context/AppContext';

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
  const { isDarkMode, lang } = useAppContext();
  // Safe Area Insets to handle Android system nav (home, back, recent) & iOS swipe bar
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      initialRouteName="Feeds"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#008B8B',
        tabBarInactiveTintColor: isDarkMode ? '#64748b' : '#94a3b8',
        
        // --- SYSTEM NAVIGATION & TAB BAR PADDING CONFIGURATION ---
        tabBarStyle: {
          backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
          borderTopColor: isDarkMode ? '#334155' : '#e2e8f0',

          // ADJUST HERE: Dynamic height accommodates Android bottom system buttons & iOS home bar.
          // Base height = 56px + system inset (or default 10px if no inset present).
          height: 56 + (insets.bottom > 0 ? insets.bottom : 10),

          // ADJUST HERE: Bottom padding pushes tab content above Android home/back/recents buttons.
          // Increase or decrease `8` or `insets.bottom` if icons sit too high/low.
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,

          // ADJUST HERE: Top padding inside the tab bar for icon alignment.
          paddingTop: 6,

          // ADJUST HERE: Optional absolute positioning or bottom margin if custom floating bar is needed
          // marginBottom: 0,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          // ADJUST HERE: Margin between icon and label text
          marginBottom: 2,
        },
        tabBarIconStyle: {
          // ADJUST HERE: Icon container offset/margin
          marginTop: 2,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'newspaper-outline';

          if (route.name === 'Feeds') {
            iconName = focused ? 'newspaper' : 'newspaper-outline';
          } else if (route.name === 'Directory') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Jobs') {
            iconName = focused ? 'briefcase' : 'briefcase-outline';
          } else if (route.name === 'Messages') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Feeds"
        component={FeedsScreen}
        options={{ tabBarLabel: lang === 'mm' ? 'သတင်းများ' : 'Feeds' }}
      />
      <Tab.Screen
        name="Directory"
        component={DirectoryScreen}
        options={{ tabBarLabel: lang === 'mm' ? 'စာရင်း' : 'Directory' }}
      />
      <Tab.Screen
        name="Jobs"
        component={JobsScreen}
        options={{ tabBarLabel: lang === 'mm' ? 'အလုပ်အကိုင်' : 'Jobs' }}
      />
      <Tab.Screen
        name="Messages"
        component={MessagesScreen}
        options={{ tabBarLabel: lang === 'mm' ? 'မက်ဆေ့ခ်ျ' : 'Messages' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarLabel: lang === 'mm' ? 'ပရိုဖိုင်' : 'My Profile' }}
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
            <Stack.Screen name="JobApply" component={JobApplyScreen} options={{ animation: 'slide_from_bottom' }} />
          </Stack.Navigator>
        </NavigationContainer>
      </AppProvider>
    </SafeAreaProvider>
  );
}