import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { useAppContext } from "../context/AppContext";
import { getColors } from "../theme/colors";

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
}

export default function Card({ children, style }: CardProps) {
  const { isDarkMode } = useAppContext();
  const colors = getColors(isDarkMode);

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.cardBg, borderColor: colors.cardBorder },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 14,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    borderWidth: 1,
  },
});
