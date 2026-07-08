import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { BottomTabs, Header, PrimaryButton, Row, Screen } from '../components/HealthClanUI';
import { colors } from '../constants/healthclanDesign';
import { healthclanApi } from '../lib/api';
import { appointmentTimestamp, sortAppointmentsNewestFirst } from '../lib/appointments';

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

  if (status === 'completed') {
    return (
      <View accessibilityLabel="Completed" style={[styles.statusIcon, styles.statusIconConfirmed]}>
        <Text style={styles.statusIconText}>✓</Text>
      </View>
    );
  }

  return (
    <View accessibilityLabel="Pending" style={styles.statusIcon}>
      <View style={styles.statusIconDot} />
    </View>
  );
}

function entityId(value: any) {
  return String(value?._id || value?.id || value || '');
}

function requestTimestamp(value: any) {
  const raw = value?.createdAt || value?.updatedAt || value?.preferredTime || value?.date;
  const parsed = raw ? new Date(raw) : null;
  return parsed && !Number.isNaN(parsed.getTime()) ? parsed.getTime() : 0;
}

function openDoctorNotes(appointment: any) {
  router.push({
    pathname: '/doctor-notes',
    params: { appointmentId: entityId(appointment) },
  } as any);
}

function openRateDoctor(appointment: any) {
  router.push({
    pathname: '/rate-doctor',
    params: {
      appointmentId: entityId(appointment),
      doctorId: entityId(appointment.doctor),
      doctorName: appointment.doctor?.fullName || 'Doctor appointment',
    },
  } as any);
}

