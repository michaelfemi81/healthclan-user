import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AssetImage } from '../components/AssetImage';
import { Card, Header, PrimaryButton, Row, Screen } from '../components/HealthClanUI';
import { SpecialtyIcon } from '../components/SpecialtyIcon';
import { colors } from '../constants/healthclanDesign';
import { getDoctorById, getSpecialtyByName, type SpecialtyName } from '../constants/doctors';
import { healthclanApi } from '../lib/api';
import { convertedCurrencyLabel, formatCurrency, getPreferredCurrency, loadBackendExchangeRates } from '../lib/currency';
import { formatDoctor, type AppDoctor } from '../lib/doctor-format';

type SlotOption = {
  key: string;
  value: string;
  endValue: string;
  dateKey: string;
  label: string;
  meta: string;
};

type DateOption = {
  key: string;
  date: Date;
  label: string;
  sub: string;
  slots: number;
};

export default function DoctorProfile() {
  const params = useLocalSearchParams();
  const fallbackDoctor = getDoctorById(params.doctorId);
  const [doctor, setDoctor] = useState<AppDoctor>(fallbackDoctor);
  const [serviceId, setServiceId] = useState('');
  const [services, setServices] = useState<any[]>([]);
  const [availability, setAvailability] = useState<any>(null);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const specialty = getSpecialtyByName(doctor.specialty);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [selectedDateKey, setSelectedDateKey] = useState(dateKey(new Date()));
  const [message, setMessage] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [displayCurrency, setDisplayCurrency] = useState(() => getPreferredCurrency());
  const [rateRefresh, setRateRefresh] = useState(0);
  const activeService = services.find(service => service._id === serviceId);
  const servicePrice = Number(activeService?.price || 25);
  const serviceCurrency = activeService?.currency || 'GBP';
  const convertedServicePrice = useMemo(
    () => convertedCurrencyLabel(servicePrice, serviceCurrency, displayCurrency),
    [displayCurrency, rateRefresh, serviceCurrency, servicePrice]
  );
  const originalServicePrice = formatCurrency(servicePrice, serviceCurrency);
  const slotDuration = Number(activeService?.durationMinutes || 30);
  const allSlots = useMemo(() => {
    const schedule = Array.isArray(availability?.weeklySchedule) ? availability.weeklySchedule : [];
    return buildFutureSlots({
      schedule,
      blockedSlots: availability?.blockedSlots,
      bookedSlots: availability?.bookedSlots || availability?.bookedAppointments,
      durationMinutes: slotDuration,
    });
  }, [availability?.weeklySchedule, availability?.blockedSlots, availability?.bookedSlots, availability?.bookedAppointments, slotDuration]);
  const dateOptions = useMemo(() => buildDateOptions(allSlots), [allSlots]);
  const availableSlots = allSlots.filter(slot => slot.dateKey === selectedDateKey);
  const selectedSlotOption = allSlots.find((slot: SlotOption) => slot.value === selectedSlot);

  useFocusEffect(
    useCallback(() => {
      setDisplayCurrency(getPreferredCurrency());
      loadBackendExchangeRates()
        .then(() => setRateRefresh(current => current + 1))
        .catch(() => null);
    }, [])
  );

  useEffect(() => {
    const id = Array.isArray(params.doctorId) ? params.doctorId[0] : params.doctorId;
    if (!id) return;

    healthclanApi.doctors.byId(id)
      .then((payload: any) => {
        setDoctor(formatDoctor({ ...payload.doctor, profile: payload.profile }));
        setServices(payload.services || []);
        setServiceId(payload.services?.[0]?._id || '');
      })
      .catch(() => null);
    setLoadingAvailability(true);
    healthclanApi.doctors.availability(id)
      .then((payload: any) => {
        setAvailability(payload?.availability ? {
          ...payload.availability,
          bookedSlots: payload.bookedIntervals || payload.availability.bookedSlots,
        } : null);
        setServices(current => current.length ? current : payload?.services || []);
        setServiceId(current => current || payload?.services?.[0]?._id || '');
      })
      .catch(() => setAvailability(null))
      .finally(() => setLoadingAvailability(false));
    healthclanApi.users.favorites()
      .then(items => setIsFavorite(items.some((item: any) => String(item?.doctor?._id || item?.doctor) === id)))
      .catch(() => null);
  }, [params.doctorId]);

  useEffect(() => {
    if (!allSlots.length) {
      setSelectedSlot('');
      return;
    }

    const currentDateHasSlots = allSlots.some(slot => slot.dateKey === selectedDateKey);
    const nextDateKey = currentDateHasSlots ? selectedDateKey : allSlots[0].dateKey;
    const currentSlotStillOpen = allSlots.some(slot => slot.value === selectedSlot && slot.dateKey === nextDateKey);

    if (!currentDateHasSlots) setSelectedDateKey(nextDateKey);
    if (!currentSlotStillOpen) setSelectedSlot(allSlots.find(slot => slot.dateKey === nextDateKey)?.value || '');
  }, [allSlots, selectedDateKey, selectedSlot]);

  async function toggleFavorite() {
    if (!doctor.id) return;

    if (isFavorite) {
      await healthclanApi.users.removeFavorite(doctor.id);
      setIsFavorite(false);
      return;
    }

    await healthclanApi.users.addFavorite(doctor.id);
    setIsFavorite(true);
  }

  return (
    <Screen>
      <Header title="Doctor Profile" backTo={`/eachspec?specialty=${specialty.slug}`} />
      <View style={styles.hero}>
        <View style={styles.profile}>
          <AssetImage source={doctor.image} style={styles.avatar} resizeMode="cover" />
          <View style={styles.profileCopy}>
            <SpecialtyIcon name={doctor.specialty as SpecialtyName} size={36} />
            <Text style={styles.name}>{doctor.name}</Text>
            <Text style={styles.meta}>{doctor.specialty} - {doctor.experience} experience</Text>
            <Text style={styles.rating}>★ {doctor.rating} rating - {doctor.location}</Text>
          </View>
          <Pressable
            accessibilityLabel={isFavorite ? 'Remove doctor from favorites' : 'Add doctor to favorites'}
            style={[styles.favoriteButton, isFavorite && styles.favoriteButtonActive]}
            onPress={toggleFavorite}
          >
            <Text style={[styles.favoriteIcon, isFavorite && styles.favoriteIconActive]}>{isFavorite ? '♥' : '♡'}</Text>
          </Pressable>
        </View>
        <View style={styles.stats}>
          <View style={styles.stat}><Text style={styles.statValue}>{doctor.rating}</Text><Text style={styles.statLabel}>Rating</Text></View>
          <View style={styles.stat}><Text style={styles.statValue}>{allSlots.length}</Text><Text style={styles.statLabel}>Slots</Text></View>
          <View style={styles.stat}><Text style={styles.statValue}>{activeService?.durationMinutes || 30}</Text><Text style={styles.statLabel}>Minutes</Text></View>
        </View>
      </View>
      <Text style={styles.heading}>About Doctor</Text>
      <Text style={styles.copy}>{doctor.bio}</Text>
      {activeService ? (
        <>
          <Text style={styles.heading}>Video Service</Text>
          <Card>
            <Text style={styles.cardTitle}>{activeService.title}</Text>
            <Text style={styles.cardSub}>{activeService.description || 'Video consultation'}</Text>
            <Text style={styles.cardMeta}>
              {convertedServicePrice}
              {displayCurrency !== serviceCurrency ? ` (${originalServicePrice})` : ''}
              {' - '}
              {activeService.durationMinutes || 30} minutes
            </Text>
          </Card>
        </>
      ) : null}
      <Text style={styles.heading}>Choose a Date</Text>
      <View style={styles.dateRail}>
        {dateOptions.map(date => (
          <Pressable
            key={date.key}
            style={[styles.datePill, selectedDateKey === date.key && styles.datePillActive]}
            onPress={() => {
              setSelectedDateKey(date.key);
              setSelectedSlot(allSlots.find(slot => slot.dateKey === date.key)?.value || '');
            }}
          >
            <Text style={[styles.dateLabel, selectedDateKey === date.key && styles.dateTextActive]}>{date.label}</Text>
            <Text style={[styles.dateSub, selectedDateKey === date.key && styles.dateTextActive]}>{date.sub}</Text>
            <Text style={[styles.dateSlots, selectedDateKey === date.key && styles.dateTextActive]}>{date.slots} slot{date.slots === 1 ? '' : 's'}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.heading}>Available Slots</Text>
      <View style={styles.slots}>
        {loadingAvailability ? (
          <View style={styles.emptySlots}>
            <Text style={styles.emptyTitle}>Checking availability...</Text>
          </View>
        ) : availableSlots.length > 0 ? availableSlots.map((slot: SlotOption) => (
          <Pressable key={slot.key} style={[styles.slot, selectedSlot === slot.value && styles.slotActive]} onPress={() => setSelectedSlot(slot.value)}>
            <Text style={[styles.slotText, selectedSlot === slot.value && styles.slotTextActive]}>{slot.label}</Text>
            <Text style={[styles.slotMeta, selectedSlot === slot.value && styles.slotTextActive]}>{slot.meta}</Text>
          </Pressable>
        )) : (
          <View style={styles.emptySlots}>
            <Text style={styles.emptyTitle}>{allSlots.length ? 'No slots on this date' : 'No future slots available'}</Text>
            <Text style={styles.emptyCopy}>
              {allSlots.length
                ? 'Choose another date above to see available appointment times.'
                : 'This doctor has no open future slots right now. Check another doctor or try again later.'}
            </Text>
          </View>
        )}
      </View>
      <Card>
        <Row
          title="Book video appointment"
          subtitle="Confirm your online care slot"
          right="Book"
          onPress={() => {
            setMessage('');
            if (!doctor.id) {
              setMessage('Doctor profile is still loading.');
              return;
            }
            if (!selectedSlotOption) {
              setMessage('This doctor has not opened a bookable slot yet.');
              return;
            }
            router.push({ pathname: '/book-appointment', params: { doctorId: doctor.id, slot: selectedSlotOption.value, endSlot: selectedSlotOption.endValue } } as any);
          }}
        />
      </Card>
      {!!message && <Text style={styles.message}>{message}</Text>}
      <View style={styles.footerSpace} />
      <PrimaryButton
        title="Book Video Appointment"
        onPress={() => {
          setMessage('');
          if (!doctor.id) {
            setMessage('Doctor profile is still loading.');
            return;
          }
          if (!selectedSlotOption) {
            setMessage('This doctor has not opened a bookable slot yet.');
            return;
          }
          router.push({ pathname: '/book-appointment', params: { doctorId: doctor.id, slot: selectedSlotOption.value, endSlot: selectedSlotOption.endValue } } as any);
        }}
      />
    </Screen>
  );
}

function dayLabel(day: number | string) {
  const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return labels[Number(day)] || 'Day';
}

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function addDays(date: Date, days: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function timeToMinutes(time: string) {
  const [hour = '0', minute = '0'] = String(time).split(':');
  return Number(hour) * 60 + Number(minute);
}

function dateAtMinutes(date: Date, minutes: number) {
  const next = new Date(date);
  next.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return next;
}

function intervalsOverlap(start: Date, end: Date, ranges: any[] = []) {
  return ranges.some(range => {
    const blockedStart = new Date(range.startTime || range.startsAt || range.start);
    const blockedEnd = new Date(range.endTime || range.endsAt || range.end);

    if (Number.isNaN(blockedStart.getTime()) || Number.isNaN(blockedEnd.getTime())) return false;
    return start < blockedEnd && end > blockedStart;
  });
}

function buildFutureSlots({
  schedule,
  blockedSlots,
  bookedSlots,
  durationMinutes,
}: {
  schedule: any[];
  blockedSlots?: any[];
  bookedSlots?: any[];
  durationMinutes: number;
}) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const slots: SlotOption[] = [];
  const safeDuration = Number.isFinite(durationMinutes) && durationMinutes > 0 ? durationMinutes : 30;

  Array.from({ length: 21 }, (_, offset) => addDays(today, offset)).forEach(date => {
    const dateSchedule = schedule.filter(item => Number(item.day) === date.getDay() && item?.isAvailable !== false && item?.startTime && item?.endTime);

    dateSchedule.forEach(item => {
      const startMinutes = timeToMinutes(item.startTime);
      const endMinutes = timeToMinutes(item.endTime);

      for (let cursor = startMinutes; cursor + safeDuration <= endMinutes; cursor += safeDuration) {
        const start = dateAtMinutes(date, cursor);
        const end = dateAtMinutes(date, cursor + safeDuration);

        if (start <= now) continue;
        if (intervalsOverlap(start, end, blockedSlots)) continue;
        if (intervalsOverlap(start, end, bookedSlots)) continue;

        slots.push({
          key: `${dateKey(date)}-${cursor}`,
          value: start.toISOString(),
          endValue: end.toISOString(),
          dateKey: dateKey(date),
          label: start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          meta: `${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        });
      }
    });
  });

  return slots.sort((first, second) => new Date(first.value).getTime() - new Date(second.value).getTime());
}

function buildDateOptions(slots: SlotOption[]) {
  const byDate = slots.reduce<Map<string, SlotOption[]>>((map, slot) => {
    map.set(slot.dateKey, [...(map.get(slot.dateKey) || []), slot]);
    return map;
  }, new Map());

  return [...byDate.entries()].map<DateOption>(([key, daySlots]) => {
    const date = new Date(daySlots[0].value);

    return {
      key,
      date,
      label: dayLabel(date.getDay()),
      sub: date.toLocaleDateString([], { month: 'short', day: 'numeric' }),
      slots: daySlots.length,
    };
  });
}

const styles = StyleSheet.create({
  hero: { borderRadius: 24, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, padding: 16 },
  profile: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  profileCopy: { flex: 1, minWidth: 0 },
  favoriteButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  favoriteButtonActive: { backgroundColor: colors.teal, borderColor: colors.teal },
  favoriteIcon: { color: colors.teal, fontSize: 24, lineHeight: 28, fontWeight: '900' },
  favoriteIconActive: { color: colors.white },
  avatar: { width: 92, height: 92, borderRadius: 30, backgroundColor: colors.panel },
  name: { color: colors.ink, fontFamily: 'Poppins', fontSize: 22, fontWeight: '900' },
  meta: { color: colors.teal, fontFamily: 'Poppins', fontSize: 13, fontWeight: '800', marginTop: 4 },
  rating: { color: colors.muted, fontFamily: 'Poppins', fontSize: 12, fontWeight: '800', marginTop: 8 },
  stats: { flexDirection: 'row', gap: 10, marginTop: 16 },
  stat: { flex: 1, borderRadius: 16, backgroundColor: colors.bg, paddingVertical: 12, alignItems: 'center' },
  statValue: { color: colors.teal, fontFamily: 'Poppins', fontSize: 18, fontWeight: '900' },
  statLabel: { color: colors.muted, fontFamily: 'Poppins', fontSize: 11, fontWeight: '800', marginTop: 3 },
  heading: { color: colors.ink, fontFamily: 'Poppins', fontSize: 20, fontWeight: '900', marginTop: 22 },
  copy: { color: colors.muted, fontFamily: 'Poppins', fontSize: 14, lineHeight: 22, fontWeight: '700', marginTop: 8, marginBottom: 18 },
  dateRail: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  datePill: { minWidth: 86, borderRadius: 16, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, paddingVertical: 10, paddingHorizontal: 10, alignItems: 'center' },
  datePillActive: { backgroundColor: colors.teal, borderColor: colors.teal },
  dateLabel: { color: colors.ink, fontFamily: 'Poppins', fontSize: 12, fontWeight: '900' },
  dateSub: { color: colors.teal, fontFamily: 'Poppins', fontSize: 13, fontWeight: '900', marginTop: 2 },
  dateSlots: { color: colors.muted, fontFamily: 'Poppins', fontSize: 10, fontWeight: '800', marginTop: 3 },
  dateTextActive: { color: colors.white },
  slots: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 18 },
  slot: { width: '31%', minWidth: 92, borderRadius: 14, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.line, alignItems: 'center', paddingVertical: 12, paddingHorizontal: 8 },
  slotActive: { backgroundColor: colors.teal, borderColor: colors.teal },
  slotText: { color: colors.teal, fontFamily: 'Poppins', fontSize: 12, fontWeight: '900', textAlign: 'center' },
  slotMeta: { color: colors.muted, fontFamily: 'Poppins', fontSize: 10, fontWeight: '800', marginTop: 3, textAlign: 'center' },
  slotTextActive: { color: colors.white },
  emptySlots: { width: '100%', borderRadius: 18, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, padding: 16, alignItems: 'center' },
  emptyTitle: { color: colors.ink, fontFamily: 'Poppins', fontSize: 14, fontWeight: '900', textAlign: 'center' },
  emptyCopy: { color: colors.muted, fontFamily: 'Poppins', fontSize: 12, lineHeight: 18, fontWeight: '700', textAlign: 'center', marginTop: 6 },
  cardTitle: { color: colors.ink, fontFamily: 'Poppins', fontSize: 16, fontWeight: '900' },
  cardSub: { color: colors.muted, fontFamily: 'Poppins', fontSize: 12, lineHeight: 18, fontWeight: '700', marginTop: 5 },
  cardMeta: { color: colors.teal, fontFamily: 'Poppins', fontSize: 12, fontWeight: '900', marginTop: 8 },
  message: { color: '#B42318', fontFamily: 'Poppins', fontSize: 12, lineHeight: 18, fontWeight: '800', textAlign: 'center', marginTop: 12 },
  separator: { height: 10 },
  footerSpace: { height: 18 },
});
