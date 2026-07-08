import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
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

const timeSlots = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'];
const durationOptions: Option[] = [
  { label: '6 hours daycare', value: 'six_hours_daycare' },
  { label: '8 hours daycare', value: 'eight_hours_daycare' },
  { label: '10 hours daycare', value: 'ten_hours_daycare' },
  { label: '12 hours daycare', value: 'twelve_hours_daycare' },
  { label: '24/7 live in care', value: 'live_in_24_7' },
  { label: 'Overnight care', value: 'overnight_care' },
];

const genderAtBirthOptions: Option[] = [
  { label: 'Female', value: 'female' },
  { label: 'Male', value: 'male' },
  { label: 'Intersex', value: 'intersex' },
  { label: 'Prefer not to say', value: 'prefer_not_to_say' },
];

const consentText = 'I consent to give the Doctor my true personal, medical, surgical information and I expect it to be used solely for the purpose of my care and treatment, to be kept confidentially and according to the POPI Act.';

const dateOptions = Array.from({ length: 30 }, (_, index) => {
  const date = new Date();
  date.setDate(date.getDate() + index);
  date.setHours(10, 0, 0, 0);
  return date;
});

function careTypeLabel(value?: string) {
  return value ? careTypes.find(item => item.value === value)?.label || value.replace(/_/g, ' ') : 'Care request';
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

function PreferredTimeField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const current = value ? new Date(value) : null;
  const [selectedDate, setSelectedDate] = useState(current?.toISOString().slice(0, 10) || dateOptions[0].toISOString().slice(0, 10));
  const [selectedTime, setSelectedTime] = useState(current ? `${String(current.getHours()).padStart(2, '0')}:${String(current.getMinutes()).padStart(2, '0')}` : '10:00');
  const selectedDateObject = useMemo(() => dateOptions.find(date => date.toISOString().slice(0, 10) === selectedDate) || dateOptions[0], [selectedDate]);
  const label = current
    ? current.toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
    : 'Preferred date and time';

  function save() {
    const [hour, minute] = selectedTime.split(':').map(Number);
    const next = new Date(`${selectedDate}T00:00:00`);
    next.setHours(hour, minute, 0, 0);
    onChange(next.toISOString());
    setOpen(false);
  }

  return (
    <>
      <Pressable style={styles.selectField} onPress={() => setOpen(true)}>
        <Text style={[styles.selectText, !value && styles.selectPlaceholder]}>{label}</Text>
        <View style={styles.chevronDown} />
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.dateSheet}>
            <View style={styles.sheetTop}>
              <View>
                <Text style={styles.optionTitle}>Preferred date and time</Text>
                <Text style={styles.sheetSub}>{selectedDateObject.toLocaleDateString([], { month: 'long', year: 'numeric' })}</Text>
              </View>
              <Pressable style={styles.sheetClose} onPress={() => setOpen(false)}>
                <Text style={styles.sheetCloseText}>×</Text>
              </Pressable>
            </View>
            <View style={styles.selectedSummary}>
              <Text style={styles.selectedSummaryLabel}>Selected</Text>
              <Text style={styles.selectedSummaryValue}>
                {selectedDateObject.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })} at {selectedTime}
              </Text>
            </View>
            <Text style={styles.sheetLabel}>Choose date</Text>
            <FlatList
              horizontal
              data={dateOptions}
              keyExtractor={date => date.toISOString().slice(0, 10)}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.dateScroller}
              renderItem={({ item: date, index }) => {
                const key = date.toISOString().slice(0, 10);
                const active = key === selectedDate;
                return (
                  <Pressable key={key} style={[styles.datePill, active && styles.datePillActive]} onPress={() => setSelectedDate(key)}>
                    <Text style={[styles.datePillText, active && styles.datePillTextActive]}>{index === 0 ? 'Today' : date.toLocaleDateString([], { weekday: 'short' })}</Text>
                    <Text style={[styles.datePillDay, active && styles.datePillTextActive]}>{date.getDate()}</Text>
                    <Text style={[styles.datePillMonth, active && styles.datePillTextActive]}>{date.toLocaleDateString([], { month: 'short' })}</Text>
                  </Pressable>
                );
              }}
            />
            <Text style={styles.sheetLabel}>Time</Text>
            <View style={styles.timeGrid}>
              {timeSlots.map(time => {
                const active = time === selectedTime;
                return (
                  <Pressable key={time} style={[styles.timePill, active && styles.datePillActive]} onPress={() => setSelectedTime(time)}>
                    <Text style={[styles.timePillText, active && styles.datePillTextActive]}>{time}</Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={styles.sheetActions}>
              <Pressable style={styles.cancelButton} onPress={() => setOpen(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.doneButton} onPress={save}>
                <Text style={styles.doneButtonText}>Use this time</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

export default function RequestCarer() {
  const [careType, setCareType] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [durationType, setDurationType] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [genderAtBirth, setGenderAtBirth] = useState('');
  const [chronicIllnesses, setChronicIllnesses] = useState('');
  const [chronicMedication, setChronicMedication] = useState('');
  const [allergies, setAllergies] = useState('');
  const [consentGiven, setConsentGiven] = useState(false);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [recentRequests, setRecentRequests] = useState<any[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const sortedRecentRequests = useMemo(
    () => recentRequests.slice().sort((a, b) => requestTimestamp(b) - requestTimestamp(a)),
    [recentRequests]
  );

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

    if (!preferredTime || Number.isNaN(new Date(preferredTime).getTime())) {
      setMessage('Select your preferred date and time.');
      return;
    }

    if (!durationType) {
      setMessage('Select how long you need the carer.');
      return;
    }

    if (!dateOfBirth.trim()) {
      setMessage('Enter date of birth.');
      return;
    }

    if (!genderAtBirth) {
      setMessage('Select gender at birth.');
      return;
    }

    if (!consentGiven) {
      setMessage('Tick the consent box before submitting your care request.');
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
    const preferredDate = new Date(preferredTime);
    const hoursUntilCare = (preferredDate.getTime() - Date.now()) / (1000 * 60 * 60);
    const urgency = hoursUntilCare <= 24 ? 'immediate' : hoursUntilCare <= 24 * 7 ? 'this_week' : 'this_month';

    setLoading(true);

    try {
      const durationLabel = durationOptionLabel(durationType);

      await healthclanApi.care.createRequest({
        careFor: 'self',
        careType,
        urgency,
        preferredTime,
        preferredDate: preferredDate.toISOString(),
        durationType,
        durationLabel,
        numberOfHours: durationType === 'six_hours_daycare' ? 6 : durationType === 'eight_hours_daycare' ? 8 : durationType === 'ten_hours_daycare' ? 10 : durationType === 'twelve_hours_daycare' ? 12 : undefined,
        dateOfBirth: dateOfBirth.trim(),
        genderAtBirth,
        chronicIllnesses: chronicIllnesses.trim(),
        chronicMedication: chronicMedication.trim(),
        allergies: allergies.trim(),
        medicalConsent: {
          accepted: consentGiven,
          text: consentText,
          acceptedAt: new Date().toISOString(),
        },
        location: { city: city || 'Not specified' },
        description,
        notes: description,
        contact: {
          name: 'HealthClan patient',
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
          <PreferredTimeField value={preferredTime} onChange={setPreferredTime} />
          <SelectField placeholder="Duration" value={durationType} options={durationOptions} onChange={setDurationType} />
          <Field placeholder="Date of Birth" value={dateOfBirth} onChangeText={setDateOfBirth} inputProps={{ placeholder: 'Date of Birth: DD/MM/YYYY' }} />
          <SelectField placeholder="Gender at Birth" value={genderAtBirth} options={genderAtBirthOptions} onChange={setGenderAtBirth} />
          <Field placeholder="Chronic Illnesses" multiline value={chronicIllnesses} onChangeText={setChronicIllnesses} />
          <Field placeholder="Chronic Medication" multiline value={chronicMedication} onChangeText={setChronicMedication} />
          <Field placeholder="Allergies" multiline value={allergies} onChangeText={setAllergies} />
          <Field placeholder="Email address" value={email} onChangeText={setEmail} />
          <Field placeholder="Phone number" value={phone} onChangeText={setPhone} />
          <Field placeholder="Location" value={location} onChangeText={setLocation} />
          <Field placeholder="Care Notes" multiline value={description} onChangeText={setDescription} />
          <Pressable style={styles.consentRow} onPress={() => setConsentGiven(current => !current)}>
            <View style={[styles.checkbox, consentGiven && styles.checkboxChecked]}>
              {consentGiven ? <Text style={styles.checkboxMark}>✓</Text> : null}
            </View>
            <Text style={styles.consentText}>{consentText}</Text>
          </Pressable>
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
  consentRow: { width: '100%', maxWidth: 520, borderRadius: 16, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, padding: 12, flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  checkbox: { width: 22, height: 22, borderRadius: 5, borderWidth: 2, borderColor: colors.teal, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  checkboxChecked: { backgroundColor: colors.teal },
  checkboxMark: { color: colors.white, fontFamily: 'Poppins', fontSize: 14, lineHeight: 18, fontWeight: '900' },
  consentText: { flex: 1, minWidth: 0, color: colors.ink, fontFamily: 'Poppins', fontSize: 11, lineHeight: 17, fontWeight: '700' },
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
  dateSheet: { width: '100%', maxHeight: '86%', maxWidth: 560, alignSelf: 'center', borderRadius: 24, backgroundColor: colors.white, padding: 16, gap: 12 },
  sheetTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  optionTitle: { color: colors.ink, fontFamily: 'Poppins', fontSize: 18, fontWeight: '900', marginBottom: 4 },
  sheetSub: { color: colors.muted, fontFamily: 'Poppins', fontSize: 12, fontWeight: '800' },
  sheetClose: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.panel, alignItems: 'center', justifyContent: 'center' },
  sheetCloseText: { color: colors.teal, fontSize: 24, lineHeight: 28, fontWeight: '800' },
  selectedSummary: { borderRadius: 18, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.line, padding: 14 },
  selectedSummaryLabel: { color: colors.muted, fontFamily: 'Poppins', fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },
  selectedSummaryValue: { color: colors.ink, fontFamily: 'Poppins', fontSize: 15, lineHeight: 22, fontWeight: '900', marginTop: 4 },
  optionRow: { minHeight: 48, borderRadius: 12, justifyContent: 'center', paddingHorizontal: 12 },
  optionActive: { backgroundColor: colors.panel },
  optionText: { color: colors.ink, fontFamily: 'Poppins', fontSize: 14, fontWeight: '800' },
  sheetLabel: { color: colors.teal, fontFamily: 'Poppins', fontSize: 12, fontWeight: '900' },
  dateScroller: { gap: 8, paddingRight: 8 },
  datePill: { width: 68, minHeight: 80, borderRadius: 18, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  datePillActive: { backgroundColor: colors.teal, borderColor: colors.teal },
  datePillText: { color: colors.muted, fontFamily: 'Poppins', fontSize: 11, fontWeight: '900' },
  datePillDay: { color: colors.ink, fontFamily: 'Poppins', fontSize: 17, fontWeight: '900', marginTop: 2 },
  datePillMonth: { color: colors.muted, fontFamily: 'Poppins', fontSize: 10, fontWeight: '900', marginTop: 2 },
  datePillTextActive: { color: colors.white },
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  timePill: { minWidth: 82, minHeight: 46, borderRadius: 16, backgroundColor: colors.panel, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  timePillText: { color: colors.teal, fontFamily: 'Poppins', fontSize: 13, fontWeight: '900' },
  sheetActions: { flexDirection: 'row', gap: 10, marginTop: 2 },
  cancelButton: { flex: 1, minHeight: 50, borderRadius: 14, backgroundColor: colors.panel, alignItems: 'center', justifyContent: 'center' },
  cancelButtonText: { color: colors.teal, fontFamily: 'Poppins', fontSize: 14, fontWeight: '900' },
  doneButton: { flex: 1, minHeight: 50, borderRadius: 14, backgroundColor: colors.teal, alignItems: 'center', justifyContent: 'center' },
  doneButtonText: { color: colors.white, fontFamily: 'Poppins', fontSize: 14, fontWeight: '900' },
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