export default function History() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [careRequests, setCareRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1200, useNativeDriver: true }),
      ]),
    ).start();
  }, [pulse]);

  const loadRecords = useCallback(() => {
    setLoading(true);
    Promise.all([
      healthclanApi.doctors.appointments().then(items => setAppointments(Array.isArray(items) ? sortAppointmentsNewestFirst(items) : [])).catch(() => setAppointments([])),
      healthclanApi.care.myRequests().then(setCareRequests).catch(() => setCareRequests([])),
    ]).finally(() => setLoading(false));
  }, []);

  useFocusEffect(loadRecords);

  const sortedAppointments = useMemo(
    () => appointments.slice().sort((a, b) => appointmentTimestamp(b) - appointmentTimestamp(a)),
    [appointments]
  );
  const sortedCareRequests = useMemo(
    () => careRequests.slice().sort((a, b) => requestTimestamp(b) - requestTimestamp(a)),
    [careRequests]
  );
  const hasRecords = appointments.length > 0 || careRequests.length > 0;
  const iconScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] });
  const orbitOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.85] });

  return (
    <View style={styles.wrap}>
      <Screen bottom={104}>
        <Header title="Record" />
        {loading ? (
          <View style={styles.loadingPanel}>
            <Text style={styles.loadingText}>Loading your records...</Text>
          </View>
        ) : hasRecords ? (
          <View style={styles.list}>
            {sortedAppointments.map(appointment => {
              const isCompleted = appointment.status === 'completed';
              const isPaymentDue = appointment.status === 'pending_payment';
              const isConfirmed = appointment.status === 'confirmed';
              const appointmentId = entityId(appointment);
              const doctorId = entityId(appointment.doctor);

              return (
                <View key={appointmentId} style={styles.recordItem}>
                  <Pressable
                    style={styles.recordRow}
                    onPress={() => {
                      if (isCompleted) {
                        openDoctorNotes(appointment);
                        return;
                      }

                      if (isPaymentDue || isConfirmed) {
                        router.push({
                          pathname: '/video-call',
                          params: { appointmentId, doctorId, active: 'true' },
                        } as any);
                        return;
                      }

                    }}
                  >
                    <View style={styles.rowIcon}>
                      <Text style={styles.rowIconText}>A</Text>
                    </View>
                    <View style={styles.rowCopy}>
                      <Text style={styles.rowTitle}>{appointment.service?.name || 'Doctor appointment'}</Text>
                      <Text style={styles.rowSubtitle}>
                        {appointment.startTime ? new Date(appointment.startTime).toLocaleString() : 'Scheduled'} - {appointment.doctor?.fullName || 'Doctor'}
                      </Text>
                      {isPaymentDue ? <Text style={styles.paymentHint}>Tap to view appointment info</Text> : null}
                      {isCompleted ? <Text style={styles.paymentHint}>Tap to view doctor notes</Text> : null}
                    </View>
                    <StatusIcon status={appointment.status} />
                  </Pressable>
                  {isCompleted ? (
                    <View style={styles.completedActions}>
                      <Pressable style={styles.notesButton} onPress={() => openDoctorNotes(appointment)}>
                        <Text style={styles.notesButtonText}>Doctor notes</Text>
                      </Pressable>
                      <Pressable style={styles.rateButton} onPress={() => openRateDoctor(appointment)}>
                        <Text style={styles.rateButtonText}>Rate doctor</Text>
                      </Pressable>
                    </View>
                  ) : null}
                </View>
            );})}
            {sortedCareRequests.map(request => (
              <Row
                key={request._id}
                title="Care request"
                subtitle={`${request.location?.city || 'Location pending'} • ${request.careType?.replace(/_/g, ' ') || 'Care support'}`}
                right={request.patientStatus === 'viewed' ? 'viewed' : request.status === 'open' ? 'pending' : request.status}
                onPress={() => router.push('/care-requests' as any)}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Animated.View style={[styles.emptyVisual, { transform: [{ scale: iconScale }] }]}>
              <Animated.View style={[styles.orbit, { opacity: orbitOpacity }]} />
              <View style={styles.recordCard}>
                <View style={styles.recordLineWide} />
                <View style={styles.recordLine} />
                <View style={styles.recordLineShort} />
                <View style={styles.recordBadge}>
                  <Text style={styles.recordBadgeText}>+</Text>
                </View>
              </View>
            </Animated.View>

            <Text style={styles.emptyTitle}>No records yet</Text>
            <Text style={styles.emptyCopy}>
              Your appointments, care requests, consultation notes, and visit history will appear here once you start using HealthClan.
            </Text>

            <View style={styles.actions}>
              <PrimaryButton title="Book Appointment" onPress={() => router.push('/specialties' as any)} />
              <Pressable style={styles.secondaryAction} onPress={() => router.push('/request' as any)}>
                <Text style={styles.secondaryActionText}>Request a carer</Text>
              </Pressable>
            </View>
          </View>
        )}
      </Screen>
      <BottomTabs active="record" />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  list: { gap: 12 },
  recordItem: { gap: 8 },
  recordRow: {
    minHeight: 82,
    borderRadius: 18,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowIcon: { width: 44, height: 44, borderRadius: 16, backgroundColor: colors.panel, alignItems: 'center', justifyContent: 'center' },
  rowIconText: { color: colors.teal, fontFamily: 'Poppins', fontSize: 17, fontWeight: '900' },
  rowCopy: { flex: 1, minWidth: 0 },
  rowTitle: { color: colors.ink, fontFamily: 'Poppins', fontSize: 14, fontWeight: '900' },
  rowSubtitle: { color: colors.muted, fontFamily: 'Poppins', fontSize: 12, lineHeight: 17, fontWeight: '700', marginTop: 3 },
  paymentHint: { color: colors.teal, fontFamily: 'Poppins', fontSize: 11, fontWeight: '900', marginTop: 5 },
  completedActions: { flexDirection: 'row', gap: 10, paddingHorizontal: 2 },
  notesButton: { flex: 1, minHeight: 44, borderRadius: 12, backgroundColor: colors.teal, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  notesButtonText: { color: colors.white, fontFamily: 'Poppins', fontSize: 13, fontWeight: '900' },
  rateButton: { flex: 1, minHeight: 44, borderRadius: 12, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  rateButtonText: { color: colors.teal, fontFamily: 'Poppins', fontSize: 13, fontWeight: '900' },
  statusIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.panel, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  statusIconConfirmed: { backgroundColor: 'rgba(17,162,111,0.12)' },
  statusIconPayment: { backgroundColor: colors.field },
  statusIconText: { color: '#0F8F64', fontFamily: 'Poppins', fontSize: 20, lineHeight: 24, fontWeight: '900' },
  statusIconDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.teal },
  cardIconLine: { width: 20, height: 4, borderRadius: 3, backgroundColor: colors.teal, marginBottom: 5 },
  cardIconDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.teal, alignSelf: 'flex-start', marginLeft: 9 },
  loadingPanel: {
    minHeight: 180,
    borderRadius: 18,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
  },
  loadingText: { color: colors.muted, fontFamily: 'Poppins', fontSize: 14, fontWeight: '800' },
  emptyState: {
    minHeight: 430,
    borderRadius: 22,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 22,
  },
  emptyVisual: {
    width: 150,
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  orbit: {
    position: 'absolute',
    width: 138,
    height: 138,
    borderRadius: 69,
    borderWidth: 2,
    borderColor: colors.aqua,
    backgroundColor: colors.field,
  },
  recordCard: {
    width: 92,
    height: 112,
    borderRadius: 18,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: 'rgba(8,81,97,0.18)',
    padding: 14,
    justifyContent: 'center',
    gap: 10,
  },
  recordLineWide: { width: '80%', height: 9, borderRadius: 5, backgroundColor: colors.teal },
  recordLine: { width: '64%', height: 8, borderRadius: 4, backgroundColor: colors.cyan },
  recordLineShort: { width: '48%', height: 8, borderRadius: 4, backgroundColor: colors.panel },
  recordBadge: {
    position: 'absolute',
    right: -10,
    bottom: -10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.teal,
    borderWidth: 3,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordBadgeText: { color: colors.white, fontFamily: 'Poppins', fontSize: 22, lineHeight: 26, fontWeight: '900' },
  emptyTitle: { color: colors.ink, fontFamily: 'Poppins', fontSize: 24, fontWeight: '900', textAlign: 'center' },
  emptyCopy: {
    maxWidth: 470,
    color: colors.muted,
    fontFamily: 'Poppins',
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 8,
  },
  actions: { width: '100%', maxWidth: 420, gap: 12, marginTop: 22 },
  secondaryAction: {
    minHeight: 52,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryActionText: { color: colors.teal, fontFamily: 'Poppins', fontSize: 15, fontWeight: '900' },
});
