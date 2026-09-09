// file: src/screens/EditProfileScreen.tsx
import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Animated,
  StatusBar,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, Feather, FontAwesome5 } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as SecureStore from "expo-secure-store";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import api from "../services/api";

// 1. IMPORT GLOBAL CONTEXT
import { useAppContext } from "../context/AppContext";

type Lang = "en" | "mm";

const DOMAIN = "https://alumni.ucsh.edu.mm";

// ----------------------------------------------------
// TYPES & CONSTANTS
// ----------------------------------------------------
type Experience = {
  company?: string;
  position?: string;
  employmentType?: string;
  location?: string;
  phone?: string;
  email?: string;
  salary?: string;
  website?: string;
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
  experienceYear?: string;
};

type SocialLinks = {
  facebook?: string;
  telegram?: string;
  instagram?: string;
  youtube?: string;
  linkedin?: string;
  github?: string;
  tiktok?: string;
  viber?: string;
  line?: string;
  whatsapp?: string;
};

type ProfileData = {
  name?: string;
  email?: string;
  image?: string;
  bio?: string;
  degree?: string;
  graduatedYear?: number | string;
  contactInfo?: {
    phone?: string;
    email?: string;
    address?: string;
    company?: string;
    position?: string;
  };
  experiences?: Experience[];
  socialLinks?: SocialLinks;
};

const emptyProfile: ProfileData = {
  name: "", email: "", image: "", bio: "", degree: "", graduatedYear: "",
  contactInfo: { phone: "", email: "", address: "", company: "", position: "" },
  experiences: [],
  socialLinks: { facebook: "", telegram: "", instagram: "", youtube: "", linkedin: "", github: "", tiktok: "", viber: "", line: "", whatsapp: "" },
};

const degreesList = ["B.C.Sc", "B.C.Tech", "M.C.Sc", "M.C.Tech", "D.C.Sc", "M.I.Sc", "Ph.D"];
const employmentTypes = ["Full-Time", "Part-Time", "Freelance", "Internship", "Student", "Contract", "Remote", "Hybrid", "Temporary", "Volunteer", "Self-Employed"];

const socialConfigs: { key: keyof SocialLinks; label: string; prefix: string; icon: any }[] = [
  { key: "facebook", label: "Facebook", prefix: "https://facebook.com/", icon: "logo-facebook" },
  { key: "telegram", label: "Telegram", prefix: "https://t.me/", icon: "paper-plane" },
  { key: "instagram", label: "Instagram", prefix: "https://instagram.com/", icon: "logo-instagram" },
  { key: "youtube", label: "YouTube", prefix: "https://youtube.com/", icon: "logo-youtube" },
  { key: "linkedin", label: "LinkedIn", prefix: "https://linkedin.com/in/", icon: "logo-linkedin" },
  { key: "github", label: "GitHub", prefix: "https://github.com/", icon: "logo-github" },
  { key: "tiktok", label: "TikTok", prefix: "https://tiktok.com/@", icon: "logo-tiktok" },
  { key: "viber", label: "Viber", prefix: "viber://chat?number=", icon: "call" },
  { key: "line", label: "Line", prefix: "https://line.me/ti/p/", icon: "chatbubble-ellipses" },
  { key: "whatsapp", label: "WhatsApp", prefix: "https://wa.me/", icon: "logo-whatsapp" },
];

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^[0-9+\-\s()]{6,20}$/;
const urlRegex = /^https?:\/\/[^\s]+\.[^\s]+/i;

