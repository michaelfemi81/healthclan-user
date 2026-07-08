import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BottomTabs, Card, Header, Row, Screen } from '../components/HealthClanUI';
import { colors } from '../constants/healthclanDesign';
import { healthclanApi } from '../lib/api';

export default function Profile() {
  const [user, setUser] = useState<any>(null);
  const [message, setMessage] = useState('');
  const displayName = user?.fullName || [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'HealthClan User';
  const displayMeta = [user?.email, user?.type ? String(user.type).replace(/_/g, ' ') : 'Personal Information'].filter(Boolean).join(' | ');
  const displayAddress = user?.address?.line1 || [user?.address?.city, user?.address?.state, user?.address?.country].filter(Boolean).join(', ');
  const avatarSource = user?.avatar ? { uri: user.avatar } : require('../../assets/images/default-user-illustration.png');

  useEffect(() => {
    healthclanApi.users.me()
      .then((payload: any) => setUser(payload?.user || payload))
      .catch(error => setMessage(error instanceof Error ? error.message : 'Unable to load profile.'));
  }, []);

  return (
    <View style={styles.wrap}>
      <Screen bottom={104}>
        <Header title="Profile" />
        <Card>
          <View style={styles.profile}>
            <Image source={avatarSource} style={styles.avatar} contentFit="cover" />
            <Text style={styles.name}>{displayName}</Text>
            <Text style={styles.meta}>{displayMeta}</Text>
            {!!displayAddress && <Text style={styles.address}>{displayAddress}</Text>}
            {!!message && <Text style={styles.error}>{message}</Text>}
          </View>
        </Card>
        <View style={styles.list}>
          <Row title="Edit Profile" subtitle="Update personal details" onPress={() => router.push('/editprofile' as any)} />
          <Row title="Favorites" subtitle="Saved doctors" onPress={() => router.push('/favorites' as any)} />
          <Row title="Notifications" subtitle="Appointment and account alerts" onPress={() => router.push({ pathname: '/notifications', params: { from: 'profile' } } as any)} />
          <Row title="Search Doctors" subtitle="Find care by specialty or availability" onPress={() => router.push({ pathname: '/search', params: { from: 'profile' } } as any)} />
          <Row title="Settings" subtitle="Account and app preferences" onPress={() => router.push('/settings' as any)} />
        </View>
      </Screen>
      <BottomTabs active="profile" />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  profile: { alignItems: 'center' },
  avatar: { width: 90, height: 90, borderRadius: 45, backgroundColor: colors.panel },
  name: { color: colors.ink, fontFamily: 'Poppins', fontSize: 22, fontWeight: '900', marginTop: 12 },
  meta: { color: colors.muted, fontFamily: 'Poppins', fontSize: 13, fontWeight: '700', marginTop: 3 },
  address: { color: colors.teal, fontFamily: 'Poppins', fontSize: 12, lineHeight: 18, fontWeight: '800', textAlign: 'center', marginTop: 6 },
  error: { color: '#B42318', fontFamily: 'Poppins', fontSize: 12, lineHeight: 18, fontWeight: '800', textAlign: 'center', marginTop: 8 },
  list: { gap: 12, marginTop: 16 },
});
