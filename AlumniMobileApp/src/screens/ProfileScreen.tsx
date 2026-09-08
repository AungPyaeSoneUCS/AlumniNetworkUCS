// file: src/screens/ProfileScreen.tsx
import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Linking,
  Alert,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, Feather } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import { Image } from "expo-image";
import api from "../services/api";
import { GradientBackground, ScreenHeader, ActionIconButton, Avatar, EmptyState, useTheme } from "../components";

// 1. IMPORT GLOBAL CONTEXT
import { useAppContext } from "../context/AppContext";

type Lang = "en" | "mm";

const DOMAIN = 'https://alumni.ucsh.edu.mm';

// ----------------------------------------------------
// TRANSLATION STORE
// ----------------------------------------------------
const translations = {
  en: {
    pageTitle: "My Profile",
    editProfile: "Edit Profile",
    logoutTitle: "Logout",
    logoutMsg: "Are you sure you want to log out?",
    cancel: "Cancel",
    loading: "Loading profile...",
    noProfile: "No profile found.",
    retry: "Retry",
    alumni: "ALUMNI",
    contactInfo: "Contact Information",
    experience: "Experience",
    present: "Present",
    notProvided: "Not provided",
    error: "Error",
    cannotOpen: "Cannot open URL:",
    sessionExpired: "Session Expired",
    loginAgain: "Please log in again to continue."
  },
  mm: {
    pageTitle: "ကျွန်ုပ်၏ Profile",
    editProfile: "ပရိုဖိုင် ပြင်ဆင်မည်",
    logoutTitle: "အကောင့်ထွက်မည်",
    logoutMsg: "အကောင့်ထွက်ရန် သေချာပါသလား?",
    cancel: "မလုပ်တော့ပါ",
    loading: "Profile ဖွင့်နေသည်...",
    noProfile: "Profile မတွေ့ပါ။",
    retry: "ပြန်ကြိုးစားမည်",
    alumni: "ကျောင်းသားဟောင်း",
    contactInfo: "ဆက်သွယ်ရန် အချက်အလက်များ",
    experience: "လုပ်ငန်းအတွေ့အကြုံ",
    present: "လက်ရှိ",
    notProvided: "မဖြည့်ထားပါ",
    error: "အမှား",
    cannotOpen: "URL ကို ဖွင့်၍မရပါ:",
    sessionExpired: "Session သက်တမ်းကုန်သွားပါပြီ",
    loginAgain: "ဆက်လုပ်ရန် ကျေးဇူးပြု၍ ပြန်လည်ဝင်ရောက်ပါ။"
  }
};

interface Experience {
  company: string;
  position: string;
  employmentType?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
  experienceYear?: string;
  salary?: string;
  website?: string;
  email?: string;
  phone?: string;
}

interface SocialLinks {
  facebook?: string;
  telegram?: string;
  linkedin?: string;
  github?: string;
  website?: string;
  viber?: string;
  [key: string]: string | undefined;
}

interface ContactInfo {
  phone?: string;
  email?: string;
  company?: string;
  position?: string;
  address?: string;
}

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  image?: string;
  profileImage?: string;
  googleImage?: string;
  googleProfileImage?: string;
  bio?: string;
  degree?: string;
  graduatedYear?: string;
  position?: string;
  role?: string;
  contactInfo?: ContactInfo;
  experiences?: Experience[];
  socialLinks?: SocialLinks;
}

// ----------------------------------------------------
// SMART IMAGE RESOLVER
// ----------------------------------------------------
const getUserImage = (user: UserProfile) => {
  const imgName = user.image || user.profileImage || user.googleImage || user.googleProfileImage;
  if (!imgName || imgName.trim() === '') return null;
  const cleanPath = imgName.trim();
  if (cleanPath.startsWith('http')) return cleanPath;
  if (cleanPath.startsWith('/uploads/')) return `${DOMAIN}${cleanPath}`;
  if (cleanPath.startsWith('/photo/')) return `${DOMAIN}/uploads${cleanPath}`;
  return `${DOMAIN}/uploads/photo/${user._id}/profile/${cleanPath}`;
};

// ----------------------------------------------------
// SOCIAL LINKS RESOLVER
// ----------------------------------------------------
const socialPrefixes: Record<string, string> = {
  facebook: "https://facebook.com/",
  telegram: "https://t.me/",
  instagram: "https://instagram.com/",
  youtube: "https://youtube.com/@",
  linkedin: "https://linkedin.com/in/",
  github: "https://github.com/",
  tiktok: "https://tiktok.com/@",
  line: "https://line.me/R/ti/p/@",
  viber: "viber://chat?number=",
  whatsapp: "https://wa.me/",
  x: "https://x.com/",
  twitter: "https://twitter.com/",
  website: "",
};

