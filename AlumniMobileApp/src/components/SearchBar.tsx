import React from "react";
import { View, TextInput, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useAppContext } from "../context/AppContext";
import { getColors } from "../theme/colors";

interface SearchBarProps {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  containerStyle?: any;
}

export default function SearchBar({ placeholder, value, onChangeText, containerStyle }: SearchBarProps) {
  const { isDarkMode } = useAppContext();
  const colors = getColors(isDarkMode);

  return (
    <View style={[styles.container, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }, containerStyle]}>
      <Feather name="search" size={16} color={colors.subText} style={styles.icon} />
      <TextInput
        style={[styles.input, { color: colors.text }]}
        placeholder={placeholder}
        placeholderTextColor={isDarkMode ? "#64748b" : "#94a3b8"}
        value={value}
        onChangeText={onChangeText}
        autoCapitalize="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: "row", alignItems: "center", borderRadius: 12, paddingHorizontal: 12, borderWidth: 1 },
  icon: { marginRight: 8 },
  input: { flex: 1, paddingVertical: 10, fontSize: 14, fontWeight: "600" },
});
