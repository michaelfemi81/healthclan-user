import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Header, Screen } from '../components/HealthClanUI';
import { colors } from '../constants/healthclanDesign';
import { healthclanApi } from '../lib/api';

export default function Notifications() {
  const params = useLocalSearchParams();
  const backTo = params.from === 'profile' ? '/profile' : '/';
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const loadNotifications = useCallback(() => {
    setLoading(true);
    setMessage('');
    healthclanApi.notifications.list()
      .then(items => setNotifications(Array.isArray(items) ? items : []))
      .catch(error => {
        setNotifications([]);
        setMessage(error instanceof Error ? error.message : 'Unable to load notifications.');
      })
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(loadNotifications);

  function markAllRead() {
    if (unreadCount === 0) return;

    setNotifications(current => current.map(item => ({ ...item, unread: false, isRead: true })));
    healthclanApi.notifications.markAllRead().catch(error => {
      setMessage(error instanceof Error ? error.message : 'Unable to mark notifications as read.');
      loadNotifications();
    });
  }

  function toggleRead(id: string) {
    if (!id) return;

    setNotifications(current => current.map(item => item._id === id ? { ...item, unread: false, isRead: true } : item));
    healthclanApi.notifications.markRead(id).catch(error => {
      setMessage(error instanceof Error ? error.message : 'Unable to update notification.');
      loadNotifications();
    });
  }

  function openNotification(item: any) {
    toggleRead(item._id);
    const route = routeForNotification(item);
    if (route) router.push(route as any);
  }

  function deleteNotification(id: string) {
    if (!id) return;
    const previous = notifications;
    setNotifications(current => current.filter(item => item._id !== id));
    healthclanApi.notifications.delete(id).catch(error => {
      setNotifications(previous);
      setMessage(error instanceof Error ? error.message : 'Unable to delete notification.');
    });
  }

  const unreadCount = notifications.filter(item => item.unread || item.isRead === false).length;

  return (
    <Screen>
      <Header title="Notifications" backTo={backTo} />
      <View style={styles.hero}>
        <View style={styles.heroCopy}>
          <Text style={styles.title}>{unreadCount} unread</Text>
          <Text style={styles.sub}>Appointment, payment, and account updates appear here.</Text>
        </View>
        <Pressable style={styles.markButton} onPress={markAllRead}>
          <Text style={styles.markText}>Mark all read</Text>
        </Pressable>
      </View>
      {!!message && <Text style={styles.error}>{message}</Text>}
      <View style={styles.list}>
        {loading ? <Text style={styles.loading}>Loading notifications...</Text> : null}
        {notifications.map(item => (
          <View key={item._id} style={styles.notificationCard}>
            <Pressable style={styles.notificationMain} onPress={() => openNotification(item)}>
              <View style={[styles.dot, !(item.unread || item.isRead === false) && styles.dotRead]} />
              <View style={styles.copy}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemSub}>{item.message || item.subtitle}</Text>
                <Text style={styles.itemMeta}>{notificationLabel(item.type)}{item.createdAt ? ` - ${formatTime(item.createdAt)}` : ''}</Text>
              </View>
              <Text style={styles.status}>{(item.unread || item.isRead === false) ? 'New' : 'Read'}</Text>
            </Pressable>
            <Pressable style={styles.deleteButton} onPress={() => deleteNotification(item._id)}>
              <Text style={styles.deleteText}>Delete</Text>
            </Pressable>
          </View>
        ))}
        {!loading && notifications.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No notifications yet</Text>
            <Text style={styles.emptySub}>When something needs your attention, it will show here.</Text>
          </View>
        ) : null}
      </View>
    </Screen>
  );
}

function routeForNotification(item: any) {
  const type = String(item?.type || '');
  const data = item?.data || {};

  if (type.startsWith('appointment') || type === 'consultation_notes') {
    if (type === 'appointment_confirmed' && data.appointmentId) {
      return { pathname: '/video-call', params: { appointmentId: String(data.appointmentId) } };
    }
    if (type === 'consultation_notes' && data.appointmentId) {
      return { pathname: '/doctor-notes', params: { appointmentId: String(data.appointmentId) } };
    }
    return { pathname: '/appointments', params: { focus: type.includes('request') || type === 'appointment_booked' ? 'requests' : 'upcoming' } };
  }

  if (type.startsWith('care_request') || type === 'lead_unlocked') return '/care-requests';
  if (type.startsWith('payment') || type.startsWith('card') || type.startsWith('refund') || type.startsWith('payout')) return '/payment-methods';
  if (type.startsWith('verification') || type.startsWith('document')) return '/profile';
  if (type === 'favorite_added') return '/favorites';
  if (type === 'password_changed' || type === 'security_alert') return '/privacy-security';
  if (type === 'support_update') return '/email-support';
  if (type === 'profile_update' || type === 'account_update') return '/profile';

  return null;
}

function notificationLabel(type?: string) {
  return String(type || 'general').replace(/_/g, ' ');
}

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const styles = StyleSheet.create({
  hero: { borderRadius: 22, backgroundColor: colors.teal, padding: 16, marginBottom: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  heroCopy: { flex: 1, minWidth: 0 },
  title: { color: colors.white, fontFamily: 'Poppins', fontSize: 22, fontWeight: '900' },
  sub: { color: 'rgba(255,255,255,0.82)', fontFamily: 'Poppins', fontSize: 12, lineHeight: 18, fontWeight: '700', marginTop: 4 },
  markButton: { minHeight: 40, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
  markText: { color: colors.white, fontFamily: 'Poppins', fontSize: 12, fontWeight: '900' },
  error: { color: '#B42318', fontFamily: 'Poppins', fontSize: 12, fontWeight: '800', textAlign: 'center', marginBottom: 10 },
  list: { gap: 12 },
  loading: { color: colors.muted, fontFamily: 'Poppins', fontSize: 12, fontWeight: '800', textAlign: 'center' },
  notificationCard: { borderRadius: 18, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, overflow: 'hidden' },
  notificationMain: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.aqua },
  dotRead: { backgroundColor: colors.line },
  copy: { flex: 1, minWidth: 0 },
  itemTitle: { color: colors.ink, fontFamily: 'Poppins', fontSize: 14, fontWeight: '900' },
  itemSub: { color: colors.muted, fontFamily: 'Poppins', fontSize: 12, lineHeight: 18, fontWeight: '700', marginTop: 3 },
  itemMeta: { color: colors.teal, fontFamily: 'Poppins', fontSize: 10, fontWeight: '900', marginTop: 6, textTransform: 'capitalize' },
  status: { color: colors.teal, fontFamily: 'Poppins', fontSize: 11, fontWeight: '900' },
  deleteButton: { minHeight: 38, borderTopWidth: 1, borderTopColor: colors.line, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.panel },
  deleteText: { color: colors.muted, fontFamily: 'Poppins', fontSize: 12, fontWeight: '900' },
  empty: { borderRadius: 18, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, padding: 18, alignItems: 'center' },
  emptyTitle: { color: colors.ink, fontFamily: 'Poppins', fontSize: 16, fontWeight: '900', textAlign: 'center' },
  emptySub: { color: colors.muted, fontFamily: 'Poppins', fontSize: 12, lineHeight: 18, fontWeight: '700', textAlign: 'center', marginTop: 4 },
});
