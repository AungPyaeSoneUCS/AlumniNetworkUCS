// file: src/services/notifications.ts
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import api from "./api";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    return null;
  }

  if (Constants.appOwnership === "expo") {
    console.log("[Push] Skipping registration: push notifications are not supported in Expo Go.");
    return null;
  }

  let token: string | null = null;

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      return null;
    }

    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) {
      return null;
    }

    const data = await Notifications.getExpoPushTokenAsync({ projectId });
    token = data.data;

    if (Platform.OS === "android") {
      Notifications.setNotificationChannelAsync("default", {
        name: "Default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#008B8B",
      });
    }

    await sendPushTokenToBackend(token);
  } catch (error) {
    console.error("[Push] Failed to get token:", error);
  }

  return token;
}

async function sendPushTokenToBackend(token: string) {
  try {
    const session = await SecureStore.getItemAsync("user_session");
    if (!session) return;
    const user = JSON.parse(session);
    await api.post("/notifications/register-push", {
      userId: user._id,
      expoPushToken: token,
      platform: Platform.OS,
    });
  } catch (error) {
    console.error("[Push] Failed to register token:", error);
  }
}

export function addNotificationResponseListener(
  handler: (response: Notifications.NotificationResponse) => void
) {
  return Notifications.addNotificationResponseReceivedListener(handler);
}

export function addNotificationReceivedListener(
  handler: (notification: Notifications.Notification) => void
) {
  return Notifications.addNotificationReceivedListener(handler);
}
