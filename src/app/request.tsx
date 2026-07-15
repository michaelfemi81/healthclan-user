import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { BottomTabs, Field, Header, PrimaryButton, Screen } from '../components/HealthClanUI';
import { colors } from '../constants/healthclanDesign';
import { healthclanApi } from '../lib/api';
import { isValidEmail, isValidPhone } from '../lib/validation';

type Option = { label: string; value: string };

const careTypes: Option[] = [
  { label: 'Home care', value: 'home_care' },
  { label: 'Elderly care', value: 'elderly_care' },
  { label: 'Live-in care', value: 'live_in_care' },
  { label: 'Respite care', value: 'respite_care' },
  { label: 'Disability care', value: 'disability_care' },
  { label: 'Dementia care', value: 'dementia_care' },
  { label: 'Personal care', value: 'personal_care' },
  { label: 'Companionship', value: 'companionship' },
];

const preferredTimeOptions: Option[] = [
  { label: 'This month', value: 'this_month' },
  { label: 'Next month', value: 'next_month' },
  { label: 'As soon as possible', value: 'as_soon_as_possible' },
];

const durationOptions: Option[] = [
  { label: '6 hours daycare', value: 'six_hours_daycare' },
  { label: '8 hours daycare', value: 'eight_hours_daycare' },
  { label: '10 hours daycare', value: 'ten_hours_daycare' },
  { label: '12 hours daycare', value: 'twelve_hours_daycare' },
  { label: '24/7 live in care', value: 'live_in_24_7' },
  { label: 'Overnight care', value: 'overnight_care' },
];

const daysPerWeekOptions: Option[] = Array.from({ length: 7 }, (_, index) => ({
  label: `${index + 1} day${index === 0 ? '' : 's'} per week`,
  value: String(index + 1),
}));
const datePickerMonths = Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, '0'));
const currentYear = new Date().getFullYear();
const datePickerYears = Array.from({ length: 120 }, (_, index) => String(currentYear - index));

function careTypeLabel(value?: string) {
  return value ? careTypes.find(item => item.value === value)?.label || value.replace(/_/g, ' ') : 'Care request';
}

function buildPreferredDate(value: string) {
  const date = new Date();

  if (value === 'as_soon_as_possible') {
    date.setHours(date.getHours() + 2, 0, 0, 0);
    return date;
  }

  if (value === 'next_month') {
    const targetYear = date.getFullYear();
    const targetMonth = date.getMonth() + 1;
    const daysInTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
    return new Date(targetYear, targetMonth, Math.min(date.getDate(), daysInTargetMonth), 10, 0, 0, 0);
  }

  const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 7, 10, 0, 0, 0);
  const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 10, 0, 0, 0);
  if (targetDate.getMonth() === date.getMonth()) return targetDate;
  if (endOfMonth.getTime() > Date.now()) return endOfMonth;

  date.setHours(date.getHours() + 2, 0, 0, 0);
  return date;
}

function urgencyForPreferredTime(value: string) {
  return value === 'as_soon_as_possible' ? 'immediate' : 'this_month';
}

function requestState(request: any) {
  if (request.status === 'closed') return { label: 'Closed', tone: 'closed' };
  if (request.status === 'expired') return { label: 'Expired', tone: 'closed' };
  if (request.patientStatus === 'viewed' || request.viewedByPartners?.length > 0) return { label: 'Viewed', tone: 'viewed' };
  return { label: 'Pending', tone: 'pending' };
}

