// file: src/screens/RegisterScreen.tsx
import React, { useState, useEffect, useRef } from "react";
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
  Modal,
  FlatList,
  Animated,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as SecureStore from "expo-secure-store";
import api from "../services/api";

// 1. IMPORT GLOBAL CONTEXT
import { useAppContext } from "../context/AppContext";

type Lang = "en" | "mm";
type Step = "approval" | "info" | "otp";

const OTP_LENGTH = 6;

// Fallback years if server is offline or down
const FALLBACK_YEARS = ["2026", "2025", "2024", "2023", "2022", "2021", "2020", "2019", "2018", "2017", "2016", "2015"];

// ----------------------------------------------------
// TRANSLATION STORE
// ----------------------------------------------------
const translations = {
  en: {
    heroTitle: "Create Account",
    heroSubtitle: "Alumni Network",
    heroDesc: "Register with your approved student info and join the network.",
    step1: "Approval",
    step2: "Account",
    step3: "OTP",
    name: "Name",
    namePlaceholder: "Aung Aung",
    fatherName: "Father Name",
    fatherPlaceholder: "U --",
    graduatedYear: "Year of Successful Completion",
    selectYear: "Select Year",
    email: "Email",
    emailPlaceholder: "example@gmail.com",
    password: "Password",
    passwordPlaceholder: "Enter password",
    confirmPassword: "Confirm Password",
    confirmPlaceholder: "Confirm password",
    check: "Check Approval",
    checking: "Checking...",
    sendOtp: "Continue",
    sending: "Sending...",
    verifyOtp: "Verify OTP",
    verifying: "Verifying...",
    back: "Back",
    already: "Already have an account?",
    login: "Login",
    approved: "Approved register data found.",
    required: "Please fill all required fields.",
    nameInvalid: "Name must be at least 5 characters.",
    fatherNameInvalid: 'Father Name must start with "U ". ',
    invalidEmail: "Invalid email format.",
    weakPassword: "Password needs at least 3 types: uppercase, lowercase, number, or symbol.",
    passwordMismatch: "Passwords do not match.",
    passwordMatched: "Passwords match.",
    checkFirst: "Please check approval first.",
    otpInvalid: "OTP must be 6 digits.",
    nameHint: "Warning: Do not include 'Mg' or 'Ma' prefixes.",
    fatherNameHint: 'Warning: Father Name must start with "U ". ',
    emailHint: "Enter an active email to receive your OTP.",
    passwordHint: "Must be >= 8 chars with uppercase, lowercase, number, and symbol.",
    otpHint: "Enter the 6-digit OTP sent to your email.",
    successAlertTitle: "Success",
    successAlertMsg: "Account created and verified successfully!",
    uppercase: "Uppercase",
    lowercase: "Lowercase",
    number: "Number",
    symbol: "Symbol",
    loadingYears: "Loading years...",
    serverError: "Server is unreachable. Please check your internet connection.",
  },
  mm: {
    heroTitle: "အကောင့်သစ်ဖွင့်ရန်",
    heroSubtitle: "ကျောင်းသားဟောင်းများ ကွန်ရက်",
    heroDesc: "အတည်ပြုထားသော အချက်အလက်ဖြင့် ကျောင်းသားဟောင်းကွန်ရက်သို့ ဝင်ရောက်ပါ။",
    step1: "Approval",
    step2: "Account",
    step3: "OTP",
    name: "အမည်",
    namePlaceholder: "အောင်အောင်",
    fatherName: "အဖအမည်",
    fatherPlaceholder: "ဦး --",
    graduatedYear: "အောင်မြင်သည့်ခုနှစ်",
    selectYear: "ခုနှစ် ရွေးချယ်ပါ",
    email: "အီးမေးလ်",
    emailPlaceholder: "example@gmail.com",
    password: "စကားဝှက်",
    passwordPlaceholder: "စကားဝှက် ထည့်ပါ",
    confirmPassword: "စကားဝှက် အတည်ပြု",
    confirmPlaceholder: "စကားဝှက် ပြန်ထည့်ပါ",
    check: "အတည်ပြုမှု စစ်ဆေးမည်",
    checking: "စစ်ဆေးနေသည်...",
    sendOtp: "ဆက်သွားမည်",
    sending: "ပို့နေသည်...",
    verifyOtp: "OTP အတည်ပြုမည်",
    verifying: "စစ်ဆေးနေသည်...",
    back: "နောက်သို့",
    already: "အကောင့် ရှိပြီးသားလား?",
    login: "အကောင့်ဝင်ရန်",
    approved: "Admin မှ အတည်ပြုထားသော data တွေ့ပါသည်။",
    required: "လိုအပ်သော အချက်အလက်အားလုံး ဖြည့်ပါ။",
    nameInvalid: "အမည်သည် အနည်းဆုံး စာလုံး ၅ လုံး ရှိရမည်။",
    fatherNameInvalid: 'အဖအမည်သည် "U " ဖြင့် စရမည်။ ',
    invalidEmail: "Email format မမှန်ပါ။",
    weakPassword: "စကားဝှက်တွင် အနည်းဆုံး ၃ မျိုး ပါရမည်။",
    passwordMismatch: "စကားဝှက် မတူပါ။",
    passwordMatched: "စကားဝှက် တူညီပါသည်။",
    checkFirst: "အရင်ဆုံး approval စစ်ပါ။",
    otpInvalid: "OTP သည် ဂဏန်း ၆ လုံး ဖြစ်ရမည်။",
    nameHint: "သတိပြုရန် - 'Mg' သို့မဟုတ် 'Ma' ထည့်ရေးရန် မလိုပါ။",
    fatherNameHint: 'သတိပြုရန် - အဖအမည်ကို "U " ဖြင့် စရမည်။ ',
    emailHint: "OTP လက်ခံရရှိရန် အသုံးပြုနေသော အီးမေးလ် ဖြည့်ပါ။",
    passwordHint: "အကြီး၊ အသေး၊ နံပါတ်၊ သင်္ကေတ နှင့် အနည်းဆုံး ၈ လုံး ပါရမည်။",
    otpHint: "သင့် Email သို့ ပို့ထားသော OTP ၆ လုံးကို ထည့်ပါ။",
    successAlertTitle: "အောင်မြင်ပါသည်",
    successAlertMsg: "အကောင့်ဖွင့်ခြင်း အောင်မြင်ပါသည်။",
    uppercase: "အကြီးစာလုံး",
    lowercase: "အသေးစာလုံး",
    number: "နံပါတ်",
    symbol: "Symbol",
    loadingYears: "ခုနှစ်များ ရှာဖွေနေသည်...",
    serverError: "ဆာဗာနှင့် ချိတ်ဆက်၍မရပါ။ အင်တာနက်လိုင်း စစ်ဆေးပါ။",
  },
};

