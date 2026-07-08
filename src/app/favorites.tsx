import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AssetImage } from '../components/AssetImage';
import { Header, PrimaryButton, Screen } from '../components/HealthClanUI';
import { SpecialtyIcon } from '../components/SpecialtyIcon';
import { colors } from '../constants/healthclanDesign';
import type { SpecialtyName } from '../constants/doctors';
import { healthclanApi } from '../lib/api';
import { formatFavorite, type AppDoctor } from '../lib/doctor-format';

export default function Favorites() {
  const [favoriteDoctors, setFavoriteDoctors] = useState<AppDoctor[]>([]);
  const [message, setMessage] = useState('');

  const loadFavorites = useCallback(() => {
    setMessage('');
    healthclanApi.users.favorites()
      .then(items => setFavoriteDoctors(items.map(formatFavorite)))
      .catch(error => setMessage(error instanceof Error ? error.message : 'Unable to load favorites.'));
  }, []);

  useFocusEffect(loadFavorites);

  async function removeFavorite(doctorId: string) {
    if (!doctorId) return;

    const previous = favoriteDoctors;
    setFavoriteDoctors(current => current.filter(doctor => doctor.id !== doctorId));

    try {
      await healthclanApi.users.removeFavorite(doctorId);
    } catch (error) {
      setFavoriteDoctors(previous);
      setMessage(error instanceof Error ? error.message : 'Unable to remove favorite.');
    }
  }

  return (
    <Screen>
      <Header title="Favorites" backTo="/profile" />
      {!!message && <Text style={styles.error}>{message}</Text>}
      {favoriteDoctors.length ? (
        <View style={styles.list}>
          {favoriteDoctors.map(doctor => (
            <View key={doctor.id} style={styles.card}>
              <Pressable
                style={styles.main}
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
              </Pressable>
              <Pressable style={styles.remove} onPress={() => removeFavorite(doctor.id)}>
                <Text style={styles.removeText}>♥</Text>
              </Pressable>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No favorite doctors yet</Text>
          <Text style={styles.emptySub}>Save doctors from profiles or search results so they appear here.</Text>
          <PrimaryButton title="Find Doctors" onPress={() => router.push('/specialties' as any)} />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: 12 },
  card: { borderRadius: 18, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  main: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 58, height: 58, borderRadius: 20, backgroundColor: colors.panel },
  copy: { flex: 1, minWidth: 0 },
  nameLine: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  name: { flex: 1, color: colors.ink, fontFamily: 'Poppins', fontSize: 15, fontWeight: '900' },
  meta: { color: colors.teal, fontFamily: 'Poppins', fontSize: 12, fontWeight: '800', marginTop: 3 },
  bio: { color: colors.muted, fontFamily: 'Poppins', fontSize: 11, lineHeight: 16, fontWeight: '700', marginTop: 4 },
  remove: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.teal, alignItems: 'center', justifyContent: 'center' },
  removeText: { color: colors.white, fontSize: 22, lineHeight: 26, fontWeight: '900' },
  empty: { gap: 14, borderRadius: 22, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, padding: 18, alignItems: 'center' },
  emptyTitle: { color: colors.ink, fontFamily: 'Poppins', fontSize: 18, fontWeight: '900', textAlign: 'center' },
  emptySub: { color: colors.muted, fontFamily: 'Poppins', fontSize: 13, lineHeight: 20, fontWeight: '700', textAlign: 'center' },
  error: { color: '#B42318', fontFamily: 'Poppins', fontSize: 12, fontWeight: '800', marginBottom: 12, textAlign: 'center' },
});
