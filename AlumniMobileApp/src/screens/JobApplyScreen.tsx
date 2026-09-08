// file: src/screens/JobApplyScreen.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  ScrollView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, Feather } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import { GradientBackground, useTheme } from "../components";
import { useAppContext } from "../context/AppContext";
import { jobsApi, UserProfile } from "../services/api";

type Lang = "en" | "mm";

const translations = {
  en: {
    title: "Apply for Job",
    coverLetter: "Cover Letter",
    coverPlaceholder: "Introduce yourself and explain why you're a good fit...",
    experience: "Link Experience (Optional)",
    selectExperience: "Select your experience",
    name: "Your Name",
    email: "Your Email",
    phone: "Phone (Optional)",
    submit: "Submit Application",
    submitting: "Submitting...",
    success: "Application Submitted",
    successMsg: "Your application has been sent successfully.",
    error: "Error",
    fillRequired: "Please fill in your name, email and cover letter.",
    needLogin: "Please log in to apply for jobs.",
    cancel: "Cancel",
    jobTitle: "Job Title",
    sessionExpired: "Session Expired",
    loginAgain: "Please log in again to continue.",
  },
  mm: {
    title: "အလုပ်လျှောက်ထားမည်",
    coverLetter: "ကိုယ်ရေးရာဇဝင်",
    coverPlaceholder: "သင့်အကြောင်း နှင့် အလုပ်အတွက် အသင့်တော်ဆုံး ဖြစ်ကြောင်း ရှင်းပြပါ...",
    experience: "အတွေ့အကြုံ ချိတ်ဆက်ရန် (မလိုအပ်)",
    selectExperience: "သင့်အတွေ့အကြုံကို ရွေးချယ်ပါ",
    name: "သင့်နာမည်",
    email: "သင့် Email",
    phone: "ဖုန်း (မလိုအပ်)",
    submit: "လျှောက်လွှာ တင်မည်",
    submitting: "တင်နေသည်...",
    success: "လျှောက်လွှာ တင်ပြီးပါပြီ",
    successMsg: "သင့်လျှောက်လွှာကို အောင်မြင်စွာ ပို့လိုက်ပါပြီ။",
    error: "အမှား",
    fillRequired: "နာမည်၊ Email နှင့် ကိုယ်ရေးရာဇဝင် ဖြည့်ပေးပါ။",
    needLogin: "အလုပ်လျှောက်ရန် ကျေးဇူးပြု၍ ဝင်ရောက်ပါ။",
    cancel: "မလုပ်တော့ပါ",
    jobTitle: "အလုပ် ခေါင်းစဉ်",
    sessionExpired: "Session သက်တမ်းကုန်သွားပါပြီ",
    loginAgain: "ဆက်လုပ်ရန် ကျေးဇူးပြု၍ ပြန်လည်ဝင်ရောက်ပါ။",
  },
};

