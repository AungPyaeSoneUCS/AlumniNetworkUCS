import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { useAppContext } from "../context/AppContext";
import { getColors } from "../theme/colors";

export default function LangToggle() {
  const { lang, setLang, isDarkMode } = useAppContext();
  const colors = getColors(isDarkMode);

  return (
    <TouchableOpacity
      style={[styles.btn, { backgroundColor: colors.actionBg }]}
      onPress={() => setLang(lang === "en" ? "mm" : "en")}
    >
      <Text style={[styles.text, { color: isDarkMode ? "#ffffff" : "#008B8B" }]}>
        {lang === "en" ? "MM" : "EN"}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  text: { fontSize: 12, fontWeight: "800" },
});