function formatPreferredTime(value?: string) {
  if (!value) return 'No preferred time';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'No preferred time';
  return date.toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function durationOptionLabel(value?: string) {
  return value ? durationOptions.find(item => item.value === value)?.label || value.replace(/_/g, ' ') : 'Not specified';
}

function formatDuration(request: any) {
  const label = request?.durationLabel || durationOptionLabel(request?.durationType);
  const hours = request?.numberOfHours ? `, ${request.numberOfHours} hour${Number(request.numberOfHours) === 1 ? '' : 's'}` : '';
  return `${label || 'Not specified'}${hours}`;
}

function requestTimestamp(request: any) {
  const raw = request?.createdAt || request?.updatedAt || request?.preferredTime || request?.date;
  const date = raw ? new Date(raw) : null;
  return date && !Number.isNaN(date.getTime()) ? date.getTime() : 0;
}

function SelectField({ placeholder, value, options, onChange }: { placeholder: string; value: string; options: Option[]; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const selected = options.find(option => option.value === value);

  return (
    <>
      <Pressable style={styles.selectField} onPress={() => setOpen(true)}>
        <Text style={[styles.selectText, !selected && styles.selectPlaceholder]}>{selected?.label || placeholder}</Text>
        <View style={styles.chevronDown} />
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setOpen(false)}>
          <View style={styles.optionSheet}>
            <Text style={styles.optionTitle}>{placeholder}</Text>
            <FlatList
              data={options}
              keyExtractor={item => item.value}
              renderItem={({ item }) => (
                <Pressable
                  style={[styles.optionRow, item.value === value && styles.optionActive]}
                  onPress={() => {
                    onChange(item.value);
                    setOpen(false);
                  }}
                >
                  <Text style={styles.optionText}>{item.label}</Text>
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

function DatePickerField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(value.split('-')[0] || String(currentYear - 25));
  const [month, setMonth] = useState(value.split('-')[1] || '01');
  const [day, setDay] = useState(value.split('-')[2] || '01');
  const daysInMonth = new Date(Number(year), Number(month), 0).getDate();
  const datePickerDays = Array.from({ length: daysInMonth }, (_, index) => String(index + 1).padStart(2, '0'));

  useEffect(() => {
    const [nextYear, nextMonth, nextDay] = value.split('-');
    if (nextYear) setYear(nextYear);
    if (nextMonth) setMonth(nextMonth);
    if (nextDay) setDay(nextDay);
  }, [value]);

  useEffect(() => {
    if (Number(day) > daysInMonth) setDay(String(daysInMonth).padStart(2, '0'));
  }, [day, daysInMonth]);

  const renderColumn = (title: string, values: string[], selected: string, onSelect: (item: string) => void) => (
    <View style={styles.dateColumn}>
      <Text style={styles.dateColumnTitle}>{title}</Text>
      <FlatList
        data={values}
        keyExtractor={item => item}
        style={styles.dateList}
        renderItem={({ item }) => (
          <Pressable style={[styles.dateOption, item === selected && styles.dateOptionActive]} onPress={() => onSelect(item)}>
            <Text style={[styles.dateOptionText, item === selected && styles.dateOptionTextActive]}>{item}</Text>
          </Pressable>
        )}
      />
    </View>
  );

  return (
    <>
      <Pressable style={styles.selectField} onPress={() => setOpen(true)}>
        <Text style={[styles.selectText, !value && styles.selectPlaceholder]}>{value || 'Date of Birth'}</Text>
        <View style={styles.chevronDown} />
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setOpen(false)}>
          <View style={styles.dateSheet}>
            <Text style={styles.optionTitle}>Date of Birth</Text>
            <View style={styles.dateColumns}>
              {renderColumn('Day', datePickerDays, day, setDay)}
              {renderColumn('Month', datePickerMonths, month, setMonth)}
              {renderColumn('Year', datePickerYears, year, setYear)}
            </View>
            <PrimaryButton
              title="Done"
              onPress={() => {
                onChange(`${year}-${month}-${day}`);
                setOpen(false);
              }}
            />
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

function addressToText(address: unknown) {
  if (typeof address === 'string') return address;
  if (!address || typeof address !== 'object') return '';
  const value = address as Record<string, unknown>;
  return [value.line1, value.line2, value.city, value.state, value.postalCode, value.country]
    .filter(Boolean)
    .join(', ');
}

export default function RequestCarer() {
  const [careType, setCareType] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [durationType, setDurationType] = useState('');
  const [daysPerWeek, setDaysPerWeek] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [chronicIllnesses, setChronicIllnesses] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [contactName, setContactName] = useState('HealthClan patient');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [recentRequests, setRecentRequests] = useState<any[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const sortedRecentRequests = useMemo(
    () => recentRequests.slice().sort((a, b) => requestTimestamp(b) - requestTimestamp(a)),
    [recentRequests]
  );

  useEffect(() => {
    healthclanApi.users.me()
      .then((payload: any) => {
        const user = payload?.user || {};
        const profile = payload?.profile || {};
        const details = { ...profile, ...user };
        const fullName = details.fullName || [details.firstName, details.lastName].filter(Boolean).join(' ');

        setContactName(fullName || 'HealthClan patient');
        setEmail(details.email || '');
        setPhone(details.phone || '');
        setDateOfBirth(details.dateOfBirth ? String(details.dateOfBirth).slice(0, 10) : '');
        setChronicIllnesses(details.chronicIllnesses || '');
        setLocation(addressToText(details.address));
      })
      .catch(() => null);
  }, []);

  const loadRecentRequests = useCallback(() => {
    setRequestsLoading(true);
    healthclanApi.care.myRequests()
      .then(items => setRecentRequests(Array.isArray(items) ? items : []))
      .catch(() => setRecentRequests([]))
      .finally(() => setRequestsLoading(false));
  }, []);

  useFocusEffect(loadRecentRequests);

  async function submit() {
    if (loading) return;

    setMessage('');

    if (!careType) {
      setMessage('Select the type of care you need.');
      return;
    }

    if (!preferredTime) {
      setMessage('Select when you need care.');
      return;
    }

    if (!durationType) {
      setMessage('Select how long you need the carer.');
      return;
    }

    if (!daysPerWeek) {
      setMessage('Select the number of days needed per week.');
      return;
    }

    if (!dateOfBirth.trim()) {
      setMessage('Enter date of birth.');
      return;
    }

    if (!isValidEmail(email)) {
      setMessage('Enter a valid email address.');
      return;
    }

    if (!isValidPhone(phone)) {
      setMessage('Enter a valid phone number.');
      return;
    }

    if (!location.trim()) {
      setMessage('Enter the care location.');
      return;
    }

    if (description.trim().length < 10) {
      setMessage('Add care notes with at least 10 characters.');
      return;
    }

    const [city = location] = location.split(',').map(part => part.trim()).filter(Boolean);
    const preferredDate = buildPreferredDate(preferredTime);
    const urgency = urgencyForPreferredTime(preferredTime);

    setLoading(true);

    try {
      const durationLabel = durationOptionLabel(durationType);

      await healthclanApi.care.createRequest({
        careFor: 'self',
        careType,
        urgency,
        preferredTime: preferredDate.toISOString(),
        preferredDate: preferredDate.toISOString(),
        durationType,
        durationLabel,
        daysPerWeek: Number(daysPerWeek),
        numberOfHours: durationType === 'six_hours_daycare' ? 6 : durationType === 'eight_hours_daycare' ? 8 : durationType === 'ten_hours_daycare' ? 10 : durationType === 'twelve_hours_daycare' ? 12 : undefined,
        dateOfBirth: dateOfBirth.trim(),
        chronicIllnesses: chronicIllnesses.trim(),
        location: { city: city || 'Not specified' },
        description,
        notes: description,
        contact: {
          name: contactName,
          email,
          phone,
        },
      });
      setMessage('Care request sent.');
      router.replace('/care-requests' as any);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to submit request.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.wrap}>
      <Screen bottom={104}>
        <Header title="Request A Carer" />
        <Text style={styles.sub}>Tell us what kind of care you need, then track each request from pending to partner viewed.</Text>
        <View style={styles.historyShortcut}>
          <View style={styles.historyShortcutCopy}>
            <Text style={styles.historyShortcutTitle}>Past requested carers</Text>
            <Text style={styles.historyShortcutSub}>View every request and status update.</Text>
          </View>
          <Pressable style={styles.historyShortcutButton} onPress={() => router.push('/care-requests' as any)}>
            <Text style={styles.historyShortcutButtonText}>Open</Text>
          </Pressable>
        </View>
        <View style={styles.form}>
          <SelectField placeholder="Care type" value={careType} options={careTypes} onChange={setCareType} />
          <SelectField placeholder="How soon do you need care?" value={preferredTime} options={preferredTimeOptions} onChange={setPreferredTime} />
          <SelectField placeholder="Duration" value={durationType} options={durationOptions} onChange={setDurationType} />
          <SelectField placeholder="Number of days per week" value={daysPerWeek} options={daysPerWeekOptions} onChange={setDaysPerWeek} />
          <DatePickerField value={dateOfBirth} onChange={setDateOfBirth} />
          <Field placeholder="Chronic Illnesses" multiline value={chronicIllnesses} onChangeText={setChronicIllnesses} />
          <Field placeholder="Email address" value={email} onChangeText={setEmail} />
          <Field placeholder="Phone number" value={phone} onChangeText={setPhone} />
          <Field placeholder="Location" value={location} onChangeText={setLocation} />
          <Field placeholder="Care Notes" multiline value={description} onChangeText={setDescription} />
          {!!message && <Text style={styles.message}>{message}</Text>}
          <PrimaryButton title={loading ? 'Submitting...' : 'Submit Request'} onPress={submit} loading={loading} />
        </View>
        <View style={styles.recentSection}>
          <View style={styles.recentHeader}>
            <Text style={styles.recentTitle}>Recent requests</Text>
            <Text style={styles.recentLink} onPress={() => router.push('/care-requests' as any)}>View all</Text>
          </View>
          {requestsLoading ? (
            <View style={styles.recentLoading}>
              <ActivityIndicator color={colors.teal} />
              <Text style={styles.recentLoadingText}>Checking your carer request history...</Text>
            </View>
          ) : sortedRecentRequests.length > 0 ? (
            <View style={styles.recentList}>
              {sortedRecentRequests.slice(0, 3).map(request => {
                const state = requestState(request);
                return (
                  <Pressable key={request._id} style={styles.recentCard} onPress={() => router.push('/care-requests' as any)}>
                    <View style={styles.recentIcon}>
                      <Text style={styles.recentIconText}>{careTypeLabel(request.careType).charAt(0)}</Text>
                    </View>
                    <View style={styles.recentCopy}>
                      <Text style={styles.recentCardTitle}>{careTypeLabel(request.careType)}</Text>
                      <Text style={styles.recentCardSub}>{formatPreferredTime(request.preferredTime)}</Text>
                      <Text style={styles.recentCardSub}>{formatDuration(request)}</Text>
                    </View>
                    <Text style={[styles.recentStatus, state.tone === 'viewed' && styles.recentStatusViewed, state.tone === 'closed' && styles.recentStatusClosed]}>{state.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <View style={styles.recentEmpty}>
              <View style={styles.recentEmptyIcon}>
                <Text style={styles.recentEmptyIconText}>+</Text>
              </View>
              <Text style={styles.recentEmptyTitle}>No past requests yet</Text>
              <Text style={styles.recentEmptyCopy}>Your submitted carer requests will appear here with partner-viewed status.</Text>
            </View>
          )}
        </View>
      </Screen>
      <BottomTabs active="home" />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  sub: { color: colors.muted, fontFamily: 'Poppins', fontSize: 14, fontWeight: '700', lineHeight: 22, textAlign: 'center', marginBottom: 14 },
  historyShortcut: { borderRadius: 20, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  historyShortcutCopy: { flex: 1, minWidth: 0 },
  historyShortcutTitle: { color: colors.ink, fontFamily: 'Poppins', fontSize: 15, fontWeight: '900' },
  historyShortcutSub: { color: colors.muted, fontFamily: 'Poppins', fontSize: 12, lineHeight: 17, fontWeight: '700', marginTop: 3 },
  historyShortcutButton: { minHeight: 40, borderRadius: 14, backgroundColor: colors.teal, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  historyShortcutButtonText: { color: colors.white, fontFamily: 'Poppins', fontSize: 12, fontWeight: '900' },
  form: { gap: 12, alignItems: 'center' },
  message: { color: colors.teal, fontFamily: 'Poppins', fontSize: 12, fontWeight: '800', textAlign: 'center' },
  selectField: {
    width: '100%',
    maxWidth: 520,
    minHeight: 50,
    borderRadius: 10,
    alignSelf: 'center',
    backgroundColor: colors.field,
    borderWidth: 0.8,
    borderColor: 'rgba(255,255,255,0.5)',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  selectText: { flex: 1, minWidth: 0, color: colors.ink, fontFamily: 'Poppins', fontSize: 14, fontWeight: '800' },
  selectPlaceholder: { color: colors.muted },
  chevronDown: { width: 10, height: 10, borderRightWidth: 2, borderBottomWidth: 2, borderColor: colors.teal, transform: [{ rotate: '45deg' }], marginTop: -5 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(8,81,97,0.24)', justifyContent: 'flex-end', padding: 16 },
  optionSheet: { width: '100%', maxHeight: '72%', maxWidth: 560, alignSelf: 'center', borderRadius: 18, backgroundColor: colors.white, padding: 14 },
  optionTitle: { color: colors.ink, fontFamily: 'Poppins', fontSize: 18, fontWeight: '900', marginBottom: 4 },
  optionRow: { minHeight: 48, borderRadius: 12, justifyContent: 'center', paddingHorizontal: 12 },
  optionActive: { backgroundColor: colors.panel },
  optionText: { color: colors.ink, fontFamily: 'Poppins', fontSize: 14, fontWeight: '800' },
  dateSheet: { width: '100%', maxWidth: 520, maxHeight: '82%', alignSelf: 'center', borderRadius: 18, backgroundColor: colors.white, padding: 14, gap: 12 },
  dateColumns: { flexDirection: 'row', gap: 8, minHeight: 260 },
  dateColumn: { flex: 1 },
  dateColumnTitle: { color: colors.muted, fontFamily: 'Poppins', fontSize: 12, fontWeight: '900', textAlign: 'center', marginBottom: 6 },
  dateList: { maxHeight: 250 },
  dateOption: { minHeight: 38, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  dateOptionActive: { backgroundColor: colors.teal },
  dateOptionText: { color: colors.ink, fontFamily: 'Poppins', fontSize: 13, fontWeight: '800' },
  dateOptionTextActive: { color: colors.white },
  recentSection: { marginTop: 24 },
  recentHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, gap: 12 },
  recentTitle: { color: colors.ink, fontFamily: 'Poppins', fontSize: 19, fontWeight: '900' },
  recentLink: { color: colors.teal, fontFamily: 'Poppins', fontSize: 12, fontWeight: '900' },
  recentLoading: { minHeight: 120, borderRadius: 20, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 16 },
  recentLoadingText: { color: colors.muted, fontFamily: 'Poppins', fontSize: 12, fontWeight: '800', textAlign: 'center' },
  recentList: { gap: 10 },
  recentCard: { borderRadius: 18, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  recentIcon: { width: 42, height: 42, borderRadius: 15, backgroundColor: colors.panel, alignItems: 'center', justifyContent: 'center' },
  recentIconText: { color: colors.teal, fontFamily: 'Poppins', fontSize: 16, fontWeight: '900' },
  recentCopy: { flex: 1, minWidth: 0 },
  recentCardTitle: { color: colors.ink, fontFamily: 'Poppins', fontSize: 13, fontWeight: '900' },
  recentCardSub: { color: colors.muted, fontFamily: 'Poppins', fontSize: 11, lineHeight: 16, fontWeight: '700', marginTop: 3 },
  recentStatus: { overflow: 'hidden', borderRadius: 999, backgroundColor: 'rgba(193,124,18,0.12)', color: '#C17C12', fontFamily: 'Poppins', fontSize: 10, fontWeight: '900', paddingHorizontal: 9, paddingVertical: 5 },
  recentStatusViewed: { backgroundColor: 'rgba(17,162,111,0.12)', color: '#11a26f' },
  recentStatusClosed: { backgroundColor: colors.panel, color: colors.muted },
  recentEmpty: { minHeight: 170, borderRadius: 22, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center', padding: 18 },
  recentEmptyIcon: { width: 58, height: 58, borderRadius: 20, backgroundColor: colors.panel, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  recentEmptyIconText: { color: colors.teal, fontFamily: 'Poppins', fontSize: 28, lineHeight: 32, fontWeight: '900' },
  recentEmptyTitle: { color: colors.ink, fontFamily: 'Poppins', fontSize: 16, fontWeight: '900', textAlign: 'center' },
  recentEmptyCopy: { maxWidth: 360, color: colors.muted, fontFamily: 'Poppins', fontSize: 12, lineHeight: 18, fontWeight: '700', textAlign: 'center', marginTop: 6 },
});
