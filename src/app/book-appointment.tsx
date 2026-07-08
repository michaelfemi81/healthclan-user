import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card, Field, Header, PrimaryButton, Screen } from '../components/HealthClanUI';
import { colors } from '../constants/healthclanDesign';
import { getDoctorById } from '../constants/doctors';
import { healthclanApi } from '../lib/api';
import { formatDoctor, type AppDoctor } from '../lib/doctor-format';

export default function BookAppointment() {
  const params = useLocalSearchParams();
  const [doctor, setDoctor] = useState<AppDoctor>(getDoctorById(params.doctorId));
  const selectedSlot = Array.isArray(params.slot) ? params.slot[0] : params.slot;
  const selectedEndSlot = Array.isArray(params.endSlot) ? params.endSlot[0] : params.endSlot;
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const id = Array.isArray(params.doctorId) ? params.doctorId[0] : params.doctorId;
    if (!id) return;

    healthclanApi.doctors.byId(id)
      .then((payload: any) => {
        setDoctor(formatDoctor({ ...payload.doctor, profile: payload.profile }));
      })
      .catch(() => null);
  }, [params.doctorId]);

  async function sendRequest() {
    if (loading) return;

    setMessage('');

    if (!doctor.id) {
      setMessage('Choose a doctor before booking.');
      return;
    }

    if (!selectedSlot) {
      setMessage('Choose an appointment time.');
      return;
    }

    const visitReason = [reason, notes].map(value => value.trim()).filter(Boolean).join(' - ');

    if (visitReason.length < 3) {
      setMessage('Enter a reason for the visit.');
      return;
    }

    const startTime = parseSlotDate(selectedSlot);
    const endTime = selectedEndSlot ? parseSlotDate(selectedEndSlot) : new Date(startTime.getTime() + 30 * 60 * 1000);

    if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime()) || startTime >= endTime) {
      setMessage('Choose a valid appointment time.');
      return;
    }

    setLoading(true);

    try {
      const payload: any = await healthclanApi.doctors.bookAppointment({
        doctor: doctor.id,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        reasonForVisit: visitReason,
      });
      setMessage(payload?.message || 'Appointment request sent. You will be notified when the doctor responds.');
      router.replace({
        pathname: '/appointments',
        params: { focus: 'requests' },
      } as any);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to create appointment.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <Header title="Book Appointment" backTo={`/doctor-profile?doctorId=${doctor.id}`} />
      <View style={styles.form}>
        <Text style={styles.title}>Confirm Appointment</Text>
        <Card>
          <Text style={styles.cardTitle}>{doctor.name}</Text>
          <Text style={styles.cardSub}>{doctor.specialty} - {doctor.location}</Text>
          <Text style={styles.cardMeta}>{selectedSlot ? formatSlotLabel(selectedSlot) : 'The doctor will accept or reject this request before payment.'}</Text>
        </Card>
        <Field placeholder="Reason for Visit" value={reason} onChangeText={setReason} />
        <Field placeholder="Briefly describe your concern" multiline value={notes} onChangeText={setNotes} />
        {!!message && <Text style={styles.message}>{message}</Text>}
        <PrimaryButton
          title={loading ? 'Sending request...' : 'Send Appointment Request'}
          onPress={sendRequest}
          loading={loading}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { gap: 14, alignItems: 'center' },
  title: { color: colors.ink, fontFamily: 'Poppins', fontSize: 24, fontWeight: '900', marginBottom: 8 },
  cardTitle: { color: colors.ink, fontFamily: 'Poppins', fontSize: 17, fontWeight: '900' },
  cardSub: { color: colors.teal, fontFamily: 'Poppins', fontSize: 13, fontWeight: '800', marginTop: 4 },
  cardMeta: { color: colors.muted, fontFamily: 'Poppins', fontSize: 12, fontWeight: '700', marginTop: 8 },
  message: { color: '#B42318', fontFamily: 'Poppins', fontSize: 12, fontWeight: '800', textAlign: 'center' },
});

function parseSlotDate(value: string) {
  if (value.includes('T')) return new Date(value);

  const startTime = new Date();
  const [hour, minute = '00'] = value.split(':');
  startTime.setHours(Number(hour), Number(minute), 0, 0);
  return startTime;
}

function formatSlotLabel(value: string) {
  const date = parseSlotDate(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