// ----------------------------------------------------
// TRANSLATIONS
// ----------------------------------------------------
const text = {
  en: {
    title: "Edit Profile",
    saveSuccess: "Profile updated successfully.",
    saveFailed: "Failed to save profile.",
    permissionTitle: "Permission Needed",
    permissionMsg: "Please allow photo access to update your profile photo.",
    saving: "Saving...",
    save: "Save",
    personal: "Personal",
    experience: "Experience",
    social: "Social",
    fullName: "Name",
    email: "Email",
    degree: "Degree",
    selectDegree: "Select Degree",
    graduatedYear: "Graduated Year",
    bio: "Bio",
    bioPlaceholder: "Tell alumni about yourself...",
    phone: "Phone",
    address: "Address",
    addExperience: "Add Experience",
    employmentType: "Job Type",
    location: "Job Location",
    salary: "Income",
    website: "Website",
    company: "Organization",
    position: "Position",
    startDate: "Start Date (YYYY-MM)",
    endDate: "End Date (YYYY-MM)",
    currentJob: "I currently work here",
    experienceYear: "Experience Years",
    dialogTitle: "Required Fields Missing",
    dialogClose: "Close",
    validation: {
      required: "is required.",
      invalidEmail: "Please enter a valid email.",
      invalidPhone: "Please enter a valid phone number.",
      invalidSalary: "Income must be at least 3 digits.",
      invalidUrl: "Website URL must start with http:// or https://.",
      invalidDate: "End Date must be after Start Date.",
    },
    sessionExpired: "Session Expired",
    loginAgain: "Please log in again to continue.",
  },
  mm: {
    title: "ပရိုဖိုင် ပြင်ဆင်ရန်",
    saveSuccess: "ပရိုဖိုင် ပြင်ဆင်ပြီးပါပြီ။",
    saveFailed: "ပရိုဖိုင် သိမ်းဆည်းမှု မအောင်မြင်ပါ။",
    permissionTitle: "ခွင့်ပြုချက် လိုအပ်ပါသည်",
    permissionMsg: "ပရိုဖိုင် ဓာတ်ပုံ ပြောင်းရန် ဓာတ်ပုံခွင့်ပြုချက် ဖွင့်ပေးပါ။",
    saving: "သိမ်းနေသည်...",
    save: "သိမ်းမည်",
    personal: "အခြေခံ",
    experience: "အတွေ့အကြုံ",
    social: "Social",
    fullName: "အမည်",
    email: "မေးလ်",
    degree: "ဘွဲ့",
    selectDegree: "ဘွဲ့ ရွေးပါ",
    graduatedYear: "ဘွဲ့ရနှစ်",
    bio: "Bio",
    bioPlaceholder: "သင့်အကြောင်း ရေးပါ...",
    phone: "ဖုန်း",
    address: "လိပ်စာ",
    addExperience: "အတွေ့အကြုံ ထည့်မည်",
    employmentType: "အလုပ်အမျိုးအစား",
    location: "အလုပ်တည်နေရာ",
    salary: "ဝင်ငွေ",
    website: "Website",
    company: "အဖွဲ့အစည်း",
    position: "ရာထူး",
    startDate: "စတင်ရက် (YYYY-MM)",
    endDate: "ပြီးဆုံးရက် (YYYY-MM)",
    currentJob: "လက်ရှိအလုပ်ဖြစ်သည်",
    experienceYear: "လုပ်သက်နှစ်",
    dialogTitle: "အချက်အလက်များ လိုအပ်နေပါသည်",
    dialogClose: "ပိတ်မည်",
    validation: {
      required: "လိုအပ်ပါသည်။",
      invalidEmail: "မှန်ကန်သော မေးလ် ထည့်ပါ။",
      invalidPhone: "မှန်ကန်သော ဖုန်းနံပါတ် ထည့်ပါ။",
      invalidSalary: "လစာသည် အနည်းဆုံး ၃ လုံး ဖြစ်ရမည်။",
      invalidUrl: "URL သည် http:// (သို့) https:// ဖြင့် စရမည်။",
      invalidDate: "End Date သည် Start Date ထက် နောက်ကျရမည်။",
    },
    sessionExpired: "Session သက်တမ်းကုန်သွားပါပြီ",
    loginAgain: "ဆက်လုပ်ရန် ကျေးဇူးပြု၍ ပြန်လည်ဝင်ရောက်ပါ။",
  },
};

function cleanSocialValue(value: string, prefix: string) {
  let next = value.trim();
  for (const config of socialConfigs) {
    if (next.startsWith(config.prefix)) next = next.replace(config.prefix, "");
  }
  next = next.replace(/^https?:\/\/(www\.)?/i, "");
  next = next.replace(/^@+/, "");
  next = next.replace(/^\/+/, "");
  if (prefix.includes("wa.me") || prefix.includes("viber")) {
    next = next.replace(/[^\d+]/g, "");
  }
  return next;
}

const getImageUrl = (url?: string) => {
  if (!url || url.trim() === '') return null;
  let cleanPath = url.trim();
  if (cleanPath.startsWith('http')) return cleanPath;
  if (cleanPath.startsWith('/uploads/')) return `${DOMAIN}${cleanPath}`;
  if (cleanPath.startsWith('uploads/')) return `${DOMAIN}/${cleanPath}`;
  return `${DOMAIN}${cleanPath.startsWith('/') ? '' : '/'}${cleanPath}`;
};

