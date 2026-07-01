import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getStockUsed, getStockReturned, getStockReceived } from '../services/projectService';

const INDIGO  = '#4F46E5';
const DARK    = '#1E1B4B';
const GREEN   = '#10B981';
const AMBER   = '#F59E0B';
const PURPLE  = '#7C3AED';
const RED     = '#EF4444';

function Section({ title, color, icon, children }) {
  const [open, setOpen] = useState(true);
  return (
    <View style={styles.section}>
      <TouchableOpacity style={[styles.sectionHeader, { borderLeftColor: color }]} onPress={() => setOpen(!open)}>
        <Ionicons name={icon} size={18} color={color} style={{ marginRight: 8 }} />
        <Text style={[styles.sectionTitle, { color }]}>{title}</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color="#9CA3AF" style={{ marginLeft: 'auto' }} />
      </TouchableOpacity>
      {open && <View style={styles.sectionBody}>{children}</View>}
    </View>
  );
}

function InfoRow({ label, value }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || '—'}</Text>
    </View>
  );
}

function StockRow({ item, color }) {
  return (
    <View style={styles.stockRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.stockName}>{item.itemName || item.itemId || '—'}</Text>
        <Text style={styles.stockMeta}>
          {item.date ? new Date(item.date).toLocaleDateString() : ''}{item.purpose ? ` · ${item.purpose}` : ''}{item.reason ? ` · ${item.reason}` : ''}
        </Text>
      </View>
      <View style={[styles.qtyBadge, { backgroundColor: color + '22' }]}>
        <Text style={[styles.qtyText, { color }]}>{item.quantity} {item.unit || ''}</Text>
      </View>
    </View>
  );
}

export default function ProjectDetailScreen({ route, navigation }) {
  const { project } = route.params;
  const pid = project.projectId || project.id;

  const [stockUsed,     setStockUsed]     = useState([]);
  const [stockReturned, setStockReturned] = useState([]);
  const [stockReceived, setStockReceived] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [refreshing,    setRefreshing]    = useState(false);

  async function load(isRefresh = false) {
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);
      const [used, returned, received] = await Promise.all([
        getStockUsed(pid).catch(() => []),
        getStockReturned(pid).catch(() => []),
        getStockReceived(pid).catch(() => []),
      ]);
      setStockUsed(Array.isArray(used) ? used : used.records || []);
      setStockReturned(Array.isArray(returned) ? returned : returned.records || []);
      setStockReceived(Array.isArray(received) ? received : received.records || []);
    } finally {
      setLoading(false); setRefreshing(false);
    }
  }

  useEffect(() => { load(); }, [pid]);

  function statusColor(s) {
    const map = { active: GREEN, ongoing: GREEN, completed: '#3B82F6', pending: AMBER, cancelled: RED };
    return map[(s || '').toLowerCase()] || '#6B7280';
  }

  return (
    <View style={styles.root}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.topBarTitle} numberOfLines={1}>{project.projectName || project.name}</Text>
          <Text style={styles.topBarId}>{pid}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor(project.status) + '33' }]}>
          <Text style={[styles.statusText, { color: statusColor(project.status) }]}>{project.status}</Text>
        </View>
      </View>

      {loading
        ? <View style={styles.center}><ActivityIndicator size="large" color={INDIGO} /></View>
        : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={[INDIGO]} />}
        >
          {/* Project info */}
          <Section title="Project Details" color={INDIGO} icon="information-circle-outline">
            <InfoRow label="Vessel"    value={project.vessel} />
            <InfoRow label="Location"  value={project.location} />
            <InfoRow label="Start Date" value={project.startDate ? new Date(project.startDate).toLocaleDateString() : null} />
            <InfoRow label="End Date"   value={project.endDate   ? new Date(project.endDate  ).toLocaleDateString() : null} />
            <InfoRow label="Manager"    value={project.manager} />
            <InfoRow label="Description" value={project.description} />
          </Section>

          {/* Stock Received */}
          <Section title={`Stock Received (${stockReceived.length})`} color={GREEN} icon="arrow-down-circle-outline">
            {stockReceived.length === 0
              ? <Text style={styles.empty}>No stock received records.</Text>
              : stockReceived.flatMap((sub) =>
                  (sub.items || []).map((item, i) => (
                    <StockRow key={`${sub.id}-${i}`} item={{ ...item, date: sub.date, purpose: sub.submittedBy }} color={GREEN} />
                  ))
                )
            }
          </Section>

          {/* Stock Used */}
          <Section title={`Stock Used (${stockUsed.length})`} color={AMBER} icon="cube-outline">
            {stockUsed.length === 0
              ? <Text style={styles.empty}>No stock used records.</Text>
              : stockUsed.map((item, i) => <StockRow key={i} item={item} color={AMBER} />)
            }
          </Section>

          {/* Stock Returned */}
          <Section title={`Stock Returned (${stockReturned.length})`} color={PURPLE} icon="return-down-back-outline">
            {stockReturned.length === 0
              ? <Text style={styles.empty}>No stock returned records.</Text>
              : stockReturned.map((item, i) => <StockRow key={i} item={item} color={PURPLE} />)
            }
          </Section>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root:         { flex: 1, backgroundColor: '#F3F4F6' },
  center:       { flex: 1, justifyContent: 'center', alignItems: 'center' },
  topBar:       { backgroundColor: DARK, flexDirection: 'row', alignItems: 'center', padding: 16, paddingTop: 50, gap: 12 },
  backBtn:      { padding: 4 },
  topBarTitle:  { fontSize: 16, fontWeight: '700', color: '#fff' },
  topBarId:     { fontSize: 12, color: '#A5B4FC', marginTop: 2 },
  statusBadge:  { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText:   { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  scroll:       { padding: 12, paddingBottom: 32 },
  section:      { backgroundColor: '#fff', borderRadius: 14, marginBottom: 12, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  sectionHeader:{ flexDirection: 'row', alignItems: 'center', padding: 14, borderLeftWidth: 4 },
  sectionTitle: { fontSize: 14, fontWeight: '700' },
  sectionBody:  { padding: 14, paddingTop: 4 },
  infoRow:      { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  infoLabel:    { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  infoValue:    { fontSize: 13, color: '#111827', fontWeight: '600', maxWidth: '60%', textAlign: 'right' },
  stockRow:     { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  stockName:    { fontSize: 13, fontWeight: '600', color: '#111827' },
  stockMeta:    { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  qtyBadge:     { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  qtyText:      { fontSize: 12, fontWeight: '700' },
  empty:        { color: '#9CA3AF', textAlign: 'center', paddingVertical: 12, fontSize: 13 },
});
