/**
 * ChatScreen — AI Stock Assistant (with persistent memory + Voice Assistant mode)
 *
 * Voice modes:
 *  - Speaker icon  : toggle spoken replies on/off (default ON)
 *  - 🎙 Voice Mode : hands-free loop — mic auto-restarts after AI speaks
 *    Tap the glowing orb to stop listening, or tap "Exit Voice Mode" to quit.
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, KeyboardAvoidingView, ActivityIndicator,
  Alert, Animated, Keyboard, Platform,
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

// ── Bubble ────────────────────────────────────────────────────────────────────
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

// ── Voice Mode Orb ────────────────────────────────────────────────────────────
function VoiceModeOrb({ state, transcript, onStop }) {
  // state: 'listening' | 'thinking' | 'speaking'
  const scale  = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    let anim;
    if (state === 'listening') {
      anim = Animated.loop(Animated.sequence([
        Animated.parallel([
          Animated.timing(scale,   { toValue: 1.25, duration: 700, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 1,    duration: 700, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(scale,   { toValue: 1,    duration: 700, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.6,  duration: 700, useNativeDriver: true }),
        ]),
      ]));
    } else if (state === 'speaking') {
      anim = Animated.loop(Animated.sequence([
        Animated.timing(scale,   { toValue: 1.15, duration: 400, useNativeDriver: true }),
        Animated.timing(scale,   { toValue: 0.95, duration: 400, useNativeDriver: true }),
      ]));
    } else {
      // thinking
      anim = Animated.loop(Animated.sequence([
        Animated.timing(opacity, { toValue: 0.3, duration: 500, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1,   duration: 500, useNativeDriver: true }),
      ]));
    }
    anim.start();
    return () => anim.stop();
  }, [state, scale, opacity]);

  const orbColor = state === 'listening' ? '#EF4444'
                 : state === 'speaking'  ? '#10B981'
                 : '#6366F1';

  const stateLabel = state === 'listening' ? '🎙 Listening…'
                   : state === 'speaking'  ? '🔊 Speaking…'
                   : '⏳ Thinking…';

  return (
    <View style={styles.orbContainer}>
      <Text style={styles.orbStateLabel}>{stateLabel}</Text>

      {transcript ? (
        <Text style={styles.orbTranscript} numberOfLines={3}>{transcript}</Text>
      ) : null}

      <TouchableOpacity onPress={onStop} activeOpacity={0.8}>
        <Animated.View style={[
          styles.orb,
          { backgroundColor: orbColor, transform: [{ scale }], opacity },
        ]}>
          <Ionicons
            name={state === 'listening' ? 'mic' : state === 'speaking' ? 'volume-high' : 'ellipsis-horizontal'}
            size={40}
            color="#fff"
          />
        </Animated.View>
      </TouchableOpacity>

      <Text style={styles.orbHint}>
        {state === 'listening' ? 'Tap orb to stop listening' : ''}
      </Text>
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function ChatScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const welcome = {
    id:      uid(),
    role:    'assistant',
    content: `Hi ${user?.username || 'there'}! 👋 I'm your SDJ Marine Stock Assistant.\n\nI remember our previous conversations! Try Voice Mode (🎙) for hands-free chat — just speak and I'll reply out loud.\n\n• "How much rice do we have?"\n• "Add 100 kg of cooking oil"\n• "Show me low stock items"\n• "Give me the daily summary"`,
    ts:      new Date(),
  };

  const [messages,       setMessages]       = useState([welcome]);
  const [input,          setInput]          = useState('');
  const [loading,        setLoading]        = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [listening,      setListening]      = useState(false);
  const [speakReplies,   setSpeakReplies]   = useState(true);   // ← default ON
  const [voiceMode,      setVoiceMode]      = useState(false);  // hands-free loop
  const [voiceState,     setVoiceState]     = useState('listening'); // 'listening'|'thinking'|'speaking'

  const listRef         = useRef(null);
  const speakRepliesRef = useRef(true);
  speakRepliesRef.current = speakReplies;
  const voiceModeRef    = useRef(false);
  voiceModeRef.current  = voiceMode;
  const listeningRef    = useRef(false);
  listeningRef.current  = listening;

  const scrollToEnd = useCallback(() => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  useEffect(() => () => { cancelListening(); stopSpeaking(); }, []);

  // ── Load persistent history ─────────────────────────────────────────────────
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

  // ── Clear history ───────────────────────────────────────────────────────────
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
            } catch {
              Alert.alert('Error', 'Could not clear history.');
            }
          },
        },
      ]
    );
  }

  // ── Auto-listen after AI speaks (voice mode loop) ───────────────────────────
  function autoListen() {
    if (!voiceModeRef.current || !voiceInputSupported) return;
    setVoiceState('listening');
    startListening({
      onPartial: (t) => setInput(t),
      onFinal:   (text) => {
        setListening(false);
        listeningRef.current = false;
        if (text.trim()) sendMessage(text);
        else if (voiceModeRef.current) autoListen(); // nothing heard → try again
      },
      onEnd:  () => { setListening(false); listeningRef.current = false; },
      onError: (reason) => {
        setListening(false);
        listeningRef.current = false;
        if (reason === 'no-speech' && voiceModeRef.current) {
          autoListen(); // restart on silence
        }
      },
    }).then(started => {
      setListening(started);
      listeningRef.current = started;
    });
  }

  // ── Send message ────────────────────────────────────────────────────────────
  async function sendMessage(text) {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');
    if (voiceModeRef.current) setVoiceState('thinking');

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

      if (res.ok && speakRepliesRef.current) {
        if (voiceModeRef.current) setVoiceState('speaking');
        speak(reply, {
          onDone: () => {
            // After AI finishes speaking, auto-restart mic in voice mode
            if (voiceModeRef.current) {
              autoListen();
            }
          },
        });
      } else if (voiceModeRef.current) {
        // Even if speak is off, restart mic in voice mode
        autoListen();
      }
    } catch {
      const errMsg = { id: uid(), role: 'assistant', content: '⚠️ Could not reach the server. Check your connection.', ts: new Date() };
      setMessages(prev => [...prev, errMsg]);
      if (voiceModeRef.current) setVoiceState('listening');
    } finally {
      setLoading(false);
      scrollToEnd();
    }
  }

  // ── Toggle Voice Mode ───────────────────────────────────────────────────────
  async function toggleVoiceMode() {
    if (!voiceInputSupported) {
      Alert.alert(
        'Voice Mode needs a development build',
        'Speech recognition is not available in Expo Go. Build the app with EAS to use Voice Mode.',
      );
      return;
    }

    if (voiceMode) {
      // Exit voice mode
      stopSpeaking();
      cancelListening();
      setVoiceMode(false);
      setListening(false);
      setInput('');
    } else {
      // Enter voice mode — enable speak replies too
      setSpeakReplies(true);
      setVoiceMode(true);
      setVoiceState('listening');
      setInput('');
      Keyboard.dismiss();
      stopSpeaking();
      // Small delay to let state settle
      setTimeout(() => autoListen(), 300);
    }
  }

  // ── Regular mic toggle (non-voice-mode) ─────────────────────────────────────
  async function toggleMic() {
    if (voiceMode) return; // handled by voice mode
    if (listening) { stopListening(); return; }

    if (!voiceInputSupported) {
      Alert.alert(
        'Voice input needs a development build',
        'Speech recognition is not available inside Expo Go. Build the app once with EAS to use the microphone.\n\nYou can still turn on spoken replies with the speaker icon.',
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
      onEnd:   () => setListening(false),
      onError: (reason) => {
        setListening(false);
        if (reason === 'no-speech') return;
        if (reason === 'permission') {
          Alert.alert('Microphone permission needed', 'Allow microphone access in Settings.');
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
    <KeyboardAvoidingView
      style={styles.safe}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Logo size={40} style={styles.headerAvatar} />
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Stock Assistant</Text>
          <Text style={styles.headerSub}>SDJ Marine AI · Remembers your history</Text>
        </View>

        {/* Speaker toggle */}
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

        {/* Voice Mode toggle */}
        <TouchableOpacity
          onPress={toggleVoiceMode}
          style={[styles.iconBtn, voiceMode && styles.iconBtnActive]}
          accessibilityLabel={voiceMode ? 'Exit Voice Mode' : 'Enter Voice Mode'}
        >
          <Ionicons
            name={voiceMode ? 'mic' : 'mic-outline'}
            size={20}
            color={voiceMode ? '#FCD34D' : '#A5B4FC'}
          />
        </TouchableOpacity>

        {/* Clear history */}
        <TouchableOpacity onPress={clearHistory} style={styles.iconBtn} accessibilityLabel="Clear chat history">
          <Ionicons name="trash-outline" size={18} color="#A5B4FC" />
        </TouchableOpacity>

        <View style={styles.onlineDot} />
      </View>

      {/* ── Voice Mode Orb overlay ──────────────────────────────────────────── */}
      {voiceMode ? (
        <View style={styles.orbWrapper}>
          <VoiceModeOrb
            state={loading ? 'thinking' : voiceState}
            transcript={input}
            onStop={() => {
              if (listening) stopListening();
              else if (loading) { /* can't cancel API */ }
              else stopSpeaking();
            }}
          />
          {/* Last AI message preview */}
          {messages.length > 1 && (
            <View style={styles.orbLastMsg}>
              <Text style={styles.orbLastMsgText} numberOfLines={4}>
                {messages[messages.length - 1]?.content || ''}
              </Text>
            </View>
          )}
          <TouchableOpacity style={styles.exitVoiceBtn} onPress={toggleVoiceMode}>
            <Text style={styles.exitVoiceBtnText}>✕  Exit Voice Mode</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* ── Chat list ──────────────────────────────────────────────────── */}
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

          {/* ── Input bar ──────────────────────────────────────────────────── */}
          <View style={styles.inputBar}>
            {/* Voice Mode shortcut button */}
            <TouchableOpacity
              style={styles.voiceModeBtn}
              onPress={toggleVoiceMode}
              accessibilityLabel="Enter Voice Mode"
            >
              <Ionicons name="mic-circle" size={30} color={INDIGO} />
            </TouchableOpacity>

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
        </>
      )}
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
  iconBtnActive:   { backgroundColor: 'rgba(252,211,77,0.15)', borderRadius: 20 },
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

  inputBar:        { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 8, paddingVertical: 8, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E5E7EB', gap: 6 },
  voiceModeBtn:    { padding: 4, justifyContent: 'center', alignItems: 'center' },
  textInput:       { flex: 1, minHeight: 44, maxHeight: 120, backgroundColor: '#F3F4F6', borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, color: '#111827', borderWidth: 1, borderColor: '#E5E7EB' },
  actionBtn:       { width: 44, height: 44, borderRadius: 22, backgroundColor: INDIGO, justifyContent: 'center', alignItems: 'center' },
  actionBtnDisabled: { backgroundColor: '#C7D2FE' },
  micActive:       { backgroundColor: '#EF4444' },

  // ── Voice Mode Orb ────────────────────────────────────────────────────────
  orbWrapper:      { flex: 1, backgroundColor: DARK, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24, gap: 24 },
  orbContainer:    { alignItems: 'center', gap: 20 },
  orbStateLabel:   { color: '#E0E7FF', fontSize: 18, fontWeight: '600', letterSpacing: 0.5 },
  orbTranscript:   { color: '#A5B4FC', fontSize: 15, textAlign: 'center', maxWidth: 280, lineHeight: 22 },
  orb:             { width: 140, height: 140, borderRadius: 70, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 12 },
  orbHint:         { color: '#6B7280', fontSize: 12, marginTop: 4 },
  orbLastMsg:      { backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 16, padding: 16, maxWidth: '100%' },
  orbLastMsgText:  { color: '#C7D2FE', fontSize: 14, lineHeight: 22, textAlign: 'center' },
  exitVoiceBtn:    { marginTop: 8, paddingVertical: 12, paddingHorizontal: 28, borderRadius: 24, borderWidth: 1, borderColor: '#4B5563' },
  exitVoiceBtnText: { color: '#9CA3AF', fontSize: 14, fontWeight: '500' },
});