export default function JobApplyScreen({ navigation, route }: any) {
  const { lang, isDarkMode } = useAppContext();
  const colors = useTheme();
  const t = (translations[lang as Lang]) as any;

  const job: any = route?.params?.job;

  const [me, setMe] = useState<UserProfile | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [selectedExpId, setSelectedExpId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function init() {
      const session = await SecureStore.getItemAsync("user_session");
      if (!session) {
        navigation.reset({ index: 0, routes: [{ name: "Welcome" }] });
        return;
      }
      const parsed = JSON.parse(session);
      setMe(parsed);
      setName(parsed.name || "");
      setEmail(parsed.email || "");
    }
    init();
  }, [navigation]);

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim() || !coverLetter.trim()) {
      Alert.alert(t.error, t.fillRequired);
      return;
    }
    if (!job?._id) {
      Alert.alert(t.error, "Job not found");
      return;
    }

    const session = await SecureStore.getItemAsync("user_session");
    if (!session) {
      Alert.alert(t.needLogin);
      return;
    }

    setSubmitting(true);
    try {
      await jobsApi.applyForJob(job._id, {
        experienceId: selectedExpId || undefined,
        coverLetter: coverLetter.trim(),
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
      });
      Alert.alert(t.success, t.successMsg, [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      if (err?.response?.status === 401) {
        await SecureStore.deleteItemAsync("user_session");
        Alert.alert(t.sessionExpired, t.loginAgain);
        navigation.reset({ index: 0, routes: [{ name: "Welcome" }] });
      } else {
        Alert.alert(t.error, err?.response?.data?.message || "Failed to submit application.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const experiences = me?.experiences || [];

  return (
    <View style={styles.root}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      <GradientBackground isDarkMode={isDarkMode} />

      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <KeyboardAvoidingView style={styles.flex1} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]}>{t.title}</Text>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={[styles.jobCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
              <Text style={[styles.jobTitle, { color: colors.text }]}>{job?.title}</Text>
              <Text style={[styles.jobCompany, { color: colors.subText }]}>{job?.company}</Text>
            </View>

            <Text style={[styles.label, { color: colors.text }]}>{t.name} *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
              value={name}
              onChangeText={setName}
              placeholder="Name"
              placeholderTextColor={isDarkMode ? "#64748b" : "#94a3b8"}
            />

            <Text style={[styles.label, { color: colors.text }]}>{t.email} *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor={isDarkMode ? "#64748b" : "#94a3b8"}
            />

            <Text style={[styles.label, { color: colors.text }]}>{t.phone}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
              value={phone}
              onChangeText={setPhone}
              placeholder="Phone"
              keyboardType="phone-pad"
              placeholderTextColor={isDarkMode ? "#64748b" : "#94a3b8"}
            />

            <Text style={[styles.label, { color: colors.text }]}>{t.experience}</Text>
            {experiences.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.expScroll}>
                <TouchableOpacity
                  style={[styles.expChip, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }, selectedExpId === "" && styles.expChipActive]}
                  onPress={() => setSelectedExpId("")}
                >
                  <Text style={[styles.expChipText, { color: colors.subText }, selectedExpId === "" && styles.expChipTextActive]}>
                    {t.selectExperience}
                  </Text>
                </TouchableOpacity>
                {experiences.map((exp: any) => (
                  <TouchableOpacity
                    key={exp._id || exp.position}
                    style={[styles.expChip, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }, selectedExpId === exp._id && styles.expChipActive]}
                    onPress={() => setSelectedExpId(exp._id || "")}
                  >
                    <Text style={[styles.expChipText, { color: colors.subText }, selectedExpId === exp._id && styles.expChipTextActive]}>
                      {exp.position} @ {exp.company}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <Text style={[styles.noExpText, { color: colors.subText }]}>No linked experiences</Text>
            )}

            <Text style={[styles.label, { color: colors.text }]}>{t.coverLetter} *</Text>
            <TextInput
              style={[styles.textArea, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
              value={coverLetter}
              onChangeText={setCoverLetter}
              placeholder={t.coverPlaceholder}
              multiline
              numberOfLines={6}
              placeholderTextColor={isDarkMode ? "#64748b" : "#94a3b8"}
            />

            <TouchableOpacity
              style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Feather name="send" size={16} color="#fff" />
                  <Text style={styles.submitText}>{t.submit}</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safeArea: { flex: 1 },
  flex1: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 12, gap: 12 },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 20, fontWeight: "900" },
  scrollContent: { padding: 16, paddingBottom: 40 },
  jobCard: { borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1 },
  jobTitle: { fontSize: 18, fontWeight: "900" },
  jobCompany: { fontSize: 14, fontWeight: "600", marginTop: 4 },
  label: { fontSize: 14, fontWeight: "800", marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, marginBottom: 4 },
  textArea: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 14, minHeight: 110, textAlignVertical: "top", marginBottom: 20 },
  expScroll: { flexDirection: "row", gap: 8, marginBottom: 12 },
  expChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, marginRight: 8 },
  expChipActive: { backgroundColor: "#008B8B", borderColor: "#008B8B" },
  expChipText: { fontSize: 12, fontWeight: "700" },
  expChipTextActive: { color: "#ffffff" },
  noExpText: { fontSize: 12, fontStyle: "italic", marginBottom: 12 },
  submitBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#008B8B", paddingVertical: 14, borderRadius: 14, marginTop: 4 },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: { color: "#fff", fontWeight: "800", fontSize: 15 },
});
