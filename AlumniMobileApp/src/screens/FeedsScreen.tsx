// file: src/screens/FeedsScreen.tsx
import React, { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Alert,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../services/api';

// 1. IMPORT GLOBAL CONTEXT
import { useAppContext } from "../context/AppContext";

type Category = 'General' | 'Job' | 'Event' | 'News';
type Lang = 'en' | 'mm';

const DOMAIN = 'https://alumni.ucsh.edu.mm';

// ----------------------------------------------------
// TRANSLATION STORE
// ----------------------------------------------------
const translations = {
  en: {
    title: 'Alumni Feeds',
    searchPlaceholder: 'Search posts...',
    composerPlaceholder: 'Share an update with alumni...',
    postBtn: 'Post',
    noPosts: 'No posts found.',
    editTitle: 'Edit Post',
    saveBtn: 'Save Changes',
    deleteTitle: 'Delete Post',
    deleteDesc: 'Are you sure you want to delete this post?',
    cancel: 'Cancel',
    delete: 'Delete',
    commentPlaceholder: 'Write a comment...',
    noComments: 'No comments yet.',
    liked: 'Liked',
    like: 'Like',
    comments: 'Comments',
    sessionExpired: 'Session Expired',
    loginAgain: 'Please log in again to continue.',
    imageUploadFail: 'Image upload failed. Posting without image.',
    postFail: 'Failed to create post',
    commentFail: 'Failed to add comment',
    deleteFail: 'Failed to delete post',
    updateFail: 'Failed to update post'
  },
  mm: {
    title: 'Alumni Feeds',
    searchPlaceholder: 'Post များ ရှာရန်...',
    composerPlaceholder: 'ကျောင်းသားဟောင်းများအတွက် အကြောင်းအရာ ရေးပါ...',
    postBtn: 'တင်မည်',
    noPosts: 'Post မရှိသေးပါ။',
    editTitle: 'Post ပြင်ဆင်ရန်',
    saveBtn: 'သိမ်းမည်',
    deleteTitle: 'ဖျက်မည်',
    deleteDesc: 'ဒီ post ကို ဖျက်မှာ သေချာပါသလား?',
    cancel: 'မလုပ်တော့ပါ',
    delete: 'ဖျက်မည်',
    commentPlaceholder: 'မှတ်ချက် ရေးပါ...',
    noComments: 'မှတ်ချက် မရှိသေးပါ။',
    liked: 'Liked',
    like: 'Like',
    comments: 'Comments',
    sessionExpired: 'Session သက်တမ်းကုန်သွားပါပြီ',
    loginAgain: 'ဆက်လုပ်ရန် ကျေးဇူးပြု၍ ပြန်လည်ဝင်ရောက်ပါ။',
    imageUploadFail: 'ပုံတင်၍မရပါ။ ပုံမပါဘဲ post တင်ပါမည်။',
    postFail: 'Post တင်၍မရပါ',
    commentFail: 'Comment ရေး၍မရပါ',
    deleteFail: 'Post ဖျက်၍မရပါ',
    updateFail: 'Post ပြင်၍မရပါ'
  }
};

const CATEGORIES: Category[] = ['General', 'Job', 'Event', 'News'];

const categoryLabels: Record<Lang, Record<Category | 'All', string>> = {
  en: { All: 'All', General: 'General', Job: 'Job', Event: 'Event', News: 'News' },
  mm: { All: 'အားလုံး', General: 'အထွေထွေ', Job: 'အလုပ်အကိုင်', Event: 'ပွဲအစီအစဉ်', News: 'သတင်း' },
};

interface Author {
  _id: string;
  name: string;
  image?: string;
  profileImage?: string;
  googleImage?: string;
  degree?: string;
  department?: string;
  graduatedYear?: string;
}

interface Comment {
  _id: string;
  content: string;
  createdAt?: string;
  author: Author;
}

export interface Post {
  _id: string;
  content: string;
  category: Category;
  image?: string;
  images?: string[];
  likes?: string[];
  likedByMe?: boolean;
  comments?: Comment[];
  commentsCount?: number;
  isEdited?: boolean;
  createdAt?: string;
  author: Author;
}

// --- Smart Image Resolvers ---
const getImageUrl = (url?: string, userId?: string) => {
  if (!url || url.trim() === '') return null;
  let cleanPath = url.trim();
  if (cleanPath.startsWith('http')) return cleanPath;
  if (cleanPath.startsWith('/uploads/')) return `${DOMAIN}${cleanPath}`;
  if (cleanPath.startsWith('uploads/')) return `${DOMAIN}/${cleanPath}`;
  if (cleanPath.startsWith('/photo/')) return `${DOMAIN}/uploads${cleanPath}`;
  if (cleanPath.startsWith('photo/')) return `${DOMAIN}/uploads/${cleanPath}`;
  if (userId) return `${DOMAIN}/uploads/photo/${userId}/profile/${cleanPath}`;
  return `${DOMAIN}/uploads/${cleanPath}`;
};

const getPostImageUrl = (url?: string) => {
  if (!url || url.trim() === '') return null;
  let cleanPath = url.trim();
  if (cleanPath.startsWith('http')) return cleanPath;
  if (cleanPath.startsWith('/uploads/')) return `${DOMAIN}${cleanPath}`;
  if (cleanPath.startsWith('uploads/')) return `${DOMAIN}/${cleanPath}`;
  if (cleanPath.startsWith('/photo/')) return `${DOMAIN}/uploads${cleanPath}`;
  return `${DOMAIN}${cleanPath.startsWith('/') ? '' : '/'}${cleanPath}`;
};

function timeAgo(dateString?: string) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + 'y ago';
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + 'mo ago';
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + 'd ago';
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + 'h ago';
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + 'm ago';
  return 'Just now';
}

