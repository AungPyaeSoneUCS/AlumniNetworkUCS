import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAppContext } from "../context/AppContext";
import { getColors } from "../theme/colors";

export default function ThemeToggle() {
  const { isDarkMode, toggleTheme } = useAppContext();
  const colors = getColors(isDarkMode);

  return (
    <TouchableOpacity style={[styles.btn, { backgroundColor: colors.actionBg }]} onPress={toggleTheme}>
      <Ionicons
        name={isDarkMode ? "moon" : "sunny"}
        size={16}
        color={isDarkMode ? "#f1cd72" : "#f59e0b"}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: { width: 34, height: 34, borderRadius: 17, justifyContent: "center", alignItems: "center" },
});
