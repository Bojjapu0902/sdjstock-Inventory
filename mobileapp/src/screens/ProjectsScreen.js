import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  TextInput, RefreshControl, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { getProjects } from '../services/projectService';

const INDIGO = '#4F46E5';
const DARK   = '#1E1B4B';

function statusColor(s) {
  const map = { active: '#10B981', ongoing: '#10B981', completed: '#3B82F6', pending: '#F59E0B', cancelled: '#EF4444' };
  return map[(s || '').toLowerCase()] || '#6B7280';
}

export default function ProjectsScreen({ navigation }) {
  const [projects,   setProjects]   = useState([]);
  const [filtered,   setFiltered]   = useState([]);
  const [search,     setSearch]     = useState('');
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load(isRefresh = false) {
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);
      const data = await getProjects();
      const list = Array.isArray(data) ? data : data.projects || [];
      setProjects(list);
      setFiltered(list);
    } catch (err) {
      console.warn(err.message);
    } finally {
      setLoading(false); setRefreshing(false);
    }
  }

  useFocusEffect(useCallback(() => { load(); }, []));

  useEffect(() => {
    if (!search.trim()) { setFiltered(projects); return; }
    const q = search.toLowerCase();
    setFiltered(projects.filter((p) =>
      (p.projectName || p.name || '').toLowerCase().includes(q) ||
      (p.projectId   || p.id   || '').toLowerCase().includes(q) ||
      (p.vessel      || '').toLowerCase().includes(q)
    ));
  }, [search, projects]);

  function renderItem({ item }) {
    const sc = statusColor(item.status);
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('ProjectDetail', { project: item })}
        activeOpacity={0.8}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardIdBadge}>
            <Text style={styles.cardId}>{item.projectId || item.id}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: sc + '22' }]}>
            <Text style={[styles.statusText, { color: sc }]}>{item.status}</Text>
          </View>
        </View>
        <Text style={styles.cardName} numberOfLines={1}>{item.projectName || item.name}</Text>
        <View style={styles.cardMeta}>
          <Ionicons name="boat-outline" size={13} color="#9CA3AF" />
          <Text style={styles.cardMetaText}>{item.vessel || '—'}</Text>
          <Ionicons name="calendar-outline" size={13} color="#9CA3AF" style={{ marginLeft: 12 }} />
          <Text style={styles.cardMetaText}>{item.startDate ? new Date(item.startDate).toLocaleDateString() : '—'}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={INDIGO} /></View>;

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Projects</Text>
        <Text style={styles.headerCount}>{projects.length} total</Text>
      </View>

      {/* Search */}
      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={18} color="#9CA3AF" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search projects..."
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

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id || item._id)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={[INDIGO]} />}
        ListEmptyComponent={<Text style={styles.empty}>No projects found.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root:         { flex: 1, backgroundColor: '#F3F4F6' },
  center:       { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6' },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: DARK, padding: 20, paddingTop: 50 },
  headerTitle:  { fontSize: 22, fontWeight: '800', color: '#fff' },
  headerCount:  { fontSize: 14, color: '#A5B4FC' },
  searchBox:    { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', margin: 12, borderRadius: 12, paddingHorizontal: 14, height: 46, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  searchInput:  { flex: 1, fontSize: 15, color: '#111827' },
  list:         { paddingHorizontal: 12, paddingBottom: 24 },
  card:         { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  cardHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardIdBadge:  { backgroundColor: '#EEF2FF', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  cardId:       { fontSize: 11, fontWeight: '700', color: INDIGO },
  statusBadge:  { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  statusText:   { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  cardName:     { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 8 },
  cardMeta:     { flexDirection: 'row', alignItems: 'center' },
  cardMetaText: { fontSize: 12, color: '#9CA3AF', marginLeft: 4 },
  empty:        { textAlign: 'center', color: '#9CA3AF', marginTop: 40 },
});
