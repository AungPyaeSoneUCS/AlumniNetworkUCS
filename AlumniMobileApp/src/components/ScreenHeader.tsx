import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../hooks/useTheme";

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  children?: React.ReactNode;
}

export function ScreenHeader({ title, subtitle, icon, children }: ScreenHeaderProps) {
  const colors = useTheme();
  return (
    <View style={styles.topBar}>
      <View style={styles.left}>
        {icon && (
          <View style={styles.iconBox}>
            <Ionicons name={icon} size={20} color="#ffffff" />
          </View>
        )}
        <View>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          {subtitle ? <Text style={[styles.subtitle, { color: colors.subText }]}>{subtitle}</Text> : null}
        </View>
      </View>
      <View style={styles.right}>
        {children}
      </View>
    </View>
  );
}

export function ActionIconButton({
  icon,
  color,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  color?: string;
  onPress: () => void;
}) {
  const colors = useTheme();
  return (
    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.actionBg }]} onPress={onPress}>
      <Ionicons name={icon} size={16} color={color || colors.text} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12 },
  left: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconBox: { width: 38, height: 38, borderRadius: 12, backgroundColor: "#008B8B", justifyContent: "center", alignItems: "center" },
  title: { fontSize: 20, fontWeight: "900" },
  subtitle: { fontSize: 11, fontWeight: "700" },
  right: { flexDirection: "row", alignItems: "center", gap: 8 },
  actionBtn: { width: 34, height: 34, borderRadius: 17, justifyContent: "center", alignItems: "center" },
});
