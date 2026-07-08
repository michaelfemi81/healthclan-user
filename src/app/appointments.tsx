import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { BottomTabs, Header, PrimaryButton, Screen } from '../components/HealthClanUI';
import { colors } from '../constants/healthclanDesign';
import { healthclanApi } from '../lib/api';
import { appointmentDate, appointmentTimestamp, sortAppointmentsNewestFirst } from '../lib/appointments';

type FilterKey = 'requests' | 'upcoming' | 'past' | 'all';

function statusLabel(status?: string) {
  if (status === 'pending_payment') return 'Payment due';
  if (status === 'requested') return 'Awaiting doctor';
  return status ? status.replace(/_/g, ' ') : 'Scheduled';
}

function statusTone(status?: string) {
  if (status === 'pending_payment') return styles.statusPayment;
  if (status === 'confirmed') return styles.statusConfirmed;
  if (status === 'rejected' || status === 'cancelled') return styles.statusMuted;
  return styles.statusWaiting;
}

function StatusIcon({ status }: { status?: string }) {
  if (status === 'confirmed') {
    return (
      <View accessibilityLabel="Confirmed" style={[styles.statusIcon, styles.statusIconConfirmed]}>
        <Text style={styles.statusIconText}>✓</Text>
      </View>
    );
  }

  if (status === 'pending_payment') {
    return (
      <View accessibilityLabel="Payment due" style={[styles.statusIcon, styles.statusIconPayment]}>
        <View style={styles.cardIconLine} />
        <View style={styles.cardIconDot} />
      </View>
    );
  }

  return <Text style={[styles.status, statusTone(status)]}>{statusLabel(status)}</Text>;
}

function InfoIcon() {
  return <Text style={styles.actionIconText}>i</Text>;
}

function PayIcon() {
  return (
    <View style={styles.actionCardIcon}>
      <View style={styles.actionCardLine} />
      <View style={styles.actionCardDot} />
    </View>
  );
}

function VideoIcon() {
  return (
    <View style={styles.actionVideoIcon}>
      <View style={styles.actionVideoLens} />
      <View style={styles.actionVideoWing} />
    </View>
  );
}

function doctorName(appointment: any) {
  return appointment?.doctor?.fullName || [appointment?.doctor?.firstName, appointment?.doctor?.lastName].filter(Boolean).join(' ') || 'Doctor';
}

function entityId(value: any) {
  return String(value?._id || value?.id || value || '');
}

function openPayment(appointment: any) {
  const appointmentId = entityId(appointment);
  router.push({
    pathname: '/payment',
    params: { appointmentId, doctorId: entityId(appointment.doctor) },
  } as any);
}

function openVideo(appointment: any) {
  const appointmentId = entityId(appointment);
  router.push({
    pathname: '/video-call',
    params: { appointmentId, doctorId: entityId(appointment.doctor), active: 'true' },
  } as any);
}

