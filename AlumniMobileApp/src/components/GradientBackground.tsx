import React, { useRef, useEffect } from "react";
import { Animated, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { CARDS_LIGHT, CARDS_DARK } from "../theme/colors";

interface GradientBackgroundProps {
  isDarkMode: boolean;
  duration?: number;
}

export default function GradientBackground({ isDarkMode, duration = 400 }: GradientBackgroundProps) {
  const themeAnim = useRef(new Animated.Value(isDarkMode ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(themeAnim, {
      toValue: isDarkMode ? 1 : 0,
      duration,
      useNativeDriver: true,
    }).start();
  }, [isDarkMode, duration, themeAnim]);

  return (
    <>
      <Animated.View
        style={[StyleSheet.absoluteFill, { opacity: themeAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }]}
      >
        <LinearGradient colors={CARDS_LIGHT} style={StyleSheet.absoluteFill} />
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: themeAnim }]}>
        <LinearGradient colors={CARDS_DARK} style={StyleSheet.absoluteFill} />
      </Animated.View>
    </>
  );
}
