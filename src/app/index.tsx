import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { AssetImage } from '../components/AssetImage';
import { BottomTabs, Card, PrimaryButton, Row, Screen } from '../components/HealthClanUI';
import { colors } from '../constants/healthclanDesign';
import { hasCompletedOnboarding, isAuthenticated } from '../constants/session';
import { healthclanApi } from '../lib/api';
import { appointmentDate, sortAppointmentsNewestFirst } from '../lib/appointments';

const INITIAL_DATE_OFFSET = 180;
const DATE_ITEM_WIDTH = 72;
const DATE_PILL_WIDTH = 64;

function startOfDay(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function apiDate(date: Date) {
  return dateKey(date);
}

function buildDays(centerDate: Date, pastDays = INITIAL_DATE_OFFSET, futureDays = INITIAL_DATE_OFFSET) {
  return Array.from({ length: pastDays + futureDays + 1 }, (_, index) => addDays(centerDate, index - pastDays));
}

function isUnreadNotification(item: any) {
  return item?.unread || item?.isRead === false || item?.read === false;
}

function appointmentStatusLabel(status?: string) {
  if (status === 'pending_payment') return 'Payment due';
  if (status === 'requested') return 'Awaiting doctor';
  return status ? status.replace(/_/g, ' ') : 'Scheduled';
}

function isPaymentDue(status?: string) {
  return status === 'pending_payment';
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

  return <Text style={styles.statusPill}>{appointmentStatusLabel(status)}</Text>;
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

function openAppointmentPayment(appointment: any) {
  const appointmentId = String(appointment?._id || appointment?.id || '');
  router.push({
    pathname: '/payment',
    params: { appointmentId, doctorId: String(appointment?.doctor?._id || appointment?.doctor?.id || '') },
  } as any);
}

function openAppointmentVideo(appointment: any) {
  const appointmentId = String(appointment?._id || appointment?.id || '');
  router.push({
    pathname: '/video-call',
    params: { appointmentId, doctorId: String(appointment?.doctor?._id || appointment?.doctor?.id || ''), active: 'true' },
  } as any);
}

function BellIcon() {
  return (
    <View style={styles.bell}>
      <View style={styles.bellHandle} />
      <View style={styles.bellBody} />
      <View style={styles.bellBase} />
      <View style={styles.bellClapper} />
    </View>
  );
}

export default function Home() {
  const { width } = useWindowDimensions();
  const dateListRef = useRef<FlatList<Date> | null>(null);
  const dateListCentered = useRef(false);
  const [dateListWidth, setDateListWidth] = useState(0);
  const isCompact = width < 430;
  const intro = isCompact
    ? 'Appointments, video visits, carers, and health records.'
    : 'Appointments, video visits, carers, and health records in one calm place.';
  const [ready, setReady] = useState(false);
  const today = useMemo(() => startOfDay(), []);
  const [calendarDays, setCalendarDays] = useState(() => buildDays(today));
  const [selectedDate, setSelectedDate] = useState(today);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [cards, setCards] = useState<any[]>([]);
  const selectedDateKey = dateKey(selectedDate);
  const selectedAppointments = useMemo(() => sortAppointmentsNewestFirst(appointments), [appointments]);
  const unreadCount = notifications.filter(isUnreadNotification).length;
  const monthLabel = selectedDate.toLocaleDateString([], { month: 'long', year: 'numeric' });
  const dateSidePadding = Math.max((dateListWidth - DATE_PILL_WIDTH) / 2, 0);

  const loadDashboardMeta = useCallback(() => {
    healthclanApi.users.favorites().then(setFavorites).catch(() => setFavorites([]));
    healthclanApi.payments.cards().then(setCards).catch(() => setCards([]));
    healthclanApi.notifications.list().then(setNotifications).catch(() => setNotifications([]));
  }, []);

  const loadSelectedAppointments = useCallback(() => {
    if (!ready) return;

    setAppointmentsLoading(true);
    healthclanApi.doctors.appointments({ date: apiDate(selectedDate) })
      .then(items => setAppointments(Array.isArray(items) ? sortAppointmentsNewestFirst(items) : []))
      .catch(() => setAppointments([]))
      .finally(() => setAppointmentsLoading(false));
  }, [ready, selectedDateKey]);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace(hasCompletedOnboarding() ? '/sign-in' as any : '/onboard' as any);
      return;
    }
    setReady(true);
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!isAuthenticated()) return;
      loadDashboardMeta();
    }, [loadDashboardMeta])
  );

  useFocusEffect(
    useCallback(() => {
      loadSelectedAppointments();
    }, [loadSelectedAppointments])
  );

  useEffect(loadSelectedAppointments, [loadSelectedAppointments]);

  function loadMoreFutureDays() {
    setCalendarDays(current => {
      const last = current[current.length - 1] || today;
      return [...current, ...Array.from({ length: 45 }, (_, index) => addDays(last, index + 1))];
    });
  }

  function centerToday() {
    if (dateListCentered.current || dateListWidth <= 0) return;
    dateListCentered.current = true;

    requestAnimationFrame(() => {
      dateListRef.current?.scrollToOffset({
        offset: INITIAL_DATE_OFFSET * DATE_ITEM_WIDTH,
        animated: false,
      });
    });
  }

  useEffect(() => {
    dateListCentered.current = false;
    centerToday();
  }, [dateListWidth]);

  if (!ready) {
    return <View style={styles.wrap} />;
  }

  return (
    <View style={styles.wrap}>
      <Screen bottom={104}>
        <View style={[styles.hero, isCompact && styles.heroCompact]}>
          <View style={styles.heroHeader}>
            <View style={styles.heroCopy}>
              <Text style={styles.eyebrow}>Good morning</Text>
              <Text style={[styles.title, isCompact && styles.titleCompact]}>Your care, organized.</Text>
              <Text style={[styles.sub, isCompact && styles.subCompact]}>{intro}</Text>
            </View>
            <Pressable
              accessibilityLabel="Open notifications"
              style={styles.notification}
              onPress={() => router.push('/notifications' as any)}
            >
              <BellIcon />
              {unreadCount > 0 ? (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                </View>
              ) : null}
            </Pressable>
          </View>
        </View>
        <View style={styles.searchRow}>
          <Pressable style={styles.search} onPress={() => router.push('/search' as any)}>
            <Text style={styles.searchText}>Search doctors, specialties, symptoms</Text>
          </Pressable>
          <Pressable style={styles.filterButton} onPress={() => router.push('/doctor-filter' as any)}>
            <Text style={styles.filterText}>Filter</Text>
          </Pressable>
        </View>
        <View style={[styles.quick, isCompact && styles.quickCompact]}>
          <Pressable style={styles.quickCard} onPress={() => router.push('/specialties' as any)}>
            <AssetImage source={require('../../assets/images/choose.png')} style={styles.quickImage} resizeMode="contain" />
            <Text style={styles.quickTitle}>Book Doctor</Text>
          </Pressable>
          <Pressable style={styles.quickCard} onPress={() => router.push('/appointments' as any)}>
            <AssetImage source={require('../../assets/images/call.png')} style={styles.quickImage} resizeMode="contain" />
            <Text style={styles.quickTitle}>Video visit</Text>
          </Pressable>
          <Pressable style={styles.quickCard} onPress={() => router.push('/request' as any)}>
            <AssetImage source={require('../../assets/images/carer.png')} style={styles.quickImage} resizeMode="contain" />
            <Text style={styles.quickTitle}>Request A Carer</Text>
          </Pressable>
        </View>
        <View style={styles.sectionRow}>
          <View style={styles.sectionCopy}>
            <Text style={styles.sectionInline}>Upcoming Appointments</Text>
            <Text style={styles.monthLabel}>{monthLabel}</Text>
          </View>
          <Text style={styles.sectionLink} onPress={() => router.push('/appointments' as any)}>View all</Text>
        </View>
        <Card>
          <FlatList
            ref={dateListRef}
            horizontal
            data={calendarDays}
            keyExtractor={item => dateKey(item)}
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={INITIAL_DATE_OFFSET}
            getItemLayout={(_, index) => ({ length: DATE_ITEM_WIDTH, offset: DATE_ITEM_WIDTH * index, index })}
            onLayout={({ nativeEvent }) => {
              setDateListWidth(nativeEvent.layout.width);
            }}
            onContentSizeChange={centerToday}
            onScrollToIndexFailed={() => setTimeout(centerToday, 80)}
            onEndReached={loadMoreFutureDays}
            onEndReachedThreshold={0.55}
            contentContainerStyle={[styles.calendar, isCompact && styles.calendarCompact, { paddingLeft: dateSidePadding, paddingRight: dateSidePadding }]}
            renderItem={({ item }) => {
              const selected = dateKey(item) === selectedDateKey;
              const isToday = dateKey(item) === dateKey(today);
              return (
                <Pressable style={[styles.day, selected && styles.dayActive]} onPress={() => setSelectedDate(item)}>
                  <Text style={[styles.dayName, selected && styles.dayTextActive]}>{item.toLocaleDateString([], { weekday: 'short' })}</Text>
                  <Text style={[styles.dayDate, selected && styles.dayTextActive]}>{item.getDate()}</Text>
                  <Text style={[styles.todayLabel, selected && styles.dayTextActive]}>{isToday ? 'Today' : item.toLocaleDateString([], { month: 'short' })}</Text>
                </Pressable>
              );
            }}
          />
          {appointmentsLoading ? (
            <View style={styles.appointmentLoading}>
              <ActivityIndicator color={colors.teal} />
              <Text style={styles.appointmentLoadingText}>Checking appointments for this day...</Text>
            </View>
          ) : selectedAppointments.length > 0 ? (
            selectedAppointments.map(appointment => {
              const currentAppointmentDate = appointmentDate(appointment);
              const needsPayment = isPaymentDue(appointment.status);
              return (
                <View
                  key={appointment._id || `${appointment.service?.name}-${appointment.startTime}`}
                  style={[styles.appointmentCard, needsPayment && styles.appointmentCardPaymentDue, isCompact && styles.appointmentCompact]}
                >
                  <View style={styles.appointmentMain}>
                    <View style={[styles.appointmentTime, needsPayment && styles.appointmentTimePayment]}>
                      <Text style={styles.appointmentTimeMain}>{currentAppointmentDate ? currentAppointmentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</Text>
                      <Text style={styles.appointmentTimeSub}>Video</Text>
                    </View>
                    <View style={styles.appointmentCopy}>
                      <View style={styles.appointmentTopRow}>
                        <Text style={styles.appointmentTitle} numberOfLines={1}>{appointment.service?.name || 'Doctor appointment'}</Text>
                        <StatusIcon status={appointment.status} />
                      </View>
                      <Text style={styles.appointmentSub}>{appointment.doctor?.fullName || 'Doctor'}</Text>
                      <Text style={styles.appointmentMeta}>{appointment.reasonForVisit || 'No visit reason added yet.'}</Text>
                    </View>
                  </View>
                  {needsPayment ? (
                    <View style={styles.homePaymentPanel}>
                      <Text style={styles.homePaymentNoteText}>Doctor accepted. Complete checkout to confirm this slot.</Text>
                      <View style={styles.homePaymentActions}>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel="View appointment info"
                          style={styles.homeInfoButton}
                          onPress={() => openAppointmentVideo(appointment)}
                        >
                          <InfoIcon />
                        </Pressable>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel="Complete payment"
                          style={styles.homePayButton}
                          onPress={() => openAppointmentPayment(appointment)}
                        >
                          <PayIcon />
                        </Pressable>
                      </View>
                    </View>
                  ) : appointment.status === 'confirmed' ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Open video visit"
                      style={styles.homeOpenButton}
                      onPress={() => openAppointmentVideo(appointment)}
                    >
                      <VideoIcon />
                    </Pressable>
                  ) : appointment.status === 'requested' ? (
                    <View style={styles.homePassivePanel}>
                      <Text style={styles.homePassiveText}>Waiting for the doctor to accept this request.</Text>
                    </View>
                  ) : (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="View appointment details"
                      style={styles.homeOpenButton}
                      onPress={() => router.push('/appointments' as any)}
                    >
                      <InfoIcon />
                    </Pressable>
                  )}
                </View>
              );
            })
          ) : (
            <View style={styles.emptyAppointments}>
              <View style={styles.emptyIcon}>
                <Text style={styles.emptyIconText}>+</Text>
              </View>
              <Text style={styles.emptyTitle}>No appointment for this day</Text>
              <Text style={styles.emptyCopy}>Pick another date, book a doctor, or request a carer for help at home.</Text>
              <View style={styles.emptyActions}>
                <PrimaryButton title="Book Doctor" onPress={() => router.push('/specialties' as any)} />
                <Pressable style={styles.emptySecondary} onPress={() => router.push('/request' as any)}>
                  <Text style={styles.emptySecondaryText}>Request a carer</Text>
                </Pressable>
              </View>
            </View>
          )}
        </Card>
        <View style={styles.statusGrid}>
          <Pressable style={styles.statusCard} onPress={() => router.push('/favorites' as any)}>
            <Text style={styles.statusValue}>{favorites.length}</Text>
            <Text style={styles.statusLabel}>Saved doctors</Text>
          </Pressable>
          <Pressable style={styles.statusCard} onPress={() => router.push('/payment-methods' as any)}>
            <Text style={styles.statusValue}>{cards.length}</Text>
            <Text style={styles.statusLabel}>Payment method</Text>
          </Pressable>
        </View>
        <Text style={styles.section}>Care Tools</Text>
        <View style={styles.list}>
          <Row title="Book Appointment" subtitle="Choose a free consultation slot" onPress={() => router.push('/specialties' as any)} />
          <Row title="Notifications" subtitle="Recent appointment and account updates" onPress={() => router.push('/notifications' as any)} />
          <Row title="Health Records" subtitle="View consultations and doctor notes" onPress={() => router.push('/history' as any)} />
          <Row title="Settings" subtitle="Payments, security, language, and preferences" onPress={() => router.push('/settings' as any)} />
        </View>
      </Screen>
      <BottomTabs active="home" />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  hero: { borderRadius: 24, backgroundColor: colors.teal, padding: 20, minHeight: 132, gap: 18 },
  heroCompact: { minHeight: 0, padding: 16, borderRadius: 22, gap: 14 },
  heroHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14 },
  heroCopy: { flex: 1, minWidth: 0 },
  eyebrow: { color: 'rgba(255,255,255,0.72)', fontFamily: 'Poppins', fontSize: 13, fontWeight: '800', marginBottom: 10 },
  title: { color: colors.white, fontFamily: 'Poppins', fontSize: 30, lineHeight: 36, fontWeight: '900' },
  titleCompact: { fontSize: 25, lineHeight: 30 },
  sub: { color: 'rgba(255,255,255,0.84)', fontFamily: 'Poppins', fontSize: 14, lineHeight: 21, fontWeight: '700', marginTop: 8, maxWidth: 560 },
  subCompact: { fontSize: 13, lineHeight: 19, maxWidth: 260 },
  notification: { width: 46, height: 46, borderRadius: 23, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  notificationBadge: { position: 'absolute', top: -3, right: -3, minWidth: 19, height: 19, borderRadius: 10, backgroundColor: colors.aqua, borderWidth: 2, borderColor: colors.teal, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  notificationBadgeText: { color: colors.white, fontFamily: 'Poppins', fontSize: 10, lineHeight: 13, fontWeight: '900' },
  bell: { width: 22, height: 23, alignItems: 'center', justifyContent: 'flex-end' },
  bellHandle: { position: 'absolute', top: 2, width: 6, height: 4, borderTopLeftRadius: 4, borderTopRightRadius: 4, backgroundColor: colors.white },
  bellBody: { width: 16, height: 15, borderTopLeftRadius: 9, borderTopRightRadius: 9, borderBottomLeftRadius: 4, borderBottomRightRadius: 4, borderWidth: 2, borderColor: colors.white, borderBottomWidth: 0 },
  bellBase: { width: 20, height: 2, borderRadius: 2, backgroundColor: colors.white, marginTop: -1 },
  bellClapper: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.white, marginTop: 1 },
  searchRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  search: { flex: 1, minHeight: 52, borderRadius: 16, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, justifyContent: 'center', paddingHorizontal: 14 },
  searchText: { color: colors.muted, fontFamily: 'Poppins', fontSize: 13, fontWeight: '700' },
  filterButton: { minWidth: 88, borderRadius: 16, backgroundColor: colors.panel, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
  filterText: { color: colors.teal, fontFamily: 'Poppins', fontSize: 13, fontWeight: '900' },
  quick: { flexDirection: 'row', gap: 10, marginTop: 16 },
  quickCompact: { gap: 8 },
  quickCard: { flex: 1, minHeight: 126, borderRadius: 16, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center', padding: 10 },
  quickImage: { width: 56, height: 56, marginBottom: 8 },
  quickTitle: { color: colors.teal, fontFamily: 'Poppins', fontSize: 12, lineHeight: 16, fontWeight: '900', textAlign: 'center' },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 24, marginBottom: 12, gap: 12 },
  sectionCopy: { flex: 1, minWidth: 0 },
  section: { color: colors.ink, fontFamily: 'Poppins', fontSize: 20, fontWeight: '900', marginTop: 24, marginBottom: 12 },
  sectionInline: { color: colors.ink, fontFamily: 'Poppins', fontSize: 20, fontWeight: '900' },
  monthLabel: { color: colors.muted, fontFamily: 'Poppins', fontSize: 12, fontWeight: '800', marginTop: 3 },
  sectionLink: { color: colors.teal, fontFamily: 'Poppins', fontSize: 13, fontWeight: '900' },
  calendar: { paddingBottom: 14 },
  calendarCompact: {},
  day: { width: 64, minHeight: 78, borderRadius: 14, backgroundColor: colors.panel, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  dayActive: { backgroundColor: colors.teal },
  dayName: { color: colors.muted, fontFamily: 'Poppins', fontSize: 11, fontWeight: '800' },
  dayDate: { color: colors.ink, fontFamily: 'Poppins', fontSize: 18, fontWeight: '900', marginTop: 2 },
  todayLabel: { color: colors.muted, fontFamily: 'Poppins', fontSize: 10, fontWeight: '900', marginTop: 2 },
  dayTextActive: { color: colors.white },
  appointmentLoading: { minHeight: 138, borderRadius: 18, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 18, marginTop: 4 },
  appointmentLoadingText: { color: colors.muted, fontFamily: 'Poppins', fontSize: 12, fontWeight: '800', textAlign: 'center' },
  appointmentCard: {
    minHeight: 112,
    borderRadius: 20,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: 'rgba(8,81,97,0.18)',
    padding: 14,
    gap: 12,
    marginTop: 10,
  },
  appointmentCardPaymentDue: { backgroundColor: colors.white, borderColor: 'rgba(8,81,97,0.18)' },
  appointmentMain: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  appointmentCompact: { alignItems: 'flex-start' },
  appointmentTime: { width: 68, height: 68, borderRadius: 20, backgroundColor: colors.teal, alignItems: 'center', justifyContent: 'center' },
  appointmentTimePayment: { backgroundColor: colors.teal },
  carerTime: { backgroundColor: colors.cyan },
  appointmentTimeMain: { color: colors.white, fontFamily: 'Poppins', fontSize: 15, fontWeight: '900', textAlign: 'center' },
  appointmentTimeSub: { color: 'rgba(255,255,255,0.8)', fontFamily: 'Poppins', fontSize: 10, fontWeight: '900', marginTop: 3 },
  appointmentCopy: { flex: 1, minWidth: 0 },
  appointmentTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3, minWidth: 0 },
  appointmentTitle: { flex: 1, minWidth: 0, color: colors.ink, fontFamily: 'Poppins', fontSize: 15, fontWeight: '900' },
  statusPill: { flexShrink: 0, borderRadius: 999, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, color: colors.teal, fontFamily: 'Poppins', fontSize: 10, lineHeight: 14, fontWeight: '900', paddingHorizontal: 8, paddingVertical: 3, textTransform: 'capitalize', overflow: 'hidden' },
  statusPillPayment: { backgroundColor: colors.field, borderColor: 'rgba(8,81,97,0.12)', color: colors.teal },
  statusIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.panel, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  statusIconConfirmed: { backgroundColor: 'rgba(17,162,111,0.12)' },
  statusIconPayment: { backgroundColor: colors.field },
  statusIconText: { color: '#0F8F64', fontFamily: 'Poppins', fontSize: 19, lineHeight: 23, fontWeight: '900' },
  cardIconLine: { width: 19, height: 4, borderRadius: 3, backgroundColor: colors.teal, marginBottom: 5 },
  cardIconDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.teal, alignSelf: 'flex-start', marginLeft: 9 },
  appointmentSub: { color: colors.teal, fontFamily: 'Poppins', fontSize: 12, fontWeight: '800', marginTop: 3 },
  appointmentMeta: { color: colors.muted, fontFamily: 'Poppins', fontSize: 11, fontWeight: '700', marginTop: 3 },
  homePaymentPanel: { borderRadius: 16, backgroundColor: colors.field, padding: 12, gap: 10 },
  homePaymentNoteText: { color: colors.ink, fontFamily: 'Poppins', fontSize: 11, lineHeight: 16, fontWeight: '800' },
  homePaymentActions: { flexDirection: 'row', gap: 10 },
  homeInfoButton: { flex: 1, minHeight: 48, borderRadius: 12, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  homePayButton: { flex: 1, minHeight: 48, borderRadius: 12, backgroundColor: colors.teal, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
  homePassivePanel: { borderRadius: 14, backgroundColor: colors.panel, paddingHorizontal: 12, paddingVertical: 10 },
  homePassiveText: { color: colors.muted, fontFamily: 'Poppins', fontSize: 11, lineHeight: 16, fontWeight: '800', textAlign: 'center' },
  homeOpenButton: { minHeight: 46, borderRadius: 12, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  actionIconText: { color: colors.teal, fontFamily: 'Poppins', fontSize: 20, lineHeight: 24, fontWeight: '900' },
  actionCardIcon: { width: 26, height: 20, borderRadius: 7, backgroundColor: colors.white, padding: 5, justifyContent: 'center' },
  actionCardLine: { width: 15, height: 3, borderRadius: 2, backgroundColor: colors.teal, marginBottom: 4 },
  actionCardDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.teal, alignSelf: 'flex-end' },
  actionVideoIcon: { width: 25, height: 19, borderRadius: 7, backgroundColor: colors.teal, justifyContent: 'center' },
  actionVideoLens: { width: 11, height: 7, borderRadius: 4, backgroundColor: colors.white, marginLeft: 5 },
  actionVideoWing: { position: 'absolute', right: -6, width: 9, height: 12, borderTopRightRadius: 6, borderBottomRightRadius: 6, backgroundColor: colors.teal },
  emptyAppointments: { borderRadius: 18, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.line, alignItems: 'center', padding: 18, marginTop: 4 },
  emptyIcon: { width: 58, height: 58, borderRadius: 20, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  emptyIconText: { color: colors.teal, fontFamily: 'Poppins', fontSize: 28, lineHeight: 32, fontWeight: '900' },
  emptyTitle: { color: colors.ink, fontFamily: 'Poppins', fontSize: 17, fontWeight: '900', textAlign: 'center' },
  emptyCopy: { maxWidth: 410, color: colors.muted, fontFamily: 'Poppins', fontSize: 12, lineHeight: 18, fontWeight: '700', textAlign: 'center', marginTop: 6 },
  emptyActions: { width: '100%', maxWidth: 360, gap: 10, marginTop: 14 },
  emptySecondary: { minHeight: 48, borderRadius: 10, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  emptySecondaryText: { color: colors.teal, fontFamily: 'Poppins', fontSize: 14, fontWeight: '900' },
  statusGrid: { flexDirection: 'row', gap: 12, marginTop: 14 },
  statusCard: { flex: 1, minHeight: 90, borderRadius: 18, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, padding: 16, justifyContent: 'center' },
  statusValue: { color: colors.teal, fontFamily: 'Poppins', fontSize: 28, fontWeight: '900' },
  statusLabel: { color: colors.muted, fontFamily: 'Poppins', fontSize: 12, fontWeight: '800', marginTop: 4 },
  list: { gap: 12 },
});
