import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { BottomTabs, Header, Screen } from '../components/HealthClanUI';
import { SpecialtyIcon } from '../components/SpecialtyIcon';
import { colors } from '../constants/healthclanDesign';
import { specialties } from '../constants/doctors';
import { healthclanApi } from '../lib/api';
import { slugify } from '../lib/doctor-format';

export default function Specialties() {
  const [apiSpecialties, setApiSpecialties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  function loadSpecialties() {
    setLoading(true);
    setMessage('');
    healthclanApi.doctors.specialties()
      .then(items => setApiSpecialties(Array.isArray(items) ? items : []))
      .catch(error => {
        setApiSpecialties([]);
        setMessage(error instanceof Error ? error.message : 'Unable to load specialties.');
      })
      .finally(() => setLoading(false));
  }

  useEffect(loadSpecialties, []);

  const countBySlug = new Map(
    apiSpecialties.map(item => [slugify(item.name || ''), Number(item.doctors || item.count || 0)])
  );
  const localSpecialties = specialties.map(item => ({
    ...item,
    count: countBySlug.get(item.slug) || 0,
  }));
  const extraSpecialties = apiSpecialties
    .filter(item => !specialties.some(specialty => specialty.slug === slugify(item.name || '')))
    .map(item => ({
      name: item.name || 'General Medicine',
      slug: slugify(item.name || 'general-medicine'),
      summary: 'Verified HealthClan doctors available for video visits.',
      count: Number(item.doctors || item.count || 0),
    }));
  const visibleSpecialties = [...localSpecialties, ...extraSpecialties];

  return (
    <View style={styles.wrap}>
      <Screen bottom={104}>
        <Header title="Specialties" />
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Find the right specialist</Text>
          <Text style={styles.heroSub}>Choose a care area, compare doctors, then book a slot or start a video visit.</Text>
        </View>
        <View style={styles.tools}>
          <Pressable style={styles.search} onPress={() => router.push('/search' as any)}>
            <Text style={styles.searchText}>Search specialty or symptom</Text>
          </Pressable>
          <Pressable style={styles.filter} onPress={() => router.push('/doctor-filter' as any)}>
            <Text style={styles.filterText}>Filter</Text>
          </Pressable>
        </View>
        <Pressable style={styles.allCard} onPress={() => router.push({ pathname: '/eachspec', params: { specialty: 'all' } } as any)}>
          <View style={styles.allIcon}>
            <Text style={styles.allIconText}>+</Text>
          </View>
          <View style={styles.allCopy}>
            <Text style={styles.allTitle}>Browse all doctors</Text>
            <Text style={styles.allSub}>See every available doctor across specialties.</Text>
          </View>
          <Text style={styles.allArrow}>›</Text>
        </Pressable>
        {loading ? (
          <View style={styles.loadingPanel}>
            <ActivityIndicator color={colors.teal} />
            <Text style={styles.loadingText}>Loading specialties...</Text>
          </View>
        ) : message ? (
          <View style={styles.emptyPanel}>
            <Text style={styles.emptyTitle}>Specialties unavailable</Text>
            <Text style={styles.emptyCopy}>{message}</Text>
            <Pressable style={styles.retryButton} onPress={loadSpecialties}>
              <Text style={styles.retryText}>Try again</Text>
            </Pressable>
          </View>
        ) : null}
        <View style={styles.grid}>
          {!loading && visibleSpecialties.map(specialty => {
            return (
            <Pressable
              key={specialty.slug}
              style={styles.card}
              onPress={() => router.push({ pathname: '/eachspec', params: { specialty: specialty.slug } } as any)}
            >
              <View style={styles.image}>
                <SpecialtyIcon name={specialty.name} size={58} />
              </View>
              <Text style={styles.name}>{specialty.name}</Text>
              <Text style={styles.summary}>{specialty.summary}</Text>
              <Text style={styles.count}>{specialty.count} doctors</Text>
            </Pressable>
            );
          })}
        </View>
      </Screen>
      <BottomTabs active="doctors" />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  hero: { borderRadius: 24, backgroundColor: colors.teal, padding: 20, marginBottom: 14 },
  heroTitle: { color: colors.white, fontFamily: 'Poppins', fontSize: 26, lineHeight: 32, fontWeight: '900' },
  heroSub: { color: 'rgba(255,255,255,0.84)', fontFamily: 'Poppins', fontSize: 13, lineHeight: 20, fontWeight: '700', marginTop: 8 },
  tools: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  search: { flex: 1, minHeight: 50, borderRadius: 16, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, justifyContent: 'center', paddingHorizontal: 14 },
  searchText: { color: colors.muted, fontFamily: 'Poppins', fontSize: 13, fontWeight: '700' },
  filter: { minWidth: 86, borderRadius: 16, backgroundColor: colors.panel, alignItems: 'center', justifyContent: 'center' },
  filterText: { color: colors.teal, fontFamily: 'Poppins', fontSize: 13, fontWeight: '900' },
  allCard: { minHeight: 82, borderRadius: 20, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  allIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: colors.panel, alignItems: 'center', justifyContent: 'center' },
  allIconText: { color: colors.teal, fontFamily: 'Poppins', fontSize: 26, lineHeight: 30, fontWeight: '900' },
  allCopy: { flex: 1, minWidth: 0 },
  allTitle: { color: colors.ink, fontFamily: 'Poppins', fontSize: 15, fontWeight: '900' },
  allSub: { color: colors.muted, fontFamily: 'Poppins', fontSize: 12, lineHeight: 17, fontWeight: '700', marginTop: 3 },
  allArrow: { color: colors.teal, fontSize: 28, fontWeight: '800' },
  loadingPanel: { minHeight: 170, borderRadius: 22, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 14 },
  loadingText: { color: colors.muted, fontFamily: 'Poppins', fontSize: 13, fontWeight: '800' },
  emptyPanel: { minHeight: 180, borderRadius: 22, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 18, marginBottom: 14 },
  emptyTitle: { color: colors.ink, fontFamily: 'Poppins', fontSize: 18, fontWeight: '900', textAlign: 'center' },
  emptyCopy: { color: colors.muted, fontFamily: 'Poppins', fontSize: 12, lineHeight: 18, fontWeight: '700', textAlign: 'center' },
  retryButton: { minHeight: 42, borderRadius: 14, backgroundColor: colors.teal, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  retryText: { color: colors.white, fontFamily: 'Poppins', fontSize: 12, fontWeight: '900' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, alignItems: 'stretch' },
  card: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 156,
    maxWidth: 210,
    height: 188,
    borderRadius: 18,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  image: { width: 58, height: 58, marginBottom: 10 },
  name: { color: colors.ink, fontFamily: 'Poppins', fontSize: 13, lineHeight: 17, fontWeight: '900', textAlign: 'center' },
  summary: { color: colors.muted, fontFamily: 'Poppins', fontSize: 10, lineHeight: 14, fontWeight: '700', textAlign: 'center', marginTop: 5 },
  count: { color: colors.teal, fontFamily: 'Poppins', fontSize: 11, fontWeight: '800', marginTop: 5, textAlign: 'center' },
});
