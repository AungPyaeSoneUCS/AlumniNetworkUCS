import type { ColorValue } from "react-native";

export interface AppColors {
  text: string;
  subText: string;
  cardBg: string;
  cardBorder: string;
  inputBg: string;
  inputBorder: string;
  actionBg: string;
  actionBtnBg: string;
  brand: string;
  brandLight: string;
  danger: string;
  success: string;
  warning: string;
  lightText: string;
  surface: string;
}

export function getColors(isDarkMode: boolean): AppColors {
  return isDarkMode
    ? {
        text: "#ffffff",
        subText: "#94a3b8",
        cardBg: "#1e293b",
        cardBorder: "rgba(255,255,255,0.1)",
        inputBg: "#334155",
        inputBorder: "#475569",
        actionBg: "rgba(255,255,255,0.15)",
        actionBtnBg: "rgba(255,255,255,0.05)",
        brand: "#00BFC4",
        brandLight: "rgba(0,191,196,0.15)",
        danger: "#ef4444",
        success: "#10b981",
        warning: "#f1cd72",
        lightText: "#e2e8f0",
        surface: "#0f172a",
      }
    : {
        text: "#0f172a",
        subText: "#64748b",
        cardBg: "#ffffff",
        cardBorder: "rgba(0,0,0,0.05)",
        inputBg: "#f8fafc",
        inputBorder: "#e2e8f0",
        actionBg: "rgba(0,139,139,0.1)",
        actionBtnBg: "#f8fafc",
        brand: "#008B8B",
        brandLight: "#eaffff",
        danger: "#ef4444",
        success: "#10b981",
        warning: "#f59e0b",
        lightText: "#334155",
        surface: "#f8fafc",
      };
}

export const DOMAIN = "https://alumni.ucsh.edu.mm";
export const CARDS_LIGHT: readonly [ColorValue, ColorValue, ...ColorValue[]] = ["#eaffff", "#f8fafc"];
export const CARDS_DARK: readonly [ColorValue, ColorValue, ...ColorValue[]] = ["#0f172a", "#1e293b"];
