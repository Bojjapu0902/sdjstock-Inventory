import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { forgotPassword, verifyOtp, resetPassword } from '../services/authService';

const INDIGO = '#4F46E5';
const DARK   = '#1E1B4B';

export default function ForgotPasswordScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [step, setStep]             = useState(1); // 1=email, 2=otp, 3=new password
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp]               = useState('');
  const [newPw, setNewPw]           = useState('');
  const [confirmPw, setConfirmPw]   = useState('');
  const [showPw, setShowPw]         = useState(false);
  const [busy, setBusy]             = useState(false);

  async function handleSendOtp() {
    if (!identifier.trim()) { Alert.alert('Error', 'Please enter your username or email.'); return; }
    setBusy(true);
    try {
      await forgotPassword(identifier);
      setStep(2);
    } catch (err) { Alert.alert('Error', err.message); }
    finally { setBusy(false); }
  }

  async function handleVerifyOtp() {
    if (!otp.trim()) { Alert.alert('Error', 'Please enter the OTP.'); return; }
    setBusy(true);
    try {
      await verifyOtp(identifier, otp);
      setStep(3);
    } catch (err) { Alert.alert('Error', err.message); }
    finally { setBusy(false); }
  }

  async function handleReset() {
    if (!newPw || newPw.length < 6) { Alert.alert('Error', 'Password must be at least 6 characters.'); return; }
    if (newPw !== confirmPw) { Alert.alert('Error', 'Passwords do not match.'); return; }
    setBusy(true);
    try {
      await resetPassword(identifier, otp, newPw);
      Alert.alert('Success', 'Password reset successfully! Please log in.', [
        { text: 'OK', onPress: () => navigation.navigate('Login') },
      ]);
    } catch (err) { Alert.alert('Error', err.message); }
    finally { setBusy(false); }
  }

  return (
    <KeyboardAvoidingView style={styles.root} behavior="padding">
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => step > 1 ? setStep(step - 1) : navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <View style={styles.card}>
          <Text style={styles.title}>Forgot Password</Text>

          {/* Step indicator */}
          <View style={styles.steps}>
            {[1, 2, 3].map((s) => (
              <React.Fragment key={s}>
                <View style={[styles.stepCircle, step >= s && styles.stepActive]}>
                  <Text style={[styles.stepNum, step >= s && styles.stepNumActive]}>{s}</Text>
                </View>
                {s < 3 && <View style={[styles.stepLine, step > s && styles.stepLineActive]} />}
              </React.Fragment>
            ))}
          </View>
          <Text style={styles.stepLabel}>
            {step === 1 ? 'Enter Email / Username' : step === 2 ? 'Verify OTP' : 'Set New Password'}
          </Text>

          {step === 1 && (
            <>
              <Text style={styles.desc}>Enter your username or email address and we'll send an OTP to it.</Text>
              <View style={styles.inputRow}>
                <Ionicons name="mail-outline" size={18} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Username or email"
                  placeholderTextColor="#9CA3AF"
                  value={identifier}
                  onChangeText={setIdentifier}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
              <TouchableOpacity style={[styles.btn, busy && { opacity: 0.7 }]} onPress={handleSendOtp} disabled={busy}>
                {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Send OTP</Text>}
              </TouchableOpacity>
            </>
          )}

          {step === 2 && (
            <>
              <Text style={styles.desc}>Enter the 6-digit OTP sent to your email.</Text>
              <View style={styles.inputRow}>
                <Ionicons name="key-outline" size={18} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter OTP"
                  placeholderTextColor="#9CA3AF"
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="number-pad"
                  maxLength={6}
                />
              </View>
              <TouchableOpacity style={[styles.btn, busy && { opacity: 0.7 }]} onPress={handleVerifyOtp} disabled={busy}>
                {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Verify OTP</Text>}
              </TouchableOpacity>
            </>
          )}

          {step === 3 && (
            <>
              <Text style={styles.desc}>Choose a strong new password.</Text>
              <View style={styles.inputRow}>
                <Ionicons name="lock-closed-outline" size={18} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="New password"
                  placeholderTextColor="#9CA3AF"
                  value={newPw}
                  onChangeText={setNewPw}
                  secureTextEntry={!showPw}
                />
                <TouchableOpacity onPress={() => setShowPw(!showPw)}>
                  <Ionicons name={showPw ? 'eye-off-outline' : 'eye-outline'} size={18} color="#6B7280" />
                </TouchableOpacity>
              </View>
              <View style={[styles.inputRow, { marginTop: 12 }]}>
                <Ionicons name="lock-closed-outline" size={18} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Confirm password"
                  placeholderTextColor="#9CA3AF"
                  value={confirmPw}
                  onChangeText={setConfirmPw}
                  secureTextEntry={!showPw}
                />
              </View>
              <TouchableOpacity style={[styles.btn, busy && { opacity: 0.7 }]} onPress={handleReset} disabled={busy}>
                {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Reset Password</Text>}
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root:         { flex: 1, backgroundColor: DARK },
  scroll:       { flexGrow: 1, paddingHorizontal: 24 },
  backBtn:      { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  backText:     { color: '#fff', fontSize: 16, marginLeft: 4 },
  card:         { backgroundColor: '#fff', borderRadius: 20, padding: 28 },
  title:        { fontSize: 22, fontWeight: '700', color: DARK, marginBottom: 20, textAlign: 'center' },
  steps:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  stepCircle:   { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: '#D1D5DB', justifyContent: 'center', alignItems: 'center' },
  stepActive:   { borderColor: INDIGO, backgroundColor: INDIGO },
  stepNum:      { fontSize: 13, fontWeight: '700', color: '#9CA3AF' },
  stepNumActive:{ color: '#fff' },
  stepLine:     { flex: 1, height: 2, backgroundColor: '#E5E7EB', marginHorizontal: 6 },
  stepLineActive:{ backgroundColor: INDIGO },
  stepLabel:    { textAlign: 'center', fontSize: 13, color: '#6B7280', marginBottom: 16 },
  desc:         { fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 20 },
  inputRow:     { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 12, backgroundColor: '#F9FAFB', marginBottom: 4 },
  inputIcon:    { marginRight: 8 },
  input:        { height: 46, fontSize: 15, color: '#111827' },
  btn:          { backgroundColor: INDIGO, borderRadius: 12, height: 50, justifyContent: 'center', alignItems: 'center', marginTop: 20 },
  btnText:      { color: '#fff', fontSize: 16, fontWeight: '700' },
});