function cleanUsername(value: string, key = "") {
  let cleaned = value
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/\/$/, "")
    .replace(/^@/, "");

  const removers = [
    "facebook.com/", "t.me/", "telegram.me/", "instagram.com/",
    "youtube.com/@", "youtube.com/", "linkedin.com/in/",
    "linkedin.com/company/", "linkedin.com/", "github.com/",
    "tiktok.com/@", "tiktok.com/", "x.com/", "twitter.com/",
    "wa.me/", "line.me/R/ti/p/@", "viber://chat?number=",
  ];

  for (const remover of removers) {
    if (cleaned.toLowerCase().startsWith(remover.toLowerCase())) {
      cleaned = cleaned.slice(remover.length);
    }
  }

  if (key === "whatsapp" || key === "viber") {
    cleaned = cleaned.replace(/[^\d+]/g, "");
  }
  return cleaned;
}

function buildSocialUrl(key: string, value: string) {
  if (value.startsWith("http://") || value.startsWith("https://") || value.startsWith("viber:")) return value;
  if (key === "website" || key === "portfolio") return `https://${cleanUsername(value, key)}`;
  const prefix = socialPrefixes[key] || "https://";
  return `${prefix}${cleanUsername(value, key)}`;
}


export default function ProfileScreen({ navigation }: any) {
  // 2. EXTRACT GLOBAL STATE
  const { lang, setLang, isDarkMode, toggleTheme } = useAppContext();
  const t = translations[lang];

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [imageError, setImageError] = useState(false);

  // 1. STRICT AUTH CHECK
  useEffect(() => {
    async function enforceAuth() {
      const session = await SecureStore.getItemAsync('user_session');
      if (!session) {
        navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
      }
    }
    enforceAuth();
  }, [navigation]);

  const loadUserProfile = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    
    setImageError(false); 

    try {
      const sessionData = await SecureStore.getItemAsync("user_session");
      if (!sessionData) {
        navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
        return;
      }

      const parsedSession = JSON.parse(sessionData);
      const userId = parsedSession._id;

      // Fetch user profile from API
      const res = await api.get(`/users/${userId}`);
      if (res.data) {
        setProfile(res.data);
      } else {
        setProfile(parsedSession);
      }
    } catch (error: any) {
      console.error("Failed to load profile:", error);
      if (error?.response?.status === 401) {
        await SecureStore.deleteItemAsync('user_session'); 
        Alert.alert(t.sessionExpired, t.loginAgain);
        navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [navigation, t]);

  // Load Profile on focus (so it updates after returning from Settings)
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadUserProfile(true);
    });
    loadUserProfile();
    return unsubscribe;
  }, [navigation, loadUserProfile]);

  const handleLogout = () => {
    Alert.alert(t.logoutTitle, t.logoutMsg, [
      { text: t.cancel, style: "cancel" },
      {
        text: t.logoutTitle,
        style: "destructive",
        onPress: async () => {
          await SecureStore.deleteItemAsync("user_session");
          navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
        },
      },
    ]);
  };

  const openUrl = async (url?: string) => {
    if (!url) return;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert(t.error, `${t.cannotOpen} ${url}`);
      }
    } catch (err) {
      console.error("URL Opening Error:", err);
    }
  };

  // Dynamic Theme Colors
  const textColor = isDarkMode ? "#ffffff" : "#0f172a";
  const subTextColor = isDarkMode ? "#94a3b8" : "#475569";
  const cardBg = isDarkMode ? "#1e293b" : "#ffffff";
  const cardBorder = isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)";
  const iconBg = isDarkMode ? "rgba(255,255,255,0.1)" : "#f8fafc";
  const actionBg = isDarkMode ? "rgba(255,255,255,0.15)" : "rgba(0,139,139,0.1)";

  if (loading && !refreshing && !profile) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc' }]}>
        <ActivityIndicator size="large" color="#00BFC4" />
        <Text style={[styles.loadingText, { color: subTextColor }]}>{t.loading}</Text>
      </View>
    );
  }

  if (!profile && !loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc' }]}>
        <Text style={styles.errorText}>{t.noProfile}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => loadUserProfile()}>
          <Text style={styles.retryBtnText}>{t.retry}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const profileImageUrl = profile ? getUserImage(profile) : null;

  return (
    <View style={styles.root}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

      <GradientBackground isDarkMode={isDarkMode} />

      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadUserProfile(true)}
              colors={["#008B8B"]}
              tintColor={isDarkMode ? "#008B8B" : "#008B8B"}
            />
          }
        >
          {/* Top Bar Area */}
          <ScreenHeader title={t.pageTitle}>
            <ActionIconButton icon="settings-outline" onPress={() => navigation.navigate("Settings")} />
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={18} color="#ef4444" />
            </TouchableOpacity>
          </ScreenHeader>

          {/* Profile Header Card */}
          {profile && (
            <View style={[styles.headerCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <View style={styles.avatarWrapper}>
                {profileImageUrl && !imageError ? (
                  <Image 
                    source={{ uri: profileImageUrl }} 
                    style={styles.avatar} 
                    contentFit="cover"
                    cachePolicy="memory-disk"
                    transition={200}
                    onError={() => setImageError(true)} 
                  />
                ) : (
                  <View style={[styles.avatar, styles.placeholderAvatar]}>
                    <Text style={styles.placeholderText}>
                      {profile.name?.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}

                <View style={styles.roleBadge}>
                  <Text style={styles.roleText}>{profile.role?.toUpperCase() || t.alumni}</Text>
                </View>
              </View>

              <Text style={[styles.userName, { color: textColor }]}>{profile.name}</Text>
              <Text style={[styles.userEmail, { color: subTextColor }]}>{profile.email}</Text>

              {profile.position ? (
                <Text style={[styles.userPosition, { color: isDarkMode ? "#e2e8f0" : "#334155" }]}>{profile.position}</Text>
              ) : null}

              <View style={[styles.academicBadge, { backgroundColor: isDarkMode ? "rgba(0,191,196,0.15)" : "#eaffff" }]}>
                <Ionicons name="school-outline" size={15} color="#008B8B" />
                <Text style={styles.academicText}>
                  {profile.degree || "UCSH Alumni"}
                  {profile.graduatedYear ? ` • Class of ${profile.graduatedYear}` : ""}
                </Text>
              </View>

              {/* Edit Profile Button */}
              <TouchableOpacity style={styles.editProfileBtn} onPress={() => navigation.navigate("Settings")}>
                <Feather name="edit-2" size={14} color="#ffffff" />
                <Text style={styles.editProfileBtnText}>{t.editProfile}</Text>
              </TouchableOpacity>

              {profile.bio ? <Text style={[styles.bioText, { color: subTextColor }]}>{profile.bio}</Text> : null}
            </View>
          )}

          {/* Social Links Row */}
          {profile?.socialLinks && (
            <View style={styles.socialRow}>
              {profile.socialLinks.github ? (
                <TouchableOpacity style={[styles.socialIconBtn, { backgroundColor: cardBg, borderColor: cardBorder }]} onPress={() => openUrl(buildSocialUrl("github", profile.socialLinks!.github!))}>
                  <Ionicons name="logo-github" size={20} color={isDarkMode ? "#ffffff" : "#1e293b"} />
                </TouchableOpacity>
              ) : null}
              
              {profile.socialLinks.linkedin ? (
                <TouchableOpacity style={[styles.socialIconBtn, { backgroundColor: cardBg, borderColor: cardBorder }]} onPress={() => openUrl(buildSocialUrl("linkedin", profile.socialLinks!.linkedin!))}>
                  <Ionicons name="logo-linkedin" size={20} color="#0a66c2" />
                </TouchableOpacity>
              ) : null}
              
              {profile.socialLinks.facebook ? (
                <TouchableOpacity style={[styles.socialIconBtn, { backgroundColor: cardBg, borderColor: cardBorder }]} onPress={() => openUrl(buildSocialUrl("facebook", profile.socialLinks!.facebook!))}>
                  <Ionicons name="logo-facebook" size={20} color="#1877f2" />
                </TouchableOpacity>
              ) : null}
              
              {profile.socialLinks.website ? (
                <TouchableOpacity style={[styles.socialIconBtn, { backgroundColor: cardBg, borderColor: cardBorder }]} onPress={() => openUrl(buildSocialUrl("website", profile.socialLinks!.website!))}>
                  <Ionicons name="globe-outline" size={20} color="#008B8B" />
                </TouchableOpacity>
              ) : null}
            </View>
          )}

          {/* Contact Information Section */}
          {profile?.contactInfo && (
            <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <Text style={[styles.sectionHeader, { color: textColor }]}>{t.contactInfo}</Text>
              
              {profile.contactInfo.phone ? (
                <View style={styles.infoRow}>
                  <View style={[styles.iconWrapper, { backgroundColor: iconBg }]}><Feather name="phone" size={16} color="#008B8B" /></View>
                  <Text style={[styles.infoText, { color: isDarkMode ? "#e2e8f0" : "#334155" }]}>{profile.contactInfo.phone}</Text>
                </View>
              ) : null}

              {profile.contactInfo.company ? (
                <View style={styles.infoRow}>
                  <View style={[styles.iconWrapper, { backgroundColor: iconBg }]}><Feather name="briefcase" size={16} color="#008B8B" /></View>
                  <Text style={[styles.infoText, { color: isDarkMode ? "#e2e8f0" : "#334155" }]}>
                    {profile.contactInfo.position ? `${profile.contactInfo.position} at ` : ""}
                    {profile.contactInfo.company}
                  </Text>
                </View>
              ) : null}

              {profile.contactInfo.address ? (
                <View style={styles.infoRow}>
                  <View style={[styles.iconWrapper, { backgroundColor: iconBg }]}><Feather name="map-pin" size={16} color="#008B8B" /></View>
                  <Text style={[styles.infoText, { color: isDarkMode ? "#e2e8f0" : "#334155" }]}>{profile.contactInfo.address}</Text>
                </View>
              ) : null}
            </View>
          )}

          {/* Experience Section */}
          {profile?.experiences && profile.experiences.length > 0 && (
            <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <Text style={[styles.sectionHeader, { color: textColor }]}>{t.experience}</Text>
              {profile.experiences.map((exp, index) => (
                <View key={index} style={styles.expItem}>
                  <View style={styles.expDot} />
                  <View style={styles.expContent}>
                    <Text style={[styles.expPosition, { color: textColor }]}>{exp.position}</Text>
                    <Text style={[styles.expCompany, { color: subTextColor }]}>{exp.company}</Text>
                    <Text style={styles.expDuration}>
                      {exp.startDate || "N/A"} - {exp.isCurrent ? t.present : exp.endDate || "N/A"}
                    </Text>
                    {exp.location ? (
                      <Text style={styles.expLocation}>{exp.location}</Text>
                    ) : null}
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safeArea: { flex: 1 },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  loadingText: { marginTop: 10, fontSize: 14, fontWeight: "600" },
  errorText: { color: "#ef4444", fontSize: 16, fontWeight: "700" },
  retryBtn: { marginTop: 14, backgroundColor: "#008B8B", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  retryBtnText: { color: "#ffffff", fontWeight: "700" },
  scrollContent: { padding: 16, paddingBottom: 40 },
  topActions: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  topBarRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  pageTitle: { fontSize: 24, fontWeight: "900" },
  actionIconBtn: { width: 34, height: 34, borderRadius: 17, justifyContent: "center", alignItems: "center" },
  logoutBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: "rgba(239,68,68,0.15)", justifyContent: "center", alignItems: "center" },
  headerCard: {
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    borderWidth: 1,
    marginBottom: 20,
  },
  avatarWrapper: { position: "relative", marginBottom: 16 },
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: "#e2e8f0" },
  placeholderAvatar: { backgroundColor: "#008B8B", justifyContent: "center", alignItems: "center" },
  placeholderText: { color: "#ffffff", fontSize: 36, fontWeight: "bold" },
  roleBadge: {
    position: "absolute",
    bottom: -4,
    right: -4,
    backgroundColor: "#f1cd72",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#ffffff",
  },
  roleText: { fontSize: 10, fontWeight: "900", color: "#0f172a" },
  userName: { fontSize: 22, fontWeight: "900", textAlign: "center" },
  userEmail: { fontSize: 14, marginTop: 4, fontWeight: "500", textAlign: "center" },
  userPosition: { fontSize: 15, fontWeight: "700", marginTop: 6, textAlign: "center" },
  academicBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 14,
    gap: 6,
  },
  academicText: { fontSize: 12, fontWeight: "800", color: "#008B8B" },
  editProfileBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 18,
    backgroundColor: "#008B8B",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 16,
    elevation: 2,
    shadowColor: "#008B8B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  editProfileBtnText: { color: "#ffffff", fontSize: 13, fontWeight: "800" },
  bioText: { fontSize: 14, textAlign: "center", marginTop: 16, lineHeight: 22 },
  socialRow: { flexDirection: "row", justifyContent: "center", gap: 14, marginBottom: 20 },
  socialIconBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    borderWidth: 1,
  },
  sectionCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    borderWidth: 1,
  },
  sectionHeader: { fontSize: 18, fontWeight: "900", marginBottom: 16 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  iconWrapper: { width: 32, height: 32, borderRadius: 16, justifyContent: "center", alignItems: "center" },
  infoText: { fontSize: 15, flex: 1, fontWeight: "500" },
  expItem: { flexDirection: "row", gap: 14, marginBottom: 20 },
  expDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#00BFC4", marginTop: 6, borderWidth: 2, borderColor: "#eaffff" },
  expContent: { flex: 1 },
  expPosition: { fontSize: 16, fontWeight: "800" },
  expCompany: { fontSize: 14, marginTop: 2, fontWeight: "600" },
  expDuration: { fontSize: 12, color: "#008B8B", marginTop: 4, fontWeight: "700" },
  expLocation: { fontSize: 12, color: "#64748b", marginTop: 2 },
});