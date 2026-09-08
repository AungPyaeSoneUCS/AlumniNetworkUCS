// file: src/screens/SettingsScreen.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import { useNavigation } from "@react-navigation/native";
import { useAppContext, ThemeMode } from "../context/AppContext";
import { GradientBackground, ScreenHeader, Card, useTheme } from "../components";

const translations = {
  en: {
    title: "Settings",
    appearance: "Appearance",
    language: "Language",
    english: "English",
    burmese: "Myanmar (မြန်မာ)",
    theme: "Theme",
    light: "Light",
    dark: "Dark",
    system: "System",
    account: "Account",
    editProfile: "Edit Profile",
    changePassword: "Change Password",
    logout: "Log Out",
    logoutTitle: "Log Out",
    logoutMsg: "Are you sure you want to log out?",
    cancel: "Cancel",
    chevron: "chevron-forward",
  },
  mm: {
    title: "ဆက်တင်များ",
    appearance: "အသွင်အပြင်",
    language: "ဘာသာစကား",
    english: "အင်္ဂလိပ်",
    burmese: "မြန်မာ",
    theme: "အပြင်အဆင်",
    light: "အလင်း",
    dark: "အမှောင်",
    system: "စနစ်",
    account: "အကောင့်",
    editProfile: "ပရိုဖိုင် ပြင်ဆင်ရန်",
    changePassword: "စကားဝှက် ပြောင်းရန်",
    logout: "ထွက်မည်",
    logoutTitle: "ထွက်မည်",
    logoutMsg: "အကောင့်မှ ထွက်မှာ သေချာပါသလား?",
    cancel: "မလုပ်တော့ပါ",
    chevron: "chevron-forward",
  },
};

export default function SettingsScreen() {
  const { lang, setLang, themeMode, setThemeMode, isDarkMode } = useAppContext();
  const navigation = useNavigation<any>();
  const colors = useTheme();
  const t = translations[lang];

  const [executingLogout, setExecutingLogout] = useState(false);

  const handleLogout = () => {
    Alert.alert(t.logoutTitle, t.logoutMsg, [
      { text: t.cancel, style: "cancel" },
      {
        text: t.logoutTitle,
        style: "destructive",
        onPress: async () => {
          setExecutingLogout(true);
          await SecureStore.deleteItemAsync("user_session");
          navigation.reset({ index: 0, routes: [{ name: "Welcome" }] });
          setExecutingLogout(false);
        },
      },
    ]);
  };

  const themeOptions: { key: ThemeMode; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: "light", label: t.light, icon: "sunny-outline" },
    { key: "dark", label: t.dark, icon: "moon-outline" },
    { key: "system", label: t.system, icon: "phone-portrait-outline" },
  ];

  return (
    <View style={styles.root}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      <GradientBackground isDarkMode={isDarkMode} />

      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <ScreenHeader
          title={t.title}
          icon="settings-outline"
        />

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Appearance */}
          <Text style={[styles.sectionLabel, { color: colors.brand }]}>{t.appearance}</Text>
          <Card style={styles.card}>
            {/* Language */}
            <Text style={[styles.itemLabel, { color: colors.subText }]}>{t.language}</Text>
            <View style={[styles.segmented, { backgroundColor: colors.inputBg, borderColor: colors.cardBorder }]}>
              {[
                { key: "en" as const, label: t.english },
                { key: "mm" as const, label: t.burmese },
              ].map((opt) => (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.segmentBtn, { backgroundColor: lang === opt.key ? colors.brand : "transparent" }]}
                  onPress={() => setLang(opt.key)}
                >
                  <Text style={[styles.segmentText, { color: lang === opt.key ? "#ffffff" : colors.text }]}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Theme */}
            <Text style={[styles.itemLabel, { color: colors.subText, marginTop: 18 }]}>{t.theme}</Text>
            <View style={[styles.segmented, { backgroundColor: colors.inputBg, borderColor: colors.cardBorder }]}>
              {themeOptions.map((opt) => (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.segmentBtn, { backgroundColor: themeMode === opt.key ? colors.brand : "transparent" }]}
                  onPress={() => setThemeMode(opt.key)}
                >
                  <Ionicons name={opt.icon} size={14} color={themeMode === opt.key ? "#ffffff" : colors.text} />
                  <Text style={[styles.segmentText, { color: themeMode === opt.key ? "#ffffff" : colors.text }]}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card>

          {/* Account */}
          <Text style={[styles.sectionLabel, { color: colors.brand, marginTop: 24 }]}>{t.account}</Text>
          <Card style={styles.card}>
            <TouchableOpacity style={styles.row} onPress={() => navigation.navigate("EditProfile")}>
              <View style={[styles.rowIcon, { backgroundColor: colors.brandLight }]}>
                <Ionicons name="person-outline" size={18} color={colors.brand} />
              </View>
              <Text style={[styles.rowLabel, { color: colors.text }]}>{t.editProfile}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.subText} />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: colors.cardBorder }]} />

            <TouchableOpacity style={styles.row} onPress={() => navigation.navigate("ChangePassword")}>
              <View style={[styles.rowIcon, { backgroundColor: colors.brandLight }]}>
                <Ionicons name="key-outline" size={18} color={colors.brand} />
              </View>
              <Text style={[styles.rowLabel, { color: colors.text }]}>{t.changePassword}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.subText} />
            </TouchableOpacity>
          </Card>

          {/* Logout */}
          <TouchableOpacity
            style={[styles.logoutBtn, { borderColor: colors.cardBorder }]}
            onPress={handleLogout}
            disabled={executingLogout}
          >
            <Ionicons name="log-out-outline" size={18} color={colors.danger} />
            <Text style={[styles.logoutText, { color: colors.danger }]}>{t.logout}</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  sectionLabel: { fontSize: 13, fontWeight: "800", marginBottom: 8, marginLeft: 4, textTransform: "uppercase", letterSpacing: 0.5 },
  card: { padding: 16, borderRadius: 18 },
  itemLabel: { fontSize: 12, fontWeight: "700", marginBottom: 8 },
  segmented: { flexDirection: "row", borderRadius: 12, padding: 4, borderWidth: 1, gap: 4 },
  segmentBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 9 },
  segmentText: { fontSize: 13, fontWeight: "800" },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 12, gap: 12 },
  rowIcon: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  rowLabel: { flex: 1, fontSize: 15, fontWeight: "700" },
  divider: { height: 1 },
  logoutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 24, paddingVertical: 14, borderRadius: 14, borderWidth: 1 },
  logoutText: { fontSize: 15, fontWeight: "800" },
});
