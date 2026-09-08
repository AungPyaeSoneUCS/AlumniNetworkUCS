import React from "react";
import { View, Pressable, Text, StyleSheet, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppContext } from "../context/AppContext";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

interface TabDescriptor {
  name: keyof typeof Ionicons.glyphMap;
  label: string;
  route: string;
}

const TABS: TabDescriptor[] = [
  { name: "newspaper", label: "Feeds", route: "Feeds" },
  { name: "people", label: "Directory", route: "Directory" },
  { name: "briefcase", label: "Jobs", route: "Jobs" },
  { name: "chatbubbles", label: "Messages", route: "Messages" },
  { name: "person", label: "Profile", route: "Profile" },
];

const INACTIVE_COLOR_LIGHT = "#1C1C1E";
const INACTIVE_COLOR_DARK = "#8E8E93";

export default function GlassTabBar({
  state,
  descriptors,
  navigation,
}: any) {
  const insets = useSafeAreaInsets();
  const { isDarkMode } = useAppContext();

  const brand = isDarkMode ? "#00BFC4" : "#008B8B";
  const activePillBg = isDarkMode ? "rgba(0,191,196,0.22)" : "rgba(0,139,139,0.16)";
  const inactiveColor = isDarkMode ? INACTIVE_COLOR_DARK : INACTIVE_COLOR_LIGHT;
  const pillBg = isDarkMode ? "#1E293B" : "#ffffff";
  const pillBorder = isDarkMode ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.9)";

  return (
    <View
      style={[
        styles.wrapper,
        { paddingBottom: Math.max(insets.bottom, 10) },
      ]}
      pointerEvents="box-none"
    >
      <View style={[styles.pill, { backgroundColor: pillBg, borderColor: pillBorder }]}>
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const tab = TABS[index];
          const label = options.tabBarLabel !== undefined
            ? options.tabBarLabel as string
            : tab.label;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const iconName: IconName = isFocused
            ? tab.name
            : ((tab.name + "-outline") as IconName);

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              style={styles.tab}
              android_ripple={{ color: "transparent" }}
            >
              <View style={styles.iconWrap}>
                {isFocused && (
                  <View style={[styles.pillow, { backgroundColor: activePillBg }]} />
                )}
                <Ionicons
                  name={iconName}
                  size={isFocused ? 24 : 21}
                  color={isFocused ? brand : inactiveColor}
                  style={{ zIndex: 1 }}
                />
              </View>
              <Text
                style={[
                  styles.label,
                  { color: isFocused ? brand : inactiveColor },
                ]}
                numberOfLines={1}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingHorizontal: 16,
    paddingTop: 8,
    zIndex: 10,
    elevation: 10,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    width: "100%",
    maxWidth: 480,
    borderRadius: 40,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    overflow: Platform.OS === "android" ? "hidden" : "visible",
    shadowColor: "#000000",
    shadowOpacity: 0.15,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 2,
  },
  iconWrap: {
    width: 48,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  pillow: {
    position: "absolute",
    width: 48,
    height: 34,
    borderRadius: 17,
  },
  label: {
    fontSize: 10,
    fontWeight: "800",
    marginTop: 1,
  },
});
