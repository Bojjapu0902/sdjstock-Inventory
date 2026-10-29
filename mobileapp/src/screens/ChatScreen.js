/**
 * ChatScreen — AI Stock Assistant (with persistent memory)
 * Loads previous chat history from MongoDB on open.
 * Saves every conversation to DB so AI remembers across sessions.
 * Voice: mic button (speech-to-text) and speaker toggle (spoken replies).
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, KeyboardAvoidingView, ActivityIndicator,
  Alert, Animated, Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { useAuth } from '../contexts/AuthContext';
import { BASE_URL } from '../config/api';
import Logo from '../components/Logo';
import {
  voiceInputSupported, startListening, stopListening, cancelListening,
  speak, stopSpeaking,
} from '../services/voice';

const INDIGO  = '#4F46E5';
const DARK    = '#1E1B4B';
const BOT_BG  = '#F3F4F6';
const USER_BG = INDIGO;

const SUGGESTIONS = [
  '📦 Show all stock',
  '⚠️ Low stock items',
  '📊 Daily summary',
  '➕ Create project',
];

let _id = 0;
const uid = () => String(++_id);

function fmt(date) {
  return new Date(date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function Bubble({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <View style={[styles.bubbleRow, isUser ? styles.bubbleRowUser : styles.bubbleRowBot]}>
      {!isUser && (
        <View style={styles.botAvatar}>
          <Text style={styles.botAvatarText}>AI</Text>
        </View>
      )}
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleBot]}>
        <Text style={[styles.bubbleText, isUser ? styles.bubbleTextUser : styles.bubbleTextBot]}>
          {msg.content}
        </Text>
        <Text style={[styles.bubbleTime, isUser ? styles.bubbleTimeUser : styles.bubbleTimeBot]}>
          {fmt(msg.ts || msg.timestamp || new Date())}
        </Text>
      </View>
    </View>
  );
}

function TypingIndicator() {
  return (
    <View style={[styles.bubbleRow, styles.bubbleRowBot]}>
      <View style={styles.botAvatar}><Text style={styles.botAvatarText}>AI</Text></View>
      <View style={[styles.bubble, styles.bubbleBot, styles.typingBubble]}>
        <ActivityIndicator size="small" color="#6B7280" />
        <Text style={styles.typingText}>Thinking…</Text>
      </View>
    </View>
  );
}

function ListeningBanner({ transcript }) {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1.35, duration: 600, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 1,    duration: 600, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <View style={styles.listenBar}>
      <Animated.View style={[styles.listenDot, { transform: [{ scale: pulse }] }]} />
      <Text style={styles.listenText} numberOfLines={2}>
        {transcript || 'Listening… speak now'}
      </Text>
    </View>
  );
}

export default function ChatScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const welcome = {
    id:      uid(),
    role:    'assistant',
    content: `Hi ${user?.username || 'there'}! 👋 I'm your SDJ Marine Stock Assistant.\n\nI remember our previous conversations! Ask me anything:\n• "How much rice do we have?"\n• "Add 100 kg of cooking oil"\n• "Show me low stock items"\n• "Give me the daily summary"`,
    ts:      new Date(),
  };

  const [messages,   setMessages]   = useState([welcome]);
  const [input,      setInput]      = useState('');
  const [loading,    setLoading]    = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [listening,  setListening]  = useState(false);
  const [speakReplies, setSpeakReplies] = useState(false);
  const listRef = useRef(null);
  const speakRepliesRef = useRef(false);
  speakRepliesRef.current = speakReplies;

  const scrollToEnd = useCallback(() => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  // Stop mic / voice when leaving the screen
  useEffect(() => () => { cancelListening(); stopSpeaking(); }, []);

  // ── Load persistent history on mount ────────────────────────────────────────
  useEffect(() => {
    async function loadHistory() {
      try {
        const token = await SecureStore.getItemAsync('auth_token');
        const res   = await fetch(`${BASE_URL}/chat/history`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data.messages && data.messages.length > 0) {
          const loaded = data.messages.map(m => ({
            id:      uid(),
            role:    m.role,
            content: m.content,
            ts:      m.timestamp || new Date(),
          }));
          setMessages([welcome, ...loaded]);
        }
      } catch (err) {
        console.warn('History load error:', err.message);
      } finally {
        setLoadingHistory(false);
        scrollToEnd();
      }
    }
    loadHistory();
  }, []);

  // ── Clear history ────────────────────────────────────────────────────────────
  async function clearHistory() {
    Alert.alert(
      'Clear Chat History',
      'This will delete all previous conversations. The AI will start fresh.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear', style: 'destructive',
          onPress: async () => {
            try {
              const token = await SecureStore.getItemAsync('auth_token');
              await fetch(`${BASE_URL}/chat/history`, {
                method:  'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
              });
              setMessages([welcome]);
            } catch (err) {
              Alert.alert('Error', 'Could not clear history.');
            }
          },
        },
      ]
    );
  }

  // ── Send message ─────────────────────────────────────────────────────────────
  async function sendMessage(text) {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');

    const userMsg = { id: uid(), role: 'user', content: msg, ts: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    scrollToEnd();

    try {
      const token = await SecureStore.getItemAsync('auth_token');
      const res   = await fetch(`${BASE_URL}/chat`, {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ message: msg }),
      });

      const data  = await res.json();
      const reply = res.ok
        ? (data.reply || 'Done.')
        : (data.error || 'Something went wrong. Please try again.');

      const botMsg = { id: uid(), role: 'assistant', content: reply, ts: new Date() };
      setMessages(prev => [...prev, botMsg]);
      if (res.ok && speakRepliesRef.current) speak(reply);
    } catch {
      const errMsg = { id: uid(), role: 'assistant', content: '⚠️ Could not reach the server. Check your connection.', ts: new Date() };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setLoading(false);
      scrollToEnd();
    }
  }

  // ── Voice input ──────────────────────────────────────────────────────────────
  async function toggleMic() {
    if (listening) { stopListening(); return; }

    if (!voiceInputSupported) {
      Alert.alert(
        'Voice input needs a development build',
        'Speech recognition is not available inside Expo Go. Build the app once with "npx expo run:android" (or an EAS development build) to use the microphone.\n\nYou can still turn on spoken replies with the speaker icon.',
      );
      return;
    }

    Keyboard.dismiss();
    stopSpeaking();
    setInput('');
    const started = await startListening({
      onPartial: setInput,
      onFinal: (text) => {
        setListening(false);
        if (text.trim()) sendMessage(text); else setInput('');
      },
      onEnd: () => setListening(false),
      onError: (reason) => {
        setListening(false);
        if (reason === 'no-speech') return;
        if (reason === 'permission') {
          Alert.alert('Microphone permission needed', 'Allow microphone and speech recognition access in Settings to use voice chat.');
        } else {
          Alert.alert('Voice input error', String(reason));
        }
      },
    });
    setListening(started);
  }

  function toggleSpeakReplies() {
    if (speakReplies) stopSpeaking();
    setSpeakReplies(v => !v);
  }

  const showSuggestions = messages.length <= 1;
  const canSend = !!input.trim() && !loading && !listening;

  return (
    // The tab bar hides while the keyboard is open, so this view spans to the screen
    // bottom and "padding" lifts the input bar exactly above the keyboard.
    <KeyboardAvoidingView style={styles.safe} behavior="padding">
      {/* Header — padded by the status-bar inset so it never sits under the system bar */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Logo size={40} style={styles.headerAvatar} />
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Stock Assistant</Text>
          <Text style={styles.headerSub}>SDJ Marine AI · Remembers your history</Text>
        </View>
        <TouchableOpacity
          onPress={toggleSpeakReplies}
          style={styles.iconBtn}
          accessibilityLabel={speakReplies ? 'Turn off spoken replies' : 'Turn on spoken replies'}
        >
          <Ionicons
            name={speakReplies ? 'volume-high' : 'volume-mute-outline'}
            size={20}
            color={speakReplies ? '#fff' : '#A5B4FC'}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={clearHistory} style={styles.iconBtn} accessibilityLabel="Clear chat history">
          <Ionicons name="trash-outline" size={18} color="#A5B4FC" />
        </TouchableOpacity>
        <View style={styles.onlineDot} />
      </View>

      {loadingHistory ? (
        <View style={styles.center}>
          <ActivityIndicator size="small" color={INDIGO} />
          <Text style={styles.loadingText}>Loading your chat history…</Text>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          style={styles.flex}
          data={messages}
          keyExtractor={m => m.id}
          renderItem={({ item }) => <Bubble msg={item} />}
          contentContainerStyle={styles.list}
          onContentSizeChange={scrollToEnd}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          ListFooterComponent={loading ? <TypingIndicator /> : null}
        />
      )}

      {showSuggestions && !loadingHistory && (
        <View style={styles.chips}>
          {SUGGESTIONS.map(s => (
            <TouchableOpacity key={s} style={styles.chip} onPress={() => sendMessage(s)}>
              <Text style={styles.chipText}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {listening && <ListeningBanner transcript={input} />}

      <View style={styles.inputBar}>
        <TextInput
          style={styles.textInput}
          placeholder={listening ? 'Listening…' : 'Type a message…'}
          placeholderTextColor="#9CA3AF"
          value={input}
          onChangeText={setInput}
          onSubmitEditing={() => sendMessage()}
          returnKeyType="send"
          multiline
          maxLength={500}
          editable={!listening}
        />
        {canSend ? (
          <TouchableOpacity style={styles.actionBtn} onPress={() => sendMessage()} accessibilityLabel="Send message">
            <Ionicons name="send" size={20} color="#fff" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.actionBtn, listening && styles.micActive, loading && styles.actionBtnDisabled]}
            onPress={toggleMic}
            disabled={loading}
            accessibilityLabel={listening ? 'Stop listening' : 'Start voice input'}
          >
            <Ionicons name={listening ? 'stop' : 'mic'} size={22} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  safe:            { flex: 1, backgroundColor: '#F9FAFB' },
  flex:            { flex: 1 },
  center:          { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
  loadingText:     { color: '#6B7280', fontSize: 13 },

  header:          { flexDirection: 'row', alignItems: 'center', backgroundColor: DARK, paddingHorizontal: 16, paddingBottom: 12, gap: 6 },
  headerAvatar:    { marginRight: 4 },
  headerTitle:     { color: '#fff', fontSize: 15, fontWeight: '700' },
  headerSub:       { color: '#A5B4FC', fontSize: 11 },
  iconBtn:         { padding: 8 },
  onlineDot:       { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981', marginLeft: 2 },

  list:            { padding: 12, paddingBottom: 8 },

  bubbleRow:       { flexDirection: 'row', marginVertical: 4, maxWidth: '85%' },
  bubbleRowUser:   { alignSelf: 'flex-end', flexDirection: 'row-reverse' },
  bubbleRowBot:    { alignSelf: 'flex-start' },

  botAvatar:       { width: 30, height: 30, borderRadius: 15, backgroundColor: INDIGO, justifyContent: 'center', alignItems: 'center', marginRight: 6, alignSelf: 'flex-end' },
  botAvatarText:   { color: '#fff', fontSize: 10, fontWeight: '700' },

  bubble:          { borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10, maxWidth: '100%', flexShrink: 1 },
  bubbleUser:      { backgroundColor: USER_BG, borderBottomRightRadius: 4 },
  bubbleBot:       { backgroundColor: BOT_BG,  borderBottomLeftRadius: 4 },
  bubbleText:      { fontSize: 14.5, lineHeight: 21 },
  bubbleTextUser:  { color: '#fff' },
  bubbleTextBot:   { color: '#111827' },
  bubbleTime:      { fontSize: 10.5, marginTop: 4 },
  bubbleTimeUser:  { color: 'rgba(255,255,255,0.65)', textAlign: 'right' },
  bubbleTimeBot:   { color: '#9CA3AF' },

  typingBubble:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  typingText:      { color: '#6B7280', fontSize: 13.5 },

  chips:           { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, paddingBottom: 4, gap: 8 },
  chip:            { backgroundColor: '#EEF2FF', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, borderWidth: 1, borderColor: '#C7D2FE' },
  chipText:        { color: INDIGO, fontSize: 13, fontWeight: '500' },

  listenBar:       { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#FEF2F2', borderTopWidth: 1, borderTopColor: '#FECACA' },
  listenDot:       { width: 12, height: 12, borderRadius: 6, backgroundColor: '#EF4444' },
  listenText:      { flex: 1, color: '#7F1D1D', fontSize: 14, fontWeight: '500' },

  inputBar:        { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E5E7EB', gap: 8 },
  textInput:       { flex: 1, minHeight: 44, maxHeight: 120, backgroundColor: '#F3F4F6', borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, color: '#111827', borderWidth: 1, borderColor: '#E5E7EB' },
  actionBtn:       { width: 44, height: 44, borderRadius: 22, backgroundColor: INDIGO, justifyContent: 'center', alignItems: 'center' },
  actionBtnDisabled: { backgroundColor: '#C7D2FE' },
  micActive:       { backgroundColor: '#EF4444' },
});
