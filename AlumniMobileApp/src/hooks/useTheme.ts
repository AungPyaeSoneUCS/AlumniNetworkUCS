import React from "react";
import { useAppContext } from "../context/AppContext";
import { getColors, AppColors } from "../theme/colors";

export function useTheme(): AppColors {
  const { isDarkMode } = useAppContext();
  return getColors(isDarkMode);
}
