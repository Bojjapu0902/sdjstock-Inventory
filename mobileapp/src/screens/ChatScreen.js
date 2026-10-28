/**
 * ChatScreen — AI Stock Assistant
 * WhatsApp-style chat interface that talks to the /api/chat endpoint.
 * The AI understands natural language commands like:
 *   "How much rice do we have?"
 *   "Add 50 kg of cooking oil"
 *   "Assign 20 units of flour to project Vessel-Alpha"
 *   "Show me low stock items"
 *   "Give me the daily summary"
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { useAuth } from '../contexts/AuthContext';
import { BASE_URL } from '../config/api';

const INDIGO  = '#4F46E5';
const DARK    = '#1E1B4B';
const BOT_BG  = '#F3F4F6';
const USER_BG = INDIGO;

// ── Quick-action suggestion chips shown before first message ──────────────────
const SUGGESTIONS = [
  '📦 Show all stock',
  '⚠️ Low stock items',
  '📊 Daily summary',
  '➕ Create project',
];

// ── Unique ID helper ──────────────────────────────────────────────────────────
let _id = 0;
const uid = () => String(++_id);

// ── Timestamp formatter ───────────────────────────────────────────────────────
function fmt(date) {
  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

// ── Single chat bubble ────────────────────────────────────────────────────────
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
          {fmt(msg.ts)}
        </Text>
      </View>
    </View>
  );
}

// ── Typing indicator ──────────────────────────────────────────────────────────
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

// ── Main screen ───────────────────────────────────────────────────────────────
export default function ChatScreen() {
  const { user } = useAuth();

  const [messages, setMessages]     = useState([
    {
      id:      uid(),
      role:    'assistant',
      content: `Hi ${user?.username || 'there'}! 👋 I'm your SDJ Marine Stock Assistant.\n\nYou can ask me things like:\n• "How much rice do we have?"\n• "Add 100 kg of cooking oil"\n• "Show me low stock items"\n• "Give me the daily summary"\n\nWhat would you like to do?`,
      ts:      new Date(),
    },
  ]);
  const [input, setInput]           = useState('');
  const [loading, setLoading]       = useState(false);
  const listRef                     = useRef(null);

  // Build conversation history for context (last 10 messages only to keep tokens down)
  const buildHistory = useCallback(() => {
    return messages
      .slice(-10)
      .filter(m => !m._system)
      .map(m => ({ role: m.role, content: m.content }));
  }, [messages]);

  const scrollToEnd = useCallback(() => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

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
        body: JSON.stringify({
          message: msg,
          history: buildHistory(),
        }),
      });

      const data = await res.json();
      const reply = res.ok
        ? (data.reply || 'Done.')
        : (data.error || 'Something went wrong. Please try again.');

      const botMsg = { id: uid(), role: 'assistant', content: reply, ts: new Date() };
      setMessages(prev => [...prev, botMsg]);
    } catch {
      const errMsg = { id: uid(), role: 'assistant', content: '⚠️ Could not reach the server. Check your connection.', ts: new Date() };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setLoading(false);
      scrollToEnd();
    }
  }

  const showSuggestions = messages.length <= 1;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerAvatar}>
          <Ionicons name="chatbubble-ellipses" size={20} color="#fff" />
        </View>
        <View>
          <Text style={styles.headerTitle}>Stock Assistant</Text>
          <Text style={styles.headerSub}>SDJ Marine AI</Text>
        </View>
        <View style={styles.onlineDot} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        {/* Message list */}
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={m => m.id}
          renderItem={({ item }) => <Bubble msg={item} />}
          contentContainerStyle={styles.list}
          onContentSizeChange={scrollToEnd}
          ListFooterComponent={loading ? <TypingIndicator /> : null}
        />

        {/* Suggestion chips — visible only at start */}
        {showSuggestions && (
          <View style={styles.chips}>
            {SUGGESTIONS.map(s => (
              <TouchableOpacity key={s} style={styles.chip} onPress={() => sendMessage(s)}>
                <Text style={styles.chipText}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Input bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.textInput}
            placeholder="Type a message…"
            placeholderTextColor="#9CA3AF"
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => sendMessage()}
            returnKeyType="send"
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
            onPress={() => sendMessage()}
            disabled={!input.trim() || loading}
          >
            <Ionicons name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe:              { flex: 1, backgroundColor: '#F9FAFB' },
  flex:              { flex: 1 },

  // Header
  header:            { flexDirection: 'row', alignItems: 'center', backgroundColor: DARK, paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
  headerAvatar:      { width: 38, height: 38, borderRadius: 19, backgroundColor: INDIGO, justifyContent: 'center', alignItems: 'center' },
  headerTitle:       { color: '#fff', fontSize: 15, fontWeight: '700' },
  headerSub:         { color: '#A5B4FC', fontSize: 12 },
  onlineDot:         { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981', marginLeft: 'auto' },

  // Message list
  list:              { padding: 12, paddingBottom: 8 },

  // Bubble rows
  bubbleRow:         { flexDirection: 'row', marginVertical: 4, maxWidth: '85%' },
  bubbleRowUser:     { alignSelf: 'flex-end', flexDirection: 'row-reverse' },
  bubbleRowBot:      { alignSelf: 'flex-start' },

  // Bot avatar
  botAvatar:         { width: 30, height: 30, borderRadius: 15, backgroundColor: INDIGO, justifyContent: 'center', alignItems: 'center', marginRight: 6, alignSelf: 'flex-end' },
  botAvatarText:     { color: '#fff', fontSize: 10, fontWeight: '700' },

  // Bubbles
  bubble:            { borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10, maxWidth: '100%' },
  bubbleUser:        { backgroundColor: USER_BG, borderBottomRightRadius: 4 },
  bubbleBot:         { backgroundColor: BOT_BG,  borderBottomLeftRadius: 4 },
  bubbleText:        { fontSize: 14.5, lineHeight: 21 },
  bubbleTextUser:    { color: '#fff' },
  bubbleTextBot:     { color: '#111827' },
  bubbleTime:        { fontSize: 10.5, marginTop: 4 },
  bubbleTimeUser:    { color: 'rgba(255,255,255,0.65)', textAlign: 'right' },
  bubbleTimeBot:     { color: '#9CA3AF' },

  // Typing indicator
  typingBubble:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
  typingText:        { color: '#6B7280', fontSize: 13.5 },

  // Suggestion chips
  chips:             { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, paddingBottom: 4, gap: 8 },
  chip:              { backgroundColor: '#EEF2FF', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, borderWidth: 1, borderColor: '#C7D2FE' },
  chipText:          { color: INDIGO, fontSize: 13, fontWeight: '500' },

  // Input bar
  inputBar:          { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E5E7EB', gap: 8 },
  textInput:         { flex: 1, minHeight: 44, maxHeight: 120, backgroundColor: '#F3F4F6', borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, color: '#111827', borderWidth: 1, borderColor: '#E5E7EB' },
  sendBtn:           { width: 44, height: 44, borderRadius: 22, backgroundColor: INDIGO, justifyContent: 'center', alignItems: 'center' },
  sendBtnDisabled:   { backgroundColor: '#C7D2FE' },
});
