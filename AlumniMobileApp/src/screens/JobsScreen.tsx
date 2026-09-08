// file: src/screens/JobsScreen.tsx
import React, { useEffect, useState, useCallback, useRef, memo, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  StatusBar,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { jobsApi, Job as JobItem } from '../services/api';
import { useAppContext } from '../context/AppContext';

const DOMAIN = 'https://alumni.ucsh.edu.mm';

type JobType = 'Full-time' | 'Part-time' | 'Remote' | 'Internship' | 'Contract' | 'Freelance' | 'Full-Time';
type Lang = 'en' | 'mm';

const JOB_TYPES: JobType[] = ['Full-time', 'Part-time', 'Freelance', 'Remote', 'Internship', 'Contract'];

// ----------------------------------------------------
// TRANSLATION STORE
// ----------------------------------------------------
const translations = {
  en: {
    title: "Job Opportunities",
    searchPlaceholder: "Search job title, company, or keyword...",
    noJobs: "No job opportunities matched with your experiences.",
    connect: "Connect",
    cancel: "Cancel",
    delete: "Delete",
    posted: "Posted",
    sessionExpired: "Session Expired",
    loginAgain: "Please log in again to continue.",
    detailTitle: "Job Details",
    jobDescription: "Job Description",
    requirements: "Requirements",
    postedBy: "Posted by",
    deleteConfirmTitle: "Delete Job",
    deleteConfirmDesc: "Are you sure you want to delete this job posting?",
    noAuthor: "Author profile is unavailable for this job posting.",
  },
  mm: {
    title: "အလုပ်အကိုင် အခွင့်အလမ်းများ",
    searchPlaceholder: "ရာထူး၊ ကုမ္ပဏီ သို့မဟုတ် သော့ချက်စာလုံး ရှာရန်...",
    noJobs: "သင့်အတွေ့အကြုံများနှင့် ကိုက်ညီသော အလုပ် မတွေ့ပါသေးပါ။",
    connect: "ချိတ်ဆက်မည်",
    cancel: "မလုပ်တော့ပါ",
    delete: "ဖျက်မည်",
    posted: "တင်ခဲ့သည်",
    sessionExpired: "Session သက်တမ်းကုန်သွားပါပြီ",
    loginAgain: "ဆက်လုပ်ရန် ကျေးဇူးပြု၍ ပြန်လည်ဝင်ရောက်ပါ။",
    detailTitle: "အလုပ် အသေးစိတ်",
    jobDescription: "အသေးစိတ် ဖော်ပြချက်",
    requirements: "လိုအပ်ချက်များ",
    postedBy: "တင်သူ",
    deleteConfirmTitle: "အလုပ်ဖျက်မည်",
    deleteConfirmDesc: "ဒီအလုပ်ကြော်ငြာကို ဖျက်မှာ သေချာပါသလား?",
    noAuthor: "ဤအလုပ်ကြော်ငြာအတွက် တင်သူအချက်အလက် မရရှိနိုင်ပါ။",
  }
};

const jobTypeLabels: Record<Lang, Record<string, string>> = {
  en: {
    All: 'All Types',
    'Full-time': 'Full-time',
    'Full-Time': 'Full-time',
    'Part-time': 'Part-time',
    Freelance: 'Freelance',
    Remote: 'Remote',
    Internship: 'Internship',
    Contract: 'Contract',
  },
  mm: {
    All: 'အမျိုးအစား အားလုံး',
    'Full-time': 'အချိန်ပြည့်',
    'Full-Time': 'အချိန်ပြည့်',
    'Part-time': 'အချိန်ပိုင်း',
    Freelance: 'ပြင်ပအလုပ်',
    Remote: 'အိမ်မှလုပ်ရန်',
    Internship: 'အလုပ်သင်',
    Contract: 'စာချုပ်စနစ်',
  }
};

function timeAgo(dateString?: string) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + 'y ago';
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + 'mo ago';
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + 'd ago';
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + 'h ago';
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + 'm ago';
  return 'Just now';
}

