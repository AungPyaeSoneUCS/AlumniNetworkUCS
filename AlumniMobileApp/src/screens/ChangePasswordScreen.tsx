// file: src/screens/ChangePasswordScreen.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Alert,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { userApi } from "../services/api";
import { useAppContext } from "../context/AppContext";
import { GradientBackground, ScreenHeader, Card, useTheme } from "../components";

const translations = {
  en: {
    title: "Change Password",
    currentPassword: "Current Password",
    currentPlaceholder: "Enter your current password",
    newPassword: "New Password",
    newPlaceholder: "Enter a new password",
    confirmPassword: "Confirm New Password",
    confirmPlaceholder: "Re-enter your new password",
    submit: "Update Password",
    success: "Your password has been updated successfully.",
    mismatch: "New passwords do not match.",
    weakPassword: "Password must be at least 8 characters, with an uppercase letter, a lowercase letter, and a number.",
    goBack: "Done",
    updating: "Updating...",
  },
  mm: {
    title: "စကားဝှက် ပြောင်းရန်",
    currentPassword: "လက်ရှိ စကားဝှက်",
    currentPlaceholder: "လက်ရှိ စကားဝှက်ကို ထည့်ပါ",
    newPassword: "စကားဝှက် အသစ်",
    newPlaceholder: "စကားဝှက်အသစ် ထည့်ပါ",
    confirmPassword: "စကားဝှက်သစ် အတည်ပြုရန်",
    confirmPlaceholder: "စကားဝှက်သစ် ထပ်ထည့်ပါ",
    submit: "စကားဝှက် ပြောင်းမည်",
    success: "စကားဝှက်ကို အောင်မြင်စွာ ပြောင်းလဲပြီးပါပြီ။",
    mismatch: "စကားဝှက်သစ်များ မတူပါ။",
    weakPassword: "စကားဝှက်သည် အနည်းဆုံး စာလုံး ၈ လုံး၊ စာလုံးကြီး၊ စာလုံးငယ် နှင့် နံပါတ်တစ်ခု ပါရပါမည်။",
    goBack: "ပြီးပြီ",
    updating: "ပြောင်းလဲနေသည်...",
  },
};

export default function ChangePasswordScreen() {
  const { lang, isDarkMode } = useAppContext();
  const navigation = useNavigation<any>();
  const colors = useTheme();
  const t = translations[lang];

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isPasswordValid =
    newPassword.length >= 8 &&
    /[A-Z]/.test(newPassword) &&
    /[a-z]/.test(newPassword) &&
    /\d/.test(newPassword);

  const handleSubmit = async () => {
    if (newPassword !== confirmPassword) {
      Alert.alert(t.title, t.mismatch);
      return;
    }
    if (!isPasswordValid) {
      Alert.alert(t.title, t.weakPassword);
      return;
    }

    setSubmitting(true);
    try {
      await userApi.changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      Alert.alert(t.title, t.success, [
        { text: t.goBack, onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      const message =
        error?.response?.data?.error || error?.response?.data?.message || "Failed to change password.";
      Alert.alert(t.title, message);
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (
    label: string,
    placeholder: string,
    value: string,
    onChangeText: (v: string) => void,
    visible: boolean,
    toggleVisible: () => void,
    autoFocus?: boolean
  ) => (
    <View style={styles.fieldGroup}>
      <Text style={[styles.label, { color: colors.subText }]}>{label}</Text>
      <View style={[styles.inputWrap, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
        <TextInput
          style={[styles.input, { color: colors.text }]}
          placeholder={placeholder}
          placeholderTextColor={isDarkMode ? "#64748b" : "#94a3b8"}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={!visible}
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus={autoFocus}
        />
        <TouchableOpacity onPress={toggleVisible} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name={visible ? "eye-off-outline" : "eye-outline"} size={20} color={colors.subText} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.root}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      <GradientBackground isDarkMode={isDarkMode} />

      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <ScreenHeader title={t.title} icon="key-outline" />

        <KeyboardAvoidingView
          style={styles.keyboard}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            <Card style={styles.card}>
              {renderField(t.currentPassword, t.currentPlaceholder, currentPassword, setCurrentPassword, showCurrent, () => setShowCurrent((v) => !v))}
              {renderField(t.newPassword, t.newPlaceholder, newPassword, setNewPassword, showNew, () => setShowNew((v) => !v))}
              {renderField(t.confirmPassword, t.confirmPlaceholder, confirmPassword, setConfirmPassword, showConfirm, () => setShowConfirm((v) => !v))}

              <TouchableOpacity
                style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
                onPress={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <Ionicons name="lock-closed-outline" size={18} color="#ffffff" />
                    <Text style={styles.submitText}>{t.submit}</Text>
                  </>
                )}
              </TouchableOpacity>
            </Card>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safeArea: { flex: 1 },
  keyboard: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  card: { padding: 16, borderRadius: 18 },
  fieldGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: "700", marginBottom: 8 },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  input: { flex: 1, paddingVertical: 12, fontSize: 14 },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#008B8B",
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 8,
  },
  submitText: { color: "#ffffff", fontSize: 15, fontWeight: "800" },
});
