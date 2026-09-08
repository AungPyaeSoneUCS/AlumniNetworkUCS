// file: src/screens/WelcomeScreen.tsx
import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  Animated,
  Dimensions,
  GestureResponderEvent,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../services/api";

// 1. IMPORT THE GLOBAL CONTEXT
import { useAppContext } from "../context/AppContext"; 

const { width, height } = Dimensions.get("window");

type Lang = "en" | "mm";

// ----------------------------------------------------
// TRANSLATION STORE
// ----------------------------------------------------
const translations = {
  en: {
    badge: "Alumni Network",
    line1: "University of Computer Studies (Hinthada)",
    line2: "Alumni Network",
    sub1: "• Connecting Alumni",
    sub2: "• Sharing Knowledge",
    sub3: "• Inspiring Innovation",
    slogan: "Together \n       Building \n                Myanmar's \n                         Digital Future",
    login: "Alumni Login",
    register: "New Alumni Register",
    forgot: "Forgot Password?",
    loadingSession: "Checking session...",
    connecting: "Connecting to server...",
    downloading: "Downloading alumni data...",
    offlineMode: "Offline. Loading local data...",
    retryBtn: "Retry Connection",
    fatalError: "Cannot reach server and no local data found. Please check your internet.",
  },
  mm: {
    badge: "ကျောင်းသားဟောင်းများ ကွန်ရက်",
    line1: "ကွန်ပျူတာတက္ကသိုလ် (ဟင်္သာတ)",
    line2: "ကျောင်းသားဟောင်းများ ကွန်ရက်",
    sub1: "• ကျောင်းသားဟောင်းများ ချိတ်ဆက်ခြင်း",
    sub2: "• အသိပညာ မျှဝေခြင်း",
    sub3: "• နည်းပညာ တိုးတက်မှု အားပေးခြင်း",
    slogan: "မြန်မာ့ဒစ်ဂျစ်တယ် အနာဂတ်ကို အတူတကွ တည်ဆောက်ကြမယ်",
    login: "အကောင့် ဝင်မယ်",
    register: "အကောင့် ဖွင့်မယ်",
    forgot: "စကားဝှက် မေ့နေပါသလား?",
    loadingSession: "Session စစ်ဆေးနေသည်...",
    connecting: "ဆာဗာနှင့် ချိတ်ဆက်နေသည်...",
    downloading: "Data ဒေါင်းလုဒ်ဆွဲနေသည်...",
    offlineMode: "အင်တာနက်မရှိပါ။ Local data ဖွင့်နေပါသည်...",
    retryBtn: "ပြန်လည်ကြိုးစားမည်",
    fatalError: "ဆာဗာချိတ်ဆက်၍မရပါ။ Local data လည်းမရှိပါ။ အင်တာနက်စစ်ဆေးပါ။",
  },
};

// ----------------------------------------------------
// COMPONENT: FLOATING TOUCH BUBBLE
// ----------------------------------------------------
const FloatingTouchBubble = ({ x, y, onComplete }: { x: number; y: number; onComplete: () => void }) => {
  const animation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animation, { toValue: 1, duration: 800, useNativeDriver: true }).start(() => onComplete());
  }, [animation, onComplete]);

  const translateY = animation.interpolate({ inputRange: [0, 1], outputRange: [0, -120] });
  const opacity = animation.interpolate({ inputRange: [0, 0.7, 1], outputRange: [0.6, 0.6, 0] });
  const scale = animation.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1.5] });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.touchBubble,
        { left: x - 20, top: y - 20, opacity, transform: [{ translateY }, { scale }] },
      ]}
    />
  );
};

