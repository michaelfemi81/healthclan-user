import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Field, Header, PrimaryButton, Row, Screen } from '../components/HealthClanUI';
import { colors } from '../constants/healthclanDesign';
import { healthclanApi } from '../lib/api';

export default function EmailSupport() {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [tickets, setTickets] = useState<any[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const loadTickets = useCallback(() => {
    healthclanApi.users.supportTickets()
      .then(setTickets)
      .catch(() => setTickets([]));
  }, []);

  useFocusEffect(loadTickets);

  async function submitTicket() {
    if (loading) return;

    setMessage('');

    if (subject.trim().length < 3) {
      setMessage('Enter a support subject.');
      return;
    }

    if (body.trim().length < 10) {
      setMessage('Describe the issue with at least 10 characters.');
      return;
    }

    setLoading(true);

    try {
      await healthclanApi.users.createSupportTicket({
        subject: subject.trim(),
        message: body.trim(),
        category: 'account',
      });
      setSubject('');
      setBody('');
      setMessage('Support request sent.');
      loadTickets();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to send support request.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <Header title="Email Support" backTo="/help-support" />
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Tell us what happened</Text>
        <Text style={styles.heroSub}>Share the account, appointment, payment, or app issue you need help with. We will keep your recent requests below.</Text>
      </View>
      <View style={styles.form}>
        <Text style={styles.formTitle}>New request</Text>
        <Field placeholder="Subject" value={subject} onChangeText={setSubject} />
        <Field placeholder="Message" multiline value={body} onChangeText={setBody} />
        {!!message && <Text style={styles.message}>{message}</Text>}
        <PrimaryButton title={loading ? 'Sending...' : 'Send Request'} onPress={submitTicket} loading={loading} />
      </View>
      <Text style={styles.section}>Recent requests</Text>
      <View style={styles.list}>
        {tickets.map(ticket => (
          <Row key={ticket._id || ticket.id || ticket.subject} title={ticket.subject || 'Support request'} subtitle={ticket.status || ticket.message || 'Submitted'} />
        ))}
        {tickets.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No support requests yet</Text>
            <Text style={styles.emptySub}>After you send a request, it will appear here with its latest status.</Text>
          </View>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { borderRadius: 24, backgroundColor: colors.teal, padding: 20, marginBottom: 18 },
  heroTitle: { color: colors.white, fontFamily: 'Poppins', fontSize: 24, lineHeight: 30, fontWeight: '900' },
  heroSub: { color: 'rgba(255,255,255,0.84)', fontFamily: 'Poppins', fontSize: 13, lineHeight: 20, fontWeight: '700', marginTop: 8 },
  form: { gap: 12, alignItems: 'center', marginBottom: 24, borderRadius: 20, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, padding: 16 },
  formTitle: { width: '100%', maxWidth: 520, color: colors.ink, fontFamily: 'Poppins', fontSize: 18, fontWeight: '900' },
  message: { color: colors.teal, fontFamily: 'Poppins', fontSize: 12, lineHeight: 18, fontWeight: '800', textAlign: 'center' },
  section: { color: colors.ink, fontFamily: 'Poppins', fontSize: 18, fontWeight: '900', marginBottom: 12 },
  list: { gap: 12 },
  empty: { borderRadius: 18, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, padding: 18, alignItems: 'center' },
  emptyTitle: { color: colors.ink, fontFamily: 'Poppins', fontSize: 16, fontWeight: '900', textAlign: 'center' },
  emptySub: { color: colors.muted, fontFamily: 'Poppins', fontSize: 12, lineHeight: 18, fontWeight: '700', textAlign: 'center', marginTop: 4 },
});
