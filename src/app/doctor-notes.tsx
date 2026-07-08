import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Header, Screen } from '../components/HealthClanUI';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/healthclanDesign';
import { healthclanApi } from '../lib/api';

function doctorName(value: any) {
  return value?.doctor?.fullName || [value?.doctor?.firstName, value?.doctor?.lastName].filter(Boolean).join(' ') || 'Doctor';
}

function appointmentTime(value: any) {
  const raw = value?.completedAt || value?.endTime || value?.startTime;
  const parsed = raw ? new Date(raw) : null;
  return parsed && !Number.isNaN(parsed.getTime()) ? parsed.toLocaleString() : '';
}

function noteText(value: any) {
  return String(value?.consultationNotes || value?.notes || '').trim();
}

export default function DoctorNotes() {
  const params = useLocalSearchParams();
  const appointmentId = Array.isArray(params.appointmentId) ? params.appointmentId[0] : params.appointmentId;
  const [notes, setNotes] = useState<any>(null);
  const [loading, setLoading] = useState(Boolean(appointmentId));
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!appointmentId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    healthclanApi.doctors.notes(appointmentId)
      .then(setNotes)
      .catch(error => setMessage(error instanceof Error ? error.message : 'Unable to load consultation notes.'))
      .finally(() => setLoading(false));
  }, [appointmentId]);

  return (
    <Screen>
      <Header title="Doctor Notes" backTo="/history" />
      {loading ? (
        <View style={styles.panel}>
          <ActivityIndicator color={colors.teal} />
          <Text style={styles.copy}>Loading consultation notes...</Text>
        </View>
      ) : noteText(notes) ? (
        <View style={styles.panel}>
          <View style={styles.icon}>
            <Text style={styles.iconText}>N</Text>
          </View>
          <Text style={styles.heading}>After-visit notes</Text>
          <Text style={styles.meta}>{doctorName(notes)}{appointmentTime(notes) ? ` - ${appointmentTime(notes)}` : ''}</Text>
          <View style={styles.noteBox}>
            <Text style={styles.copy}>{noteText(notes)}</Text>
          </View>
          <Text style={styles.helper}>These notes were added by your doctor after the appointment.</Text>
        </View>
      ) : (
        <View style={styles.panel}>
          <View style={styles.icon}>
            <Text style={styles.iconText}>N</Text>
          </View>
          <Text style={styles.heading}>{message ? 'Unable to load notes' : 'No notes yet'}</Text>
          <Text style={styles.copy}>
            {message || 'After-visit notes will appear here once your doctor adds them for the completed appointment.'}
          </Text>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  panel: { borderRadius: 22, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, padding: 18, gap: 12, alignItems: 'center' },
  icon: { width: 62, height: 62, borderRadius: 22, backgroundColor: colors.field, alignItems: 'center', justifyContent: 'center' },
  iconText: { color: colors.teal, fontFamily: 'Poppins', fontSize: 24, fontWeight: '900' },
  heading: { color: colors.ink, fontFamily: 'Poppins', fontSize: 20, fontWeight: '900', textAlign: 'center' },
  meta: { color: colors.muted, fontFamily: 'Poppins', fontSize: 12, lineHeight: 18, fontWeight: '800', textAlign: 'center' },
  noteBox: { width: '100%', borderRadius: 18, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.line, padding: 16 },
  copy: { color: colors.ink, fontFamily: 'Poppins', fontSize: 15, lineHeight: 24, fontWeight: '700', textAlign: 'center' },
  helper: { color: colors.muted, fontFamily: 'Poppins', fontSize: 12, lineHeight: 18, fontWeight: '800', textAlign: 'center' },
});