const getCompanyImageUrl = (url?: string) => {
  if (!url || url.trim() === '') return null;
  let cleanPath = url.trim();
  if (cleanPath.startsWith('http')) return cleanPath;
  if (cleanPath.startsWith('/uploads/')) return `${DOMAIN}${cleanPath}`;
  if (cleanPath.startsWith('uploads/')) return `${DOMAIN}/${cleanPath}`;
  return `${DOMAIN}/uploads/${cleanPath}`;
};

// ----------------------------------------------------
// MEMOIZED JOB CARD COMPONENT
// ----------------------------------------------------
const JobCard = memo(({
  item,
  currentUserId,
  onPress,
  onConnect,
  onDelete,
  t,
  lang,
  isDarkMode,
  textColor,
  subTextColor,
  cardBg,
  cardBorder,
  actionBtnBg,
}: {
  item: JobItem;
  currentUserId: string;
  onPress: (item: JobItem) => void;
  onConnect: (item: JobItem) => void;
  onDelete: (jobId: string) => void;
  t: any;
  lang: Lang;
  isDarkMode: boolean;
  textColor: string;
  subTextColor: string;
  cardBg: string;
  cardBorder: string;
  actionBtnBg: string;
}) => {
  const [logoError, setLogoError] = useState(false);
  const logoUrl = !logoError ? getCompanyImageUrl(item.companyLogo || item.image) : null;
  const isOwner = item.author?._id === currentUserId;

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}
      activeOpacity={0.8}
      onPress={() => onPress(item)}
    >
      <View style={styles.cardHeader}>
        {logoUrl ? (
          <Image
            source={{ uri: logoUrl }}
            style={styles.companyLogo}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={200}
            onError={() => setLogoError(true)}
          />
        ) : (
          <View style={[styles.companyLogo, styles.logoPlaceholder]}>
            <Text style={styles.logoPlaceholderText}>
              {item.company ? item.company.charAt(0).toUpperCase() : 'J'}
            </Text>
          </View>
        )}

        <View style={styles.headerInfo}>
          <Text style={[styles.jobTitle, { color: textColor }]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={[styles.companyName, { color: subTextColor }]} numberOfLines={1}>
            {item.company}
          </Text>
        </View>

        {isOwner && (
          <TouchableOpacity
            style={styles.moreOptionsBtn}
            onPress={() => onDelete(item._id)}
          >
            <Feather name="trash-2" size={16} color="#ef4444" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.tagRow}>
        {item.jobType ? (
          <View style={[styles.tagBadge, { backgroundColor: isDarkMode ? 'rgba(0,191,196,0.15)' : '#eaffff' }]}>
            <Ionicons name="briefcase-outline" size={12} color="#008B8B" />
            <Text style={styles.tagText}>
              {jobTypeLabels[lang][item.jobType] || item.jobType}
            </Text>
          </View>
        ) : null}

        {item.location ? (
          <View style={[styles.tagBadge, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f1f5f9' }]}>
            <Ionicons name="location-outline" size={12} color={subTextColor} />
            <Text style={[styles.tagText, { color: subTextColor }]}>{item.location}</Text>
          </View>
        ) : null}

        {item.salary ? (
          <View style={[styles.tagBadge, { backgroundColor: isDarkMode ? 'rgba(241,205,114,0.15)' : '#fef9c3' }]}>
            <Ionicons name="cash-outline" size={12} color="#d97706" />
            <Text style={[styles.tagText, { color: isDarkMode ? '#f1cd72' : '#b45309' }]}>
              {item.salary}
            </Text>
          </View>
        ) : null}
      </View>

      <Text style={[styles.descriptionSnippet, { color: subTextColor }]} numberOfLines={2}>
        {item.description}
      </Text>

      <View style={[styles.cardFooter, { borderTopColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f1f5f9' }]}>
        <Text style={[styles.postedTime, { color: subTextColor }]}>
          {item.createdAt ? `${t.posted} ${timeAgo(item.createdAt)}` : ''}
        </Text>

        <TouchableOpacity
          style={[styles.applyBtn, { backgroundColor: actionBtnBg }]}
          onPress={() => onConnect(item)}
        >
          <Text style={styles.applyBtnText}>{t.connect}</Text>
          <Ionicons name="person-add-outline" size={14} color="#008B8B" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
});

export default function JobsScreen({ navigation }: any) {
  const { lang, setLang, isDarkMode, toggleTheme } = useAppContext();
  const t = translations[lang];

  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('All');

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const isFetchingRef = useRef(false);

  const [selectedJob, setSelectedJob] = useState<JobItem | null>(null);

  const themeAnim = useRef(new Animated.Value(isDarkMode ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(themeAnim, {
      toValue: isDarkMode ? 1 : 0,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [isDarkMode, themeAnim]);

  useEffect(() => {
    async function enforceAuth() {
      const session = await SecureStore.getItemAsync('user_session');
      if (!session) {
        navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
      } else {
        const user = JSON.parse(session);
        setCurrentUserId(user._id || '');
      }
    }
    enforceAuth();
  }, [navigation]);

  const fetchJobs = useCallback(
    async (isRefresh = false) => {
      if (isFetchingRef.current) return;

      isFetchingRef.current = true;
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      // Load cache first
      try {
        const cachedData = await AsyncStorage.getItem('cached_jobs_data');
        if (cachedData) {
          setJobs(JSON.parse(cachedData));
          setLoading(false);
        }
      } catch (e) {
        console.log("No jobs cache found.");
      }

      // Fetch Jobs mapped from user experiences
      try {
        const jobsList = await jobsApi.getJobsFromExperiences();
        setJobs(jobsList);
        await AsyncStorage.setItem('cached_jobs_data', JSON.stringify(jobsList));
      } catch (error: any) {
        console.error('Failed to fetch jobs:', error);
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
    fetchJobs();
  }, [fetchJobs]);

  const handleDeleteJob = useCallback((jobId: string) => {
    Alert.alert(
      t.deleteConfirmTitle,
      t.deleteConfirmDesc,
      [
        { text: t.cancel, style: 'cancel' },
        {
          text: t.delete,
          style: 'destructive',
          onPress: async () => {
            setJobs((prev) => prev.filter((j) => j._id !== jobId));
            if (selectedJob?._id === jobId) setSelectedJob(null);
          },
        },
      ]
    );
  }, [selectedJob, t]);

  const handleConnect = useCallback((job: JobItem) => {
    const authorId = job.author?._id;
    if (!authorId) {
      Alert.alert('Notice', t.noAuthor);
      return;
    }

    if (authorId === currentUserId) {
      navigation.navigate('MainTabs', { screen: 'Profile' });
    } else {
      // Changed from 'UserProfile' to 'AlumniDetail'
      navigation.navigate('AlumniDetail', { userId: authorId });
    }
  }, [currentUserId, navigation, t]);

  const filteredJobs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return jobs.filter((job) => {
      const matchesSearch = query
        ? (job.title || '').toLowerCase().includes(query) ||
          (job.company || '').toLowerCase().includes(query) ||
          (job.location || '').toLowerCase().includes(query) ||
          (job.description || '').toLowerCase().includes(query)
        : true;

      const matchesType =
        selectedType === 'All'
          ? true
          : (job.jobType || '').toLowerCase() === selectedType.toLowerCase();

      return matchesSearch && matchesType;
    });
  }, [jobs, searchQuery, selectedType]);

  const handleProfilePress = () => {
    navigation.navigate('MainTabs', { screen: 'Profile' });
  };

  const textColor = isDarkMode ? "#ffffff" : "#0f172a";
  const subTextColor = isDarkMode ? "#94a3b8" : "#64748b";
  const cardBg = isDarkMode ? "#1e293b" : "#ffffff";
  const cardBorder = isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)";
  const actionBtnBg = isDarkMode ? "rgba(255,255,255,0.05)" : "#f8fafc";
  const actionBg = isDarkMode ? "rgba(255,255,255,0.15)" : "rgba(0,139,139,0.1)";

  const renderItem = useCallback(({ item }: { item: JobItem }) => (
    <JobCard
      item={item}
      currentUserId={currentUserId}
      onPress={(job) => setSelectedJob(job)}
      onConnect={handleConnect}
      onDelete={handleDeleteJob}
      t={t}
      lang={lang}
      isDarkMode={isDarkMode}
      textColor={textColor}
      subTextColor={subTextColor}
      cardBg={cardBg}
      cardBorder={cardBorder}
      actionBtnBg={actionBtnBg}
    />
  ), [currentUserId, handleConnect, handleDeleteJob, t, lang, isDarkMode, textColor, subTextColor, cardBg, cardBorder, actionBtnBg]);

  const filterOptions = ['All', ...JOB_TYPES];

  return (
    <View style={styles.root}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

      <Animated.View style={[StyleSheet.absoluteFill, { opacity: themeAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }]}>
        <LinearGradient colors={["#eaffff", "#f8fafc"]} style={StyleSheet.absoluteFill} />
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: themeAnim }]}>
        <LinearGradient colors={["#0f172a", "#1e293b"]} style={StyleSheet.absoluteFill} />
      </Animated.View>

      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: textColor }]}>{t.title}</Text>

          <View style={styles.topBarRight}>
            <TouchableOpacity style={[styles.actionIconBtn, { backgroundColor: actionBg }]} onPress={toggleTheme}>
              <Ionicons name={isDarkMode ? "moon" : "sunny"} size={16} color={isDarkMode ? "#f1cd72" : "#f59e0b"} />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.langToggle, { backgroundColor: actionBg }]} onPress={() => setLang(lang === 'en' ? 'mm' : 'en')}>
              <Text style={{ color: isDarkMode ? "#ffffff" : "#008B8B", fontSize: 12, fontWeight: "800" }}>{lang === 'en' ? 'MM' : 'EN'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionIconBtn, { backgroundColor: actionBg }]} onPress={handleProfilePress}>
              <Ionicons name="person-outline" size={16} color={isDarkMode ? "#ffffff" : "#008B8B"} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search & Filter */}
        <View style={styles.contentHeader}>
          <View style={[styles.searchContainer, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <Feather name="search" size={16} color={subTextColor} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchBar, { color: textColor }]}
              placeholder={t.searchPlaceholder}
              placeholderTextColor={isDarkMode ? '#64748b' : '#94a3b8'}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
            />
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
            {filterOptions.map((type) => {
              const isActive = selectedType === type;
              return (
                <TouchableOpacity
                  key={type}
                  style={[styles.filterChip, { backgroundColor: cardBg, borderColor: cardBorder }, isActive && styles.filterChipActive]}
                  onPress={() => setSelectedType(type)}
                >
                  <Text style={[styles.filterChipText, { color: subTextColor }, isActive && styles.filterChipTextActive]}>
                    {jobTypeLabels[lang][type] || type}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Job List */}
        <FlatList
          data={filteredJobs}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          initialNumToRender={6}
          maxToRenderPerBatch={8}
          windowSize={5}
          removeClippedSubviews={true}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchJobs(true)}
              colors={['#008B8B']}
              tintColor="#008B8B"
            />
          }
          ListEmptyComponent={
            !loading && !refreshing ? (
              <View style={styles.emptyContainer}>
                <Feather name="briefcase" size={36} color={subTextColor} style={{ marginBottom: 10 }} />
                <Text style={[styles.emptyText, { color: subTextColor }]}>{t.noJobs}</Text>
              </View>
            ) : (
              <ActivityIndicator size="large" color="#008B8B" style={{ marginTop: 40 }} />
            )
          }
        />

        {/* Job Detail Modal */}
        {selectedJob && (
          <Modal visible transparent animationType="slide">
            <View style={styles.modalBackdrop}>
              <View style={[styles.modalCard, { backgroundColor: cardBg, maxHeight: '80%' }]}>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: textColor }]} numberOfLines={1}>
                    {t.detailTitle}
                  </Text>
                  <TouchableOpacity onPress={() => setSelectedJob(null)}>
                    <Ionicons name="close" size={22} color={subTextColor} />
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                  <Text style={[styles.detailJobTitle, { color: textColor }]}>{selectedJob.title}</Text>
                  <Text style={[styles.detailCompany, { color: subTextColor }]}>{selectedJob.company}</Text>

                  <View style={[styles.tagRow, { marginVertical: 12 }]}>
                    {selectedJob.jobType ? (
                      <View style={[styles.tagBadge, { backgroundColor: isDarkMode ? 'rgba(0,191,196,0.15)' : '#eaffff' }]}>
                        <Ionicons name="briefcase-outline" size={12} color="#008B8B" />
                        <Text style={styles.tagText}>{jobTypeLabels[lang][selectedJob.jobType] || selectedJob.jobType}</Text>
                      </View>
                    ) : null}

                    {selectedJob.location ? (
                      <View style={[styles.tagBadge, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f1f5f9' }]}>
                        <Ionicons name="location-outline" size={12} color={subTextColor} />
                        <Text style={[styles.tagText, { color: subTextColor }]}>{selectedJob.location}</Text>
                      </View>
                    ) : null}

                    {selectedJob.salary ? (
                      <View style={[styles.tagBadge, { backgroundColor: isDarkMode ? 'rgba(241,205,114,0.15)' : '#fef9c3' }]}>
                        <Ionicons name="cash-outline" size={12} color="#d97706" />
                        <Text style={[styles.tagText, { color: isDarkMode ? '#f1cd72' : '#b45309' }]}>{selectedJob.salary}</Text>
                      </View>
                    ) : null}
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={[styles.detailSectionHeader, { color: textColor }]}>{t.jobDescription}</Text>
                    <Text style={[styles.detailText, { color: isDarkMode ? '#e2e8f0' : '#334155' }]}>{selectedJob.description}</Text>
                  </View>

                  {selectedJob.contactEmail ? (
                    <View style={styles.detailSection}>
                      <Text style={[styles.detailSectionHeader, { color: textColor }]}>Contact</Text>
                      <Text style={[styles.detailText, { color: isDarkMode ? '#e2e8f0' : '#334155' }]}>{selectedJob.contactEmail}</Text>
                    </View>
                  ) : null}

                  {selectedJob.author?.name ? (
                    <Text style={[styles.postedByText, { color: subTextColor }]}>
                      {t.postedBy}: {selectedJob.author.name}
                    </Text>
                  ) : null}
                </ScrollView>

                <TouchableOpacity
                  style={styles.submitBtn}
                  onPress={() => {
                    handleConnect(selectedJob);
                    setSelectedJob(null);
                  }}
                >
                  <Text style={styles.submitBtnText}>{t.connect}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}
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
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  companyLogo: { width: 44, height: 44, borderRadius: 10, marginRight: 12, backgroundColor: '#e2e8f0' },
  logoPlaceholder: { backgroundColor: '#008B8B', justifyContent: 'center', alignItems: 'center' },
  logoPlaceholderText: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' },
  headerInfo: { flex: 1 },
  jobTitle: { fontSize: 16, fontWeight: '800' },
  companyName: { fontSize: 13, fontWeight: '600', marginTop: 2 },
  moreOptionsBtn: { padding: 6 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  tagBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, gap: 4 },
  tagText: { fontSize: 11, fontWeight: '800', color: '#008B8B' },
  descriptionSnippet: { fontSize: 13, lineHeight: 18, marginBottom: 12 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, paddingTop: 10 },
  postedTime: { fontSize: 11, fontWeight: '600' },
  applyBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, gap: 4 },
  applyBtnText: { fontSize: 12, fontWeight: '800', color: '#008B8B' },
  emptyContainer: { alignItems: 'center', marginTop: 40 },
  emptyText: { fontSize: 14, fontWeight: '700' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalCard: { borderRadius: 20, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  submitBtn: { backgroundColor: '#008B8B', paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginTop: 16 },
  submitBtnText: { color: '#ffffff', fontWeight: '800', fontSize: 15 },
  detailJobTitle: { fontSize: 20, fontWeight: '900' },
  detailCompany: { fontSize: 15, fontWeight: '700', marginTop: 2 },
  detailSection: { marginTop: 14 },
  detailSectionHeader: { fontSize: 15, fontWeight: '800', marginBottom: 6 },
  detailText: { fontSize: 14, lineHeight: 22 },
  postedByText: { fontSize: 12, fontWeight: '600', marginTop: 16, fontStyle: 'italic' },
});