// ----------------------------------------------------
// OPTIMIZED MEMOIZED POST COMPONENT
// ----------------------------------------------------
const FeedPostCard = memo(({ 
  item, currentUserId, lang, isDarkMode, t,
  textColor, subTextColor, cardBg, cardBorder, inputBg, inputBorder,
  onLike, onAddComment, onDelete, onEditInit, onProfilePress,
  isCommentsOpen, toggleComments, commentInput, setCommentInput, isCommenting
}: any) => {
  const [avatarError, setAvatarError] = useState(false);
  const [postImgError, setPostImgError] = useState(false);

  const isOwner = item.author?._id === currentUserId;
  const isLiked = item.likedByMe || (item.likes || []).includes(currentUserId);
  const commentsList = item.comments || [];

  const authorImg = item.author?.image || item.author?.profileImage || item.author?.googleImage;
  const avatarUrl = !avatarError ? getImageUrl(authorImg, item.author?._id) : null;
  const postImgUrl = !postImgError ? getPostImageUrl(item.image) : null;

  return (
    <View style={[styles.postCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
      <View style={styles.postHeader}>
        <TouchableOpacity style={styles.authorRow} onPress={() => onProfilePress(item.author?._id)}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} contentFit="cover" cachePolicy="memory-disk" onError={() => setAvatarError(true)} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarLetter}>{item.author?.name ? item.author.name.charAt(0).toUpperCase() : 'U'}</Text>
            </View>
          )}
          <View style={styles.authorInfo}>
            <Text style={[styles.authorName, { color: textColor }]}>{item.author?.name || 'UCSH Alumni'}</Text>
            <Text style={[styles.authorMeta, { color: subTextColor }]}>
              {item.author?.degree || 'Alumni'}
              {item.author?.graduatedYear ? ` • ${item.author.graduatedYear}` : ''}
              {item.createdAt ? ` • ${timeAgo(item.createdAt)}` : ''}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.headerRight}>
          <View style={[styles.categoryBadge, { backgroundColor: isDarkMode ? 'rgba(0,191,196,0.15)' : '#eaffff' }]}>
            <Text style={styles.categoryBadgeText}>{categoryLabels[lang as Lang][item.category as Category] || item.category}</Text>
          </View>

          {isOwner && (
            <TouchableOpacity
              style={styles.menuIcon}
              onPress={() => {
                Alert.alert('Options', 'Select action', [
                  { text: t.editTitle, onPress: () => onEditInit(item) },
                  { text: t.delete, style: 'destructive', onPress: () => onDelete(item._id) },
                  { text: t.cancel, style: 'cancel' },
                ]);
              }}
            >
              <Feather name="more-vertical" size={18} color={subTextColor} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <Text style={[styles.postBody, { color: textColor }]}>{item.content}</Text>

      {postImgUrl ? (
        <Image source={{ uri: postImgUrl }} style={styles.postImage} contentFit="cover" cachePolicy="memory-disk" onError={() => setPostImgError(true)} />
      ) : null}

      <View style={[styles.actionBar, { borderTopColor: cardBorder }]}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => onLike(item._id)}>
          <Ionicons name={isLiked ? 'heart' : 'heart-outline'} size={18} color={isLiked ? '#ef4444' : subTextColor} />
          <Text style={[styles.actionText, { color: isLiked ? '#ef4444' : subTextColor }]}>
            {(item.likes || []).length} {isLiked ? t.liked : t.like}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={() => toggleComments(item._id)}>
          <Ionicons name="chatbubble-ellipses-outline" size={18} color={subTextColor} />
          <Text style={[styles.actionText, { color: subTextColor }]}>{commentsList.length} {t.comments}</Text>
        </TouchableOpacity>
      </View>

      {isCommentsOpen && (
        <View style={[styles.commentsSection, { borderTopColor: cardBorder }]}>
          <View style={styles.commentInputRow}>
            <TextInput
              style={[styles.commentTextInput, { backgroundColor: inputBg, borderColor: inputBorder, color: textColor }]}
              placeholder={t.commentPlaceholder}
              placeholderTextColor={isDarkMode ? '#64748b' : '#94a3b8'}
              value={commentInput}
              onChangeText={(txt) => setCommentInput(item._id, txt)}
            />
            <TouchableOpacity style={styles.commentSendBtn} onPress={() => onAddComment(item._id)} disabled={isCommenting}>
              {isCommenting ? <ActivityIndicator size="small" color="#ffffff" /> : <Feather name="send" size={14} color="#ffffff" />}
            </TouchableOpacity>
          </View>

          {commentsList.length === 0 ? (
            <Text style={[styles.noCommentsText, { color: subTextColor }]}>
              {t.noComments}
            </Text>
          ) : (
            commentsList.map((c: any, i: number) => {
              const cImg = c.author?.image || c.author?.profileImage || c.author?.googleImage;
              const cAvatarUrl = getImageUrl(cImg, c.author?._id);
              return (
                <View key={c._id || i} style={[styles.commentBubble, { backgroundColor: inputBg }]}>
                  <View style={styles.commentHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      {cAvatarUrl ? (
                        <Image source={{ uri: cAvatarUrl }} style={styles.commentAvatar} contentFit="cover" cachePolicy="memory-disk" />
                      ) : (
                        <View style={[styles.commentAvatar, styles.avatarPlaceholder]}>
                          <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>
                            {c.author?.name ? c.author.name.charAt(0).toUpperCase() : 'U'}
                          </Text>
                        </View>
                      )}
                      <Text style={[styles.commentAuthorName, { color: textColor }]}>{c.author?.name || 'Alumni'}</Text>
                    </View>
                    <Text style={styles.commentTime}>{timeAgo(c.createdAt)}</Text>
                  </View>
                  <Text style={[styles.commentContentText, { color: textColor }]}>{c.content}</Text>
                </View>
              );
            })
          )}
        </View>
      )}
    </View>
  );
});

