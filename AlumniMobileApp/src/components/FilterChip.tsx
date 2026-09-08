import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { useAppContext } from "../context/AppContext";
import { getColors } from "../theme/colors";

interface FilterChipProps {
  label: string;
  active: boolean;
  onPress: () => void;
}

export default function FilterChip({ label, active, onPress }: FilterChipProps) {
  const { isDarkMode } = useAppContext();
  const colors = getColors(isDarkMode);

  return (
    <TouchableOpacity
      style={[
        styles.chip,
        { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
        active && styles.chipActive,
      ]}
      onPress={onPress}
    >
      <Text style={[styles.text, { color: colors.subText }, active && styles.textActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  chipActive: { backgroundColor: "#008B8B", borderColor: "#008B8B" },
  text: { fontSize: 13, fontWeight: "700" },
  textActive: { color: "#ffffff" },
});
