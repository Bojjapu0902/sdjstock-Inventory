import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  TextInput, RefreshControl, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import api from '../services/api';

const INDIGO = '#4F46E5';
const DARK   = '#1E1B4B';

const FILTERS = [
  { key: 'all', label: 'All Items' },
  { key: 'low', label: 'Low Stock' },
];

function isLowStock(i) {
  const qty = i.quantity ?? i.currentStock ?? 0;
  const min = i.minQuantity ?? i.minStock ?? 0;
  return qty <= min;
}

export default function InventoryScreen({ route }) {
  const insets = useSafeAreaInsets();
  const [items,      setItems]      = useState([]);
  const [filtered,   setFiltered]   = useState([]);
  const [search,     setSearch]     = useState('');
  const [filter,     setFilter]     = useState(route?.params?.filter || 'all');
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load(isRefresh = false) {
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);
      const data = await api.get('/inventory');
      const list = Array.isArray(data) ? data : data.items || [];
      setItems(list);
      setFiltered(list);
    } catch (err) { console.warn(err.message); }
    finally { setLoading(false); setRefreshing(false); }
  }

  useFocusEffect(useCallback(() => { load(); }, []));

  // Dashboard KPI cards pass a filter via route params
  useEffect(() => {
    if (route?.params?.filter) setFilter(route.params.filter);
  }, [route?.params]);

  useEffect(() => {
    const q = search.trim().toLowerCase();
    setFiltered(items.filter((i) =>
      (filter !== 'low' || isLowStock(i)) && (!q ||
        (i.itemName || i.name || '').toLowerCase().includes(q) ||
        (i.category || '').toLowerCase().includes(q))
    ));
  }, [search, items, filter]);

  function stockStatus(item) {
    const qty  = item.quantity  || item.currentStock || 0;
    const min  = item.minQuantity || item.minStock || 0;
    if (qty === 0)   return { label: 'Out', color: '#EF4444', bg: '#FEF2F2' };
    if (qty <= min)  return { label: 'Low',  color: '#F59E0B', bg: '#FFFBEB' };
    return               { label: 'OK',   color: '#10B981', bg: '#ECFDF5' };
  }

  function renderItem({ item }) {
    const s = stockStatus(item);
    return (
      <View style={styles.card}>
        <View style={styles.cardLeft}>
          <View style={styles.iconBox}>
            <Ionicons name="cube-outline" size={20} color={INDIGO} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.itemName} numberOfLines={1}>{item.itemName || item.name}</Text>
            <Text style={styles.itemMeta}>{item.category || 'General'} · {item.unit || 'pcs'}</Text>
          </View>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.qty}>{item.quantity ?? item.currentStock ?? 0}</Text>
          <View style={[styles.statusPill, { backgroundColor: s.bg }]}>
            <Text style={[styles.statusLabel, { color: s.color }]}>{s.label}</Text>
          </View>
        </View>
      </View>
    );
  }

  const lowStockCount = items.filter(isLowStock).length;

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View>
          <Text style={styles.headerTitle}>Inventory</Text>
          <Text style={styles.headerSub}>{items.length} items · {lowStockCount} low stock</Text>
        </View>
        <View style={styles.warnBadge}>
          <Ionicons name="warning-outline" size={14} color="#F59E0B" />
          <Text style={styles.warnText}>{lowStockCount}</Text>
        </View>
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={18} color="#9CA3AF" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search inventory..."
          placeholderTextColor="#9CA3AF"
          value={search}
          onChangeText={setSearch}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.chipRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.chip, filter === f.key && styles.chipActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[styles.chipText, filter === f.key && styles.chipTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading
        ? <View style={styles.center}><ActivityIndicator size="large" color={INDIGO} /></View>
        : (
        <FlatList
          data={filtered}
          keyExtractor={(item, i) => String(item._id || item.id || i)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={[INDIGO]} />}
          ListEmptyComponent={<Text style={styles.empty}>No items found.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root:        { flex: 1, backgroundColor: '#F3F4F6' },
  center:      { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header:      { backgroundColor: DARK, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
  headerSub:   { fontSize: 13, color: '#A5B4FC', marginTop: 2 },
  warnBadge:   { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFBEB', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, gap: 4 },
  warnText:    { fontSize: 14, fontWeight: '700', color: '#F59E0B' },
  searchBox:   { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', margin: 12, borderRadius: 12, paddingHorizontal: 14, height: 46, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  searchInput: { flex: 1, fontSize: 15, color: '#111827' },
  chipRow:     { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 8, gap: 8 },
  chip:        { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB' },
  chipActive:  { backgroundColor: INDIGO, borderColor: INDIGO },
  chipText:    { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  chipTextActive: { color: '#fff' },
  list:        { paddingHorizontal: 12, paddingBottom: 24 },
  card:        { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  cardLeft:    { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 },
  iconBox:     { width: 40, height: 40, borderRadius: 10, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  itemName:    { fontSize: 14, fontWeight: '600', color: '#111827' },
  itemMeta:    { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  qty:         { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 4 },
  statusPill:  { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  statusLabel: { fontSize: 11, fontWeight: '700' },
  empty:       { textAlign: 'center', color: '#9CA3AF', marginTop: 40 },
});
