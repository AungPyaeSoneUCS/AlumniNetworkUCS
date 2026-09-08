// file: src/screens/LoginScreen.tsx

import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as SecureStore from "expo-secure-store";
import api from "../services/api";

// 1. IMPORT GLOBAL CONTEXT
import { useAppContext } from "../context/AppContext";

type Lang = "en" | "mm";

const translations = {
  en: {
    heroTitle: "Hinthada Computer",
    heroSubtitle: "Alumni Network",
    heroDesc: "Login with your alumni account and connect with the network.",
    formTitle: "Welcome Back!",
    formDesc: "Login with your email and password.",
    email: "Email",
    emailPlaceholder: "example@gmail.com",
    password: "Password",
    passwordPlaceholder: "Enter password",
    forgotBtn: "Forgot password?",
    loginBtn: "Login",
    noAccount: "No account yet?",
    registerBtn: "Create Account",
    emailReq: "Email must include @.",
    emailInvalid: "Invalid email format. (e.g. example@gmail.com)",
    pwShort: "Password must be at least 8 characters.",
    successTitle: "Success",
    successMsg: "Logged in successfully!",
    failMsg: "Invalid email or password.",
    networkErr: "Server is unreachable. Please check your network connection.",
  },
  mm: {
    heroTitle: "ကွန်ပျူတာတက္ကသိုလ် (ဟင်္သာတ)",
    heroSubtitle: "ကျောင်းသားဟောင်းများ ကွန်ရက်",
    heroDesc: "သင်၏ ကျောင်းသားဟောင်းအကောင့်ဖြင့် ဝင်ရောက်၍ ကွန်ရက်တွင် ချိတ်ဆက်ပါ။",
    formTitle: "ပြန်လည်ကြိုဆိုပါတယ်",
    formDesc: "Email နှင့် password ဖြင့် login ဝင်ပါ။",
    email: "အီးမေးလ်",
    emailPlaceholder: "example@gmail.com",
    password: "စကားဝှက်",
    passwordPlaceholder: "စကားဝှက် ထည့်ပါ",
    forgotBtn: "စကားဝှက် မေ့နေပါသလား?",
    loginBtn: "ဝင်မည်",
    noAccount: "အကောင့်မရှိသေးပါသလား?",
    registerBtn: "အကောင့် ဖွင့်မယ်",
    emailReq: "Email တွင် @ ထည့်ရန်လိုအပ်ပါသည်။",
    emailInvalid: "Email format မမှန်ပါ။ example@gmail.com ပုံစံဖြစ်ရမည်။",
    pwShort: "စကားဝှက်သည် အနည်းဆုံး ၈ လုံး ဖြစ်ရမည်။",
    successTitle: "အောင်မြင်ပါသည်",
    successMsg: "အကောင့်ဝင်ရောက်မှု အောင်မြင်ပါသည်။",
    failMsg: "Email သို့မဟုတ် စကားဝှက် မှားနေပါသည်။",
    networkErr: "ဆာဗာနှင့် ချိတ်ဆက်၍မရပါ။ အင်တာနက်လိုင်း စစ်ဆေးပါ။",
  },
};