export default function Appointments() {
  const params = useLocalSearchParams();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [filter, setFilter] = useState<FilterKey>(params.focus === 'requests' ? 'requests' : 'upcoming');

  const filteredAppointments = useMemo(() => {
    const now = Date.now();
    return appointments
      .slice()
      .sort((a, b) => appointmentTimestamp(b) - appointmentTimestamp(a))
      .filter(appointment => {
        if (filter === 'all') return true;
        if (filter === 'requests') return ['requested', 'pending_payment', 'rejected'].includes(appointment.status);
        const date = appointmentDate(appointment);
        const timestamp = date?.getTime() || 0;
        if (filter === 'upcoming') return timestamp >= now && ['confirmed'].includes(appointment.status);
        return timestamp < now || ['completed', 'cancelled', 'rejected'].includes(appointment.status);
      });
  }, [appointments, filter]);

  const loadAppointments = useCallback(() => {
    setLoading(true);
    setMessage('');
    healthclanApi.doctors.appointments()
      .then(items => setAppointments(Array.isArray(items) ? sortAppointmentsNewestFirst(items) : []))
      .catch(error => {
        setAppointments([]);
        setMessage(error instanceof Error ? error.message : 'Unable to load appointments.');
      })
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(loadAppointments);

  return (
    <View style={styles.wrap}>
      <Screen bottom={104}>
        <Header title="Appointments" backTo="/" />
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Appointment requests</Text>
          <Text style={styles.heroSub}>Track requests, pay after a doctor accepts, join confirmed visits, and review completed appointments.</Text>
          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{appointments.length}</Text>
              <Text style={styles.heroStatLabel}>Total</Text>
            </View>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{appointments.filter(item => item.status === 'pending_payment').length}</Text>
              <Text style={styles.heroStatLabel}>To pay</Text>
            </View>
          </View>
        </View>

        <View style={styles.filters}>
          {(['requests', 'upcoming', 'past', 'all'] as FilterKey[]).map(item => (
            <Pressable key={item} style={[styles.filterButton, filter === item && styles.filterButtonActive]} onPress={() => setFilter(item)}>
              <Text style={[styles.filterText, filter === item && styles.filterTextActive]}>{item.charAt(0).toUpperCase() + item.slice(1)}</Text>
            </Pressable>
          ))}
        </View>

        {loading ? (
          <View style={styles.loadingPanel}>
            <ActivityIndicator color={colors.teal} />
            <Text style={styles.loadingText}>Loading appointments...</Text>
          </View>
        ) : message ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Text style={styles.emptyIconText}>!</Text>
            </View>
            <Text style={styles.emptyTitle}>Appointments unavailable</Text>
            <Text style={styles.emptyCopy}>{message}</Text>
            <PrimaryButton title="Try Again" onPress={loadAppointments} />
          </View>
        ) : filteredAppointments.length > 0 ? (
          <View style={styles.list}>
            {filteredAppointments.map(appointment => {
              const date = appointmentDate(appointment);
              const isPaymentDue = appointment.status === 'pending_payment';
              return (
                <View
                  key={entityId(appointment) || `${appointment.service?.name}-${appointment.startTime}`}
                  style={[styles.card, isPaymentDue && styles.cardPaymentDue]}
                >
                  <View style={styles.cardMain}>
                    <View style={[styles.timeBlock, isPaymentDue && styles.timeBlockPayment]}>
                      <Text style={[styles.timeDay, isPaymentDue && styles.timeTextPayment]}>{date ? date.toLocaleDateString([], { month: 'short', day: 'numeric' }) : '--'}</Text>
                      <Text style={[styles.timeText, isPaymentDue && styles.timeTextPayment]}>{date ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</Text>
                    </View>
                    <View style={styles.cardCopy}>
                      <View style={styles.cardTop}>
                        <Text style={styles.cardTitle} numberOfLines={1}>{appointment.service?.name || 'Video appointment'}</Text>
                        <StatusIcon status={appointment.status} />
                      </View>
                      <Text style={styles.doctor}>{doctorName(appointment)}</Text>
                      <Text style={styles.reason} numberOfLines={2}>{appointment.reasonForVisit || 'No visit reason added.'}</Text>
                    </View>
                  </View>
                  {isPaymentDue ? (
                    <View style={styles.paymentActionPanel}>
                      <Text style={styles.paymentActionText}>Doctor accepted your request. Complete checkout to lock in this video visit.</Text>
                      <View style={styles.paymentActions}>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel="View appointment info"
                          style={styles.infoButton}
                          onPress={() => openVideo(appointment)}
                        >
                          <InfoIcon />
                        </Pressable>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel="Complete payment"
                          style={styles.payButton}
                          onPress={() => openPayment(appointment)}
                        >
                          <PayIcon />
                        </Pressable>
                      </View>
                    </View>
                  ) : appointment.status === 'confirmed' ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Open video visit"
                      style={styles.openButton}
                      onPress={() => openVideo(appointment)}
                    >
                      <VideoIcon />
                    </Pressable>
                  ) : appointment.status === 'requested' ? (
                    <View style={styles.passiveActionPanel}>
                      <Text style={styles.passiveActionText}>Waiting for the doctor to accept this request.</Text>
                    </View>
                  ) : appointment.status === 'rejected' ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Book another doctor"
                      style={styles.openButton}
                      onPress={() => router.push('/specialties' as any)}
                    >
                      <Text style={styles.actionIconText}>+</Text>
                    </Pressable>
                  ) : (
                    <View />
                  )}
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Text style={styles.emptyIconText}>+</Text>
            </View>
            <Text style={styles.emptyTitle}>{filter === 'requests' ? 'No appointment requests' : filter === 'upcoming' ? 'No upcoming appointments' : 'No appointments here yet'}</Text>
            <Text style={styles.emptyCopy}>Request a doctor when you are ready. Accepted requests will ask you to complete payment before the visit is confirmed.</Text>
            <PrimaryButton title="Book Doctor" onPress={() => router.push('/specialties' as any)} />
          </View>
        )}
      </Screen>
      <BottomTabs active="record" />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  hero: { borderRadius: 24, backgroundColor: colors.teal, padding: 18, marginBottom: 16 },
  heroTitle: { color: colors.white, fontFamily: 'Poppins', fontSize: 25, lineHeight: 31, fontWeight: '900' },
  heroSub: { color: 'rgba(255,255,255,0.82)', fontFamily: 'Poppins', fontSize: 13, lineHeight: 20, fontWeight: '700', marginTop: 7 },
  heroStats: { flexDirection: 'row', gap: 10, marginTop: 16 },
  heroStat: { flex: 1, minHeight: 72, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.16)', padding: 12, justifyContent: 'center' },
  heroStatValue: { color: colors.white, fontFamily: 'Poppins', fontSize: 24, fontWeight: '900' },
  heroStatLabel: { color: 'rgba(255,255,255,0.76)', fontFamily: 'Poppins', fontSize: 11, fontWeight: '900', marginTop: 2 },
  filters: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  filterButton: { flex: 1, minHeight: 44, borderRadius: 14, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  filterButtonActive: { backgroundColor: colors.teal, borderColor: colors.teal },
  filterText: { color: colors.teal, fontFamily: 'Poppins', fontSize: 12, fontWeight: '900' },
  filterTextActive: { color: colors.white },
  loadingPanel: { minHeight: 220, borderRadius: 22, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 18 },
  loadingText: { color: colors.muted, fontFamily: 'Poppins', fontSize: 13, fontWeight: '800' },
  list: { gap: 12 },
  card: { minHeight: 112, borderRadius: 20, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, padding: 13, gap: 12 },
  cardPaymentDue: { borderColor: 'rgba(8,81,97,0.18)', backgroundColor: colors.white },
  cardMain: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  timeBlock: { width: 72, minHeight: 76, borderRadius: 20, backgroundColor: colors.panel, alignItems: 'center', justifyContent: 'center', padding: 8 },
  timeBlockPayment: { backgroundColor: colors.teal },
  timeDay: { color: colors.teal, fontFamily: 'Poppins', fontSize: 12, fontWeight: '900', textAlign: 'center' },
  timeText: { color: colors.ink, fontFamily: 'Poppins', fontSize: 14, fontWeight: '900', textAlign: 'center', marginTop: 4 },
  timeTextPayment: { color: colors.white },
  cardCopy: { flex: 1, minWidth: 0 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { flex: 1, minWidth: 0, color: colors.ink, fontFamily: 'Poppins', fontSize: 15, fontWeight: '900' },
  status: { flexShrink: 0, overflow: 'hidden', borderRadius: 999, fontFamily: 'Poppins', fontSize: 10, fontWeight: '900', paddingHorizontal: 8, paddingVertical: 4, textTransform: 'capitalize' },
  statusPayment: { backgroundColor: colors.field, color: colors.teal },
  statusConfirmed: { backgroundColor: 'rgba(17,162,111,0.12)', color: '#0F8F64' },
  statusWaiting: { backgroundColor: colors.panel, color: colors.teal },
  statusMuted: { backgroundColor: '#F2F4F7', color: colors.muted },
  statusIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.panel, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  statusIconConfirmed: { backgroundColor: 'rgba(17,162,111,0.12)' },
  statusIconPayment: { backgroundColor: colors.field },
  statusIconText: { color: '#0F8F64', fontFamily: 'Poppins', fontSize: 19, lineHeight: 23, fontWeight: '900' },
  cardIconLine: { width: 19, height: 4, borderRadius: 3, backgroundColor: colors.teal, marginBottom: 5 },
  cardIconDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.teal, alignSelf: 'flex-start', marginLeft: 9 },
  doctor: { color: colors.teal, fontFamily: 'Poppins', fontSize: 12, fontWeight: '900', marginTop: 5 },
  reason: { color: colors.muted, fontFamily: 'Poppins', fontSize: 11, lineHeight: 16, fontWeight: '700', marginTop: 4 },
  paymentActionPanel: { borderRadius: 16, backgroundColor: colors.field, padding: 12, gap: 10 },
  paymentActionText: { color: colors.ink, fontFamily: 'Poppins', fontSize: 12, lineHeight: 18, fontWeight: '800' },
  paymentActions: { flexDirection: 'row', gap: 10 },
  infoButton: { flex: 1, minHeight: 48, borderRadius: 12, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  payButton: { flex: 1, minHeight: 48, borderRadius: 12, backgroundColor: colors.teal, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
  passiveActionPanel: { borderRadius: 14, backgroundColor: colors.panel, paddingHorizontal: 12, paddingVertical: 10 },
  passiveActionText: { color: colors.muted, fontFamily: 'Poppins', fontSize: 12, lineHeight: 17, fontWeight: '800', textAlign: 'center' },
  openButton: { minHeight: 46, borderRadius: 12, backgroundColor: colors.panel, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  actionIconText: { color: colors.teal, fontFamily: 'Poppins', fontSize: 20, lineHeight: 24, fontWeight: '900' },
  actionCardIcon: { width: 26, height: 20, borderRadius: 7, backgroundColor: colors.white, padding: 5, justifyContent: 'center' },
  actionCardLine: { width: 15, height: 3, borderRadius: 2, backgroundColor: colors.teal, marginBottom: 4 },
  actionCardDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.teal, alignSelf: 'flex-end' },
  actionVideoIcon: { width: 25, height: 19, borderRadius: 7, backgroundColor: colors.teal, justifyContent: 'center' },
  actionVideoLens: { width: 11, height: 7, borderRadius: 4, backgroundColor: colors.white, marginLeft: 5 },
  actionVideoWing: { position: 'absolute', right: -6, width: 9, height: 12, borderTopRightRadius: 6, borderBottomRightRadius: 6, backgroundColor: colors.teal },
  emptyState: { minHeight: 320, borderRadius: 22, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center', padding: 22, gap: 12 },
  emptyIcon: { width: 68, height: 68, borderRadius: 24, backgroundColor: colors.panel, alignItems: 'center', justifyContent: 'center' },
  emptyIconText: { color: colors.teal, fontFamily: 'Poppins', fontSize: 32, lineHeight: 36, fontWeight: '900' },
  emptyTitle: { color: colors.ink, fontFamily: 'Poppins', fontSize: 20, fontWeight: '900', textAlign: 'center' },
  emptyCopy: { maxWidth: 420, color: colors.muted, fontFamily: 'Poppins', fontSize: 13, lineHeight: 20, fontWeight: '700', textAlign: 'center' },
});
