// file: src/screens/ForgotPasswordScreen.tsx
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
  Animated,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import api from "../services/api";

// 1. IMPORT GLOBAL CONTEXT
import { useAppContext } from "../context/AppContext";

type Lang = "en" | "mm";
type Step = "email" | "otp" | "password" | "success";

const OTP_LENGTH = 6;

// ----------------------------------------------------
// TRANSLATION STORE
// ----------------------------------------------------
const translations = {
  en: {
    heroTitle: "Forgot Password",
    heroSubtitle: "Reset your Alumni Network password securely using OTP verification.",
    step1: "Email",
    step2: "OTP",
    step3: "Password",
    step4: "Success",
    email: "Email",
    newPassword: "New Password",
    confirmPassword: "Confirm Password",
    sendOtp: "Send OTP",
    sending: "Sending...",
    verifyOtp: "Verify OTP",
    resetBtn: "Reset Password",
    resetting: "Resetting...",
    back: "Back",
    backToLogin: "Back to login",
    login: "Login",
    emailHint: "Enter your email to receive OTP.",
    otpHint: "Enter the 6-digit OTP sent to your email.",
    passwordHint: "Enter your new password.",
    successTitle: "Password Reset",
    successDesc: "Your password has been successfully reset. Please login again.",
    invalidEmail: "Invalid email format. (e.g. example@gmail.com)",
    otpInvalid: "OTP must be 6 digits.",
    passwordMismatch: "Passwords do not match.",
    passwordMatched: "Passwords match.",
    weakPassword: "Password needs at least 3 types: uppercase, lowercase, number, or symbol.",
    uppercase: "Uppercase",
    lowercase: "Lowercase",
    number: "Number",
    symbol: "Symbol",
  },
  mm: {
    heroTitle: "စကားဝှက် ပြန်သတ်မှတ်ရန်",
    heroSubtitle: "သင့် Email သို့ OTP ပို့ပြီး စကားဝှက်အသစ် ပြန်သတ်မှတ်နိုင်ပါသည်။",
    step1: "Email",
    step2: "OTP",
    step3: "Password",
    step4: "Success",
    email: "အီးမေးလ်",
    newPassword: "စကားဝှက်အသစ်",
    confirmPassword: "စကားဝှက် အတည်ပြု",
    sendOtp: "OTP ပို့မည်",
    sending: "ပို့နေသည်...",
    verifyOtp: "OTP စစ်မည်",
    resetBtn: "စကားဝှက် ပြန်သတ်မှတ်မည်",
    resetting: "ပြောင်းနေသည်...",
    back: "နောက်သို့",
    backToLogin: "ဝင်ရန် ပြန်သွားမည်",
    login: "ဝင်မည်",
    emailHint: "သင့် Email ထည့်ပြီး OTP ရယူပါ။",
    otpHint: "သင့် Email သို့ ပို့ထားသော OTP ၆ လုံးကို ထည့်ပါ။",
    passwordHint: "စကားဝှက်အသစ် ထည့်ပါ။",
    successTitle: "စကားဝှက် ပြောင်းပြီးပါပြီ",
    successDesc: "Login page သို့ ပြန်သွားပါ။",
    invalidEmail: "Email format မမှန်ပါ။ (ဥပမာ- example@gmail.com)",
    otpInvalid: "OTP သည် ဂဏန်း ၆ လုံး ဖြစ်ရမည်။",
    passwordMismatch: "စကားဝှက် မတူပါ။",
    passwordMatched: "စကားဝှက် တူညီပါသည်။",
    weakPassword: "စကားဝှက်တွင် အနည်းဆုံး ၃ မျိုး ပါရမည်။",
    uppercase: "အကြီးစာလုံး",
    lowercase: "အသေးစာလုံး",
    number: "နံပါတ်",
    symbol: "Symbol",
  },
};

// --- Validation Helpers ---
const getEmailError = (email: string, t: any) => {
  const value = email.trim();
  if (!value) return "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return t.invalidEmail;
  return "";
};

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

