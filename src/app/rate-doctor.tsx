import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Field, Header, PrimaryButton, Screen } from '../components/HealthClanUI';
import { colors } from '../constants/healthclanDesign';
import { healthclanApi } from '../lib/api';

export default function RateDoctor() {
  const params = useLocalSearchParams();
  const appointmentId = Array.isArray(params.appointmentId) ? params.appointmentId[0] : params.appointmentId;
  const doctorId = Array.isArray(params.doctorId) ? params.doctorId[0] : params.doctorId;
  const doctorName = Array.isArray(params.doctorName) ? params.doctorName[0] : params.doctorName;
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (loading) return;

    setMessage('');

    if (!appointmentId || !doctorId) {
      setMessage('This appointment cannot be rated yet.');
      return;
    }

    if (rating < 1 || rating > 5) {
      setMessage('Choose a rating from 1 to 5 stars.');
      return;
    }

    setLoading(true);

    try {
      await healthclanApi.reviews.create({
        target: doctorId,
        appointment: appointmentId,
        rating,
        type: 'doctor',
        comment: comment.trim(),
      });
      router.replace('/history' as any);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to submit rating.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <Header title="Rate Doctor" backTo="/history" />
      <View style={styles.card}>
        <Text style={styles.eyebrow}>Completed visit</Text>
        <Text style={styles.title}>{doctorName || 'Doctor appointment'}</Text>
        <Text style={styles.copy}>Share your experience so other patients can choose care with more confidence.</Text>
        <View style={styles.stars}>
          {[1, 2, 3, 4, 5].map(value => (
            <Pressable
              key={value}
              accessibilityLabel={`Rate ${value} star${value > 1 ? 's' : ''}`}
              style={[styles.starButton, rating >= value && styles.starButtonActive]}
              onPress={() => setRating(value)}
            >
              <Text style={[styles.star, rating >= value && styles.starActive]}>★</Text>
            </Pressable>
          ))}
        </View>
        <Field placeholder="Add a comment (optional)" multiline value={comment} onChangeText={setComment} />
        {!!message && <Text style={styles.message}>{message}</Text>}
        <PrimaryButton title={loading ? 'Submitting rating...' : 'Submit Rating'} onPress={submit} loading={loading} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { width: '100%', maxWidth: 560, alignSelf: 'center', borderRadius: 22, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, padding: 18, gap: 14 },
  eyebrow: { color: colors.teal, fontFamily: 'Poppins', fontSize: 12, fontWeight: '900' },
  title: { color: colors.ink, fontFamily: 'Poppins', fontSize: 22, fontWeight: '900' },
  copy: { color: colors.muted, fontFamily: 'Poppins', fontSize: 13, lineHeight: 20, fontWeight: '700' },
  stars: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginVertical: 4 },
  starButton: { width: 48, height: 48, borderRadius: 16, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  starButtonActive: { backgroundColor: colors.teal, borderColor: colors.teal },
  star: { color: colors.teal, fontSize: 26, lineHeight: 30, fontWeight: '900' },
  starActive: { color: colors.white },
  message: { color: '#B42318', fontFamily: 'Poppins', fontSize: 12, fontWeight: '800', textAlign: 'center' },
});
