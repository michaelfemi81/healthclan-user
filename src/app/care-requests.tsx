import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { BottomTabs, Header, PrimaryButton, Screen } from '../components/HealthClanUI';
import { colors } from '../constants/healthclanDesign';
import { healthclanApi } from '../lib/api';

const careTypeLabels: Record<string, string> = {
  home_care: 'Home care',
  elderly_care: 'Elderly care',
  live_in_care: 'Live-in care',
  respite_care: 'Respite care',
  disability_care: 'Disability care',
  dementia_care: 'Dementia care',
  personal_care: 'Personal care',
  companionship: 'Companionship',
};

function careTypeLabel(value?: string) {
  return value ? careTypeLabels[value] || value.replace(/_/g, ' ') : 'Care request';
}

function patientState(request: any) {
  if (request.status === 'closed') return { label: 'Closed', tone: 'closed' };
  if (request.status === 'expired') return { label: 'Expired', tone: 'closed' };
  if (request.patientStatus === 'viewed' || request.viewedByPartners?.length > 0) return { label: 'Viewed by partner', tone: 'viewed' };
  return { label: 'Pending', tone: 'pending' };
}

function formatDate(value?: string) {
  if (!value) return 'No preferred time';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'No preferred time';
  return date.toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function durationLabel(request: any) {
  const fallbackLabels: Record<string, string> = {
    six_hours_daycare: '6 hours daycare',
    eight_hours_daycare: '8 hours daycare',
    ten_hours_daycare: '10 hours daycare',
    twelve_hours_daycare: '12 hours daycare',
    live_in_24_7: '24/7 live in care',
    overnight_care: 'Overnight care',
  };
  const label = request?.durationLabel || fallbackLabels[request?.durationType] || 'Not specified';
  const hours = request?.numberOfHours ? `, ${request.numberOfHours} hour${Number(request.numberOfHours) === 1 ? '' : 's'}` : '';
  return `${label}${hours}`;
}

function requestTimestamp(request: any) {
  const raw = request?.createdAt || request?.updatedAt || request?.preferredTime || request?.date;
  const date = raw ? new Date(raw) : null;
  return date && !Number.isNaN(date.getTime()) ? date.getTime() : 0;
}

export default function CareRequests() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const pulse = useRef(new Animated.Value(0)).current;
  const viewedCount = useMemo(() => requests.filter(request => patientState(request).tone === 'viewed').length, [requests]);
  const pendingCount = useMemo(() => requests.filter(request => patientState(request).tone === 'pending').length, [requests]);
  const sortedRequests = useMemo(
    () => requests.slice().sort((a, b) => requestTimestamp(b) - requestTimestamp(a)),
    [requests]
  );

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1200, useNativeDriver: true }),
      ]),
    ).start();
  }, [pulse]);

  const loadRequests = useCallback(() => {
    setLoading(true);
    setMessage('');
    healthclanApi.care.myRequests()
      .then(setRequests)
      .catch(error => {
        setRequests([]);
        setMessage(error instanceof Error ? error.message : 'Unable to load care requests.');
      })
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(loadRequests);

  const emptyScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.05] });

  return (
    <View style={styles.wrap}>
      <Screen bottom={104}>
        <Header title="Care Requests" backTo="/history" />
        <View style={styles.summary}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{pendingCount}</Text>
            <Text style={styles.summaryLabel}>Pending</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{viewedCount}</Text>
            <Text style={styles.summaryLabel}>Viewed</Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingPanel}>
            <Text style={styles.loadingText}>Loading your care requests...</Text>
          </View>
        ) : message ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Care requests unavailable</Text>
            <Text style={styles.emptyCopy}>{message}</Text>
            <PrimaryButton title="Try Again" onPress={loadRequests} />
          </View>
        ) : sortedRequests.length > 0 ? (
          <View style={styles.list}>
            {sortedRequests.map(request => {
              const state = patientState(request);
              return (
                <View key={request._id} style={styles.card}>
                  <View style={styles.cardTop}>
                    <View style={styles.icon}>
                      <Text style={styles.iconText}>{careTypeLabel(request.careType).charAt(0)}</Text>
                    </View>
                    <View style={styles.cardCopy}>
                      <Text style={styles.title}>{careTypeLabel(request.careType)}</Text>
                      <Text style={styles.meta}>{request.location?.city || 'Location pending'} | {formatDate(request.preferredTime)}</Text>
                      <Text style={styles.meta}>Duration: {durationLabel(request)}</Text>
                    </View>
                    <Text style={[styles.status, state.tone === 'viewed' && styles.statusViewed, state.tone === 'closed' && styles.statusClosed]}>{state.label}</Text>
                  </View>
                  <Text style={styles.description} numberOfLines={3}>{request.description || 'No care notes added.'}</Text>
                  <View style={styles.footer}>
                    <Text style={styles.footerText}>{request.createdAt ? `Requested ${new Date(request.createdAt).toLocaleDateString()}` : 'Recently requested'}</Text>
                    <Pressable style={styles.refreshButton} onPress={loadRequests}>
                      <Text style={styles.refreshText}>Refresh</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Animated.View style={[styles.emptyIcon, { transform: [{ scale: emptyScale }] }]}>
              <Text style={styles.emptyIconText}>+</Text>
            </Animated.View>
            <Text style={styles.emptyTitle}>No carer requests yet</Text>
            <Text style={styles.emptyCopy}>Once you request care support, every request and partner-viewed status will appear here.</Text>
            <PrimaryButton title="Request A Carer" onPress={() => router.push('/request' as any)} />
          </View>
        )}
      </Screen>
      <BottomTabs active="record" />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  summary: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  summaryCard: { flex: 1, minHeight: 90, borderRadius: 18, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, padding: 14, justifyContent: 'center' },
  summaryValue: { color: colors.teal, fontFamily: 'Poppins', fontSize: 28, fontWeight: '900' },
  summaryLabel: { color: colors.muted, fontFamily: 'Poppins', fontSize: 12, fontWeight: '800', marginTop: 3 },
  loadingPanel: { minHeight: 180, borderRadius: 18, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center', padding: 18 },
  loadingText: { color: colors.muted, fontFamily: 'Poppins', fontSize: 14, fontWeight: '800' },
  list: { gap: 12 },
  card: { borderRadius: 20, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, padding: 14 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 46, height: 46, borderRadius: 16, backgroundColor: colors.panel, alignItems: 'center', justifyContent: 'center' },
  iconText: { color: colors.teal, fontFamily: 'Poppins', fontSize: 18, fontWeight: '900' },
  cardCopy: { flex: 1, minWidth: 0 },
  title: { color: colors.ink, fontFamily: 'Poppins', fontSize: 15, fontWeight: '900' },
  meta: { color: colors.muted, fontFamily: 'Poppins', fontSize: 11, lineHeight: 16, fontWeight: '700', marginTop: 4 },
  status: { flexShrink: 0, overflow: 'hidden', borderRadius: 999, backgroundColor: 'rgba(193,124,18,0.12)', color: '#C17C12', fontFamily: 'Poppins', fontSize: 11, fontWeight: '900', paddingHorizontal: 10, paddingVertical: 6 },
  statusViewed: { backgroundColor: 'rgba(17,162,111,0.12)', color: '#11a26f' },
  statusClosed: { backgroundColor: colors.panel, color: colors.muted },
  description: { color: colors.ink, fontFamily: 'Poppins', fontSize: 12, lineHeight: 18, fontWeight: '700', marginTop: 12 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 12 },
  footerText: { flex: 1, color: colors.muted, fontFamily: 'Poppins', fontSize: 11, fontWeight: '800' },
  refreshButton: { minHeight: 36, borderRadius: 12, backgroundColor: colors.panel, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  refreshText: { color: colors.teal, fontFamily: 'Poppins', fontSize: 12, fontWeight: '900' },
  emptyState: { minHeight: 360, borderRadius: 22, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center', padding: 22, gap: 12 },
  emptyIcon: { width: 78, height: 78, borderRadius: 26, backgroundColor: colors.panel, alignItems: 'center', justifyContent: 'center' },
  emptyIconText: { color: colors.teal, fontFamily: 'Poppins', fontSize: 38, lineHeight: 42, fontWeight: '900' },
  emptyTitle: { color: colors.ink, fontFamily: 'Poppins', fontSize: 22, fontWeight: '900', textAlign: 'center' },
  emptyCopy: { maxWidth: 430, color: colors.muted, fontFamily: 'Poppins', fontSize: 13, lineHeight: 20, fontWeight: '700', textAlign: 'center' },
});
