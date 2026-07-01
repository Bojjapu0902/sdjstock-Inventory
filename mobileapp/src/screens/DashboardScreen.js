import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getProjects } from '../services/projectService';
import api from '../services/api';

const INDIGO = '#4F46E5';
const DARK   = '#1E1B4B';

function KpiCard({ icon, label, value, color, bg }) {
  return (
    <View style={[styles.kpi, { backgroundColor: bg }]}>
      <View style={[styles.kpiIcon, { backgroundColor: color + '22' }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={[styles.kpiVal, { color }]}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
    </View>
  );
}

export default function DashboardScreen() {
  const [projects,   setProjects]  = useState([]);
  const [inventory,  setInventory] = useState([]);
  const [loading,    setLoading]   = useState(true);
  const [refreshing, setRefreshing]= useState(false);

  async function load(refresh = false) {
    try {
      refresh ? setRefreshing(true) : setLoading(true);
      const [proj, inv] = await Promise.all([
        getProjects(),
        api.get('/inventory'),
      ]);
      setProjects(Array.isArray(proj) ? proj : proj.projects || []);
      setInventory(Array.isArray(inv) ? inv : inv.items || []);
    } catch (err) {
      console.warn('Dashboard load error:', err.message);
    } finally {
      setLoading(false); setRefreshing(false);
    }
  }

  useEffect(() => { load(); }, []);

  const activeProjects  = projects.filter((p) => p.status === 'active' || p.status === 'ongoing').length;
  const totalItems      = inventory.length;
  const lowStock        = inventory.filter((i) => (i.quantity || 0) <= (i.minQuantity || 0)).length;
  const recentProjects  = [...projects].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 5);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={INDIGO} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.scroll}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={[INDIGO]} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Dashboard</Text>
          <Text style={styles.headerSub}>SDJ Marine Inventory</Text>
        </View>
        <View style={styles.headerLogo}>
          <Text style={styles.headerLogoText}>SDJ</Text>
        </View>
      </View>

      {/* KPI row */}
      <View style={styles.kpiRow}>
        <KpiCard icon="folder-open" label="Projects"      value={projects.length} color={INDIGO}    bg="#EEF2FF" />
        <KpiCard icon="flash"       label="Active"        value={activeProjects}  color="#10B981"   bg="#ECFDF5" />
        <KpiCard icon="cube"        label="Items"         value={totalItems}      color="#F59E0B"   bg="#FFFBEB" />
        <KpiCard icon="warning"     label="Low Stock"     value={lowStock}        color="#EF4444"   bg="#FEF2F2" />
      </View>

      {/* Recent Projects */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Projects</Text>
        {recentProjects.length === 0
          ? <Text style={styles.empty}>No projects yet.</Text>
          : recentProjects.map((p) => (
            <View key={p.id || p._id} style={styles.projectRow}>
              <View style={styles.projectDot} />
              <View style={{ flex: 1 }}>
                <Text style={styles.projectName}>{p.projectName || p.name}</Text>
                <Text style={styles.projectMeta}>{p.vessel || p.location || '—'} · {p.status}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: statusColor(p.status) + '22' }]}>
                <Text style={[styles.statusText, { color: statusColor(p.status) }]}>{p.status}</Text>
              </View>
            </View>
          ))
        }
      </View>
    </ScrollView>
  );
}

function statusColor(s) {
  const map = { active: '#10B981', ongoing: '#10B981', completed: '#3B82F6', pending: '#F59E0B', cancelled: '#EF4444' };
  return map[(s || '').toLowerCase()] || '#6B7280';
}

const styles = StyleSheet.create({
  root:         { flex: 1, backgroundColor: '#F3F4F6' },
  scroll:       { padding: 16, paddingBottom: 32 },
  center:       { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6' },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: DARK, borderRadius: 16, padding: 18, marginBottom: 16 },
  headerTitle:  { fontSize: 22, fontWeight: '800', color: '#fff' },
  headerSub:    { fontSize: 13, color: '#A5B4FC', marginTop: 2 },
  headerLogo:   { width: 48, height: 48, borderRadius: 12, backgroundColor: INDIGO, justifyContent: 'center', alignItems: 'center' },
  headerLogoText: { color: '#fff', fontWeight: '800', fontSize: 14, letterSpacing: 1 },
  kpiRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  kpi:          { flex: 1, minWidth: '44%', borderRadius: 14, padding: 14, alignItems: 'center' },
  kpiIcon:      { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  kpiVal:       { fontSize: 26, fontWeight: '800', marginBottom: 2 },
  kpiLabel:     { fontSize: 12, color: '#6B7280', fontWeight: '500' },
  section:      { backgroundColor: '#fff', borderRadius: 16, padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: DARK, marginBottom: 12 },
  empty:        { color: '#9CA3AF', textAlign: 'center', paddingVertical: 12 },
  projectRow:   { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  projectDot:   { width: 8, height: 8, borderRadius: 4, backgroundColor: INDIGO, marginRight: 12 },
  projectName:  { fontSize: 14, fontWeight: '600', color: '#111827' },
  projectMeta:  { fontSize: 12, color: '#6B7280', marginTop: 2 },
  statusBadge:  { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  statusText:   { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
});
