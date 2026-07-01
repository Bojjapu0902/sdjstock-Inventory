import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { changePassword } from '../services/authService';

const INDIGO = '#4F46E5';
const DARK   = '#1E1B4B';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [changingPw, setChangingPw]   = useState(false);
  const [currentPw, setCurrentPw]     = useState('');
  const [newPw,     setNewPw]         = useState('');
  const [confirmPw, setConfirmPw]     = useState('');
  const [showPw,    setShowPw]        = useState(false);
  const [busy,      setBusy]          = useState(false);

  async function handleChangePw() {
    if (!currentPw || !newPw || !confirmPw) { Alert.alert('Error', 'All fields are required.'); return; }
    if (newPw.length < 6) { Alert.alert('Error', 'New password must be at least 6 characters.'); return; }
    if (newPw !== confirmPw) { Alert.alert('Error', 'Passwords do not match.'); return; }
    setBusy(true);
    try {
      await changePassword(currentPw, newPw);
      Alert.alert('Success', 'Password changed successfully.');
      setChangingPw(false); setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } catch (err) { Alert.alert('Error', err.message); }
    finally { setBusy(false); }
  }

  function handleLogout() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  }

  const initials = (user?.username || 'U').slice(0, 2).toUpperCase();

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.scroll}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.username}>{user?.username || 'User'}</Text>
        <Text style={styles.role}>{user?.role || 'staff'}</Text>
        {user?.email && <Text style={styles.email}>{user.email}</Text>}
      </View>

      {/* Info cards */}
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Ionicons name="person-outline" size={18} color={INDIGO} style={styles.infoIcon} />
          <View>
            <Text style={styles.infoLabel}>Username</Text>
            <Text style={styles.infoValue}>{user?.username || '—'}</Text>
          </View>
        </View>
        <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
          <Ionicons name="shield-checkmark-outline" size={18} color={INDIGO} style={styles.infoIcon} />
          <View>
            <Text style={styles.infoLabel}>Role</Text>
            <Text style={styles.infoValue}>{user?.role || '—'}</Text>
          </View>
        </View>
      </View>

      {/* Change Password toggle */}
      <TouchableOpacity style={styles.actionBtn} onPress={() => setChangingPw(!changingPw)}>
        <Ionicons name="key-outline" size={18} color={INDIGO} />
        <Text style={styles.actionBtnText}>Change Password</Text>
        <Ionicons name={changingPw ? 'chevron-up' : 'chevron-down'} size={16} color="#6B7280" style={{ marginLeft: 'auto' }} />
      </TouchableOpacity>

      {changingPw && (
        <View style={styles.pwCard}>
          {[
            { placeholder: 'Current password', value: currentPw, setter: setCurrentPw },
            { placeholder: 'New password (min 6 chars)', value: newPw, setter: setNewPw },
            { placeholder: 'Confirm new password', value: confirmPw, setter: setConfirmPw },
          ].map((field, i) => (
            <View key={i} style={styles.inputRow}>
              <TextInput
                style={styles.input}
                placeholder={field.placeholder}
                placeholderTextColor="#9CA3AF"
                value={field.value}
                onChangeText={field.setter}
                secureTextEntry={!showPw}
                autoCapitalize="none"
              />
            </View>
          ))}
          <TouchableOpacity onPress={() => setShowPw(!showPw)} style={styles.showPwBtn}>
            <Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={16} color="#6B7280" />
            <Text style={styles.showPwText}>{showPw ? 'Hide' : 'Show'} passwords</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.submitBtn, busy && { opacity: 0.7 }]} onPress={handleChangePw} disabled={busy}>
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Update Password</Text>}
          </TouchableOpacity>
        </View>
      )}

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={18} color="#EF4444" />
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>

      <Text style={styles.version}>SDJ Marine Inventory v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root:         { flex: 1, backgroundColor: '#F3F4F6' },
  scroll:       { paddingBottom: 40 },
  header:       { backgroundColor: DARK, alignItems: 'center', paddingTop: 60, paddingBottom: 32, paddingHorizontal: 24 },
  avatar:       { width: 80, height: 80, borderRadius: 40, backgroundColor: INDIGO, justifyContent: 'center', alignItems: 'center', marginBottom: 12, borderWidth: 3, borderColor: '#ffffff33' },
  avatarText:   { fontSize: 28, fontWeight: '800', color: '#fff' },
  username:     { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 4 },
  role:         { fontSize: 13, color: '#A5B4FC', textTransform: 'capitalize', marginBottom: 2 },
  email:        { fontSize: 13, color: '#C7D2FE' },
  infoCard:     { backgroundColor: '#fff', margin: 16, borderRadius: 14, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  infoRow:      { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  infoIcon:     { marginRight: 14 },
  infoLabel:    { fontSize: 12, color: '#9CA3AF', marginBottom: 2 },
  infoValue:    { fontSize: 15, fontWeight: '600', color: '#111827', textTransform: 'capitalize' },
  actionBtn:    { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 2, borderRadius: 14, padding: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  actionBtnText:{ marginLeft: 12, fontSize: 15, fontWeight: '600', color: '#111827' },
  pwCard:       { backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 2, padding: 16, borderRadius: 14 },
  inputRow:     { borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 12, marginBottom: 10, backgroundColor: '#F9FAFB' },
  input:        { height: 46, fontSize: 14, color: '#111827' },
  showPwBtn:    { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  showPwText:   { marginLeft: 6, fontSize: 13, color: '#6B7280' },
  submitBtn:    { backgroundColor: INDIGO, borderRadius: 10, height: 46, justifyContent: 'center', alignItems: 'center' },
  submitBtnText:{ color: '#fff', fontSize: 15, fontWeight: '700' },
  logoutBtn:    { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2', marginHorizontal: 16, marginTop: 16, borderRadius: 14, padding: 16 },
  logoutText:   { marginLeft: 12, fontSize: 15, fontWeight: '700', color: '#EF4444' },
  version:      { textAlign: 'center', color: '#9CA3AF', fontSize: 12, marginTop: 24 },
});
