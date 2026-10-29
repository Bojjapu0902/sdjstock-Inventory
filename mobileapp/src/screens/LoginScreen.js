import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import Logo from '../components/Logo';

const INDIGO = '#4F46E5';
const DARK   = '#1E1B4B';

export default function LoginScreen({ navigation }) {
  const { login }         = useAuth();
  const insets = useSafeAreaInsets();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [busy, setBusy]         = useState(false);

  async function handleLogin() {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter username and password.');
      return;
    }
    setBusy(true);
    try {
      await login(username, password);
    } catch (err) {
      Alert.alert('Login Failed', err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.root} behavior="padding">
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoBox}>
          <Logo size={96} style={styles.logo} />
          <Text style={styles.appName}>SDJ Marine Inventory</Text>
          <Text style={styles.appSub}>Stock & Project Management</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sign In</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Username</Text>
            <View style={styles.inputRow}>
              <Ionicons name="person-outline" size={18} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter username"
                placeholderTextColor="#9CA3AF"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputRow}>
              <Ionicons name="lock-closed-outline" size={18} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Enter password"
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPw}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPw(!showPw)} style={styles.eyeBtn}>
                <Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={18} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')} style={styles.forgotLink}>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.loginBtn, busy && { opacity: 0.7 }]} onPress={handleLogin} disabled={busy}>
            {busy
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.loginBtnText}>Sign In</Text>
            }
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root:       { flex: 1, backgroundColor: DARK },
  scroll:     { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24 },
  logoBox:    { alignItems: 'center', marginBottom: 32 },
  logo:       { marginBottom: 14 },
  appName:    { color: '#fff', fontSize: 22, fontWeight: '700', marginBottom: 4 },
  appSub:     { color: '#A5B4FC', fontSize: 14 },
  card:       { backgroundColor: '#fff', borderRadius: 20, padding: 28, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 16, elevation: 8 },
  cardTitle:  { fontSize: 20, fontWeight: '700', color: DARK, marginBottom: 24, textAlign: 'center' },
  fieldGroup: { marginBottom: 16 },
  label:      { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  inputRow:   { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 12, backgroundColor: '#F9FAFB' },
  inputIcon:  { marginRight: 8 },
  input:      { height: 46, fontSize: 15, color: '#111827' },
  eyeBtn:     { padding: 6 },
  forgotLink: { alignSelf: 'flex-end', marginBottom: 20 },
  forgotText: { color: INDIGO, fontSize: 13, fontWeight: '600' },
  loginBtn:   { backgroundColor: INDIGO, borderRadius: 12, height: 50, justifyContent: 'center', alignItems: 'center' },
  loginBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
