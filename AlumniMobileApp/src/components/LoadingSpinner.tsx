import React from "react";
import { ActivityIndicator, StyleSheet } from "react-native";

interface LoadingSpinnerProps {
  size?: "small" | "large";
  color?: string;
  marginTop?: number;
}

export default function LoadingSpinner({ size = "large", color = "#008B8B", marginTop = 40 }: LoadingSpinnerProps) {
  return <ActivityIndicator size={size} color={color} style={{ marginTop }} />;
}
