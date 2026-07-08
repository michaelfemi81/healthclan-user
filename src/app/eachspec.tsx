import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { AssetImage } from '../components/AssetImage';
import { Header, PrimaryButton, Screen } from '../components/HealthClanUI';
import { SpecialtyIcon } from '../components/SpecialtyIcon';
import { colors } from '../constants/healthclanDesign';
import { getSpecialtyBySlug, type SpecialtyName } from '../constants/doctors';
import { healthclanApi } from '../lib/api';
import { formatDoctor, type AppDoctor } from '../lib/doctor-format';

export default function EachSpec() {
  const { width } = useWindowDimensions();
  const params = useLocalSearchParams();
  const isWide = width >= 760;
  const isAllSpecialties = params.specialty === 'all';
  const specialty = getSpecialtyBySlug(params.specialty);
  const selectedAvailability = Array.isArray(params.availability) ? params.availability[0] : params.availability;
  const selectedRating = Array.isArray(params.rating) ? params.rating[0] : params.rating;
  const [activeChip, setActiveChip] = useState('Available today');
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [doctors, setDoctors] = useState<AppDoctor[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const minimumRating = selectedRating?.endsWith('+') ? Number(selectedRating.replace('+', '')) : 0;
  const hasRatingFilter = minimumRating > 0;
  const visibleDoctors = doctors
    .filter(doctor => {
      if (!hasRatingFilter) return true;
      const rating = Number(doctor.rating);
      return !Number.isNaN(rating) && rating >= minimumRating;
    })
    .slice(0, isAllSpecialties ? 12 : doctors.length);

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

  async function loadDoctors() {
    setLoading(true);
    setMessage('');
    try {
      const items = await healthclanApi.doctors.list({
        specialty: isAllSpecialties ? undefined : specialty.name,
        minRating: minimumRating || undefined,
      });
      let formatted = (Array.isArray(items) ? items : []).map(formatDoctor);

      if (!isAllSpecialties && formatted.length === 0) {
        const fallbackItems = await healthclanApi.doctors.list({
          minRating: minimumRating || undefined,
        });
        formatted = (Array.isArray(fallbackItems) ? fallbackItems : [])
          .map(formatDoctor)
          .filter(doctor => String(doctor.specialty).toLowerCase() === specialty.name.toLowerCase());
      }

      setDoctors(formatted);
    } catch (error) {
      setDoctors([]);
      setMessage(error instanceof Error ? error.message : 'Unable to load doctors.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDoctors();
  }, [isAllSpecialties, specialty.name, minimumRating]);

  useEffect(() => {
    healthclanApi.users.favorites()
      .then(items => setFavoriteIds(items.map(item => String(item?.doctor?._id || item?.doctor?.id || item?.doctor))))
      .catch(() => setFavoriteIds([]));
  }, []);

  return (
    <Screen>
      <Header title="Doctors" backTo="/specialties" />
      <View style={styles.summary}>
        <View style={styles.summaryCopy}>
          <View style={styles.summaryIcon}>
            <SpecialtyIcon name={specialty.name} size={56} />
          </View>
          <Text style={styles.summaryLabel}>{isAllSpecialties ? 'All specialties' : specialty.name}</Text>
          <Text style={styles.summaryTitle}>{visibleDoctors.length} doctors available</Text>
          <Text style={styles.summarySub}>
            {selectedAvailability && selectedAvailability !== 'Any availability'
              ? `${selectedAvailability} video slots filtered by your choices.`
              : 'Compare ratings, video slots, and online availability.'}
          </Text>
        </View>
        <Pressable style={styles.filter} onPress={() => router.push('/doctor-filter' as any)}>
          <Text style={styles.filterText}>Filter</Text>
        </Pressable>
      </View>
      <View style={[styles.chips, isWide && styles.chipsWide]}>
        {['Available today', 'Video visit', 'Top rated', 'Earliest slot'].map(chip => (
          <Pressable key={chip} style={[styles.chip, activeChip === chip && styles.chipActive]} onPress={() => setActiveChip(chip)}>
            <Text style={[styles.chipText, activeChip === chip && styles.chipTextActive]}>{chip}</Text>
          </Pressable>
        ))}
      </View>
      <View style={[styles.list, isWide && styles.listWide]}>
        {loading ? (
          <View style={styles.loadingPanel}>
            <ActivityIndicator color={colors.teal} />
            <Text style={styles.loadingText}>Loading doctors...</Text>
          </View>
        ) : message ? (
          <View style={styles.emptyDoctors}>
            <AssetImage source={require('../../assets/images/default-doctor-illustration.png')} style={styles.emptyImage} resizeMode="contain" />
            <Text style={styles.emptyTitle}>Doctors unavailable</Text>
            <Text style={styles.emptyCopy}>{message}</Text>
            <PrimaryButton title="Try Again" onPress={loadDoctors} />
          </View>
        ) : visibleDoctors.length === 0 ? (
          <View style={styles.emptyDoctors}>
            <AssetImage source={require('../../assets/images/default-doctor-illustration.png')} style={styles.emptyImage} resizeMode="contain" />
            <Text style={styles.emptyTitle}>No doctors available</Text>
            <Text style={styles.emptyCopy}>Doctors matching this specialty and filter will appear here once they are available. You can browse all doctors or search by symptom.</Text>
            <View style={styles.emptyActions}>
              {!isAllSpecialties ? <PrimaryButton title="Browse All Doctors" onPress={() => router.replace({ pathname: '/eachspec', params: { specialty: 'all' } } as any)} /> : null}
              <Pressable style={styles.secondaryButton} onPress={() => router.push('/search' as any)}>
                <Text style={styles.secondaryButtonText}>Search doctors</Text>
              </Pressable>
            </View>
          </View>
        ) : visibleDoctors.map(doctor => {
          const isFavorite = favoriteIds.includes(doctor.id);

          return (
            <View key={doctor.id} style={[styles.card, isWide && styles.cardWide]}>
              <Pressable
                style={styles.cardMain}
                onPress={() => router.push({ pathname: '/doctor-profile', params: { doctorId: doctor.id, specialty: specialty.slug } } as any)}
              >
                <AssetImage source={doctor.image} style={styles.avatar} resizeMode="cover" />
                <View style={styles.copy}>
                  <View style={styles.nameRow}>
                    <Text style={styles.name}>{doctor.name}</Text>
                    <Text style={styles.rating}>★ {doctor.rating}</Text>
                  </View>
                  <View style={styles.metaRow}>
                    <SpecialtyIcon name={doctor.specialty as SpecialtyName} size={22} />
                    <Text style={styles.meta}>{doctor.specialty} - {doctor.experience} - {doctor.location}</Text>
                  </View>
                  <Text style={styles.bio} numberOfLines={2}>{doctor.bio}</Text>
                  <View style={styles.actions}>
                <Text style={styles.availability}>
                  {selectedAvailability && selectedAvailability !== 'Any availability'
                    ? selectedAvailability
                    : activeChip === 'Earliest slot' ? 'View next slot' : 'View availability'}
                </Text>
                    <Text style={styles.book}>Book</Text>
                  </View>
                </View>
              </Pressable>
              <Pressable style={[styles.favorite, isFavorite && styles.favoriteActive]} onPress={() => toggleFavorite(doctor.id)}>
                <Text style={[styles.favoriteText, isFavorite && styles.favoriteTextActive]}>{isFavorite ? '♥' : '♡'}</Text>
              </Pressable>
            </View>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  summary: { borderRadius: 24, backgroundColor: colors.teal, padding: 18, marginBottom: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  summaryCopy: { flex: 1, minWidth: 0 },
  summaryIcon: { width: 56, height: 56, marginBottom: 10 },
  summaryLabel: { color: 'rgba(255,255,255,0.72)', fontFamily: 'Poppins', fontSize: 12, fontWeight: '900', marginBottom: 6 },
  summaryTitle: { color: colors.white, fontFamily: 'Poppins', fontSize: 24, lineHeight: 30, fontWeight: '900' },
  summarySub: { color: 'rgba(255,255,255,0.84)', fontFamily: 'Poppins', fontSize: 13, lineHeight: 20, fontWeight: '700', marginTop: 6, maxWidth: 560 },
  filter: { minWidth: 78, minHeight: 42, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  filterText: { color: colors.white, fontFamily: 'Poppins', fontSize: 13, fontWeight: '900' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  chipsWide: { justifyContent: 'flex-start' },
  chip: { borderRadius: 999, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 13, paddingVertical: 9 },
  chipActive: { backgroundColor: colors.teal, borderColor: colors.teal },
  chipText: { color: colors.teal, fontFamily: 'Poppins', fontSize: 12, fontWeight: '900' },
  chipTextActive: { color: colors.white },
  list: { gap: 12 },
  listWide: { flexDirection: 'row', flexWrap: 'wrap' },
  loadingPanel: { width: '100%', minHeight: 220, borderRadius: 22, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 18 },
  loadingText: { color: colors.muted, fontFamily: 'Poppins', fontSize: 13, fontWeight: '800' },
  card: { borderRadius: 20, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, padding: 14, flexDirection: 'row', gap: 10, alignItems: 'center' },
  cardWide: { width: '48.5%' },
  emptyDoctors: { width: '100%', borderRadius: 20, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, padding: 20, alignItems: 'center' },
  emptyImage: { width: 128, height: 128, marginBottom: 8 },
  emptyTitle: { color: colors.ink, fontFamily: 'Poppins', fontSize: 18, fontWeight: '900', textAlign: 'center' },
  emptyCopy: { maxWidth: 420, color: colors.muted, fontFamily: 'Poppins', fontSize: 12, lineHeight: 18, fontWeight: '700', textAlign: 'center', marginTop: 6 },
  emptyActions: { width: '100%', maxWidth: 360, gap: 10, marginTop: 14 },
  secondaryButton: { minHeight: 50, borderRadius: 10, backgroundColor: colors.panel, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
  secondaryButtonText: { color: colors.teal, fontFamily: 'Poppins', fontSize: 14, fontWeight: '900' },
  cardMain: { flex: 1, minWidth: 0, flexDirection: 'row', gap: 12, alignItems: 'center' },
  avatar: { width: 68, height: 68, borderRadius: 24, backgroundColor: colors.panel },
  copy: { flex: 1, minWidth: 0 },
  nameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  name: { flex: 1, color: colors.ink, fontFamily: 'Poppins', fontSize: 15, fontWeight: '900' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  meta: { flex: 1, color: colors.teal, fontFamily: 'Poppins', fontSize: 12, fontWeight: '800' },
  bio: { color: colors.muted, fontFamily: 'Poppins', fontSize: 11, lineHeight: 16, fontWeight: '700', marginTop: 5 },
  rating: { color: colors.teal, fontFamily: 'Poppins', fontSize: 12, fontWeight: '900' },
  actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, gap: 8 },
  availability: { color: colors.muted, fontFamily: 'Poppins', fontSize: 11, fontWeight: '800' },
  book: { overflow: 'hidden', borderRadius: 999, backgroundColor: colors.teal, color: colors.white, fontFamily: 'Poppins', fontSize: 11, fontWeight: '900', paddingHorizontal: 12, paddingVertical: 7 },
  favorite: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.panel, alignItems: 'center', justifyContent: 'center' },
  favoriteActive: { backgroundColor: colors.teal },
  favoriteText: { color: colors.teal, fontSize: 22, lineHeight: 26, fontWeight: '900' },
  favoriteTextActive: { color: colors.white },
});