// ----------------------------------------------------
// MAIN COMPONENT
// ----------------------------------------------------
export default function WelcomeScreen({ navigation }: any) {
  // 3. EXTRACT GLOBAL STATE
  const { lang, setLang, isDarkMode, toggleTheme } = useAppContext();
  
  const [isChecking, setIsChecking] = useState(true);
  const [loadingStatusText, setLoadingStatusText] = useState("");
  const [fatalError, setFatalError] = useState("");
  const [touchBubbles, setTouchBubbles] = useState<{ id: string; x: number; y: number }[]>([]);

  const t = translations[lang];

  // Theme Animation
  const themeAnim = useRef(new Animated.Value(isDarkMode ? 1 : 0)).current; 

  // Continuous Background Bubble Animations
  const bgFloatAnim1 = useRef(new Animated.Value(0)).current;
  const bgFloatAnim2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(bgFloatAnim1, { toValue: 1, duration: 6000, useNativeDriver: true }),
      Animated.timing(bgFloatAnim1, { toValue: 0, duration: 6000, useNativeDriver: true }),
    ])).start();
    Animated.loop(Animated.sequence([
      Animated.timing(bgFloatAnim2, { toValue: 1, duration: 8000, useNativeDriver: true }),
      Animated.timing(bgFloatAnim2, { toValue: 0, duration: 8000, useNativeDriver: true }),
    ])).start();
  }, [bgFloatAnim1, bgFloatAnim2]);

  // Sync animation when the global theme changes
  useEffect(() => {
    Animated.timing(themeAnim, { toValue: isDarkMode ? 1 : 0, duration: 500, useNativeDriver: true }).start();
  }, [isDarkMode, themeAnim]);

  // --- SMART BOOTLOADER: FETCH & CACHE ---
  const initializeApp = async () => {
    try {
      setIsChecking(true);
      setFatalError("");
      setLoadingStatusText(t.loadingSession);
      
      // Give the UI thread a moment to mount before running heavy native bridge calls
      await new Promise((resolve) => setTimeout(resolve, 600));

      const session = await SecureStore.getItemAsync("user_session");
      if (session) {
        const parsedUser = JSON.parse(session);
        if (parsedUser && parsedUser._id) {
          
          setLoadingStatusText(t.connecting);
          try {
            // 1. Try to connect to server and fetch new directory data
            const res = await api.get('/users', { timeout: 6000 });
            setLoadingStatusText(t.downloading);
            
            // 2. Save the new data locally as a JSON string
            if (res.data) {
              const dataToSave = Array.isArray(res.data) ? res.data : res.data.data;
              await AsyncStorage.setItem('cached_alumni_data', JSON.stringify(dataToSave));
            }
            
            // 3. Move to main app
            navigation.replace("MainTabs");
            return;

          } catch (netErr) {
            // 4. Server Offline: Fallback to local JSON file
            setLoadingStatusText(t.offlineMode);
            let localData = await AsyncStorage.getItem('cached_alumni_data');
            
            // --- INJECT PRESET DATA IF CACHE IS EMPTY ---
            if (!localData) {
              console.log("No cache found. Injecting preset bundled JSON safely...");
              try {
                // Safely require the file at runtime instead of top-level import
                const presetAlumniData = require("../../assets/alumni_preset.json");
                await AsyncStorage.setItem('cached_alumni_data', JSON.stringify(presetAlumniData));
                localData = JSON.stringify(presetAlumniData);
              } catch (requireErr) {
                console.warn("Failed to load bundled preset JSON.", requireErr);
              }
            }
            
            if (localData) {
              // We have offline data (either cached previously or from the preset)! Let them in.
              setTimeout(() => navigation.replace("MainTabs"), 1200);
              return;
            } else {
              // Completely offline and no local data found (fallback failed)
              setFatalError(t.fatalError);
              return;
            }
          }
        }
      }
      // No session found, show welcome screen
      setIsChecking(false);
    } catch (error) {
      console.log("Initialization skipped or offline.", error);
      setIsChecking(false);
    }
  };

  useEffect(() => {
    initializeApp();
  }, []);

  const handleTouch = (event: GestureResponderEvent) => {
    const { pageX, pageY } = event.nativeEvent;
    const newBubble = { id: Date.now().toString() + Math.random().toString(), x: pageX, y: pageY };
    setTouchBubbles((prev) => [...prev, newBubble]);
  };

  if (isChecking || fatalError) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: isDarkMode ? "#0f172a" : "#f8fafc" }]}>
        <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
        
        {fatalError ? (
          <View style={{ alignItems: 'center', padding: 30 }}>
            <Ionicons name="cloud-offline" size={60} color="#ef4444" style={{ marginBottom: 20 }} />
            <Text style={[styles.fatalErrorText, { color: isDarkMode ? "#f8fafc" : "#0f172a" }]}>{fatalError}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={initializeApp}>
              <Text style={styles.retryBtnText}>{t.retryBtn}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <ActivityIndicator size="large" color="#00BFC4" />
            <Text style={styles.loadingText}>{loadingStatusText}</Text>
          </>
        )}
      </View>
    );
  }

  // Dynamic Theme Colors
  const textColor = isDarkMode ? "#03ff9a" : "#62ff00";
  const subTextColor = isDarkMode ? "#03ff9a" : "#bffe00";
  const btnBg = isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)";
  const btnBorder = isDarkMode ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)";

  return (
    <View style={styles.root} onTouchStart={handleTouch}>
      <StatusBar barStyle="light-content" />

      {/* --- BACKGROUND LAYER: LIGHT MODE --- */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { opacity: themeAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) },
        ]}
      >
        <LinearGradient
          colors={["#3B82F6", "#8B5CF6", "#EC4899"]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.1, y: 0.1 }}
          end={{ x: 0.9, y: 0.9 }}
        />
      </Animated.View>

      {/* --- BACKGROUND LAYER: DARK MODE --- */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: themeAnim }]}>
        <LinearGradient
          colors={["#1E293B", "#0F172A", "#1E293B"]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      {/* --- CONTINUOUS ANIMATED GEOMETRIC BUBBLES --- */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Animated.View 
          style={[
            styles.bubble, 
            styles.bubble1, 
            {
              transform: [
                { translateY: bgFloatAnim1.interpolate({ inputRange: [0, 1], outputRange: [0, 40] }) },
                { translateX: bgFloatAnim1.interpolate({ inputRange: [0, 1], outputRange: [0, -20] }) }
              ]
            }
          ]} 
        />
        <Animated.View 
          style={[
            styles.bubble, 
            styles.bubble2,
            {
              transform: [
                { translateY: bgFloatAnim2.interpolate({ inputRange: [0, 1], outputRange: [0, -50] }) },
                { scale: bgFloatAnim2.interpolate({ inputRange: [0, 1], outputRange: [1, 1.05] }) }
              ]
            }
          ]} 
        />
        <Animated.View 
          style={[
            styles.bubble, 
            styles.bubble3,
            {
              transform: [
                { translateY: bgFloatAnim1.interpolate({ inputRange: [0, 1], outputRange: [0, -30] }) },
                { translateX: bgFloatAnim2.interpolate({ inputRange: [0, 1], outputRange: [0, 30] }) }
              ]
            }
          ]} 
        />
      </View>

      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <View style={styles.mainContainer}>
          
          {/* --- TOP BAR --- */}
          <View style={styles.topBar}>
            <View style={[styles.badgeContainer, { backgroundColor: btnBg, borderColor: btnBorder }]}>
              <Text style={[styles.badgeText, { color: textColor }]}>{t.badge}</Text>
            </View>
            
            <View style={styles.topBarRight}>
              {/* Theme Toggle (Uses Global Context) */}
              <TouchableOpacity 
                style={[styles.iconBtn, { backgroundColor: isDarkMode ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.3)", marginRight: 10 }]} 
                onPress={toggleTheme}
                activeOpacity={0.7}
              >
                <Ionicons name={isDarkMode ? "moon" : "sunny"} size={18} color={isDarkMode ? "#f1cd72" : "#f59e0b"} />
              </TouchableOpacity>

              {/* Language Toggle (Uses Global Context) */}
              <TouchableOpacity 
                style={[styles.langToggle, { backgroundColor: isDarkMode ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.3)" }]} 
                onPress={() => setLang(lang === "en" ? "mm" : "en")}
                activeOpacity={0.7}
              >
                <Ionicons name="globe-outline" size={16} color={isDarkMode ? "#00BFC4" : "#ffffff"} />
                <Text style={[styles.langText, { color: "#ffffff" }]}>{lang === "en" ? "MM" : "EN"}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* --- HERO SECTION --- */}
          <View style={styles.heroContainer}>
            <Text style={styles.heroGoldText}>{t.line1}</Text>
            <Text style={[styles.heroWhiteText]}>{t.line2}</Text>

            <View style={styles.featuresList}>
              <Text style={[styles.featureItem, { color: subTextColor }]}>{t.sub1}</Text>
              <Text style={[styles.featureItem, { color: subTextColor }]}>{t.sub2}</Text>
              <Text style={[styles.featureItem, { color: subTextColor }]}>{t.sub3}</Text>
            </View>

            <Text style={styles.sloganText}>{t.slogan}</Text>
          </View>

          <View style={styles.spacer} />

          {/* --- ACTION BUTTONS --- */}
          <View style={styles.actionContainer}>
            
            <TouchableOpacity 
              style={styles.registerBtn} 
              onPress={() => navigation.navigate("Register")}
              activeOpacity={0.8}
            >
              <Text style={styles.registerBtnText}>{t.register}</Text>
              <Feather name="arrow-right" size={18} color="#0f172a" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.loginBtn, { backgroundColor: btnBg, borderColor: btnBorder }]} 
              onPress={() => navigation.navigate("Login")}
              activeOpacity={0.8}
            >
              <Ionicons name="log-in-outline" size={20} color={textColor} />
              <Text style={[styles.loginBtnText, { color: textColor }]}>{t.login}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.forgotBtn} 
              onPress={() => navigation.navigate("ForgotPassword")}
            >
              <Text style={[styles.forgotBtnText, { color: isDarkMode ? "#00BFC4" : "#ffffff" }]}>{t.forgot}</Text>
            </TouchableOpacity>

          </View>
          
        </View>
      </SafeAreaView>

      {/* --- RENDER TOUCH BUBBLES --- */}
      {touchBubbles.map((bubble) => (
        <FloatingTouchBubble
          key={bubble.id}
          x={bubble.x}
          y={bubble.y}
          onComplete={() => {
            setTouchBubbles((prev) => prev.filter((b) => b.id !== bubble.id));
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safeArea: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 14,
    color: "#00BFC4",
    fontSize: 16,
    fontWeight: "bold",
  },
  fatalErrorText: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 24
  },
  retryBtn: {
    backgroundColor: "#00BFC4",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryBtnText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
  },
  mainContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 16,
    justifyContent: "space-between", 
  },
  bubble: {
    position: "absolute",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 999,
  },
  bubble1: {
    width: width * 0.8,
    height: width * 0.8,
    top: -width * 0.15,
    right: -width * 0.2,
  },
  bubble2: {
    width: width * 1.1,
    height: width * 1.1,
    bottom: -width * 0.4,
    left: -width * 0.4,
  },
  bubble3: {
    width: width * 0.6,
    height: width * 0.6,
    top: height * 0.4,
    right: -width * 0.2,
  },
  touchBubble: {
    position: "absolute",
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.8)",
    shadowColor: "#fff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 5,
    zIndex: 9999,
  },
  topBar: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    marginTop: 10,
    marginBottom: 20 
  },
  badgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  badgeText: { 
    fontSize: 11, 
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
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
    gap: 4 
  },
  langText: { 
    fontSize: 13, 
    fontWeight: "800" 
  },
  spacer: {
    flex: 1,
  },
  heroContainer: {
    marginVertical: 20,
  },
  heroGoldText: { 
    fontSize: 32, 
    fontWeight: "900", 
    color: "#00BFC4",
    lineHeight: 38,
  },
  heroWhiteText: { 
    fontSize: 34, 
    fontWeight: "900", 
    color: "#f1cd72",
    marginTop: 4,
  },
  featuresList: {
    marginTop: 24,
    gap: 8,
  },
  featureItem: {
    fontSize: 19,
    fontWeight: "700",
  },
  sloganText: {
    fontSize: 20,
    fontWeight: "900",
    color: "#f1cd72",
    marginTop: 32,
    lineHeight: 30,
  },
  actionContainer: {
    marginTop: 20,
    marginBottom: 20,
    gap: 16,
  },
  registerBtn: {
    flexDirection: "row",
    height: 56,
    backgroundColor: "#f1cd72",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    elevation: 4,
    shadowColor: "#f1cd72",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  registerBtnText: {
    color: "#0f172a",
    fontSize: 16,
    fontWeight: "900",
  },
  loginBtn: {
    flexDirection: "row",
    height: 56,
    borderWidth: 1,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  loginBtnText: {
    fontSize: 16,
    fontWeight: "800",
  },
  forgotBtn: {
    alignItems: "center",
    paddingVertical: 10,
    marginTop: 4,
  },
  forgotBtnText: {
    fontSize: 14,
    fontWeight: "700",
  },
});