export default function ForgotPasswordScreen({ navigation }: any) {
  // 2. EXTRACT GLOBAL STATE
  const { lang, setLang, isDarkMode, toggleTheme } = useAppContext();
  const t = translations[lang];

  const [step, setStep] = useState<Step>("email");

  // Input States
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const otpRefs = useRef<Array<TextInput | null>>([]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // UI States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const [touched, setTouched] = useState({
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

  // Auto-clear messages
  useEffect(() => {
    if (!message && !error) return;
    const timer = setTimeout(() => {
      setMessage("");
      setError("");
    }, 3500);
    return () => clearTimeout(timer);
  }, [message, error]);

  const resetStatus = () => {
    setMessage("");
    setError("");
  };

  // --- Handlers ---
  const handleSendOtp = async () => {
    resetStatus();
    setTouched((p) => ({ ...p, email: true }));

    const emailErr = getEmailError(email, t);
    if (emailErr) return setError(emailErr);

    setLoading(true);
    try {
      const res = await api.post("/forgot-password/send-otp", {
        email: email.trim().toLowerCase(),
      });
      if (res.data) {
        setOtp(Array(OTP_LENGTH).fill(""));
        setStep("otp");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtpLocal = () => {
    resetStatus();
    if (otp.join("").length !== OTP_LENGTH) return setError(t.otpInvalid);
    setStep("password");
  };

  const handleResetPassword = async () => {
    resetStatus();
    setTouched({ email: true, password: true, confirmPassword: true });

    const strength = getPasswordStrength(newPassword);
    if (newPassword.length < 8 || strength.passedCount < 3) return setError(t.weakPassword);
    if (newPassword !== confirmPassword) return setError(t.passwordMismatch);

    setLoading(true);
    try {
      const res = await api.post("/forgot-password/reset", {
        email: email.trim().toLowerCase(),
        otp: otp.join(""),
        password: newPassword,
      });

      if (res.data) {
        setStep("success");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (val: string, index: number) => {
    const next = [...otp];
    next[index] = val.replace(/\D/g, "").slice(-1);
    setOtp(next);
    if (val && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  // Derived variables
  const emailError = touched.email && getEmailError(email, t);
  const strength = getPasswordStrength(newPassword);
  const isPasswordValid = newPassword.length >= 8 && strength.passedCount >= 3;
  const passwordError = touched.password && newPassword && !isPasswordValid;
  const confirmError = touched.confirmPassword && confirmPassword && newPassword !== confirmPassword;
  
  const activeStepIndex = step === "email" ? 0 : step === "otp" ? 1 : step === "password" ? 2 : 3;

  // Dynamic Styles based on Theme
  const textColor = isDarkMode ? "#ffffff" : "#0f172a";
  const cardBg = isDarkMode ? "#1e293b" : "#ffffff";
  const cardBorder = isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)";
  const inputBg = isDarkMode ? "#334155" : "#f8fafc";
  const inputBorder = isDarkMode ? "#475569" : "#e2e8f0";
  const inputColor = isDarkMode ? "#f8fafc" : "#0f172a";

  return (
    <View style={styles.root}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

      {/* --- ANIMATED BACKGROUND GRADIENTS --- */}
      {/* Light Mode Gradient */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: themeAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }]}>
        <LinearGradient colors={["#eaffff", "#f1f5f9"]} style={StyleSheet.absoluteFill} />
      </Animated.View>
      
      {/* Dark Mode Gradient */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: themeAnim }]}>
        <LinearGradient colors={["#0f172a", "#1e293b"]} style={StyleSheet.absoluteFill} />
      </Animated.View>

      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            
            {/* Top Bar with Back, Theme Toggle, and Language */}
            <View style={styles.topBar}>
              <TouchableOpacity style={[styles.iconBtn, { backgroundColor: isDarkMode ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.05)" }]} onPress={() => navigation.goBack()}>
                <Ionicons name="arrow-back" size={22} color={textColor} />
              </TouchableOpacity>

              <View style={styles.topBarRight}>
                {/* Day / Night Animated Toggle */}
                <TouchableOpacity style={[styles.iconBtn, { backgroundColor: isDarkMode ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.05)", marginRight: 10 }]} onPress={toggleTheme}>
                  <Ionicons name={isDarkMode ? "moon" : "sunny"} size={20} color={isDarkMode ? "#f1cd72" : "#f59e0b"} />
                </TouchableOpacity>

                <TouchableOpacity style={[styles.langToggle, { backgroundColor: isDarkMode ? "rgba(255,255,255,0.15)" : "rgba(0,139,139,0.1)" }]} onPress={() => setLang(lang === "en" ? "mm" : "en")}>
                  <Ionicons name="globe-outline" size={16} color={isDarkMode ? "#00BFC4" : "#008B8B"} />
                  <Text style={[styles.langText, { color: isDarkMode ? "#ffffff" : "#008B8B" }]}>{lang === "en" ? "MM" : "EN"}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Hero Branding */}
            <View style={styles.heroWrapper}>
              <Text style={styles.heroGoldText}>{t.heroTitle}</Text>
              <Text style={[styles.heroSubtitle, { color: isDarkMode ? "#cbd5e1" : "#475569" }]}>{t.heroSubtitle}</Text>
            </View>

            {/* Form Container */}
            <View style={[styles.formCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              
              {/* Step Indicators */}
              {step !== "success" && (
                <View style={[styles.stepContainer, { backgroundColor: isDarkMode ? "rgba(0,191,196,0.1)" : "#eaffff" }]}>
                  {[t.step1, t.step2, t.step3].map((label, index) => (
                    <View key={label} style={[styles.stepBadge, activeStepIndex >= index ? styles.stepActive : styles.stepInactive]}>
                      <Text style={[styles.stepText, activeStepIndex >= index ? styles.stepTextActive : [styles.stepTextInactive, { color: isDarkMode ? "#94a3b8" : "#64748b" }]]}>
                        {label}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Error / Success Messages */}
              {error || message ? (
                <View style={[styles.alertBox, error ? styles.alertError : styles.alertSuccess]}>
                  <Ionicons name={error ? "alert-circle" : "checkmark-circle"} size={18} color={error ? "#b91c1c" : "#0f766e"} />
                  <Text style={[styles.alertText, error ? { color: "#b91c1c" } : { color: "#0f766e" }]}>{error || message}</Text>
                </View>
              ) : null}

              {/* STEP 1: EMAIL */}
              {step === "email" && (
                <View style={styles.formGroup}>
                  <View style={[styles.hintBadge, { backgroundColor: isDarkMode ? "rgba(0,139,139,0.15)" : "#eaffff" }]}>
                    <Text style={styles.hintBadgeText}>{t.emailHint}</Text>
                  </View>

                  <Text style={[styles.label, { color: textColor }]}>{t.email}</Text>
                  <TextInput
                    style={[
                      styles.input,
                      { backgroundColor: inputBg, borderColor: inputBorder, color: inputColor },
                      focusedField === "email" && styles.inputFocused,
                      !!emailError && styles.inputError
                    ]}
                    placeholder="example@gmail.com"
                    placeholderTextColor={isDarkMode ? "#64748b" : "#94a3b8"}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                    onFocus={() => setFocusedField("email")}
                    onBlur={() => { setFocusedField(null); setTouched((p) => ({ ...p, email: true })); }}
                  />
                  {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

                  <TouchableOpacity style={[styles.primaryBtn, { marginTop: 24 }]} onPress={handleSendOtp} disabled={loading}>
                    {loading ? <ActivityIndicator color="#ffffff" size="small" /> : <Text style={styles.primaryBtnText}>{t.sendOtp}</Text>}
                  </TouchableOpacity>
                </View>
              )}

              {/* STEP 2: OTP */}
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
                    <TouchableOpacity style={[styles.secondaryBtn, { backgroundColor: isDarkMode ? "#1e293b" : "#ffffff" }]} onPress={() => { resetStatus(); setStep("email"); }}>
                      <Text style={styles.secondaryBtnText}>{t.back}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.primaryBtn, { flex: 1 }, otp.join("").length !== OTP_LENGTH && { opacity: 0.6 }]} 
                      onPress={handleVerifyOtpLocal} 
                      disabled={otp.join("").length !== OTP_LENGTH}
                    >
                      <Text style={styles.primaryBtnText}>{t.verifyOtp}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* STEP 3: NEW PASSWORD */}
              {step === "password" && (
                <View style={styles.formGroup}>
                  <View style={[styles.hintBadge, { backgroundColor: isDarkMode ? "rgba(0,139,139,0.15)" : "#eaffff" }]}>
                    <Text style={styles.hintBadgeText}>{t.passwordHint}</Text>
                  </View>

                  <Text style={[styles.label, { color: textColor }]}>{t.newPassword}</Text>
                  <View style={styles.passwordWrapper}>
                    <TextInput
                      style={[
                        styles.input, { paddingRight: 45 },
                        { backgroundColor: inputBg, borderColor: inputBorder, color: inputColor },
                        focusedField === "newPassword" && styles.inputFocused,
                        !!passwordError && styles.inputError
                      ]}
                      placeholder="Enter new password"
                      placeholderTextColor={isDarkMode ? "#64748b" : "#94a3b8"}
                      secureTextEntry={!showPassword}
                      value={newPassword}
                      onChangeText={setNewPassword}
                      onFocus={() => setFocusedField("newPassword")}
                      onBlur={() => { setFocusedField(null); setTouched((p) => ({ ...p, password: true })); }}
                    />
                    <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowPassword(!showPassword)}>
                      <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#64748b" />
                    </TouchableOpacity>
                  </View>
                  {passwordError ? <Text style={styles.errorText}>{t.weakPassword}</Text> : null}

                  {/* Password Strength UI */}
                  {focusedField === "newPassword" && newPassword.length > 0 && !isPasswordValid && (
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
                        styles.input, { paddingRight: 45 },
                        { backgroundColor: inputBg, borderColor: inputBorder, color: inputColor },
                        focusedField === "confirmPassword" && styles.inputFocused,
                        !!confirmError && styles.inputError
                      ]}
                      placeholder="Confirm new password"
                      placeholderTextColor={isDarkMode ? "#64748b" : "#94a3b8"}
                      secureTextEntry={!showConfirm}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      onFocus={() => setFocusedField("confirmPassword")}
                      onBlur={() => { setFocusedField(null); setTouched((p) => ({ ...p, confirmPassword: true })); }}
                    />
                    <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowConfirm(!showConfirm)}>
                      <Ionicons name={showConfirm ? "eye-off-outline" : "eye-outline"} size={20} color="#64748b" />
                    </TouchableOpacity>
                  </View>
                  {confirmError ? <Text style={styles.errorText}>{t.passwordMismatch}</Text> : null}
                  {confirmPassword && !confirmError && newPassword === confirmPassword && (
                    <Text style={styles.successTextHint}>{t.passwordMatched}</Text>
                  )}

                  <View style={styles.rowBtns}>
                    <TouchableOpacity style={[styles.secondaryBtn, { backgroundColor: isDarkMode ? "#1e293b" : "#ffffff" }]} onPress={() => { resetStatus(); setStep("otp"); }}>
                      <Text style={styles.secondaryBtnText}>{t.back}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.primaryBtn, { flex: 1 }, (!isPasswordValid || confirmPassword !== newPassword) && { opacity: 0.5 }]} 
                      onPress={handleResetPassword} 
                      disabled={loading || !isPasswordValid || confirmPassword !== newPassword}
                    >
                      {loading ? <ActivityIndicator color="#ffffff" size="small" /> : <Text style={styles.primaryBtnText}>{t.resetBtn}</Text>}
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* STEP 4: SUCCESS */}
              {step === "success" && (
                <View style={styles.successContainer}>
                  <View style={styles.successCircle}>
                    <Feather name="check-circle" size={40} color="#059669" />
                  </View>
                  <Text style={[styles.successTitle, { color: textColor }]}>{t.successTitle}</Text>
                  <Text style={[styles.successDesc, { color: isDarkMode ? "#cbd5e1" : "#64748b" }]}>{t.successDesc}</Text>

                  <TouchableOpacity 
                    style={[styles.primaryBtn, { width: "100%", marginTop: 24 }]} 
                    onPress={() => navigation.replace("Login")}
                  >
                    <Text style={styles.primaryBtnText}>{t.login}</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Footer */}
              {step !== "success" && (
                <TouchableOpacity style={styles.footerRow} onPress={() => navigation.navigate("Login")}>
                  <Text style={styles.loginLink}>{t.backToLogin}</Text>
                </TouchableOpacity>
              )}

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
  eyeIcon: { position: "absolute", right: 12, top: 15 },
  errorText: { color: "#dc2626", fontSize: 12, marginTop: 4, fontWeight: "600" },
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
  successContainer: { alignItems: "center", paddingVertical: 20 },
  successCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: "#d1fae5", justifyContent: "center", alignItems: "center", marginBottom: 20 },
  successTitle: { fontSize: 24, fontWeight: "900", marginBottom: 8 },
  successDesc: { fontSize: 14, textAlign: "center", lineHeight: 22 },
  footerRow: { flexDirection: "row", justifyContent: "center", marginTop: 24 },
  loginLink: { color: "#00BFC4", fontSize: 14, fontWeight: "800" },
});