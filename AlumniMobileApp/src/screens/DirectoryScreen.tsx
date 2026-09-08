// file: src/screens/DirectoryScreen.tsx
import React, { useEffect, useState, useCallback, useRef, memo } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import api from '../services/api';
import { GradientBackground, SearchBar, FilterChip, EmptyState, ScreenHeader, ActionIconButton, Avatar, useTheme } from '../components';

// 1. IMPORT GLOBAL CONTEXT
import { useAppContext } from "../context/AppContext";

const DOMAIN = 'https://alumni.ucsh.edu.mm';
const DEGREES = ['B.C.Sc', 'B.C.Tech', 'M.C.Sc', 'M.C.Tech', 'D.C.Sc', 'M.I.Sc', 'Ph.D'];

type Lang = 'en' | 'mm';

// ----------------------------------------------------
// TRANSLATION STORE
// ----------------------------------------------------
const translations = {
  en: {
    title: "Alumni Directory",
    searchPlaceholder: "Search name or email...",
    allDegrees: "All Degrees",
    allYears: "All Years",
    noAlumni: "No alumni members found.",
    call: "Call",
    email: "Email",
    sessionExpired: "Session Expired",
    loginAgain: "Please log in again to continue.",
    classOf: "Class of",
    alumni: "Alumni",
  },
  mm: {
    title: "ကျောင်းသားဟောင်းစာရင်း",
    searchPlaceholder: "အမည် သို့မဟုတ် Email ရှာရန်...",
    allDegrees: "ဘွဲ့များအားလုံး",
    allYears: "ခုနှစ်များအားလုံး",
    noAlumni: "ကျောင်းသားဟောင်း မတွေ့ပါ",
    call: "ဖုန်း",
    email: "အီးမေးလ်",
    sessionExpired: "Session သက်တမ်းကုန်သွားပါပြီ",
    loginAgain: "ဆက်လုပ်ရန် ကျေးဇူးပြု၍ ပြန်လည်ဝင်ရောက်ပါ။",
    classOf: "ဘွဲ့ရနှစ်",
    alumni: "ကျောင်းသားဟောင်း",
  }
};

export interface UserItem {
  _id: string;
  name: string;
  email: string;
  role?: string; // <-- Added role to interface
  position?: string;
  degree?: string;
  department?: string;
  graduatedYear?: string;
  image?: string;
  profileImage?: string;
  googleImage?: string;
  googleProfileImage?: string;
  contactInfo?: {
    company?: string;
    position?: string;
    email?: string;
    phone?: string;
  };
}

// ----------------------------------------------------
// SMART IMAGE RESOLVER
// ----------------------------------------------------
const getUserImage = (user: UserItem) => {
  const imgName = user.profileImage || user.image || user.googleImage || user.googleProfileImage;
  if (!imgName || imgName.trim() === '') return null;
  let cleanPath = imgName.trim();
  if (cleanPath.startsWith('http')) return cleanPath;
  if (cleanPath.startsWith('/uploads/')) return `${DOMAIN}${cleanPath}`;
  if (cleanPath.startsWith('uploads/')) return `${DOMAIN}/${cleanPath}`;
  if (cleanPath.startsWith('/photo/')) return `${DOMAIN}/uploads${cleanPath}`;
  if (cleanPath.startsWith('photo/')) return `${DOMAIN}/uploads/${cleanPath}`;
  return `${DOMAIN}/uploads/photo/${user._id}/profile/${cleanPath}`;
};

