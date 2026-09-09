// file: src/screens/MessagesScreen.tsx
import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Keyboard,
  RefreshControl,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, Feather } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import { Image } from "expo-image";
import api from "../services/api";
import { useAppContext } from "../context/AppContext";
import { subscribeChat, RealtimeMessage } from "../services/realtime";
import { ScreenHeader, SearchBar, EmptyState, Avatar, GradientBackground } from "../components";

type Lang = "en" | "mm";

const DOMAIN = "https://alumni.ucsh.edu.mm";

// The custom GlassTabBar floats absolutely over the screen bottom and its pill
// sits ~79px above the bottom inset. Chat footer must clear it when this screen
// is rendered inside the Tab navigator (the only real usage).
const TAB_BAR_CLEARANCE = 90;

const translations = {
  en: {
    title: "Messages",
    subtitle: "Realtime alumni chats",
    searchPlaceholder: "Search alumni...",
    noAlumni: "No alumni found",
    startChat: "Start your conversation with",
    noMessagesYet: "No messages yet",
    typeMessage: "Type a message...",
    adminRestricted: "Direct messaging to Administrator accounts is not permitted.",
    edit: "Edit",
    delete: "Delete",
    cancel: "Cancel",
    deleteConfirm: "Are you sure you want to delete this message?",
    deletedMessage: "This message was deleted.",
    sessionExpired: "Session Expired",
    loginAgain: "Please log in again to continue.",
    edited: "(edited)",
    today: "Today",
    yesterday: "Yesterday",
    unknown: "Unknown Alumni",
    cancelEdit: "Cancel Edit",
  },
  mm: {
    title: "မက်ဆေ့ချ်များ",
    subtitle: "ကျောင်းသားဟောင်းများနှင့် စကားပြောရန်",
    searchPlaceholder: "နာမည် ရှာရန်...",
    noAlumni: "ကျောင်းသားဟောင်း မတွေ့ပါ",
    startChat: "စကားပြောဆိုမှု စတင်ရန်",
    noMessagesYet: "မက်ဆေ့ချ် မရှိသေးပါ",
    typeMessage: "မက်ဆေ့ချ် ရေးပါ...",
    adminRestricted: "Admin အကောင့်များသို့ တိုက်ရိုက် မက်ဆေ့ချ်ပို့ခွင့် မရှိပါ။",
    edit: "ပြင်ဆင်မည်",
    delete: "ဖျက်မည်",
    cancel: "မလုပ်တော့ပါ",
    deleteConfirm: "ဒီမက်ဆေ့ချ်ကို ဖျက်မှာ သေချာပါသလား?",
    deletedMessage: "ဤမက်ဆေ့ချ်ကို ဖျက်လိုက်ပါသည်။",
    sessionExpired: "Session သက်တမ်းကုန်သွားပါပြီ",
    loginAgain: "ဆက်လုပ်ရန် ကျေးဇူးပြု၍ ပြန်လည်ဝင်ရောက်ပါ။",
    edited: "(ပြင်ဆင်ပြီး)",
    today: "ယနေ့",
    yesterday: "မနေ့က",
    unknown: "အမည်မသိ",
    cancelEdit: "ပြင်ဆင်မှု ဖျက်သိမ်းမည်",
  },
};

interface UserInfo {
  _id: string;
  name?: string;
  email?: string;
  role?: string;
  image?: string;
  profileImage?: string;
  googleImage?: string;
  googleProfileImage?: string;
  department?: string;
  graduatedYear?: number | string | null;
}

interface Message {
  _id: string;
  text: string;
  isDeleted?: boolean;
  isEdited?: boolean;
  deletedBy?: string;
  seen?: boolean;
  createdAt?: string;
  updatedAt?: string;
  sender: UserInfo;
  receiver: UserInfo;
}

