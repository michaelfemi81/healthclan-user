import { router, useLocalSearchParams } from 'expo-router';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Card, Header, PrimaryButton, Screen } from '../components/HealthClanUI';
import { TwilioVideoRoom, type TwilioVideoSession } from '../components/TwilioVideoRoom';
import { colors } from '../constants/healthclanDesign';
import { healthclanApi } from '../lib/api';

function statusLabel(status?: string) {
  if (status === 'pending_payment') return 'Payment due';
  if (status === 'confirmed') return 'Confirmed';
  return status ? String(status).replace(/_/g, ' ') : 'Scheduled';
}

function StatusIcon({ status, inverted = false }: { status?: string; inverted?: boolean }) {
  if (status === 'confirmed') {
    return (
      <View accessibilityLabel="Confirmed" style={[styles.statusIcon, inverted && styles.statusIconInverted, styles.statusIconConfirmed]}>
        <Text style={[styles.statusIconText, inverted && styles.statusIconTextInverted]}>✓</Text>
      </View>
    );
  }

  if (status === 'pending_payment') {
    return (
      <View accessibilityLabel="Payment due" style={[styles.statusIcon, inverted && styles.statusIconInverted, styles.statusIconPayment]}>
        <View style={[styles.cardIconLine, inverted && styles.cardIconLineInverted]} />
        <View style={[styles.cardIconDot, inverted && styles.cardIconLineInverted]} />
      </View>
    );
  }

  return (
    <View accessibilityLabel={statusLabel(status)} style={[styles.statusIcon, inverted && styles.statusIconInverted]}>
      <View style={[styles.statusIconDot, inverted && styles.statusIconDotInverted]} />
    </View>
  );
}

function VideoIcon({ inverted = false }: { inverted?: boolean }) {
  return (
    <View style={[styles.videoIcon, inverted && styles.videoIconInverted]}>
      <View style={[styles.videoLens, inverted && styles.videoLensInverted]} />
      <View style={[styles.videoWing, inverted && styles.videoWingInverted]} />
    </View>
  );
}

function FileIcon() {
  return (
    <View style={styles.fileIcon}>
      <View style={styles.fileLineWide} />
      <View style={styles.fileLine} />
    </View>
  );
}

function DetailRow({
  title,
  subtitle,
  icon,
  right,
  onPress,
}: {
  title: string;
  subtitle?: string;
  icon: ReactNode;
  right?: ReactNode;
  onPress?: () => void;
}) {
  const content = (
    <>
      <View style={styles.detailIcon}>{icon}</View>
      <View style={styles.detailCopy}>
        <Text style={styles.detailTitle}>{title}</Text>
        {subtitle ? <Text style={styles.detailSubtitle}>{subtitle}</Text> : null}
      </View>
      {right ? <View style={styles.detailRight}>{right}</View> : null}
    </>
  );

  if (onPress) {
    return (
      <Pressable accessibilityRole="button" style={styles.detailRow} onPress={onPress}>
        {content}
      </Pressable>
    );
  }

  return <View style={styles.detailRow}>{content}</View>;
}