// ----------------------------------------------------
// OPTIMIZED MEMOIZED CARD COMPONENT
// ----------------------------------------------------
const UserCard = memo(({ 
  item, 
  onPress, 
  onContactUrl,
  t,
  isDarkMode,
  textColor,
  subTextColor,
  cardBg,
  cardBorder,
  actionBtnBg
}: { 
  item: UserItem; 
  onPress: (item: UserItem) => void;
  onContactUrl: (url: string) => void;
  t: any;
  isDarkMode: boolean;
  textColor: string;
  subTextColor: string;
  cardBg: string;
  cardBorder: string;
  actionBtnBg: string;
}) => {
  const [imageError, setImageError] = useState(false);
  const imageUrl = !imageError ? getUserImage(item) : null;

  const position = item.contactInfo?.position || item.position;
  const company = item.contactInfo?.company;
  const email = item.contactInfo?.email || item.email;
  const phone = item.contactInfo?.phone;

  return (
    <TouchableOpacity style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]} activeOpacity={0.7} onPress={() => onPress(item)}>
      <View style={styles.cardHeaderRow}>
        {imageUrl ? (
          <Image 
            source={{ uri: imageUrl }} 
            style={styles.avatar} 
            contentFit="cover" 
            cachePolicy="memory-disk"
            transition={200}
            onError={() => setImageError(true)}
          />
        ) : (
          <View style={[styles.avatar, styles.placeholderAvatar]}>
            <Text style={styles.placeholderText}>
              {item.name ? item.name.charAt(0).toUpperCase() : 'U'}
            </Text>
          </View>
        )}

        <View style={styles.info}>
          <Text style={[styles.name, { color: textColor }]}>{item.name}</Text>
          {(position || company) ? (
            <Text style={[styles.position, { color: subTextColor }]} numberOfLines={1}>
              {position} {company ? `at ${company}` : ''}
            </Text>
          ) : null}
          <View style={styles.badgeRow}>
            <View style={[styles.badge, { backgroundColor: isDarkMode ? 'rgba(0,191,196,0.15)' : '#f1f5f9' }]}>
              <Text style={[styles.badgeText, { color: isDarkMode ? '#00BFC4' : '#475569' }]}>
                {item.degree || item.department || t.alumni}
              </Text>
            </View>
            {item.graduatedYear ? (
              <View style={[styles.badge, { backgroundColor: isDarkMode ? 'rgba(0,191,196,0.15)' : '#f1f5f9' }]}>
                <Text style={[styles.badgeText, { color: isDarkMode ? '#00BFC4' : '#475569' }]}>
                  {t.classOf} {item.graduatedYear}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
        <Ionicons name="chevron-forward" size={18} color={subTextColor} />
      </View>

      <View style={[styles.actionRow, { borderTopColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f1f5f9' }]}>
        <TouchableOpacity 
          style={[styles.actionBtn, { backgroundColor: actionBtnBg }, !phone && styles.actionBtnDisabled]}
          disabled={!phone}
          onPress={() => onContactUrl(`tel:${phone}`)}
        >
          <Feather name="phone" size={14} color={phone ? "#008B8B" : (isDarkMode ? "#475569" : "#cbd5e1")} />
          <Text style={[styles.actionBtnText, !phone && { color: isDarkMode ? "#475569" : "#cbd5e1" }]}>{t.call}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionBtn, { backgroundColor: actionBtnBg }, !email && styles.actionBtnDisabled]}
          disabled={!email}
          onPress={() => onContactUrl(`mailto:${email}`)}
        >
          <Feather name="mail" size={14} color={email ? "#008B8B" : (isDarkMode ? "#475569" : "#cbd5e1")} />
          <Text style={[styles.actionBtnText, !email && { color: isDarkMode ? "#475569" : "#cbd5e1" }]}>{t.email}</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
});

export default function DirectoryScreen({ navigation }: any) {
  // 2. EXTRACT GLOBAL STATE
  const { lang, setLang, isDarkMode, toggleTheme } = useAppContext();
  const t = translations[lang];

  const [alumni, setAlumni] = useState<UserItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDegree, setSelectedDegree] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [availableYears, setAvailableYears] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const isFetchingRef = useRef(false);

  // 1. STRICT AUTH CHECK: Run immediately when screen mounts
  useEffect(() => {
    async function enforceAuth() {
      const session = await SecureStore.getItemAsync('user_session');
      if (!session) {
        navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
      }
    }
    enforceAuth();
  }, [navigation]);

  // Load Years Filter
  useEffect(() => {
    async function loadYears() {
      try {
        const session = await SecureStore.getItemAsync('user_session');
        if (!session) return; 
        
        const res = await api.get('/register/years');
        if (res.data?.years) setAvailableYears(res.data.years);
      } catch (error) {
        console.error('Failed to load years:', error);
      }
    }
    loadYears();
  }, []);

  // Fetch Directory (Now Cache-First!)
  const fetchAlumni = useCallback(
    async (queryText = '', degreeText = '', yearText = '', isRefresh = false) => {
      if (isFetchingRef.current) return;
      
      const session = await SecureStore.getItemAsync('user_session');
      if (!session) return;

      isFetchingRef.current = true;
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      // 1. INSTANT LOAD FROM CACHE FIRST
      try {
        const cachedData = await AsyncStorage.getItem('cached_alumni_data');
        if (cachedData) {
          const parsedCache = JSON.parse(cachedData);
          setAlumni(parsedCache);
          setLoading(false); // Stop loading spinner instantly!
        }
      } catch (e) {
        console.log("No cache found.");
      }

      // 2. FETCH LATEST FROM SERVER IN BACKGROUND
      try {
        const res = await api.get('/users', {
          params: { q: queryText, degree: degreeText, year: yearText },
        });

        if (res.data) {
          const incoming: UserItem[] = Array.isArray(res.data) ? res.data : res.data.data || [];
          
          // <-- FILTER: Exclude 'admin' and 'staff' roles to only show users -->
          const filteredAlumni = incoming.filter((user) => {
            const userRole = user.role?.toLowerCase() || 'user';
            return userRole !== 'admin' && userRole !== 'staff';
          });

          setAlumni(filteredAlumni); // Update UI quietly
          
          // Update the cache with latest data
          if (queryText === '' && degreeText === '' && yearText === '') {
             await AsyncStorage.setItem('cached_alumni_data', JSON.stringify(filteredAlumni));
          }
        }
      } catch (error: any) {
        console.error('Failed to fetch directory:', error);
        if (error?.response?.status === 401) {
          await SecureStore.deleteItemAsync('user_session'); 
          Alert.alert(t.sessionExpired, t.loginAgain);
          navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
        }
      } finally {
        isFetchingRef.current = false;
        setLoading(false);
        setRefreshing(false);
      }
    },
    [navigation, t]
  );

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchAlumni(searchQuery, selectedDegree, selectedYear, false);
    }, 400);
    return () => clearTimeout(timeout);
  }, [searchQuery, selectedDegree, selectedYear, fetchAlumni]);

  const handleProfilePress = () => {
    navigation.navigate('MainTabs', { screen: 'Profile' });
  };

  const openAlumniDetail = useCallback((item: UserItem) => {
    navigation.navigate('AlumniDetail', { userId: item._id, userName: item.name });
  }, [navigation]);

  const handleContactUrl = useCallback(async (url: string) => {
    try {
      // Bypassing Linking.canOpenURL() here because Android 11+ blocks it 
      // for 'tel:' and 'mailto:' without explicit <queries> in AndroidManifest.xml.
      // Simply attempting to open the URL is the safest cross-platform workaround.
      await Linking.openURL(url);
    } catch (err) {
      console.error('URL error:', err);
      Alert.alert(
        'Action Not Supported', 
        'Unable to open this link. Please make sure you have an email or phone app installed.'
      );
    }
  }, []);

  // Dynamic Theme Colors
  const textColor = isDarkMode ? "#ffffff" : "#0f172a";
  const subTextColor = isDarkMode ? "#94a3b8" : "#64748b";
  const cardBg = isDarkMode ? "#1e293b" : "#ffffff";
  const cardBorder = isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)";
  const inputBg = isDarkMode ? "#334155" : "#f1f5f9";
  const actionBtnBg = isDarkMode ? "rgba(255,255,255,0.05)" : "#f8fafc";
  const actionBg = isDarkMode ? "rgba(255,255,255,0.15)" : "rgba(0,139,139,0.1)";

  const renderItem = useCallback(({ item }: { item: UserItem }) => (
    <UserCard 
      item={item} 
      onPress={openAlumniDetail} 
      onContactUrl={handleContactUrl} 
      t={t}
      isDarkMode={isDarkMode}
      textColor={textColor}
      subTextColor={subTextColor}
      cardBg={cardBg}
      cardBorder={cardBorder}
      actionBtnBg={actionBtnBg}
    />
  ), [openAlumniDetail, handleContactUrl, t, isDarkMode, textColor, subTextColor, cardBg, cardBorder, actionBtnBg]);

  return (
    <View style={styles.root}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

      <GradientBackground isDarkMode={isDarkMode} />

      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {/* Header */}
        <ScreenHeader title={t.title}>
          <ActionIconButton icon="person-outline" onPress={handleProfilePress} />
        </ScreenHeader>

        <View style={styles.contentHeader}>
          <SearchBar
            placeholder={t.searchPlaceholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
            containerStyle={{ marginBottom: 12 }}
          />

          {/* Degree Filters */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
            <FilterChip label={t.allDegrees} active={selectedDegree === ''} onPress={() => setSelectedDegree('')} />
            {DEGREES.map((deg) => (
              <FilterChip key={deg} label={deg} active={selectedDegree === deg} onPress={() => setSelectedDegree(deg)} />
            ))}
          </ScrollView>

          {/* Year Filters */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
            <FilterChip label={t.allYears} active={selectedYear === ''} onPress={() => setSelectedYear('')} />
            {availableYears.map((yr) => (
              <FilterChip key={yr} label={yr} active={selectedYear === yr} onPress={() => setSelectedYear(yr)} />
            ))}
          </ScrollView>
        </View>

        <FlatList
          data={alumni}
          keyExtractor={(item, index) => (item._id ? `${item._id}-${index}` : String(index))}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          initialNumToRender={8}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={true}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchAlumni(searchQuery, selectedDegree, selectedYear, true)}
              colors={['#008B8B']}
              tintColor={isDarkMode ? "#008B8B" : "#008B8B"}
            />
          }
          ListEmptyComponent={
            !loading && !refreshing ? (
              <EmptyState icon="users" message={t.noAlumni} />
            ) : (
              <ActivityIndicator size="large" color="#008B8B" style={{ marginTop: 40 }} />
            )
          }
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safeArea: { flex: 1 },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 16, 
    paddingVertical: 12,
  },
  title: { fontSize: 24, fontWeight: '900' },
  topBarRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  actionIconBtn: { width: 34, height: 34, borderRadius: 17, justifyContent: "center", alignItems: "center" },
  langToggle: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  contentHeader: { paddingHorizontal: 16 },
  searchContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    borderRadius: 12, 
    paddingHorizontal: 12, 
    marginBottom: 12,
    borderWidth: 1,
  },
  searchIcon: { marginRight: 8 },
  searchBar: { flex: 1, paddingVertical: 10, fontSize: 14, fontWeight: "600" },
  filterScroll: { marginBottom: 10 },
  filterContent: { gap: 8, paddingRight: 16 },
  filterChip: { 
    paddingHorizontal: 14, 
    paddingVertical: 6, 
    borderRadius: 20, 
    borderWidth: 1, 
  },
  filterChipActive: { backgroundColor: '#008B8B', borderColor: '#008B8B' },
  filterChipText: { fontSize: 13, fontWeight: '700' },
  filterChipTextActive: { color: '#ffffff' },
  list: { padding: 16, paddingBottom: 24 },
  card: { 
    padding: 16, 
    borderRadius: 16, 
    marginBottom: 14, 
    elevation: 2, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 6,
    borderWidth: 1,
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  avatar: { width: 56, height: 56, borderRadius: 28, marginRight: 14, backgroundColor: '#e2e8f0' },
  placeholderAvatar: { backgroundColor: '#008B8B', justifyContent: 'center', alignItems: 'center' },
  placeholderText: { color: '#ffffff', fontSize: 22, fontWeight: 'bold' },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '800' },
  position: { fontSize: 13, marginTop: 2, fontWeight: '600' },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: '800' },
  actionRow: { flexDirection: 'row', gap: 10, borderTopWidth: 1, paddingTop: 12 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, borderRadius: 10, gap: 6 },
  actionBtnDisabled: { opacity: 0.6 },
  actionBtnText: { fontSize: 13, fontWeight: '800', color: '#008B8B' },
  emptyContainer: { alignItems: 'center', marginTop: 40 },
  emptyText: { fontSize: 14, fontWeight: '700' },
});