export default function EditProfileScreen({ navigation }: any) {
  // 2. USE GLOBAL STATE
  const { lang, setLang, isDarkMode, toggleTheme } = useAppContext();
  const t = text[lang];

  const [activeTab, setActiveTab] = useState<"personal" | "experience" | "social">("personal");
  const [form, setForm] = useState<ProfileData>(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogErrors, setDialogErrors] = useState<string[]>([]);
  const [imageError, setImageError] = useState(false);

  // Modals States
  const [showDegreeModal, setShowDegreeModal] = useState(false);
  const [showEmpTypeModal, setShowEmpTypeModal] = useState(false);
  const [currentExpIndex, setCurrentExpIndex] = useState<number | null>(null);

  // Theme Animation
  const themeAnim = useRef(new Animated.Value(isDarkMode ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(themeAnim, {
      toValue: isDarkMode ? 1 : 0,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [isDarkMode, themeAnim]);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const sessionData = await SecureStore.getItemAsync("user_session");
      if (!sessionData) {
        navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
        return;
      }
      
      const res = await api.get("/me");
      const data = res.data;

      setForm({
        ...emptyProfile,
        ...data,
        degree: data.degree || "",
        graduatedYear: data.graduatedYear || "",
        contactInfo: { ...emptyProfile.contactInfo, ...data.contactInfo },
        experiences: Array.isArray(data.experiences) ? data.experiences : [],
        socialLinks: { ...emptyProfile.socialLinks, ...data.socialLinks, website: undefined },
      });
    } catch (error: any) {
      if (error?.response?.status === 401) {
        await SecureStore.deleteItemAsync('user_session');
        Alert.alert(t.sessionExpired, t.loginAgain);
        navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
      } else {
        Alert.alert("Error", t.saveFailed);
      }
    } finally {
      setLoading(false);
    }
  }

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t.permissionTitle, t.permissionMsg);
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      setLoading(true);
      try {
        const formData = new FormData();
        const filename = uri.split('/').pop() || 'profile.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpeg`;
        formData.append('file', { uri, name: filename, type } as any);

        const res = await api.post('/upload/profile-photo', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        if (res.data?.image) {
          updateField("image", res.data.image);
          setImageError(false);
        }
      } catch (err) {
        Alert.alert("Error", "Image upload failed");
      } finally {
        setLoading(false);
      }
    }
  };

  const updateField = <K extends keyof ProfileData>(key: K, value: ProfileData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateContactField = (key: keyof NonNullable<ProfileData["contactInfo"]>, value: string) => {
    setForm((prev) => ({ ...prev, contactInfo: { ...prev.contactInfo, [key]: value } }));
  };

  const updateSocial = (key: keyof SocialLinks, value: string, prefix: string) => {
    setForm((prev) => ({
      ...prev,
      socialLinks: { ...prev.socialLinks, [key]: cleanSocialValue(value, prefix) },
    }));
  };

  const addExperience = () => {
    setActiveTab("experience");
    setForm((prev) => ({
      ...prev,
      experiences: [
        ...(prev.experiences || []),
        { position: "", company: "", employmentType: "", location: "", salary: "", experienceYear: "", startDate: "", endDate: "", isCurrent: false, phone: "", email: "", website: "" },
      ],
    }));
  };

  const removeExperience = (index: number) => {
    setForm((prev) => ({
      ...prev,
      experiences: (prev.experiences || []).filter((_, item) => item !== index),
    }));
  };

  const updateExperience = (index: number, key: keyof Experience, value: string | boolean) => {
    setForm((prev) => {
      const experiences = [...(prev.experiences || [])];
      experiences[index] = { ...experiences[index], [key]: value };
      if (key === "isCurrent" && value === true) experiences[index].endDate = "";
      return { ...prev, experiences };
    });
  };

  const validateData = () => {
    const errors: string[] = [];
    let firstErrorTab: "personal" | "experience" | "social" | null = null;

    if (!form.degree?.trim()) {
      errors.push(`${t.degree} ${t.validation.required}`);
      if (!firstErrorTab) firstErrorTab = "personal";
    }

    if (form.contactInfo?.email && !emailRegex.test(form.contactInfo.email.trim())) {
      errors.push(t.validation.invalidEmail);
      if (!firstErrorTab) firstErrorTab = "personal";
    }

    if (form.contactInfo?.phone && !phoneRegex.test(form.contactInfo.phone.trim())) {
      errors.push(t.validation.invalidPhone);
      if (!firstErrorTab) firstErrorTab = "personal";
    }

    for (let i = 0; i < (form.experiences || []).length; i++) {
      const exp = form.experiences![i];
      const missingExpFields: string[] = [];

      if (!exp.position?.trim()) missingExpFields.push(t.position);
      if (!exp.company?.trim()) missingExpFields.push(t.company);
      if (!exp.employmentType?.trim()) missingExpFields.push(t.employmentType);
      if (!exp.location?.trim()) missingExpFields.push(t.location);
      if (!exp.salary?.trim()) missingExpFields.push(t.salary);
      if (!exp.experienceYear?.trim()) missingExpFields.push(t.experienceYear);
      if (!exp.startDate?.trim()) missingExpFields.push(t.startDate);
      if (!exp.isCurrent && !exp.endDate?.trim()) missingExpFields.push(t.endDate);

      if (missingExpFields.length > 0) {
        errors.push(`Experience ${i + 1}: Missing ${missingExpFields.join(", ")}`);
        if (!firstErrorTab) firstErrorTab = "experience";
      }

      if (exp.salary && !/^\d{3,}$/.test(exp.salary.replace(/[,\s]/g, ""))) {
        errors.push(`Experience ${i + 1}: ${t.validation.invalidSalary}`);
        if (!firstErrorTab) firstErrorTab = "experience";
      }
      if (exp.email && !emailRegex.test(exp.email.trim())) {
        errors.push(`Experience ${i + 1}: ${t.validation.invalidEmail}`);
        if (!firstErrorTab) firstErrorTab = "experience";
      }
      if (exp.phone && !phoneRegex.test(exp.phone.trim())) {
        errors.push(`Experience ${i + 1}: ${t.validation.invalidPhone}`);
        if (!firstErrorTab) firstErrorTab = "experience";
      }
      if (exp.website && !urlRegex.test(exp.website.trim())) {
        errors.push(`Experience ${i + 1}: ${t.validation.invalidUrl}`);
        if (!firstErrorTab) firstErrorTab = "experience";
      }
      if (!exp.isCurrent && exp.startDate && exp.endDate && exp.endDate < exp.startDate) {
        errors.push(`Experience ${i + 1}: ${t.validation.invalidDate}`);
        if (!firstErrorTab) firstErrorTab = "experience";
      }
    }

    if (errors.length > 0) {
      if (firstErrorTab) setActiveTab(firstErrorTab);
      setDialogErrors(errors);
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateData()) return;
    setSaving(true);
    try {
      const payload = {
        image: form.image || "",
        bio: form.bio || "",
        degree: form.degree || "",
        contactInfo: {
          phone: form.contactInfo?.phone || "",
          email: form.contactInfo?.email || "",
          address: form.contactInfo?.address || "",
          company: form.contactInfo?.company || "",
          position: form.contactInfo?.position || "",
        },
        experiences: (form.experiences || []).map((item) => ({
          position: item.position || "",
          company: item.company || "",
          employmentType: item.employmentType || "",
          location: item.location || "",
          salary: item.salary || "",
          experienceYear: item.experienceYear || "",
          startDate: item.startDate || "",
          endDate: item.isCurrent ? "" : item.endDate || "",
          isCurrent: Boolean(item.isCurrent),
          phone: item.phone || "",
          email: item.email || "",
          website: item.website || "",
        })),
        socialLinks: form.socialLinks,
      };

      const res = await api.put("/me", payload);
      if (res.data) {
        Alert.alert("Success", t.saveSuccess);
      }
    } catch (error) {
      Alert.alert("Error", t.saveFailed);
    } finally {
      setSaving(false);
    }
  };

  // --- Dynamic Styles ---
  const textColor = isDarkMode ? "#ffffff" : "#0f172a";
  const subTextColor = isDarkMode ? "#94a3b8" : "#64748b";
  const cardBg = isDarkMode ? "#1e293b" : "#ffffff";
  const cardBorder = isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)";
  const inputBg = isDarkMode ? "#334155" : "#f8fafc";
  const inputBorder = isDarkMode ? "#475569" : "#e2e8f0";
  const actionBg = isDarkMode ? "rgba(255,255,255,0.15)" : "rgba(0,139,139,0.1)";

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc' }]}>
        <ActivityIndicator size="large" color="#008B8B" />
      </View>
    );
  }

  const profileImageUrl = getImageUrl(form.image);

  return (
    <View style={styles.root}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

      <Animated.View style={[StyleSheet.absoluteFill, { opacity: themeAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }]}>
        <LinearGradient colors={["#eaffff", "#f8fafc"]} style={StyleSheet.absoluteFill} />
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: themeAnim }]}>
        <LinearGradient colors={["#0f172a", "#1e293b"]} style={StyleSheet.absoluteFill} />
      </Animated.View>

      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        
        {/* 3. WRAP WITH KeyboardAvoidingView */}
        <KeyboardAvoidingView 
          style={{ flex: 1 }} 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          {/* TOP BAR */}
          <View style={styles.topBar}>
            <TouchableOpacity style={[styles.actionIconBtn, { backgroundColor: actionBg }]} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={20} color={isDarkMode ? "#ffffff" : "#0f172a"} />
            </TouchableOpacity>
            <Text style={[styles.screenTitle, { color: textColor }]}>{t.title}</Text>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            
            {/* PROFILE HEADER CARD */}
            <View style={[styles.headerCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <TouchableOpacity onPress={handlePickImage} style={styles.avatarWrapper}>
                {profileImageUrl && !imageError ? (
                  <Image source={{ uri: profileImageUrl }} style={styles.avatar} contentFit="cover" onError={() => setImageError(true)} />
                ) : (
                  <View style={[styles.avatar, styles.placeholderAvatar]}>
                    <Text style={styles.placeholderText}>{form.name ? form.name.charAt(0).toUpperCase() : 'U'}</Text>
                  </View>
                )}
                <View style={styles.cameraIconBadge}>
                  <Ionicons name="camera" size={14} color="#fff" />
                </View>
              </TouchableOpacity>

              <View style={{ flex: 1 }}>
                <Text style={[styles.userName, { color: textColor }]}>{form.name || "Name"}</Text>
                <Text style={[styles.userEmail, { color: subTextColor }]}>{form.email || "Email"}</Text>
              </View>

              <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveBtnText}>{t.save}</Text>}
              </TouchableOpacity>
            </View>

            {/* TAB BAR */}
            <View style={styles.tabContainer}>
              {(["personal", "experience", "social"] as const).map((tab) => (
                <TouchableOpacity
                  key={tab}
                  style={[styles.tabBtn, activeTab === tab ? styles.tabBtnActive : { backgroundColor: actionBg }]}
                  onPress={() => setActiveTab(tab)}
                >
                  <Text style={[styles.tabText, activeTab === tab ? styles.tabTextActive : { color: isDarkMode ? "#94a3b8" : "#475569" }]}>
                    {t[tab]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* --- PERSONAL TAB --- */}
            {activeTab === "personal" && (
              <View>
                <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                  <Text style={[styles.sectionTitle, { color: textColor }]}>{t.personal}</Text>
                  
                  <Text style={[styles.label, { color: textColor }]}>{t.fullName}</Text>
                  <TextInput style={[styles.input, styles.inputDisabled, { color: subTextColor }]} value={form.name} editable={false} />

                  <Text style={[styles.label, { color: textColor }]}>{t.email}</Text>
                  <TextInput style={[styles.input, styles.inputDisabled, { color: subTextColor }]} value={form.email} editable={false} />

                  <Text style={[styles.label, { color: textColor }]}>{t.degree} *</Text>
                  <TouchableOpacity style={[styles.input, { backgroundColor: inputBg, borderColor: inputBorder, justifyContent: 'center' }]} onPress={() => setShowDegreeModal(true)}>
                    <Text style={{ color: form.degree ? textColor : subTextColor }}>{form.degree || t.selectDegree}</Text>
                    <Feather name="chevron-down" size={18} color={subTextColor} style={{ position: 'absolute', right: 14 }} />
                  </TouchableOpacity>

                  <Text style={[styles.label, { color: textColor }]}>{t.graduatedYear}</Text>
                  <TextInput style={[styles.input, styles.inputDisabled, { color: subTextColor }]} value={String(form.graduatedYear || "")} editable={false} />

                  <Text style={[styles.label, { color: textColor }]}>{t.bio}</Text>
                  <TextInput
                    style={[styles.input, { height: 80, textAlignVertical: 'top', backgroundColor: inputBg, borderColor: inputBorder, color: textColor }]}
                    multiline
                    placeholder={t.bioPlaceholder}
                    placeholderTextColor={subTextColor}
                    value={form.bio}
                    onChangeText={(val) => updateField("bio", val)}
                  />
                </View>

                <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                  <Text style={[styles.sectionTitle, { color: textColor }]}>Contact</Text>
                  
                  <Text style={[styles.label, { color: textColor }]}>{t.phone}</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: inputBg, borderColor: inputBorder, color: textColor }]}
                    keyboardType="phone-pad"
                    value={form.contactInfo?.phone}
                    onChangeText={(val) => updateContactField("phone", val)}
                  />

                  <Text style={[styles.label, { color: textColor }]}>{t.email}</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: inputBg, borderColor: inputBorder, color: textColor }]}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={form.contactInfo?.email}
                    onChangeText={(val) => updateContactField("email", val)}
                  />

                  <Text style={[styles.label, { color: textColor }]}>{t.address}</Text>
                  <TextInput
                    style={[styles.input, { height: 80, textAlignVertical: 'top', backgroundColor: inputBg, borderColor: inputBorder, color: textColor }]}
                    multiline
                    value={form.contactInfo?.address}
                    onChangeText={(val) => updateContactField("address", val)}
                  />
                </View>
              </View>
            )}

            {/* --- EXPERIENCE TAB --- */}
            {activeTab === "experience" && (
              <View>
                {form.experiences?.map((exp, idx) => (
                  <View key={idx} style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                    <View style={styles.expHeaderRow}>
                      <Text style={[styles.expHeaderTitle, { color: subTextColor }]}>{t.experience} {idx + 1}</Text>
                      <TouchableOpacity onPress={() => removeExperience(idx)}>
                        <Ionicons name="trash-outline" size={18} color="#ef4444" />
                      </TouchableOpacity>
                    </View>

                    <Text style={[styles.label, { color: textColor }]}>{t.position} *</Text>
                    <TextInput style={[styles.input, { backgroundColor: inputBg, borderColor: inputBorder, color: textColor }]} value={exp.position} onChangeText={(v) => updateExperience(idx, "position", v)} />

                    <Text style={[styles.label, { color: textColor }]}>{t.company} *</Text>
                    <TextInput style={[styles.input, { backgroundColor: inputBg, borderColor: inputBorder, color: textColor }]} value={exp.company} onChangeText={(v) => updateExperience(idx, "company", v)} />

                    <Text style={[styles.label, { color: textColor }]}>{t.employmentType} *</Text>
                    <TouchableOpacity 
                      style={[styles.input, { backgroundColor: inputBg, borderColor: inputBorder, justifyContent: 'center' }]} 
                      onPress={() => { setCurrentExpIndex(idx); setShowEmpTypeModal(true); }}
                    >
                      <Text style={{ color: exp.employmentType ? textColor : subTextColor }}>{exp.employmentType || "Select Type"}</Text>
                      <Feather name="chevron-down" size={18} color={subTextColor} style={{ position: 'absolute', right: 14 }} />
                    </TouchableOpacity>

                    <Text style={[styles.label, { color: textColor }]}>{t.location} *</Text>
                    <TextInput style={[styles.input, { backgroundColor: inputBg, borderColor: inputBorder, color: textColor }]} value={exp.location} onChangeText={(v) => updateExperience(idx, "location", v)} />

                    <Text style={[styles.label, { color: textColor }]}>{t.salary} *</Text>
                    <TextInput style={[styles.input, { backgroundColor: inputBg, borderColor: inputBorder, color: textColor }]} keyboardType="numeric" value={exp.salary} onChangeText={(v) => updateExperience(idx, "salary", v)} />

                    <Text style={[styles.label, { color: textColor }]}>{t.experienceYear} *</Text>
                    <TextInput style={[styles.input, { backgroundColor: inputBg, borderColor: inputBorder, color: textColor }]} keyboardType="numeric" value={exp.experienceYear} onChangeText={(v) => updateExperience(idx, "experienceYear", v)} />

                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.label, { color: textColor }]}>{t.startDate} *</Text>
                        <TextInput style={[styles.input, { backgroundColor: inputBg, borderColor: inputBorder, color: textColor }]} placeholder="YYYY-MM" placeholderTextColor={subTextColor} value={exp.startDate} onChangeText={(v) => updateExperience(idx, "startDate", v)} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.label, { color: textColor }]}>{t.endDate}</Text>
                        <TextInput 
                          style={[styles.input, { backgroundColor: exp.isCurrent ? "rgba(0,0,0,0.05)" : inputBg, borderColor: inputBorder, color: textColor }]} 
                          placeholder="YYYY-MM" 
                          placeholderTextColor={subTextColor} 
                          value={exp.endDate} 
                          onChangeText={(v) => updateExperience(idx, "endDate", v)} 
                          editable={!exp.isCurrent}
                        />
                      </View>
                    </View>

                    <View style={styles.switchRow}>
                      <Switch
                        value={Boolean(exp.isCurrent)}
                        onValueChange={(val) => updateExperience(idx, "isCurrent", val)}
                        trackColor={{ false: "#cbd5e1", true: "#00BFC4" }}
                      />
                      <Text style={[styles.switchLabel, { color: textColor }]}>{t.currentJob}</Text>
                    </View>

                  </View>
                ))}

                <TouchableOpacity style={styles.addBtn} onPress={addExperience}>
                  <Feather name="plus" size={16} color="#fff" />
                  <Text style={styles.addBtnText}>{t.addExperience}</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* --- SOCIAL TAB --- */}
            {activeTab === "social" && (
              <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                {socialConfigs.map((item) => (
                  <View key={item.key} style={styles.socialGroup}>
                    <Text style={[styles.label, { color: textColor }]}>{item.label}</Text>
                    <View style={[styles.socialInputContainer, { backgroundColor: inputBg, borderColor: inputBorder }]}>
                      <View style={styles.socialIconBox}>
                        <Ionicons name={item.icon as any} size={18} color="#64748b" />
                      </View>
                      <TextInput
                        style={[styles.socialInput, { color: textColor }]}
                        placeholder="username or number"
                        placeholderTextColor={subTextColor}
                        value={form.socialLinks?.[item.key] || ""}
                        onChangeText={(val) => updateSocial(item.key, val, item.prefix)}
                      />
                    </View>
                    <Text style={styles.socialPrefixLabel}>{item.prefix}</Text>
                  </View>
                ))}
              </View>
            )}

          </ScrollView>
        </KeyboardAvoidingView>

        {/* --- MODALS --- */}
        {/* Error Dialog Modal */}
        {dialogErrors.length > 0 && (
          <Modal transparent visible animationType="fade">
            <View style={styles.modalOverlay}>
              <View style={[styles.errorModalCard, { backgroundColor: cardBg }]}>
                <View style={styles.errorModalHeader}>
                  <Ionicons name="alert-circle" size={28} color="#ef4444" />
                  <Text style={[styles.errorModalTitle, { color: textColor }]}>{t.dialogTitle}</Text>
                </View>
                <ScrollView style={{ maxHeight: 200, marginVertical: 14 }}>
                  {dialogErrors.map((err, i) => (
                    <Text key={i} style={{ color: subTextColor, fontSize: 13, marginBottom: 4 }}>• {err}</Text>
                  ))}
                </ScrollView>
                <TouchableOpacity style={styles.errorModalBtn} onPress={() => setDialogErrors([])}>
                  <Text style={styles.errorModalBtnText}>{t.dialogClose}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}

        {/* Degree Modal */}
        <Modal visible={showDegreeModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={[styles.selectModalCard, { backgroundColor: cardBg }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: textColor }]}>{t.selectDegree}</Text>
                <TouchableOpacity onPress={() => setShowDegreeModal(false)}>
                  <Ionicons name="close" size={24} color={textColor} />
                </TouchableOpacity>
              </View>
              <FlatList
                data={degreesList}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={[styles.modalItem, { borderBottomColor: inputBorder }, form.degree === item && { backgroundColor: actionBg, borderBottomWidth: 0 }]}
                    onPress={() => { updateField("degree", item); setShowDegreeModal(false); }}
                  >
                    <Text style={[styles.modalItemText, { color: textColor }, form.degree === item && { color: "#008B8B", fontWeight: "800" }]}>{item}</Text>
                    {form.degree === item && <Ionicons name="checkmark-circle" size={20} color="#008B8B" />}
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </Modal>

        {/* Employment Type Modal */}
        <Modal visible={showEmpTypeModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={[styles.selectModalCard, { backgroundColor: cardBg }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: textColor }]}>{t.employmentType}</Text>
                <TouchableOpacity onPress={() => setShowEmpTypeModal(false)}>
                  <Ionicons name="close" size={24} color={textColor} />
                </TouchableOpacity>
              </View>
              <FlatList
                data={employmentTypes}
                keyExtractor={(item) => item}
                renderItem={({ item }) => {
                  const isActive = currentExpIndex !== null && form.experiences?.[currentExpIndex]?.employmentType === item;
                  return (
                    <TouchableOpacity 
                      style={[styles.modalItem, { borderBottomColor: inputBorder }, isActive && { backgroundColor: actionBg, borderBottomWidth: 0 }]}
                      onPress={() => {
                        if (currentExpIndex !== null) updateExperience(currentExpIndex, "employmentType", item);
                        setShowEmpTypeModal(false);
                      }}
                    >
                      <Text style={[styles.modalItemText, { color: textColor }, isActive && { color: "#008B8B", fontWeight: "800" }]}>{item}</Text>
                      {isActive && <Ionicons name="checkmark-circle" size={20} color="#008B8B" />}
                    </TouchableOpacity>
                  );
                }}
              />
            </View>
          </View>
        </Modal>

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safeArea: { flex: 1 },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12 },
  screenTitle: { fontSize: 18, fontWeight: "900" },
  topBarRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  actionIconBtn: { width: 34, height: 34, borderRadius: 17, justifyContent: "center", alignItems: "center" },
  langToggle: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  headerCard: { flexDirection: "row", alignItems: "center", padding: 16, borderRadius: 20, marginBottom: 16, borderWidth: 1 },
  avatarWrapper: { position: "relative", marginRight: 14 },
  avatar: { width: 64, height: 64, borderRadius: 16, backgroundColor: "#e2e8f0" },
  placeholderAvatar: { backgroundColor: "#008B8B", justifyContent: "center", alignItems: "center" },
  placeholderText: { color: "#ffffff", fontSize: 24, fontWeight: "bold" },
  cameraIconBadge: { position: "absolute", bottom: -6, right: -6, backgroundColor: "#0f172a", width: 24, height: 24, borderRadius: 12, justifyContent: "center", alignItems: "center", borderWidth: 2, borderColor: "#fff" },
  userName: { fontSize: 18, fontWeight: "900", marginBottom: 2 },
  userEmail: { fontSize: 12, fontWeight: "500" },
  saveBtn: { backgroundColor: "#008B8B", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, marginLeft: 10 },
  saveBtnText: { color: "#fff", fontWeight: "800", fontSize: 13 },
  tabContainer: { flexDirection: "row", gap: 8, marginBottom: 16 },
  tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: "center" },
  tabBtnActive: { backgroundColor: "rgba(0,191,196,0.15)" },
  tabText: { fontSize: 13, fontWeight: "800" },
  tabTextActive: { color: "#008B8B" },
  sectionCard: { padding: 16, borderRadius: 20, marginBottom: 16, borderWidth: 1 },
  sectionTitle: { fontSize: 16, fontWeight: "900", marginBottom: 14, textTransform: "uppercase" },
  label: { fontSize: 12, fontWeight: "800", marginBottom: 6, textTransform: "uppercase" },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, height: 46, fontSize: 14, marginBottom: 14 },
  inputDisabled: { backgroundColor: "rgba(0,0,0,0.05)", borderColor: "transparent" },
  expHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderBottomWidth: 1, borderBottomColor: "rgba(0,0,0,0.05)", paddingBottom: 10, marginBottom: 14 },
  expHeaderTitle: { fontSize: 12, fontWeight: "800", textTransform: "uppercase" },
  switchRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 },
  switchLabel: { fontSize: 13, fontWeight: "700" },
  addBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: "#008B8B", paddingVertical: 14, borderRadius: 16 },
  addBtnText: { color: "#fff", fontSize: 14, fontWeight: "800" },
  socialGroup: { marginBottom: 16 },
  socialInputContainer: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 12, height: 46, overflow: "hidden" },
  socialIconBox: { width: 40, height: "100%", justifyContent: "center", alignItems: "center", borderRightWidth: 1, borderRightColor: "rgba(0,0,0,0.05)" },
  socialInput: { flex: 1, paddingHorizontal: 12, fontSize: 14, fontWeight: "600" },
  socialPrefixLabel: { fontSize: 10, color: "#94a3b8", marginTop: 4, marginLeft: 4 },
  
  // Modals
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  selectModalCard: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: "60%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  modalTitle: { fontSize: 18, fontWeight: "800" },
  modalItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 14, borderBottomWidth: 1 },
  modalItemText: { fontSize: 15, fontWeight: "600" },
  errorModalCard: { margin: 20, borderRadius: 24, padding: 20, elevation: 10 },
  errorModalHeader: { flexDirection: "row", alignItems: "center", gap: 10, borderBottomWidth: 1, borderBottomColor: "rgba(0,0,0,0.05)", paddingBottom: 12 },
  errorModalTitle: { fontSize: 18, fontWeight: "900" },
  errorModalBtn: { backgroundColor: "#0f172a", paddingVertical: 14, borderRadius: 14, alignItems: "center" },
  errorModalBtnText: { color: "#fff", fontSize: 15, fontWeight: "800" },
});