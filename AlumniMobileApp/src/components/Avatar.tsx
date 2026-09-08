import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { DOMAIN } from "../theme/colors";

interface UserLike {
  _id?: string;
  name?: string;
  image?: string;
  profileImage?: string;
  googleImage?: string;
  googleProfileImage?: string;
}

interface AvatarProps {
  user?: UserLike | null;
  uri?: string | null;
  name?: string;
  size?: number;
  borderRadius?: number;
  fallbackBg?: string;
}

export function resolveImageUrl(user: UserLike | null | undefined, overrideUri?: string | null): string | null {
  if (overrideUri) return overrideUri;
  if (!user) return null;
  const imgName = user.profileImage || user.image || user.googleImage || user.googleProfileImage;
  if (!imgName || imgName.trim() === "") return null;
  const cleanPath = imgName.trim();
  if (cleanPath.startsWith("http")) return cleanPath;
  if (cleanPath.startsWith("/uploads/")) return `${DOMAIN}${cleanPath}`;
  if (cleanPath.startsWith("uploads/")) return `${DOMAIN}/${cleanPath}`;
  if (cleanPath.startsWith("/photo/")) return `${DOMAIN}/uploads${cleanPath}`;
  if (cleanPath.startsWith("photo/")) return `${DOMAIN}/uploads/${cleanPath}`;
  if (user._id) return `${DOMAIN}/uploads/photo/${user._id}/profile/${cleanPath}`;
  return `${DOMAIN}/uploads/${cleanPath}`;
}

export default function Avatar({
  user,
  uri,
  name,
  size = 44,
  borderRadius,
  fallbackBg = "#008B8B",
}: AvatarProps) {
  const [error, setError] = React.useState(false);
  const imgUrl = !error ? resolveImageUrl(user, uri) : null;
  const initial = (name || user?.name || "U").charAt(0).toUpperCase();
  const radius = borderRadius ?? size / 2;

  if (imgUrl) {
    return (
      <Image
        source={{ uri: imgUrl }}
        style={{ width: size, height: size, borderRadius: radius, backgroundColor: "#e2e8f0" }}
        contentFit="cover"
        cachePolicy="memory-disk"
        transition={200}
        onError={() => setError(true)}
      />
    );
  }

  return (
    <View
      style={[
        styles.placeholder,
        { width: size, height: size, borderRadius: radius, backgroundColor: fallbackBg },
      ]}
    >
      <Text style={[styles.letter, { fontSize: size * 0.45 }]}>{initial}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: { justifyContent: "center", alignItems: "center" },
  letter: { color: "#ffffff", fontWeight: "bold" },
});