// --- Validators ---
const normalizeForMatch = (value: string) => value.replace(/\s+/g, "").toLowerCase();
const isEmailValid = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
const isNameValid = (val: string) => val.trim().length >= 5;
const isFatherNameValid = (val: string) => val.trimStart().startsWith("U ") && val.trim().length >= 3;

const getPasswordStrength = (password: string) => {
  const checks = [
    /[A-Z]/.test(password),
    /[a-z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  return {
    passedCount: checks.filter(Boolean).length,
    hasUpper: checks[0],
    hasLower: checks[1],
    hasNumber: checks[2],
    hasSpecial: checks[3],
  };
};

export default function RegisterScreen({ navigation }: any) {
  // 2. EXTRACT GLOBAL STATE
  const { lang, setLang, isDarkMode, toggleTheme } = useAppContext();
  const t = translations[lang];

  const [step, setStep] = useState<Step>("approval");

  // Step 1 States
  const [name, setName] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [graduatedYear, setGraduatedYear] = useState("");
  const [availableYears, setAvailableYears] = useState<string[]>(FALLBACK_YEARS);
  const [showYearModal, setShowYearModal] = useState(false);
  const [loadingYears, setLoadingYears] = useState(true);

  // Step 2 States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Step 3 States
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const otpRefs = useRef<Array<TextInput | null>>([]);

  // Flow & UI States
  const [approved, setApproved] = useState(false);
  const [checking, setChecking] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [activeHint, setActiveHint] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const [touched, setTouched] = useState({
    name: false,
    fatherName: false,
    email: false,
    password: false,
    confirmPassword: false,
  });

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

  // Fetch Years on Mount with Fallback Protection
  useEffect(() => {
    async function fetchYears() {
      try {
        const res = await api.get("/register/years", { timeout: 4000 });
        if (res.data?.years && Array.isArray(res.data.years) && res.data.years.length > 0) {
          setAvailableYears(res.data.years);
          setGraduatedYear(res.data.years[0]);
        }
      } catch (err) {
        console.log("Could not fetch remote years. Falling back to default list.");
        setGraduatedYear(FALLBACK_YEARS[0]);
      } finally {
        setLoadingYears(false);
      }
    }
    fetchYears();
  }, []);

  useEffect(() => {
    if (!message && !error) return;
    const timer = setTimeout(() => { setMessage(""); setError(""); }, 3500);
    return () => clearTimeout(timer);
  }, [message, error]);

  useEffect(() => {
    if (!activeHint) return;
    const timer = setTimeout(() => setActiveHint(null), 7000);
    return () => clearTimeout(timer);
  }, [activeHint]);

  useEffect(() => {
    setApproved(false);
  }, [name, fatherName, graduatedYear]);

  const resetStatus = () => {
    setMessage("");
    setError("");
  };

  // --- Handlers with Offline Tolerance ---
  const handleCheckApproval = async () => {
    resetStatus();
    setTouched((prev) => ({ ...prev, name: true, fatherName: true }));

    if (!isNameValid(name)) return setError(t.nameInvalid);
    if (!isFatherNameValid(fatherName)) return setError(t.fatherNameInvalid);
    if (!graduatedYear) return setError(t.required);

    setChecking(true);
    try {
      const res = await api.post("/register/check-approved", {
        name: name.trim(),
        fatherName: fatherName.trim(),
        graduatedYear: graduatedYear.trim(),
        normalizedName: normalizeForMatch(name),
        normalizedFatherName: normalizeForMatch(fatherName),
        lang,
      }, { timeout: 6000 });

      if (res.data?.approved) {
        setApproved(true);
        setMessage(res.data.message || t.approved);
        setTimeout(() => {
          setStep("info");
          resetStatus();
        }, 800);
      } else {
        setError(res.data?.message || t.required);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error || t.serverError);
    } finally {
      setChecking(false);
    }
  };

  const handleSendOtp = async () => {
    resetStatus();
    setTouched((prev) => ({ ...prev, email: true, password: true, confirmPassword: true }));

    if (!approved) {
      setStep("approval");
      return setError(t.checkFirst);
    }
    if (!isEmailValid(email)) return setError(t.invalidEmail);
    
    const strength = getPasswordStrength(password);
    if (password.length < 8 || strength.passedCount < 3) return setError(t.weakPassword);
    if (password !== confirmPassword) return setError(t.passwordMismatch);

    setSendingOtp(true);
    try {
      const res = await api.post("/register", {
        name: name.trim(),
        fatherName: fatherName.trim(),
        graduatedYear: graduatedYear.trim(),
        normalizedName: normalizeForMatch(name),
        normalizedFatherName: normalizeForMatch(fatherName),
        email: email.trim().toLowerCase(),
        password,
        lang,
      }, { timeout: 6000 });

      if (res.data) {
        setOtp(Array(OTP_LENGTH).fill(""));
        setMessage(res.data.message || "OTP sent.");
        setStep("otp");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error || t.serverError);
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    resetStatus();
    const code = otp.join("");
    if (code.length !== OTP_LENGTH) return setError(t.otpInvalid);

    setVerifyingOtp(true);
    try {
      const res = await api.post("/register/verify-otp", {
        email: email.trim().toLowerCase(),
        otp: code,
      }, { timeout: 6000 });

      if (res.data) {
        const loginRes = await api.post("/auth/mobile-login", {
          email: email.trim().toLowerCase(),
          password,
        }, { timeout: 6000 });

        if (loginRes.data?.success) {
          await SecureStore.setItemAsync("user_session", JSON.stringify(loginRes.data.user));
          Alert.alert(t.successAlertTitle, t.successAlertMsg);
          navigation.reset({
            index: 0,
            routes: [{ name: "MainTabs", state: { routes: [{ name: "Directory" }, { name: "Profile" }], index: 1 } }],
          });
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error || t.serverError);
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleOtpChange = (val: string, index: number) => {
    const next = [...otp];
    next[index] = val.replace(/\D/g, "").slice(-1);
    setOtp(next);
    if (val && index < OTP_LENGTH - 1) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const activeStepIndex = step === "approval" ? 0 : step === "info" ? 1 : 2;
  const nameError = touched.name && name && !isNameValid(name);
  const fatherNameError = touched.fatherName && fatherName && !isFatherNameValid(fatherName);
  const emailError = touched.email && email && !isEmailValid(email);
  
  const strength = getPasswordStrength(password);
  const isPasswordValid = password.length >= 8 && strength.passedCount >= 3;
  const passwordError = touched.password && password && !isPasswordValid;
  const confirmError = touched.confirmPassword && confirmPassword && password !== confirmPassword;

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
              <TouchableOpacity style={[styles.iconBtn, { backgroundColor: isDarkMode ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.05)" }]} onPress={() => navigation.goBack()}>
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
              <Text style={[styles.heroSubtitle, { color: isDarkMode ? "#cbd5e1" : "#475569" }]}>{t.heroDesc}</Text>
            </View>

            <View style={[styles.formCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              
              <View style={[styles.stepContainer, { backgroundColor: isDarkMode ? "rgba(0,191,196,0.1)" : "#eaffff" }]}>
                {[t.step1, t.step2, t.step3].map((label, index) => (
                  <View key={label} style={[styles.stepBadge, activeStepIndex >= index ? styles.stepActive : styles.stepInactive]}>
                    <Text style={[styles.stepText, activeStepIndex >= index ? styles.stepTextActive : [styles.stepTextInactive, { color: isDarkMode ? "#94a3b8" : "#64748b" }]]}>
                      {label}
                    </Text>
                  </View>
                ))}
              </View>

              {error || message ? (
                <View style={[styles.alertBox, error ? styles.alertError : styles.alertSuccess]}>
                  <Ionicons name={error ? "alert-circle" : "checkmark-circle"} size={18} color={error ? "#b91c1c" : "#0f766e"} />
                  <Text style={[styles.alertText, error ? { color: "#b91c1c" } : { color: "#0f766e" }]}>{error || message}</Text>
                </View>
              ) : null}

              {step === "approval" && (
                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: textColor }]}>{t.name}</Text>
                  <TextInput
                    style={[
                      styles.input, { backgroundColor: inputBg, borderColor: inputBorder, color: inputColor },
                      focusedField === "name" && styles.inputFocused, nameError && styles.inputError
                    ]}
                    placeholder={t.namePlaceholder}
                    placeholderTextColor={isDarkMode ? "#64748b" : "#94a3b8"}
                    value={name}
                    onChangeText={setName}
                    onFocus={() => { setFocusedField("name"); setActiveHint("name"); }}
                    onBlur={() => { setFocusedField(null); setTouched((p) => ({ ...p, name: true })); }}
                  />
                  {nameError && <Text style={styles.errorText}>{t.nameInvalid}</Text>}
                  {!nameError && activeHint === "name" && <Text style={[styles.hintText, { backgroundColor: isDarkMode ? "rgba(245,158,11,0.15)" : "#fffbeb" }]}>{t.nameHint}</Text>}

                  <Text style={[styles.label, { marginTop: 14, color: textColor }]}>{t.fatherName}</Text>
                  <TextInput
                    style={[
                      styles.input, { backgroundColor: inputBg, borderColor: inputBorder, color: inputColor },
                      focusedField === "fatherName" && styles.inputFocused, fatherNameError && styles.inputError
                    ]}
                    placeholder={t.fatherPlaceholder}
                    placeholderTextColor={isDarkMode ? "#64748b" : "#94a3b8"}
                    value={fatherName}
                    onChangeText={setFatherName}
                    onFocus={() => { setFocusedField("fatherName"); setActiveHint("fatherName"); }}
                    onBlur={() => { setFocusedField(null); setTouched((p) => ({ ...p, fatherName: true })); }}
                  />
                  {fatherNameError && <Text style={styles.errorText}>{t.fatherNameInvalid}</Text>}
                  {!fatherNameError && activeHint === "fatherName" && <Text style={[styles.hintText, { backgroundColor: isDarkMode ? "rgba(245,158,11,0.15)" : "#fffbeb" }]}>{t.fatherNameHint}</Text>}

                  <Text style={[styles.label, { marginTop: 14, color: textColor }]}>{t.graduatedYear}</Text>
                  <TouchableOpacity 
                    style={[styles.input, { justifyContent: 'center', backgroundColor: inputBg, borderColor: inputBorder }]} 
                    onPress={() => setShowYearModal(true)}
                  >
                    <Text style={{ color: graduatedYear ? inputColor : (isDarkMode ? "#64748b" : "#94a3b8") }}>
                      {graduatedYear || t.selectYear}
                    </Text>
                    <Feather name="chevron-down" size={18} color={isDarkMode ? "#94a3b8" : "#64748b"} style={{ position: 'absolute', right: 14 }} />
                  </TouchableOpacity>

                  <TouchableOpacity style={[styles.primaryBtn, { marginTop: 24 }]} onPress={handleCheckApproval} disabled={checking}>
                    {checking ? <ActivityIndicator color="#ffffff" size="small" /> : <Text style={styles.primaryBtnText}>{t.check}</Text>}
                  </TouchableOpacity>
                </View>
              )}

              {step === "info" && (
                <View style={styles.formGroup}>
                  <View style={[styles.hintBadge, { backgroundColor: isDarkMode ? "rgba(0,139,139,0.15)" : "#eaffff" }]}>
                    <Text style={styles.hintBadgeText}>{t.emailHint}</Text>
                  </View>

                  <Text style={[styles.label, { color: textColor }]}>{t.email}</Text>
                  <TextInput
                    style={[
                      styles.input, { backgroundColor: inputBg, borderColor: inputBorder, color: inputColor },
                      focusedField === "email" && styles.inputFocused, emailError && styles.inputError
                    ]}
                    placeholder={t.emailPlaceholder}
                    placeholderTextColor={isDarkMode ? "#64748b" : "#94a3b8"}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                    onFocus={() => { setFocusedField("email"); setActiveHint("email"); }}
                    onBlur={() => { setFocusedField(null); setTouched((p) => ({ ...p, email: true })); }}
                  />
                  {emailError && <Text style={styles.errorText}>{t.invalidEmail}</Text>}

                  <Text style={[styles.label, { marginTop: 14, color: textColor }]}>{t.password}</Text>
                  <View style={styles.passwordWrapper}>
                    <TextInput
                      style={[
                        styles.input, { paddingRight: 45 }, { backgroundColor: inputBg, borderColor: inputBorder, color: inputColor },
                        focusedField === "password" && styles.inputFocused, passwordError && styles.inputError
                      ]}
                      placeholder={t.passwordPlaceholder}
                      placeholderTextColor={isDarkMode ? "#64748b" : "#94a3b8"}
                      secureTextEntry={!showPassword}
                      value={password}
                      onChangeText={setPassword}
                      onFocus={() => { setFocusedField("password"); setActiveHint("password"); }}
                      onBlur={() => { setFocusedField(null); setTouched((p) => ({ ...p, password: true })); }}
                    />
                    <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowPassword(!showPassword)}>
                      <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#64748b" />
                    </TouchableOpacity>
                  </View>
                  {passwordError && <Text style={styles.errorText}>{t.weakPassword}</Text>}
                  {!passwordError && activeHint === "password" && <Text style={[styles.hintText, { backgroundColor: isDarkMode ? "rgba(245,158,11,0.15)" : "#fffbeb" }]}>{t.passwordHint}</Text>}

                  {focusedField === "password" && password.length > 0 && !isPasswordValid && (
                    <View style={styles.strengthGrid}>
                      <View style={[styles.strengthItem, strength.hasUpper ? styles.strengthPass : (isDarkMode ? styles.strengthFailDark : styles.strengthFailLight)]}>
                        <Text style={[styles.strengthText, strength.hasUpper ? styles.strengthTextPass : styles.strengthTextFail]}>{t.uppercase}</Text>
                      </View>
                      <View style={[styles.strengthItem, strength.hasLower ? styles.strengthPass : (isDarkMode ? styles.strengthFailDark : styles.strengthFailLight)]}>
                        <Text style={[styles.strengthText, strength.hasLower ? styles.strengthTextPass : styles.strengthTextFail]}>{t.lowercase}</Text>
                      </View>
                      <View style={[styles.strengthItem, strength.hasNumber ? styles.strengthPass : (isDarkMode ? styles.strengthFailDark : styles.strengthFailLight)]}>
                        <Text style={[styles.strengthText, strength.hasNumber ? styles.strengthTextPass : styles.strengthTextFail]}>{t.number}</Text>
                      </View>
                      <View style={[styles.strengthItem, strength.hasSpecial ? styles.strengthPass : (isDarkMode ? styles.strengthFailDark : styles.strengthFailLight)]}>
                        <Text style={[styles.strengthText, strength.hasSpecial ? styles.strengthTextPass : styles.strengthTextFail]}>{t.symbol}</Text>
                      </View>
                    </View>
                  )}

                  <Text style={[styles.label, { marginTop: 14, color: textColor }]}>{t.confirmPassword}</Text>
                  <View style={styles.passwordWrapper}>
                    <TextInput
                      style={[
                        styles.input, { paddingRight: 45 }, { backgroundColor: inputBg, borderColor: inputBorder, color: inputColor },
                        focusedField === "confirm" && styles.inputFocused, confirmError && styles.inputError
                      ]}
                      placeholder={t.confirmPlaceholder}
                      placeholderTextColor={isDarkMode ? "#64748b" : "#94a3b8"}
                      secureTextEntry={!showConfirm}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      onFocus={() => setFocusedField("confirm")}
                      onBlur={() => { setFocusedField(null); setTouched((p) => ({ ...p, confirmPassword: true })); }}
                    />
                    <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowConfirm(!showConfirm)}>
                      <Ionicons name={showConfirm ? "eye-off-outline" : "eye-outline"} size={20} color="#64748b" />
                    </TouchableOpacity>
                  </View>
                  {confirmError && <Text style={styles.errorText}>{t.passwordMismatch}</Text>}
                  {confirmPassword && !confirmError && password === confirmPassword && (
                    <Text style={styles.successTextHint}>{t.passwordMatched}</Text>
                  )}

                  <View style={styles.rowBtns}>
                    <TouchableOpacity style={[styles.secondaryBtn, { backgroundColor: isDarkMode ? "#1e293b" : "#ffffff" }]} onPress={() => { resetStatus(); setStep("approval"); }}>
                      <Text style={styles.secondaryBtnText}>{t.back}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.primaryBtn, { flex: 1 }]} onPress={handleSendOtp} disabled={sendingOtp}>
                      {sendingOtp ? <ActivityIndicator color="#ffffff" size="small" /> : <Text style={styles.primaryBtnText}>{t.sendOtp}</Text>}
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {step === "otp" && (
                <View style={styles.formGroup}>
                  <View style={[styles.hintBadge, { backgroundColor: isDarkMode ? "rgba(0,139,139,0.15)" : "#eaffff" }]}>
                    <Text style={styles.hintBadgeText}>{t.otpHint}</Text>
                  </View>
                  <Text style={[styles.centerEmailText, { color: textColor }]}>{email}</Text>

                  <View style={styles.otpRow}>
                    {otp.map((digit, index) => (
                      <TextInput
                        key={index}
                        ref={(el) => { otpRefs.current[index] = el; }}
                        style={[styles.otpInput, { backgroundColor: inputBg, borderColor: inputBorder, color: inputColor }]}
                        keyboardType="number-pad"
                        maxLength={1}
                        value={digit}
                        onChangeText={(val) => handleOtpChange(val, index)}
                        onKeyPress={(e) => handleOtpKeyPress(e, index)}
                      />
                    ))}
                  </View>

                  <View style={styles.rowBtns}>
                    <TouchableOpacity style={[styles.secondaryBtn, { backgroundColor: isDarkMode ? "#1e293b" : "#ffffff" }]} onPress={() => { resetStatus(); setStep("info"); }}>
                      <Text style={styles.secondaryBtnText}>{t.back}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.primaryBtn, { flex: 1 }, otp.join("").length !== OTP_LENGTH && { opacity: 0.6 }]} 
                      onPress={handleVerifyOtp} 
                      disabled={verifyingOtp || otp.join("").length !== OTP_LENGTH}
                    >
                      {verifyingOtp ? <ActivityIndicator color="#ffffff" size="small" /> : <Text style={styles.primaryBtnText}>{t.verifyOtp}</Text>}
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              <View style={styles.footerRow}>
                <Text style={[styles.footerText, { color: isDarkMode ? "#94a3b8" : "#64748b" }]}>{t.already} </Text>
                <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                  <Text style={styles.loginLink}>{t.login}</Text>
                </TouchableOpacity>
              </View>

            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        <Modal visible={showYearModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: cardBg }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: textColor }]}>{t.selectYear}</Text>
                <TouchableOpacity onPress={() => setShowYearModal(false)}>
                  <Ionicons name="close" size={24} color={textColor} />
                </TouchableOpacity>
              </View>
              <FlatList
                data={availableYears}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={[styles.modalItem, { borderBottomColor: inputBorder }, graduatedYear === item && { backgroundColor: isDarkMode ? "rgba(0,191,196,0.15)" : "#eaffff", borderBottomWidth: 0 }]}
                    onPress={() => { setGraduatedYear(item); setShowYearModal(false); }}
                  >
                    <Text style={[styles.modalItemText, { color: textColor }, graduatedYear === item && styles.modalItemTextActive]}>{item}</Text>
                    {graduatedYear === item && <Ionicons name="checkmark-circle" size={20} color="#008B8B" />}
                  </TouchableOpacity>
                )}
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
  stepContainer: { flexDirection: "row", padding: 6, borderRadius: 16, marginBottom: 20 },
  stepBadge: { flex: 1, paddingVertical: 8, borderRadius: 12, alignItems: "center" },
  stepActive: { backgroundColor: "#00BFC4", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 1 },
  stepInactive: { backgroundColor: "transparent" },
  stepText: { fontSize: 11, fontWeight: "800" },
  stepTextActive: { color: "#ffffff" },
  stepTextInactive: { color: "#64748b" },
  alertBox: { flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 12, marginBottom: 16, gap: 8, borderWidth: 1 },
  alertError: { backgroundColor: "#fef2f2", borderColor: "#fecaca" },
  alertSuccess: { backgroundColor: "#f0fdf4", borderColor: "#a7f3d0" },
  alertText: { fontSize: 13, flex: 1, fontWeight: "700" },
  formGroup: { marginBottom: 10 },
  hintBadge: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, marginBottom: 16 },
  hintBadgeText: { color: "#008B8B", fontWeight: "800", fontSize: 13, textAlign: "center" },
  label: { fontSize: 13, fontWeight: "800", marginBottom: 6 },
  input: { height: 50, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, fontSize: 15 },
  inputFocused: { borderColor: "#00BFC4", borderWidth: 1.5 },
  inputError: { borderColor: "#ef4444" },
  passwordWrapper: { position: "relative" },
  eyeIcon: { position: "absolute", right: 12, top: 15 },
  errorText: { color: "#dc2626", fontSize: 12, marginTop: 4, fontWeight: "600" },
  hintText: { marginTop: 6, borderColor: "#fde68a", borderWidth: 1, color: "#92400e", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, fontSize: 12, fontWeight: "600" },
  successTextHint: { color: "#0f766e", backgroundColor: "#ccfbf1", borderColor: "#99f6e4", borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, fontSize: 12, fontWeight: "600", marginTop: 6 },
  primaryBtn: { height: 50, backgroundColor: "#008B8B", borderRadius: 14, justifyContent: "center", alignItems: "center", elevation: 2, shadowColor: "#008B8B", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 5 },
  primaryBtnText: { color: "#ffffff", fontSize: 16, fontWeight: "800" },
  secondaryBtn: { height: 50, borderWidth: 1.5, borderColor: "#00BFC4", borderRadius: 14, justifyContent: "center", alignItems: "center", paddingHorizontal: 20 },
  secondaryBtnText: { color: "#008B8B", fontSize: 15, fontWeight: "800" },
  rowBtns: { flexDirection: "row", gap: 10, marginTop: 24 },
  centerEmailText: { fontSize: 14, fontWeight: "700", textAlign: "center", marginBottom: 20 },
  otpRow: { flexDirection: "row", justifyContent: "space-between" },
  otpInput: { width: 45, height: 50, borderWidth: 1, borderRadius: 12, textAlign: "center", fontSize: 20, fontWeight: "800" },
  strengthGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 },
  strengthItem: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  strengthPass: { backgroundColor: "#ecfdf5" },
  strengthFailLight: { backgroundColor: "#f1f5f9" },
  strengthFailDark: { backgroundColor: "#334155" },
  strengthText: { fontSize: 11, fontWeight: "800" },
  strengthTextPass: { color: "#047857" },
  strengthTextFail: { color: "#94a3b8" },
  footerRow: { flexDirection: "row", justifyContent: "center", marginTop: 24 },
  footerText: { fontSize: 14, fontWeight: "600" },
  loginLink: { color: "#00BFC4", fontSize: 14, fontWeight: "800" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: "50%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: "800" },
  modalItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 14, borderBottomWidth: 1 },
  modalItemText: { fontSize: 16, fontWeight: "600" },
  modalItemTextActive: { color: "#008B8B", fontWeight: "800" },
});