const getImageUrl = (user?: UserInfo | null) => {
  if (!user) return null;
  const imgName = user.profileImage || user.image || user.googleImage || user.googleProfileImage;
  if (!imgName || imgName.trim() === "") return null;
  const cleanPath = imgName.trim();
  if (cleanPath.startsWith("http")) return cleanPath;
  if (cleanPath.startsWith("/uploads/")) return `${DOMAIN}${cleanPath}`;
  if (cleanPath.startsWith("/photo/")) return `${DOMAIN}/uploads${cleanPath}`;
  return `${DOMAIN}/uploads/photo/${user._id}/profile/${cleanPath}`;
};

function isSameDay(a?: string, b?: string) {
  if (!a || !b) return false;
  const d1 = new Date(a);
  const d2 = new Date(b);
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
}

function formatDateLabel(dateString?: string, t?: any) {
  if (!dateString) return "";
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (isSameDay(dateString, today.toISOString())) return t.today;
  if (isSameDay(dateString, yesterday.toISOString())) return t.yesterday;

  return new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatTime(value?: string) {
  if (!value) return "";
  return new Date(value).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export default function MessagesScreen({ navigation, route }: any) {
  const { lang, setLang, isDarkMode, toggleTheme } = useAppContext();
  const insets = useSafeAreaInsets();
  const t = translations[lang as Lang];

  // While the keyboard is open it already covers the floating GlassTabBar, so
  // the tab clearance is only needed when the keyboard is hidden. This keeps a
  // tight gap between the keyboard and the input row while typing.
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  // True when this screen is mounted inside the bottom Tab navigator (its
  // navigation has a parent). The standalone Stack "Messages" screen has none.
  const isInsideTabNavigator = !!navigation?.getParent?.();
  const tabClearance = keyboardVisible ? 0 : isInsideTabNavigator ? TAB_BAR_CLEARANCE : 0;
  const footerPaddingBottom = tabClearance + Math.max(insets.bottom, 10);

  const [me, setMe] = useState<UserInfo | null>(null);
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserInfo | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [search, setSearch] = useState("");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [refreshingUsers, setRefreshingUsers] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const flatListRef = useRef<FlatList>(null);

  // Keyboard visibility: while it is open it already covers the floating tab bar.
  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener("keyboardDidHide", () => setKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Auth check & init
  useEffect(() => {
    async function init() {
      try {
        const session = await SecureStore.getItemAsync("user_session");
        if (!session) {
          navigation.reset({ index: 0, routes: [{ name: "Welcome" }] });
          return;
        }
        setMe(JSON.parse(session));
      } catch (err) {
        console.error("Auth check failed:", err);
      }
    }
    init();
  }, [navigation]);

  // Fetch Directory/Users
  const loadUsers = useCallback(
    async (isRefreshing = false) => {
      if (isRefreshing) setRefreshingUsers(true);
      else setLoadingUsers(true);

      try {
        const res = await api.get("/users");
        const list: UserInfo[] = Array.isArray(res.data) ? res.data : res.data?.data || [];
        setUsers(list);

        // Auto-select recipient if navigated via route params
        if (route?.params?.userId && !selectedUser) {
          const targetUser = list.find((u) => String(u._id) === String(route.params.userId));
          if (targetUser) {
            setSelectedUser(targetUser);
          }
        }
      } catch (error: any) {
        if (error?.response?.status === 401) {
          await SecureStore.deleteItemAsync("user_session");
          Alert.alert(t.sessionExpired, t.loginAgain);
          navigation.reset({ index: 0, routes: [{ name: "Welcome" }] });
        }
      } finally {
        setLoadingUsers(false);
        setRefreshingUsers(false);
      }
    },
    [route?.params?.userId, selectedUser, navigation, t]
  );

  useEffect(() => {
    if (me?._id) loadUsers();
  }, [me?._id, loadUsers]);

  // Fetch Chat Messages
  const loadMessages = useCallback(
    async (userId: string, silent = false) => {
      if (!silent) setLoadingChat(true);
      try {
        const res = await api.get(`/messages/${userId}`);
        const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
        setMessages(data);
      } catch (error: any) {
        console.error("Failed to load messages:", error);
        if (error?.response?.status === 401) {
          await SecureStore.deleteItemAsync("user_session");
          Alert.alert(t.sessionExpired, t.loginAgain);
          navigation.reset({ index: 0, routes: [{ name: "Welcome" }] });
        }
      } finally {
        if (!silent) {
          setLoadingChat(false);
          setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 100);
        }
      }
    },
    [navigation, t]
  );

  // Real-time message sync via Pusher (replaces polling)
  useEffect(() => {
    if (!selectedUser?._id) return;
    loadMessages(selectedUser._id);

    // Subscribe to the chat channel for this conversation
    const unsubscribe = subscribeChat(selectedUser._id, (incoming: RealtimeMessage) => {
      setMessages((prev) => {
        // Ignore messages not part of this conversation
        const otherUserId =
          typeof incoming.sender === "object" ? incoming.sender?._id : null;
        if (
          otherUserId &&
          String(otherUserId) !== String(selectedUser._id) &&
          String(otherUserId) !== String(me?._id)
        ) {
          return prev;
        }

        // Merge/replace the message by id (handles new, edit, delete, reaction)
        const exists = prev.some((m: any) => String(m._id) === String(incoming._id));
        if (exists) {
          return prev.map((m: any) =>
            String(m._id) === String(incoming._id) ? { ...m, ...incoming } : m
          );
        }

        const newMessage: Message = incoming as unknown as Message;
        return [...prev, newMessage];
      });

      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    });

    return () => unsubscribe();
  }, [selectedUser?._id, loadMessages, me?._id]);

  const handleSelectUser = (user: UserInfo) => {
    setSelectedUser(user);
    setMessages([]);
    setEditingId(null);
    setEditText("");
    setText("");
  };

  const handleBackToList = () => {
    setSelectedUser(null);
    setMessages([]);
    setText("");
    setEditingId(null);
    Keyboard.dismiss();
  };

  const sendMessage = async () => {
    if (!text.trim() || !selectedUser || sending) return;

    if (selectedUser?.role?.toLowerCase() === "admin") {
      Alert.alert("Restricted", t.adminRestricted);
      return;
    }

    const messageText = text.trim();
    setText("");
    setSending(true);

    try {
      const res = await api.post("/messages/send", {
        receiverId: selectedUser._id,
        text: messageText,
      });

      if (res.data) {
        await loadMessages(selectedUser._id, true);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      } else {
        setText(messageText);
      }
    } catch (err: any) {
      Alert.alert("Error", "Failed to send message");
      setText(messageText);
    } finally {
      setSending(false);
    }
  };

  const handleLongPressMessage = (msg: Message) => {
    if (String(msg.sender?._id || msg.sender) !== String(me?._id) || msg.isDeleted) return;

    Alert.alert("Message Options", "Choose an action", [
      {
        text: t.edit,
        onPress: () => {
          setEditingId(msg._id);
          setEditText(msg.text);
        },
      },
      { text: t.delete, style: "destructive", onPress: () => deleteMessage(msg._id) },
      { text: t.cancel, style: "cancel" },
    ]);
  };

  const commitEdit = async () => {
    if (!editText.trim() || !editingId || !selectedUser) return;
    try {
      const res = await api.patch(`/messages/${selectedUser._id}`, {
        messageId: editingId,
        newText: editText.trim(),
      });
      if (res.data) {
        setMessages((prev) =>
          prev.map((m) => (m._id === editingId ? { ...m, text: editText.trim(), isEdited: true } : m))
        );
        setEditingId(null);
      }
    } catch (err) {
      Alert.alert("Error", "Failed to edit message");
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (!selectedUser) return;
    Alert.alert(t.delete, t.deleteConfirm, [
      { text: t.cancel, style: "cancel" },
      {
        text: t.delete,
        style: "destructive",
        onPress: async () => {
          try {
            const res = await api.delete(`/messages/${selectedUser._id}?messageId=${messageId}`);
            if (res.data) {
              const deleterName = me?.name || "User";
              setMessages((prev) =>
                prev.map((m) =>
                  m._id === messageId
                    ? { ...m, isDeleted: true, deletedBy: deleterName, text: t.deletedMessage }
                    : m
                )
              );
            }
          } catch (err) {
            Alert.alert("Error", "Failed to delete message");
          }
        },
      },
    ]);
  };

  const filteredUsers = useMemo(() => {
    return users
      .filter((user) => String(user._id) !== String(me?._id))
      .filter((user) => user?.role?.toLowerCase() !== "admin" && user?.role?.toLowerCase() !== "staff")
      .filter((user) =>
        [user.name, user.email, user.department].join(" ").toLowerCase().includes(search.toLowerCase())
      );
  }, [users, me?._id, search]);

  const groupedMessages = useMemo(() => {
    return messages.map((message, index) => {
      const previous = messages[index - 1];
      return {
        message,
        showDate: !previous || !isSameDay(previous.createdAt, message.createdAt),
      };
    });
  }, [messages]);

  const isRestrictedAdminChat =
    selectedUser?.role?.toLowerCase() === "admin" && me?.role?.toLowerCase() !== "admin";

  // Dynamic Theme Colors
  const textColor = isDarkMode ? "#ffffff" : "#0f172a";
  const subTextColor = isDarkMode ? "#94a3b8" : "#64748b";
  const cardBg = isDarkMode ? "#1e293b" : "#ffffff";
  const cardBorder = isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)";
  const inputBg = isDarkMode ? "#334155" : "#f8fafc";
  const inputBorder = isDarkMode ? "#475569" : "#e2e8f0";
  const actionBg = isDarkMode ? "rgba(255,255,255,0.15)" : "rgba(0,139,139,0.1)";

  // --- RENDER USER DIRECTORY LIST ---
  const renderUserList = () => (
    <View style={styles.flex1}>
      <ScreenHeader
        title={t.title}
        subtitle={t.subtitle}
        icon="chatbubbles"
      />

      <View style={styles.searchWrapper}>
        <SearchBar
          placeholder={t.searchPlaceholder}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {loadingUsers ? (
        <ActivityIndicator size="large" color="#008B8B" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.userListContent}
          refreshControl={
            <RefreshControl refreshing={refreshingUsers} onRefresh={() => loadUsers(true)} tintColor="#008B8B" />
          }
          ListEmptyComponent={
            <EmptyState icon="users" message={t.noAlumni} />
          }
          renderItem={({ item }) => {
            return (
              <TouchableOpacity
                style={[styles.userCard, { backgroundColor: cardBg, borderColor: cardBorder }]}
                onPress={() => handleSelectUser(item)}
              >
                <Avatar user={item} size={46} />
                <View style={styles.userInfo}>
                  <Text style={[styles.userName, { color: textColor }]}>{item.name || t.unknown}</Text>
                  <Text style={[styles.userMeta, { color: subTextColor }]}>
                    {item.department || "Alumni"} {item.graduatedYear ? `• ${item.graduatedYear}` : ""}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={subTextColor} />
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );

  // --- RENDER ACTIVE CHAT ROOM ---
  const renderChatRoom = () => {
    const avatarUrl = getImageUrl(selectedUser);

    return (
      <KeyboardAvoidingView
        style={styles.flex1}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        {/* Header */}
        <View style={[styles.chatHeader, { backgroundColor: cardBg, borderBottomColor: cardBorder }]}>
          <TouchableOpacity style={styles.backBtn} onPress={handleBackToList}>
            <Ionicons name="arrow-back" size={24} color={textColor} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.chatHeaderInfo}
            onPress={() => navigation.navigate("AlumniDetail", { userId: selectedUser?._id })}
          >
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.chatHeaderAvatar} contentFit="cover" cachePolicy="memory-disk" />
            ) : (
              <View style={[styles.chatHeaderAvatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarLetter}>{selectedUser?.name ? selectedUser.name.charAt(0).toUpperCase() : "U"}</Text>
              </View>
            )}
            <View style={styles.flex1}>
              <Text style={[styles.chatHeaderName, { color: textColor }]} numberOfLines={1}>
                {selectedUser?.name || t.unknown}
              </Text>
              <Text style={[styles.chatHeaderMeta, { color: subTextColor }]} numberOfLines={1}>
                {selectedUser?.department || "Alumni"} {selectedUser?.graduatedYear ? `• ${selectedUser.graduatedYear}` : ""}
              </Text>
            </View>
            <Feather name="info" size={20} color={subTextColor} style={{ marginLeft: 10 }} />
          </TouchableOpacity>
        </View>

        {/* Message Feed */}
        {loadingChat ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#008B8B" />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={groupedMessages}
            keyExtractor={(item, index) => item.message._id + index}
            style={styles.flex1}
            contentContainerStyle={[styles.chatListContent, { flexGrow: 1 }]}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
            ListEmptyComponent={
              <View style={styles.centerContainer}>
                <View style={[styles.emptyChatCircle, { backgroundColor: inputBg }]}>
                  <Feather name="send" size={28} color={subTextColor} />
                </View>
                <Text style={[styles.emptyChatTitle, { color: textColor }]}>{t.noMessagesYet}</Text>
                <Text style={[styles.emptyChatSubtitle, { color: subTextColor }]}>
                  {t.startChat} {selectedUser?.name || t.unknown}.
                </Text>
              </View>
            }
            renderItem={({ item }) => {
              const { message, showDate } = item;
              const senderId = typeof message.sender === "object" ? message.sender?._id : message.sender;
              const isMine = String(senderId) === String(me?._id);
              const isEditingThis = editingId === message._id;
              const msgAvatar = typeof message.sender === "object" ? getImageUrl(message.sender) : null;

              return (
                <View>
                  {showDate && (
                    <View style={styles.dateLabelContainer}>
                      <Text
                        style={[
                          styles.dateLabelText,
                          { backgroundColor: cardBg, color: subTextColor, borderColor: cardBorder },
                        ]}
                      >
                        {formatDateLabel(message.createdAt, t)}
                      </Text>
                    </View>
                  )}

                  <View style={[styles.messageRow, isMine ? styles.messageRowRight : styles.messageRowLeft]}>
                    {!isMine && (
                      msgAvatar ? (
                        <Image source={{ uri: msgAvatar }} style={styles.msgAvatar} />
                      ) : (
                        <View style={[styles.msgAvatar, styles.avatarPlaceholder]}>
                          <Text style={styles.avatarLetterSmall}>
                            {typeof message.sender === "object" && message.sender?.name ? message.sender.name.charAt(0) : "U"}
                          </Text>
                        </View>
                      )
                    )}

                    <View style={[styles.messageBubbleWrapper, isMine ? styles.messageBubbleWrapperRight : styles.messageBubbleWrapperLeft]}>
                      <Text style={styles.messageTime}>{formatTime(message.createdAt)}</Text>

                      {isEditingThis ? (
                        <View style={[styles.editBox, { backgroundColor: cardBg, borderColor: "#00BFC4" }]}>
                          <TextInput
                            style={[styles.editInput, { color: textColor }]}
                            value={editText}
                            onChangeText={setEditText}
                            autoFocus
                            multiline
                          />
                          <View style={styles.editActions}>
                            <TouchableOpacity style={[styles.editBtn, { backgroundColor: "#ef4444" }]} onPress={() => setEditingId(null)}>
                              <Feather name="x" size={14} color="#fff" />
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.editBtn, { backgroundColor: "#10b981" }]} onPress={commitEdit}>
                              <Feather name="check" size={14} color="#fff" />
                            </TouchableOpacity>
                          </View>
                        </View>
                      ) : (
                        <TouchableOpacity
                          activeOpacity={0.8}
                          onLongPress={() => handleLongPressMessage(message)}
                          style={[
                            styles.messageBubble,
                            message.isDeleted
                              ? [styles.bubbleDeleted, { backgroundColor: isDarkMode ? "#1e293b" : "#f1f5f9", borderColor: cardBorder }]
                              : isMine
                              ? styles.bubbleMine
                              : [styles.bubbleTheirs, { backgroundColor: cardBg }],
                          ]}
                        >
                          <Text
                            style={[
                              styles.messageText,
                              message.isDeleted
                                ? { color: subTextColor, fontStyle: "italic" }
                                : isMine
                                ? { color: "#ffffff" }
                                : { color: textColor },
                            ]}
                          >
                            {message.isDeleted ? t.deletedMessage : message.text}
                            {message.isEdited && !message.isDeleted && (
                              <Text style={{ fontSize: 10, fontStyle: "italic", opacity: 0.7 }}> {t.edited}</Text>
                            )}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </View>
              );
            }}
          />
        )}

        {/* Input Footer */}
        <View
          style={[
            styles.chatFooter,
            {
              backgroundColor: cardBg,
              borderTopColor: cardBorder,
              paddingBottom: footerPaddingBottom,
            },
          ]}
        >
          {isRestrictedAdminChat ? (
            <View style={styles.restrictedBox}>
              <Ionicons name="shield-checkmark" size={18} color="#b45309" />
              <Text style={styles.restrictedText}>{t.adminRestricted}</Text>
            </View>
          ) : (
            <View style={[styles.inputContainer, { backgroundColor: inputBg, borderColor: inputBorder }]}>
              <TextInput
                style={[styles.chatInput, { color: textColor }]}
                placeholder={t.typeMessage}
                placeholderTextColor={isDarkMode ? "#64748b" : "#94a3b8"}
                value={text}
                onChangeText={setText}
                multiline={false}
                maxLength={500}
              />
              <TouchableOpacity
                style={[styles.sendBtn, (!text.trim() || sending) && { opacity: 0.5 }]}
                onPress={sendMessage}
                disabled={!text.trim() || sending}
              >
                {sending ? <ActivityIndicator size="small" color="#fff" /> : <Feather name="send" size={16} color="#fff" />}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: isDarkMode ? '#1e293b' : '#f8fafc' }]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

      <GradientBackground isDarkMode={isDarkMode} />

      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        {selectedUser ? renderChatRoom() : renderUserList()}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safeArea: { flex: 1 },
  flex1: { flex: 1 },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12 },
  topBarLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  topIconBox: { width: 38, height: 38, borderRadius: 12, backgroundColor: "#008B8B", justifyContent: "center", alignItems: "center" },
  screenTitle: { fontSize: 20, fontWeight: "900" },
  screenSubtitle: { fontSize: 11, fontWeight: "700" },
  actionIconBtn: { width: 34, height: 34, borderRadius: 17, justifyContent: "center", alignItems: "center" },
  langToggle: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  topBarRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  searchWrapper: { paddingHorizontal: 16, marginBottom: 10 },
  searchBox: { flexDirection: "row", alignItems: "center", borderRadius: 12, borderWidth: 1, paddingHorizontal: 12 },
  searchInput: { flex: 1, paddingVertical: 10, paddingHorizontal: 8, fontSize: 14, fontWeight: "600" },
  userListContent: { paddingHorizontal: 16, paddingBottom: 110 },
  userCard: { flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 16, marginBottom: 10, borderWidth: 1 },
  userAvatar: { width: 46, height: 46, borderRadius: 23, marginRight: 12 },
  avatarPlaceholder: { backgroundColor: "#008B8B", justifyContent: "center", alignItems: "center" },
  avatarLetter: { color: "#ffffff", fontSize: 18, fontWeight: "bold" },
  avatarLetterSmall: { color: "#ffffff", fontSize: 12, fontWeight: "bold" },
  userInfo: { flex: 1 },
  userName: { fontSize: 15, fontWeight: "800", marginBottom: 2 },
  userMeta: { fontSize: 12, fontWeight: "600" },
  emptyContainer: { alignItems: "center", marginTop: 40 },
  emptyText: { fontSize: 14, fontWeight: "700" },

  // Chat Room Styles
  chatHeader: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 10, borderBottomWidth: 1 },
  backBtn: { padding: 8, marginRight: 4 },
  chatHeaderInfo: { flex: 1, flexDirection: "row", alignItems: "center" },
  chatHeaderAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  chatHeaderName: { fontSize: 16, fontWeight: "800" },
  chatHeaderMeta: { fontSize: 11, fontWeight: "600", marginTop: 2 },
  chatListContent: { padding: 16, paddingBottom: 20 },
  emptyChatCircle: { width: 64, height: 64, borderRadius: 32, justifyContent: "center", alignItems: "center", marginBottom: 16 },
  emptyChatTitle: { fontSize: 18, fontWeight: "900", marginBottom: 6 },
  emptyChatSubtitle: { fontSize: 13, fontWeight: "600" },
  dateLabelContainer: { alignItems: "center", marginVertical: 16 },
  dateLabelText: { fontSize: 10, fontWeight: "800", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, borderWidth: 1, overflow: "hidden" },
  messageRow: { flexDirection: "row", alignItems: "flex-end", marginBottom: 12 },
  messageRowRight: { justifyContent: "flex-end" },
  messageRowLeft: { justifyContent: "flex-start" },
  msgAvatar: { width: 28, height: 28, borderRadius: 14, marginRight: 8 },
  messageBubbleWrapper: { maxWidth: "75%" },
  messageBubbleWrapperRight: { alignItems: "flex-end" },
  messageBubbleWrapperLeft: { alignItems: "flex-start" },
  messageTime: { fontSize: 10, color: "#94a3b8", fontWeight: "700", marginBottom: 4, paddingHorizontal: 4 },
  messageBubble: { paddingHorizontal: 14, paddingVertical: 10 },
  bubbleMine: { backgroundColor: "#008B8B", borderTopLeftRadius: 18, borderTopRightRadius: 18, borderBottomLeftRadius: 18, borderBottomRightRadius: 4 },
  bubbleTheirs: { borderTopLeftRadius: 18, borderTopRightRadius: 18, borderBottomRightRadius: 18, borderBottomLeftRadius: 4 },
  bubbleDeleted: { borderWidth: 1, borderTopLeftRadius: 18, borderTopRightRadius: 18, borderRadius: 18 },
  messageText: { fontSize: 14, lineHeight: 20, fontWeight: "500" },
  chatFooter: { padding: 10, borderTopWidth: 1 },
  inputContainer: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, minHeight: 48 },
  chatInput: { flex: 1, fontSize: 14, paddingVertical: 8, paddingRight: 8, textAlignVertical: "center" },
  sendBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#008B8B", justifyContent: "center", alignItems: "center", marginLeft: 4 },
  restrictedBox: { flexDirection: "row", alignItems: "center", backgroundColor: "#fef3c7", padding: 12, borderRadius: 12, gap: 8 },
  restrictedText: { flex: 1, fontSize: 12, fontWeight: "800", color: "#92400e" },
  editBox: { borderWidth: 1, borderRadius: 12, padding: 8, width: 220 },
  editInput: { minHeight: 40, fontSize: 13, marginBottom: 8 },
  editActions: { flexDirection: "row", justifyContent: "flex-end", gap: 8 },
  editBtn: { padding: 6, borderRadius: 8 },
});