export default function VideoCall() {
  const params = useLocalSearchParams();
  const appointmentId = Array.isArray(params.appointmentId) ? params.appointmentId[0] : params.appointmentId;
  const [appointment, setAppointment] = useState<any>(null);
  const [loading, setLoading] = useState(Boolean(appointmentId));
  const [joining, setJoining] = useState(false);
  const [message, setMessage] = useState('');
  const [videoSession, setVideoSession] = useState<TwilioVideoSession | null>(null);
  const appointmentDate = appointment?.startTime ? new Date(appointment.startTime) : null;
  const doctorName = appointment?.doctor?.fullName || [appointment?.doctor?.firstName, appointment?.doctor?.lastName].filter(Boolean).join(' ');
  const doctorSpecialty = appointment?.doctor?.profile?.specialization || appointment?.service?.name || 'Video visit';
  const serviceName = appointment?.service?.name || 'Video consultation';
  const status = statusLabel(appointment?.status);
  const isPaymentDue = appointment?.status === 'pending_payment';
  const initials = doctorName
    ? doctorName.split(' ').filter(Boolean).slice(0, 2).map((part: string) => part.charAt(0)).join('').toUpperCase()
    : 'HC';

  useEffect(() => {
    if (!appointmentId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setMessage('');
    healthclanApi.doctors.appointment(appointmentId)
      .then(setAppointment)
      .catch(error => setMessage(error instanceof Error ? error.message : 'Unable to load video visit.'))
      .finally(() => setLoading(false));
  }, [appointmentId]);

  async function joinVisit() {
    if (!appointmentId || joining) return;

    setJoining(true);
    setMessage('');

    try {
      const session = await healthclanApi.doctors.joinAppointment(appointmentId) as TwilioVideoSession;
      if (!session?.token || !session?.roomId) {
        throw new Error('Video room could not be prepared. Please try again.');
      }
      setVideoSession(session);
      setMessage('');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to join video visit yet.');
    } finally {
      setJoining(false);
    }
  }

  function completePayment() {
    router.push({
      pathname: '/payment',
      params: { appointmentId, doctorId: appointment?.doctor?._id },
    } as any);
  }

  if (loading) {
    return (
      <Screen>
        <Header title="Video Visit" />
        <View style={styles.loading}>
          <ActivityIndicator color={colors.teal} />
          <Text style={styles.loadingText}>Loading video visit...</Text>
        </View>
      </Screen>
    );
  }

  if (!appointmentId || (!appointment && !message)) {
    return (
      <Screen>
        <Header title="Video Visit" />
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Text style={styles.emptyIconText}>▶</Text>
          </View>
          <Text style={styles.emptyTitle}>No video visit selected</Text>
          <Text style={styles.emptyCopy}>Book an appointment or open a scheduled visit from your records to start a video consultation.</Text>
          <View style={styles.emptyActions}>
            <PrimaryButton title="Book Appointment" onPress={() => router.push('/specialties' as any)} />
            <PrimaryButton title="View Records" onPress={() => router.push('/history' as any)} />
          </View>
        </View>
      </Screen>
    );
  }

  if (!appointment) {
    return (
      <Screen>
        <Header title="Video Visit" />
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Text style={styles.emptyIconText}>!</Text>
          </View>
          <Text style={styles.emptyTitle}>Unable to open visit</Text>
          <Text style={styles.emptyCopy}>{message || 'This video visit could not be loaded. Please open it again from your records.'}</Text>
          <View style={styles.emptyActions}>
            <PrimaryButton title="View Records" onPress={() => router.push('/history' as any)} />
            <PrimaryButton title="Back Home" onPress={() => router.replace('/' as any)} />
          </View>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <Header title="Video Visit" />
      {videoSession ? (
        <View style={styles.liveSummary}>
          <View style={styles.liveAvatar}>
            <Text style={styles.liveAvatarText}>{initials}</Text>
          </View>
          <View style={styles.liveCopy}>
            <Text style={styles.liveTitle}>{doctorName || 'Doctor'}</Text>
            <Text style={styles.liveSub}>{serviceName} - {status}</Text>
          </View>
          <StatusIcon status={appointment.status} />
        </View>
      ) : (
        <View style={styles.call}>
          <View style={styles.statusPill}>
            <StatusIcon status={appointment.status} inverted />
            <Text style={styles.statusText}>{status}</Text>
          </View>
          <Text style={styles.initials}>{initials}</Text>
          <Text style={styles.title}>{serviceName}</Text>
          <Text style={styles.sub}>{doctorName || 'Doctor'} - {doctorSpecialty}</Text>
          <Text style={styles.time}>
            {appointmentDate
              ? `${appointmentDate.toLocaleDateString()} at ${appointmentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
              : 'Time unavailable'}
          </Text>
        </View>
      )}
      {videoSession ? (
        <TwilioVideoRoom
          session={videoSession}
          onLeave={() => {
            setVideoSession(null);
            setMessage('You left the video visit.');
          }}
        />
      ) : null}
      <Card>
        <DetailRow
          title="Appointment"
          subtitle={`${doctorName || 'Doctor'} - ${doctorSpecialty}`}
          icon={<VideoIcon />}
          right={<StatusIcon status={appointment.status} />}
        />
        <View style={styles.separator} />
        <DetailRow
          title="Time"
          subtitle={appointmentDate ? `${appointmentDate.toLocaleDateString()} at ${appointmentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Time unavailable'}
          icon={<Text style={styles.detailIconText}>T</Text>}
          right={<VideoIcon />}
        />
        <View style={styles.separator} />
        <DetailRow
          title="Health record"
          subtitle="Consultation notes and follow-up details"
          icon={<FileIcon />}
          right={<FileIcon />}
          onPress={() => router.push({ pathname: '/doctor-notes', params: { appointmentId } } as any)}
        />
      </Card>
      {!videoSession || isPaymentDue ? (
        <View style={styles.actions}>
          <PrimaryButton
            title={isPaymentDue ? 'Complete Payment' : joining ? 'Joining...' : 'Join Video Visit'}
            onPress={isPaymentDue ? completePayment : joinVisit}
            loading={joining}
          />
          {!!message && <Text style={styles.message}>{message}</Text>}
          <Text style={styles.helper}>{appointment?.reasonForVisit || 'Join when your confirmed appointment is ready.'}</Text>
        </View>
      ) : (
        <View style={styles.actions}>
          {!!message && <Text style={styles.message}>{message}</Text>}
          <Text style={styles.helper}>Use the controls above to mute, pause camera, switch fullscreen, or leave the visit.</Text>
        </View>
      )}
      <Pressable style={styles.backLink} onPress={() => router.replace('/')}>
        <Text style={styles.backLinkText}>Back Home</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { minHeight: 320, borderRadius: 24, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 22 },
  loadingText: { color: colors.muted, fontFamily: 'Poppins', fontSize: 13, fontWeight: '800' },
  empty: { minHeight: 430, borderRadius: 24, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center', padding: 22 },
  emptyIcon: { width: 72, height: 72, borderRadius: 24, backgroundColor: colors.field, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  emptyIconText: { color: colors.teal, fontSize: 28, fontWeight: '900' },
  emptyTitle: { color: colors.ink, fontFamily: 'Poppins', fontSize: 24, fontWeight: '900', textAlign: 'center' },
  emptyCopy: { maxWidth: 430, color: colors.muted, fontFamily: 'Poppins', fontSize: 13, lineHeight: 20, fontWeight: '700', textAlign: 'center', marginTop: 8 },
  emptyActions: { width: '100%', maxWidth: 390, gap: 12, marginTop: 20 },
  call: { minHeight: 330, borderRadius: 24, backgroundColor: colors.teal, alignItems: 'center', justifyContent: 'center', padding: 24, marginBottom: 18 },
  liveSummary: { minHeight: 78, borderRadius: 18, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, marginBottom: 12 },
  liveAvatar: { width: 50, height: 50, borderRadius: 18, backgroundColor: colors.teal, alignItems: 'center', justifyContent: 'center' },
  liveAvatarText: { color: colors.white, fontFamily: 'Poppins', fontSize: 15, fontWeight: '900' },
  liveCopy: { flex: 1, minWidth: 0 },
  liveTitle: { color: colors.ink, fontFamily: 'Poppins', fontSize: 16, fontWeight: '900' },
  liveSub: { color: colors.muted, fontFamily: 'Poppins', fontSize: 12, lineHeight: 18, fontWeight: '800', marginTop: 2 },
  statusPill: { position: 'absolute', top: 18, right: 18, minHeight: 40, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.16)', flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10 },
  statusText: { color: colors.white, fontFamily: 'Poppins', fontSize: 12, fontWeight: '900' },
  statusIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.panel, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  statusIconInverted: { backgroundColor: 'rgba(255,255,255,0.2)' },
  statusIconConfirmed: { backgroundColor: 'rgba(17,162,111,0.14)' },
  statusIconPayment: { backgroundColor: colors.field },
  statusIconText: { color: '#0F8F64', fontFamily: 'Poppins', fontSize: 18, lineHeight: 22, fontWeight: '900' },
  statusIconTextInverted: { color: colors.white },
  statusIconDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.teal },
  statusIconDotInverted: { backgroundColor: colors.white },
  cardIconLine: { width: 18, height: 4, borderRadius: 3, backgroundColor: colors.teal, marginBottom: 4 },
  cardIconLineInverted: { backgroundColor: colors.white },
  cardIconDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.teal, alignSelf: 'flex-start', marginLeft: 8 },
  initials: { width: 96, height: 96, borderRadius: 48, backgroundColor: colors.white, color: colors.teal, textAlign: 'center', lineHeight: 96, fontFamily: 'Poppins', fontSize: 30, fontWeight: '900' },
  title: { color: colors.white, fontFamily: 'Poppins', fontSize: 24, fontWeight: '900', marginTop: 18 },
  sub: { color: 'rgba(255,255,255,0.82)', fontFamily: 'Poppins', fontSize: 14, lineHeight: 22, fontWeight: '700', textAlign: 'center', marginTop: 8 },
  time: { color: colors.white, fontFamily: 'Poppins', fontSize: 16, fontWeight: '900', marginTop: 10 },
  videoIcon: { width: 26, height: 20, borderRadius: 7, backgroundColor: colors.teal, justifyContent: 'center' },
  videoIconInverted: { backgroundColor: colors.white },
  videoLens: { width: 12, height: 8, borderRadius: 4, backgroundColor: colors.white, marginLeft: 5 },
  videoLensInverted: { backgroundColor: colors.teal },
  videoWing: { position: 'absolute', right: -6, width: 9, height: 12, borderTopRightRadius: 6, borderBottomRightRadius: 6, backgroundColor: colors.teal },
  videoWingInverted: { backgroundColor: colors.white },
  fileIcon: { width: 24, height: 28, borderRadius: 7, backgroundColor: colors.teal, padding: 6, gap: 4, justifyContent: 'center' },
  fileLineWide: { width: 12, height: 3, borderRadius: 2, backgroundColor: colors.white },
  fileLine: { width: 8, height: 3, borderRadius: 2, backgroundColor: colors.white },
  detailRow: { minHeight: 74, flexDirection: 'row', alignItems: 'center', gap: 12 },
  detailIcon: { width: 44, height: 44, borderRadius: 16, backgroundColor: colors.panel, alignItems: 'center', justifyContent: 'center' },
  detailIconText: { color: colors.teal, fontFamily: 'Poppins', fontSize: 17, fontWeight: '900' },
  detailCopy: { flex: 1, minWidth: 0 },
  detailTitle: { color: colors.ink, fontFamily: 'Poppins', fontSize: 14, fontWeight: '900' },
  detailSubtitle: { color: colors.muted, fontFamily: 'Poppins', fontSize: 12, lineHeight: 18, fontWeight: '700', marginTop: 3 },
  detailRight: { flexShrink: 0 },
  separator: { height: 10 },
  actions: { gap: 10, marginVertical: 18 },
  message: { color: colors.teal, fontFamily: 'Poppins', fontSize: 12, lineHeight: 18, fontWeight: '800', textAlign: 'center' },
  helper: { color: colors.muted, fontFamily: 'Poppins', fontSize: 12, lineHeight: 18, fontWeight: '700', textAlign: 'center' },
  backLink: { minHeight: 44, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  backLinkText: { color: colors.teal, fontFamily: 'Poppins', fontSize: 13, fontWeight: '900' },
});
