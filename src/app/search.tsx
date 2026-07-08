import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { AssetImage } from '../components/AssetImage';
import { Field, Header, Screen } from '../components/HealthClanUI';
import { SpecialtyIcon } from '../components/SpecialtyIcon';
import { colors } from '../constants/healthclanDesign';
import { getSpecialtyByName, specialties, type SpecialtyName } from '../constants/doctors';
import { healthclanApi } from '../lib/api';
import { formatDoctor, type AppDoctor } from '../lib/doctor-format';

const suggestions = ['Heart pain', 'Skin rash', 'Fever', 'Pregnancy', 'Tooth pain', 'Back pain'];
const specialtySuggestions = ['Cardiology', 'Dermatology', 'General Medicine', 'Gynecology', 'Dentistry'];

export default function Search() {
  const params = useLocalSearchParams();
  const backTo = params.from === 'profile' ? '/profile' : '/';
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AppDoctor[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const normalized = query.trim().toLowerCase();

  async function toggleFavorite(doctorId: string) {
    if (!doctorId) return;

    const isFavorite = favoriteIds.includes(doctorId);
    if (isFavorite) {
      await healthclanApi.users.removeFavorite(doctorId);
      setFavoriteIds(ids => ids.filter(id => id !== doctorId));
      return;
    }

    await healthclanApi.users.addFavorite(doctorId);
    setFavoriteIds(ids => [doctorId, ...ids]);
  }

  useEffect(() => {
    const handle = setTimeout(() => {
      setLoading(true);
      setMessage('');
      const request = healthclanApi.doctors.list(normalized ? { search: normalized } : {});

      request
        .then(items => setResults((Array.isArray(items) ? items : []).map(formatDoctor).slice(0, normalized ? 12 : 6)))
        .catch(error => {
          setResults([]);
          setMessage(error instanceof Error ? error.message : 'Unable to search doctors.');
        })
        .finally(() => setLoading(false));
    }, 250);

    return () => clearTimeout(handle);
  }, [normalized]);

  useEffect(() => {
    healthclanApi.users.favorites()
      .then(items => setFavoriteIds(items.map(item => String(item?.doctor?._id || item?.doctor?.id || item?.doctor))))
      .catch(() => setFavoriteIds([]));
  }, []);

  return (
    <Screen>
      <Header title="Search" backTo={backTo} />
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Search care faster</Text>
        <Text style={styles.heroSub}>Find doctors by name, specialty, symptom, location, or video service.</Text>
      </View>
      <Field placeholder="Search doctors, specialties, or symptoms" value={query} onChangeText={setQuery} />
      {!!message && <Text style={styles.error}>{message}</Text>}
      <Text style={styles.label}>Specialties</Text>
      <View style={styles.chips}>
        {specialtySuggestions.map(item => (
          <Pressable
            key={item}
            style={styles.chip}
            onPress={() => {
              const specialty = getSpecialtyByName(item);
              router.push({ pathname: '/eachspec', params: { specialty: specialty.slug } } as any);
            }}
          >
            <Text style={styles.chipText}>{item}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.label}>Common symptoms</Text>
      <View style={styles.chips}>
        {suggestions.map(item => (
          <Pressable key={item} style={styles.symptomChip} onPress={() => setQuery(item)}>
            <Text style={styles.symptomChipText}>{item}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.section}>{normalized ? `${results.length} result${results.length === 1 ? '' : 's'}` : 'Recommended Doctors'}</Text>
      <View style={styles.list}>
        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.teal} />
            <Text style={styles.loadingText}>Searching doctors...</Text>
          </View>
        ) : results.map(doctor => {
          const isFavorite = favoriteIds.includes(doctor.id);

          return (
            <View key={doctor.id} style={styles.result}>
              <Pressable
                style={styles.resultMain}
                onPress={() => router.push({ pathname: '/doctor-profile', params: { doctorId: doctor.id } } as any)}
              >
                <AssetImage source={doctor.image} style={styles.avatar} resizeMode="cover" />
                <View style={styles.copy}>
                  <View style={styles.nameLine}>
                    <SpecialtyIcon name={doctor.specialty as SpecialtyName} size={24} />
                    <Text style={styles.name}>{doctor.name}</Text>
                  </View>
                  <Text style={styles.meta}>{doctor.specialty} - {doctor.location}</Text>
                  <Text style={styles.bio} numberOfLines={2}>{doctor.bio}</Text>
                </View>
                <Text style={styles.rating}>★ {doctor.rating}</Text>
              </Pressable>
              <Pressable style={[styles.favorite, isFavorite && styles.favoriteActive]} onPress={() => toggleFavorite(doctor.id)}>
                <Text style={[styles.favoriteText, isFavorite && styles.favoriteTextActive]}>{isFavorite ? '♥' : '♡'}</Text>
              </Pressable>
            </View>
          );
        })}
        {!loading && results.length === 0 ? (
          <View style={styles.empty}>
            <AssetImage source={require('../../assets/images/default-doctor-illustration.png')} style={styles.emptyImage} resizeMode="contain" />
            <Text style={styles.emptyTitle}>{normalized ? 'No doctors found' : 'No recommended doctors yet'}</Text>
            <Text style={styles.emptySub}>Try a specialty, location, or symptom. You can also browse every available doctor.</Text>
            <Pressable style={styles.emptyButton} onPress={() => router.push({ pathname: '/eachspec', params: { specialty: 'all' } } as any)}>
              <Text style={styles.emptyButtonText}>Browse all doctors</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { borderRadius: 24, backgroundColor: colors.teal, padding: 18, marginBottom: 14 },
  heroTitle: { color: colors.white, fontFamily: 'Poppins', fontSize: 24, lineHeight: 30, fontWeight: '900' },
  heroSub: { color: 'rgba(255,255,255,0.84)', fontFamily: 'Poppins', fontSize: 13, lineHeight: 20, fontWeight: '700', marginTop: 7 },
  label: { color: colors.muted, fontFamily: 'Poppins', fontSize: 12, fontWeight: '900', marginTop: 14, marginBottom: 8, textTransform: 'uppercase' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  chip: { borderRadius: 999, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 12, paddingVertical: 8 },
  chipText: { color: colors.teal, fontFamily: 'Poppins', fontSize: 12, fontWeight: '900' },
  symptomChip: { borderRadius: 999, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 12, paddingVertical: 8 },
  symptomChipText: { color: colors.ink, fontFamily: 'Poppins', fontSize: 12, fontWeight: '900' },
  section: { color: colors.ink, fontFamily: 'Poppins', fontSize: 20, fontWeight: '900', marginTop: 16, marginBottom: 12 },
  list: { gap: 12 },
  loading: { minHeight: 180, borderRadius: 22, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 18 },
  loadingText: { color: colors.muted, fontFamily: 'Poppins', fontSize: 13, fontWeight: '800', textAlign: 'center' },
  result: { borderRadius: 18, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  resultMain: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 58, height: 58, borderRadius: 20, backgroundColor: colors.panel },
  copy: { flex: 1, minWidth: 0 },
  nameLine: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  name: { color: colors.ink, fontFamily: 'Poppins', fontSize: 15, fontWeight: '900' },
  meta: { color: colors.teal, fontFamily: 'Poppins', fontSize: 12, fontWeight: '800', marginTop: 3 },
  bio: { color: colors.muted, fontFamily: 'Poppins', fontSize: 11, lineHeight: 16, fontWeight: '700', marginTop: 4 },
  rating: { color: colors.teal, fontFamily: 'Poppins', fontSize: 12, fontWeight: '900' },
  favorite: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.panel, alignItems: 'center', justifyContent: 'center' },
  favoriteActive: { backgroundColor: colors.teal },
  favoriteText: { color: colors.teal, fontSize: 22, lineHeight: 26, fontWeight: '900' },
  favoriteTextActive: { color: colors.white },
  empty: { borderRadius: 22, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, padding: 18, alignItems: 'center' },
  emptyImage: { width: 112, height: 112, marginBottom: 8 },
  emptyTitle: { color: colors.ink, fontFamily: 'Poppins', fontSize: 16, fontWeight: '900' },
  emptySub: { color: colors.muted, fontFamily: 'Poppins', fontSize: 12, lineHeight: 18, fontWeight: '700', marginTop: 4, textAlign: 'center' },
  emptyButton: { minHeight: 42, borderRadius: 14, backgroundColor: colors.teal, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, marginTop: 12 },
  emptyButtonText: { color: colors.white, fontFamily: 'Poppins', fontSize: 12, fontWeight: '900' },
  error: { color: '#B42318', fontFamily: 'Poppins', fontSize: 12, fontWeight: '800', marginTop: 10, textAlign: 'center' },
});
