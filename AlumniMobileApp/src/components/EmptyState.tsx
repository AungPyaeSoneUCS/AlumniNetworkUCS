import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useAppContext } from "../context/AppContext";
import { getColors } from "../theme/colors";

interface EmptyStateProps {
  icon: keyof typeof Feather.glyphMap;
  message: string;
  iconSize?: number;
}

export default function EmptyState({ icon, message, iconSize = 36 }: EmptyStateProps) {
  const { isDarkMode } = useAppContext();
  const colors = getColors(isDarkMode);

  return (
    <View style={styles.container}>
      <Feather name={icon} size={iconSize} color={colors.subText} style={styles.icon} />
      <Text style={[styles.text, { color: colors.subText }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center", justifyContent: "center", marginTop: 40 },
  icon: { marginBottom: 10 },
  text: { fontSize: 14, fontWeight: "700", textAlign: "center" },
});