export default function LoginScreen({ navigation }: any) {
  // 2. EXTRACT GLOBAL STATE
  const { lang, setLang, isDarkMode, toggleTheme } = useAppContext();
  const t = translations[lang];

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [focusedField, setFocusedField] = useState<"email" | "password" | null>(null);

  // Theme Animation
  const themeAnim = useRef(new Animated.Value(isDarkMode ? 1 : 0)).current;

  // Sync animation when the global theme changes
  useEffect(() => {
    Animated.timing(themeAnim, {
      toValue: isDarkMode ? 1 : 0,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [isDarkMode, themeAnim]);

  const getEmailError = (val: string): string => {
    const trimmed = val.trim();
    if (!trimmed) return "";
    if (!trimmed.includes("@")) return t.emailReq;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return t.emailInvalid;
    return "";
  };

  const getPasswordError = (val: string): string => {
    if (!val) return "";
    if (val.length < 8) return t.pwShort;
    return "";
  };

  const emailError = getEmailError(email);
  const passwordError = getPasswordError(password);
  const canSubmit = !emailError && !passwordError && email.trim().length > 0 && password.length >= 8 && !loading;

  // Form Submit with Server-Down Protection
  const handleLogin = async () => {
    if (emailError) return setErrorMessage(emailError);
    if (passwordError) return setErrorMessage(passwordError);

    setLoading(true);
    setErrorMessage("");

    try {
      const res = await api.post("/auth/mobile-login", {
        email: email.trim().toLowerCase(),
        password,
      }, { timeout: 6000 }); // Added 6-second timeout so it doesn't hang indefinitely

      if (res.data?.success) {
        await SecureStore.setItemAsync("user_session", JSON.stringify(res.data.user));
        
        Alert.alert(t.successTitle, t.successMsg, [
          {
            text: "OK",
            onPress: () => {
              navigation.reset({
                index: 0,
                routes: [
                  {
                    name: "MainTabs",
                    state: { routes: [{ name: "Directory" }, { name: "Profile" }], index: 0 },
                  },
                ],
              });
            },
          },
        ]);
      } else {
        setErrorMessage(res.data?.message || t.failMsg);
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || err.response?.data?.error || t.networkErr);
    } finally {
      setLoading(false);
    }
  };

  const textColor = isDarkMode ? "#ffffff" : "#0f172a";
  const cardBg = isDarkMode ? "#1e293b" : "#ffffff";
  const cardBorder = isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)";
  const inputBg = isDarkMode ? "#334155" : "#f8fafc";
  const inputBorder = isDarkMode ? "#475569" : "#e2e8f0";
  const inputColor = isDarkMode ? "#f8fafc" : "#0f172a";

  return (
    <View style={styles.root}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

      <Animated.View style={[StyleSheet.absoluteFill, { opacity: themeAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }]}>
        <LinearGradient colors={["#eaffff", "#f1f5f9"]} style={StyleSheet.absoluteFill} />
      </Animated.View>
      
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: themeAnim }]}>
        <LinearGradient colors={["#0f172a", "#1e293b"]} style={StyleSheet.absoluteFill} />
      </Animated.View>

      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            
            <View style={styles.topBar}>
              <TouchableOpacity style={[styles.iconBtn, { backgroundColor: isDarkMode ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.05)" }]} onPress={() => navigation.navigate("Welcome")}>
                <Ionicons name="arrow-back" size={22} color={textColor} />
              </TouchableOpacity>

              <View style={styles.topBarRight}>
                <TouchableOpacity style={[styles.iconBtn, { backgroundColor: isDarkMode ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.05)", marginRight: 10 }]} onPress={toggleTheme}>
                  <Ionicons name={isDarkMode ? "moon" : "sunny"} size={20} color={isDarkMode ? "#f1cd72" : "#f59e0b"} />
                </TouchableOpacity>

                <TouchableOpacity style={[styles.langToggle, { backgroundColor: isDarkMode ? "rgba(255,255,255,0.15)" : "rgba(0,139,139,0.1)" }]} onPress={() => setLang(lang === "en" ? "mm" : "en")}>
                  <Ionicons name="globe-outline" size={16} color={isDarkMode ? "#00BFC4" : "#008B8B"} />
                  <Text style={[styles.langText, { color: isDarkMode ? "#ffffff" : "#008B8B" }]}>{lang === "en" ? "MM" : "EN"}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.heroWrapper}>
              <Text style={styles.heroGoldText}>{t.heroTitle}</Text>
              <Text style={[styles.heroWhiteText, { color: textColor }]}>{t.heroSubtitle}</Text>
              <Text style={[styles.heroSubtitle, { color: isDarkMode ? "#cbd5e1" : "#475569" }]}>{t.heroDesc}</Text>
            </View>

            <View style={[styles.formCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <Text style={[styles.formTitle, { color: textColor }]}>{t.formTitle}</Text>
              <Text style={[styles.formSubTitle, { color: isDarkMode ? "#94a3b8" : "#64748b" }]}>{t.formDesc}</Text>

              {errorMessage ? (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle" size={18} color="#dc2626" />
                  <Text style={styles.errorBoxText}>{errorMessage}</Text>
                </View>
              ) : null}

              <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: textColor }]}>{t.email}</Text>
                <TextInput
                  style={[
                    styles.input,
                    { backgroundColor: inputBg, borderColor: inputBorder, color: inputColor },
                    focusedField === "email" && styles.inputFocused,
                    !!emailError && focusedField === "email" && styles.inputError,
                  ]}
                  placeholder={t.emailPlaceholder}
                  placeholderTextColor={isDarkMode ? "#64748b" : "#94a3b8"}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField(null)}
                  onChangeText={(text) => { setEmail(text); setErrorMessage(""); }}
                />
                {focusedField === "email" && emailError ? <Text style={styles.inlineError}>{emailError}</Text> : null}
              </View>

              <View style={styles.fieldGroup}>
                <Text style={[styles.label, { color: textColor }]}>{t.password}</Text>
                <View style={styles.passwordWrapper}>
                  <TextInput
                    style={[
                      styles.input,
                      styles.passwordInput,
                      { backgroundColor: inputBg, borderColor: inputBorder, color: inputColor },
                      focusedField === "password" && styles.inputFocused,
                      !!passwordError && focusedField === "password" && styles.inputError,
                    ]}
                    placeholder={t.passwordPlaceholder}
                    placeholderTextColor={isDarkMode ? "#64748b" : "#94a3b8"}
                    secureTextEntry={!showPassword}
                    value={password}
                    onFocus={() => setFocusedField("password")}
                    onBlur={() => setFocusedField(null)}
                    onChangeText={(text) => { setPassword(text); setErrorMessage(""); }}
                  />
                  <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#64748b" />
                  </TouchableOpacity>
                </View>
                {focusedField === "password" && passwordError ? <Text style={styles.inlineError}>{passwordError}</Text> : null}
              </View>

              <TouchableOpacity style={styles.forgotBtn} onPress={() => navigation.navigate("ForgotPassword")}>
                <Text style={styles.forgotText}>{t.forgotBtn}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
                onPress={handleLogin}
                disabled={!canSubmit}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.submitBtnText}>{t.loginBtn}</Text>
                )}
              </TouchableOpacity>

              <View style={styles.footerRow}>
                <Text style={[styles.footerText, { color: isDarkMode ? "#94a3b8" : "#64748b" }]}>{t.noAccount} </Text>
                <TouchableOpacity onPress={() => navigation.navigate("Register")}>
                  <Text style={styles.registerLink}>{t.registerBtn}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safeArea: { flex: 1 },
  container: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  topBarRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconBtn: {
    padding: 8,
    borderRadius: 12,
  },
  langToggle: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  langText: { fontSize: 13, fontWeight: "700" },
  heroWrapper: {
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  heroGoldText: { fontSize: 28, fontWeight: "900", color: "#00BFC4" },
  heroWhiteText: { fontSize: 28, fontWeight: "900", marginTop: -4 },
  heroSubtitle: { fontSize: 14, marginTop: 8, lineHeight: 22 },
  formCard: {
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  formTitle: { fontSize: 22, fontWeight: "800", textAlign: "center" },
  formSubTitle: { fontSize: 13, textAlign: "center", marginTop: 4, marginBottom: 20 },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
    borderWidth: 1,
    padding: 10,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  errorBoxText: { color: "#b91c1c", fontSize: 13, flex: 1, fontWeight: "600" },
  fieldGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: "700", marginBottom: 6 },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  inputFocused: { borderColor: "#00BFC4", borderWidth: 1.5 },
  inputError: { borderColor: "#ef4444" },
  passwordWrapper: { position: "relative" },
  passwordInput: { paddingRight: 45 },
  eyeIcon: { position: "absolute", right: 12, top: 15 },
  inlineError: { color: "#dc2626", fontSize: 12, marginTop: 4, fontWeight: "500" },
  forgotBtn: { alignSelf: "flex-end", marginBottom: 20 },
  forgotText: { color: "#00BFC4", fontSize: 13, fontWeight: "700" },
  submitBtn: {
    height: 50,
    backgroundColor: "#008B8B",
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#008B8B",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { color: "#ffffff", fontSize: 16, fontWeight: "800" },
  footerRow: { flexDirection: "row", justifyContent: "center", marginTop: 24 },
  footerText: { fontSize: 14 },
  registerLink: { color: "#00BFC4", fontSize: 14, fontWeight: "800" },
});