export default function FeedsScreen({ navigation }: any) {
  // 2. USE GLOBAL STATE
  const { lang, setLang, isDarkMode, toggleTheme } = useAppContext();
  const t = translations[lang];

  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const isFetchingRef = useRef(false);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('All');

  // Composer
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<Category>('General');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);

  // Edit Modal
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editCategory, setEditCategory] = useState<Category>('General');
  const [savingEdit, setSavingEdit] = useState(false);

  // Comments
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [commentingMap, setCommentingMap] = useState<Record<string, boolean>>({});

  // Theme Animation
  const themeAnim = useRef(new Animated.Value(isDarkMode ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(themeAnim, {
      toValue: isDarkMode ? 1 : 0,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [isDarkMode, themeAnim]);

  // STRICT AUTH CHECK
  useEffect(() => {
    async function enforceAuth() {
      const session = await SecureStore.getItemAsync('user_session');
      if (!session) {
        navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
      } else {
        const user = JSON.parse(session);
        setCurrentUserId(user._id || '');
      }
    }
    enforceAuth();
  }, [navigation]);

  const fetchPosts = useCallback(async (isRefresh = false) => {
    if (isFetchingRef.current) return;
    
    const session = await SecureStore.getItemAsync('user_session');
    if (!session) return;

    isFetchingRef.current = true;
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await api.get('/posts');
      const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setPosts(data);
    } catch (error: any) {
      console.error('Failed to fetch posts:', error);
      if (error?.response?.status === 401) {
        await SecureStore.deleteItemAsync('user_session');
        Alert.alert(t.sessionExpired, t.loginAgain);
        navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      isFetchingRef.current = false;
    }
  }, [navigation, t]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], 
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri: string): Promise<string | null> => {
    try {
      const formData = new FormData();
      const filename = uri.split('/').pop() || 'upload.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image/jpeg`;
      formData.append('file', { uri, name: filename, type } as any);

      const res = await api.post('/posts/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data?.url || null;
    } catch (error) {
      console.error('Image upload failed:', error);
      return null;
    }
  };

  const handleCreatePost = async () => {
    if (!newContent.trim() || posting) return;
    setPosting(true);

    try {
      let uploadedImageUrl = '';
      if (selectedImage) {
        const url = await uploadImage(selectedImage);
        if (url) uploadedImageUrl = url;
        else Alert.alert('Error', t.imageUploadFail);
      }

      const res = await api.post('/posts', {
        content: newContent,
        category: newCategory,
        image: uploadedImageUrl,
      });

      if (res.data) {
        const createdPost = res.data.data || res.data;
        setPosts((prev) => [createdPost, ...prev]);
        setNewContent('');
        setNewCategory('General');
        setSelectedImage(null);
      }
    } catch (error) {
      Alert.alert('Error', t.postFail);
    } finally {
      setPosting(false);
    }
  };

  const handleToggleLike = async (postId: string) => {
    try {
      const res = await api.patch(`/posts/${postId}/like`);
      if (res.data) {
        setPosts((prev) =>
          prev.map((post) => {
            if (post._id === postId) {
              const liked = !post.likedByMe;
              const likes = res.data.likes || (liked ? [...(post.likes || []), currentUserId] : (post.likes || []).filter((id) => id !== currentUserId));
              return { ...post, likedByMe: liked, likes };
            }
            return post;
          })
        );
      }
    } catch (error) {
      console.error('Like error:', error);
    }
  };

  const handleAddComment = async (postId: string) => {
    const text = (commentInputs[postId] || '').trim();
    if (!text) return;

    setCommentingMap((prev) => ({ ...prev, [postId]: true }));
    try {
      const res = await api.post(`/posts/${postId}/comments`, { content: text });
      if (res.data) {
        const newComment = res.data.data || res.data;
        setPosts((prev) =>
          prev.map((post) => {
            if (post._id === postId) {
              const comments = [...(post.comments || []), newComment];
              return { ...post, comments, commentsCount: comments.length };
            }
            return post;
          })
        );
        setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
      }
    } catch (error) {
      Alert.alert('Error', t.commentFail);
    } finally {
      setCommentingMap((prev) => ({ ...prev, [postId]: false }));
    }
  };

  const handleDeletePost = (postId: string) => {
    Alert.alert(
      t.deleteTitle,
      t.deleteDesc,
      [
        { text: t.cancel, style: 'cancel' },
        {
          text: t.delete, style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/posts/${postId}`);
              setPosts((prev) => prev.filter((p) => p._id !== postId));
            } catch (err) {
              Alert.alert('Error', t.deleteFail);
            }
          },
        },
      ]
    );
  };

  const handleUpdatePost = async () => {
    if (!editingPost || !editContent.trim() || savingEdit) return;
    setSavingEdit(true);

    try {
      const res = await api.put(`/posts/${editingPost._id}`, {
        content: editContent,
        category: editCategory,
      });

      const updated = res.data.data || res.data;
      setPosts((prev) => prev.map((p) => (p._id === updated._id ? { ...p, ...updated } : p)));
      setEditingPost(null);
    } catch (error) {
      Alert.alert('Error', t.updateFail);
    } finally {
      setSavingEdit(false);
    }
  };

  const filteredPosts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return posts.filter((post) => {
      const matchesSearch = query
        ? (post.content || '').toLowerCase().includes(query) || (post.author?.name || '').toLowerCase().includes(query)
        : true;
      const matchesCategory = selectedCategory === 'All' ? true : post.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [posts, search, selectedCategory]);

  const toggleComments = useCallback((postId: string) => {
    setOpenComments((prev) => ({ ...prev, [postId]: !prev[postId] }));
  }, []);

  const updateCommentInput = useCallback((postId: string, txt: string) => {
    setCommentInputs((prev) => ({ ...prev, [postId]: txt }));
  }, []);

  const navToProfile = useCallback((userId: string) => {
    navigation.navigate('AlumniDetail', { userId });
  }, [navigation]);

  const initEdit = useCallback((item: Post) => {
    setEditingPost(item);
    setEditContent(item.content);
    setEditCategory(item.category);
  }, []);

  // Theme Dynamic Colors
  const textColor = isDarkMode ? "#ffffff" : "#0f172a";
  const subTextColor = isDarkMode ? "#94a3b8" : "#64748b";
  const cardBg = isDarkMode ? "#1e293b" : "#ffffff";
  const cardBorder = isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)";
  const inputBg = isDarkMode ? "#334155" : "#f8fafc";
  const inputBorder = isDarkMode ? "#475569" : "#e2e8f0";
  const actionBg = isDarkMode ? "rgba(255,255,255,0.15)" : "rgba(0,139,139,0.1)";

  const renderItem = useCallback(({ item }: { item: Post }) => (
    <FeedPostCard 
      item={item}
      currentUserId={currentUserId}
      lang={lang}
      t={t}
      isDarkMode={isDarkMode}
      textColor={textColor}
      subTextColor={subTextColor}
      cardBg={cardBg}
      cardBorder={cardBorder}
      inputBg={inputBg}
      inputBorder={inputBorder}
      onLike={handleToggleLike}
      onAddComment={handleAddComment}
      onDelete={handleDeletePost}
      onEditInit={initEdit}
      onProfilePress={navToProfile}
      isCommentsOpen={openComments[item._id] || false}
      toggleComments={toggleComments}
      commentInput={commentInputs[item._id] || ''}
      setCommentInput={updateCommentInput}
      isCommenting={commentingMap[item._id] || false}
    />
  ), [currentUserId, lang, t, isDarkMode, textColor, subTextColor, cardBg, cardBorder, inputBg, inputBorder, openComments, commentInputs, commentingMap, toggleComments, updateCommentInput, navToProfile, initEdit]);

  const filterOptions: Array<Category | 'All'> = ['All', ...CATEGORIES];

  return (
    <View style={styles.root}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

      {/* --- ANIMATED BACKGROUND GRADIENTS --- */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: themeAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }]}>
        <LinearGradient colors={["#eaffff", "#f8fafc"]} style={StyleSheet.absoluteFill} />
      </Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: themeAnim }]}>
        <LinearGradient colors={["#0f172a", "#1e293b"]} style={StyleSheet.absoluteFill} />
      </Animated.View>

      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {/* Top Header */}
        <View style={styles.topBar}>
          <Text style={[styles.screenTitle, { color: textColor }]}>{t.title}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            
            <TouchableOpacity 
              style={[styles.actionIconBtn, { backgroundColor: actionBg }]} 
              onPress={() => navigation.navigate("Messages")}
            >
              <Ionicons name="chatbubbles" size={16} color={isDarkMode ? "#00BFC4" : "#008B8B"} />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionIconBtn, { backgroundColor: actionBg }]} onPress={toggleTheme}>
              <Ionicons name={isDarkMode ? "moon" : "sunny"} size={16} color={isDarkMode ? "#f1cd72" : "#f59e0b"} />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.langToggle, { backgroundColor: actionBg }]} onPress={() => setLang(lang === 'en' ? 'mm' : 'en')}>
              <Text style={{ color: isDarkMode ? "#ffffff" : "#008B8B", fontSize: 12, fontWeight: "800" }}>{lang === 'en' ? 'MM' : 'EN'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Main Scrollable Feed */}
        <FlatList
          data={filteredPosts}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          initialNumToRender={5}
          maxToRenderPerBatch={5}
          windowSize={5}
          removeClippedSubviews={true}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => fetchPosts(true)} colors={['#008B8B']} tintColor={isDarkMode ? "#008B8B" : "#008B8B"} />
          }
          ListHeaderComponent={
            <>
              {/* Search Input */}
              <View style={[styles.searchRow, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                <Feather name="search" size={16} color={subTextColor} style={{ marginLeft: 12 }} />
                <TextInput
                  style={[styles.searchInput, { color: textColor }]}
                  placeholder={t.searchPlaceholder}
                  placeholderTextColor={isDarkMode ? '#64748b' : '#94a3b8'}
                  value={search}
                  onChangeText={setSearch}
                />
              </View>

              {/* Category Filter Badges */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
                {filterOptions.map((cat) => {
                  const isActive = selectedCategory === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.categoryFilterChip, { backgroundColor: cardBg, borderColor: cardBorder }, isActive && styles.categoryFilterChipActive]}
                      onPress={() => setSelectedCategory(cat)}
                    >
                      <Text style={[styles.categoryFilterText, { color: subTextColor }, isActive && styles.categoryFilterTextActive]}>
                        {categoryLabels[lang][cat]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Post Creator Box */}
              <View style={[styles.composerCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                <TextInput
                  style={[styles.composerInput, { color: textColor }]}
                  multiline
                  numberOfLines={3}
                  placeholder={t.composerPlaceholder}
                  placeholderTextColor={isDarkMode ? '#64748b' : '#94a3b8'}
                  value={newContent}
                  onChangeText={setNewContent}
                />

                {/* Image Preview inside composer */}
                {selectedImage && (
                  <View style={styles.previewContainer}>
                    <Image source={{ uri: selectedImage }} style={styles.previewImage} />
                    <TouchableOpacity style={styles.previewCloseBtn} onPress={() => setSelectedImage(null)}>
                      <Ionicons name="close" size={16} color="#ffffff" />
                    </TouchableOpacity>
                  </View>
                )}

                <View style={styles.composerFooter}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
                    {CATEGORIES.map((cat: Category) => (
                      <TouchableOpacity
                        key={cat}
                        style={[styles.catChoiceChip, { backgroundColor: inputBg }, newCategory === cat && styles.catChoiceChipActive]}
                        onPress={() => setNewCategory(cat)}
                      >
                        <Text style={[styles.catChoiceText, { color: subTextColor }, newCategory === cat && styles.catChoiceTextActive]}>
                          {categoryLabels[lang][cat]}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <TouchableOpacity onPress={handlePickImage} style={styles.iconButton}>
                      <Ionicons name="image-outline" size={24} color="#008B8B" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.postButton, (!newContent.trim() || posting) && styles.postButtonDisabled]}
                      onPress={handleCreatePost}
                      disabled={!newContent.trim() || posting}
                    >
                      {posting ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <>
                          <Feather name="send" size={14} color="#ffffff" />
                          <Text style={styles.postButtonText}>{t.postBtn}</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </>
          }
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyView}>
                <Feather name="inbox" size={36} color={subTextColor} />
                <Text style={[styles.emptyText, { color: subTextColor }]}>
                  {t.noPosts}
                </Text>
              </View>
            ) : (
              <ActivityIndicator size="large" color="#008B8B" style={{ marginTop: 30 }} />
            )
          }
        />

        {/* Edit Modal */}
        {editingPost && (
          <Modal visible transparent animationType="slide">
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalBackdrop}>
              <View style={[styles.modalCard, { backgroundColor: cardBg }]}>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: textColor }]}>
                    {t.editTitle}
                  </Text>
                  <TouchableOpacity onPress={() => setEditingPost(null)}>
                    <Ionicons name="close" size={22} color={subTextColor} />
                  </TouchableOpacity>
                </View>

                <TextInput
                  style={[styles.modalInput, { backgroundColor: inputBg, borderColor: inputBorder, color: textColor }]}
                  multiline
                  numberOfLines={4}
                  value={editContent}
                  onChangeText={setEditContent}
                />

                <View style={styles.editCategoryRow}>
                  {CATEGORIES.map((cat: Category) => (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.catChoiceChip, { backgroundColor: inputBg }, editCategory === cat && styles.catChoiceChipActive]}
                      onPress={() => setEditCategory(cat)}
                    >
                      <Text style={[styles.catChoiceText, { color: subTextColor }, editCategory === cat && styles.catChoiceTextActive]}>
                        {categoryLabels[lang][cat]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity style={styles.saveEditBtn} onPress={handleUpdatePost} disabled={savingEdit}>
                  {savingEdit ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.saveEditText}>{t.saveBtn}</Text>
                  )}
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </Modal>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safeArea: { flex: 1 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  screenTitle: { fontSize: 24, fontWeight: '900' },
  actionIconBtn: { width: 34, height: 34, borderRadius: 17, justifyContent: "center", alignItems: "center" },
  langToggle: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  listContent: { padding: 14, paddingBottom: 40 },
  searchRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, marginBottom: 12, borderWidth: 1 },
  searchInput: { flex: 1, paddingVertical: 10, paddingHorizontal: 8, fontSize: 14 },
  categoryScroll: { gap: 8, paddingBottom: 14 },
  categoryFilterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  categoryFilterChipActive: { backgroundColor: '#008B8B', borderColor: '#008B8B' },
  categoryFilterText: { fontSize: 13, fontWeight: '700' },
  categoryFilterTextActive: { color: '#ffffff' },
  composerCard: { borderRadius: 16, padding: 14, marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, borderWidth: 1 },
  composerInput: { minHeight: 60, fontSize: 14, textAlignVertical: 'top' },
  previewContainer: { position: 'relative', alignSelf: 'flex-start', marginVertical: 8 },
  previewImage: { width: 100, height: 100, borderRadius: 12 },
  previewCloseBtn: { position: 'absolute', top: -6, right: -6, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 12, padding: 2 },
  composerFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, gap: 10 },
  catChoiceChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, marginRight: 6 },
  catChoiceChipActive: { backgroundColor: 'rgba(0,191,196,0.15)', borderWidth: 1, borderColor: '#008B8B' },
  catChoiceText: { fontSize: 11, fontWeight: '700' },
  catChoiceTextActive: { color: '#008B8B' },
  iconButton: { padding: 4 },
  postButton: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#008B8B', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  postButtonDisabled: { opacity: 0.5 },
  postButtonText: { color: '#ffffff', fontWeight: '800', fontSize: 13 },
  postCard: { borderRadius: 16, padding: 16, marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, borderWidth: 1 },
  postHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  authorRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#e2e8f0', marginRight: 10 },
  avatarPlaceholder: { backgroundColor: '#008B8B', justifyContent: 'center', alignItems: 'center' },
  avatarLetter: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' },
  authorInfo: { flex: 1 },
  authorName: { fontSize: 15, fontWeight: '800' },
  authorMeta: { fontSize: 12, marginTop: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  categoryBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  categoryBadgeText: { fontSize: 11, fontWeight: '800', color: '#008B8B' },
  menuIcon: { padding: 4 },
  postBody: { fontSize: 14, lineHeight: 22, marginBottom: 12 },
  postImage: { width: '100%', height: 220, borderRadius: 12, marginBottom: 12 },
  actionBar: { flexDirection: 'row', borderTopWidth: 1, paddingTop: 10, gap: 16 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 },
  actionText: { fontSize: 13, fontWeight: '700' },
  commentsSection: { marginTop: 12, borderTopWidth: 1, paddingTop: 10 },
  commentInputRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  commentTextInput: { flex: 1, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 13 },
  commentSendBtn: { backgroundColor: '#008B8B', width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  noCommentsText: { fontSize: 12, fontStyle: 'italic', marginVertical: 4 },
  commentBubble: { padding: 10, borderRadius: 12, marginBottom: 8 },
  commentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  commentAvatar: { width: 20, height: 20, borderRadius: 10 },
  commentAuthorName: { fontSize: 12, fontWeight: '800' },
  commentTime: { fontSize: 10, color: '#94a3b8' },
  commentContentText: { fontSize: 13 },
  emptyView: { alignItems: 'center', justifyContent: 'center', marginTop: 40, gap: 8 },
  emptyText: { fontSize: 14, fontWeight: '700' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalCard: { borderRadius: 20, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  modalInput: { minHeight: 100, borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 14, textAlignVertical: 'top', marginBottom: 12 },
  editCategoryRow: { flexDirection: 'row', gap: 6, marginBottom: 16 },
  saveEditBtn: { backgroundColor: '#008B8B', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  saveEditText: { color: '#ffffff', fontWeight: '800', fontSize: 15 },
});