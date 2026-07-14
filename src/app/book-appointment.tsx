import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Card, Field, Header, PrimaryButton, Screen } from '../components/HealthClanUI';
import { colors } from '../constants/healthclanDesign';
import { getDoctorById } from '../constants/doctors';
import { healthclanApi } from '../lib/api';
import { formatDoctor, type AppDoctor } from '../lib/doctor-format';
import { isValidEmail, isValidPhone } from '../lib/validation';

type Option = { label: string; value: string };

const genderOptions: Option[] = [
  { label: 'Female', value: 'female' },
  { label: 'Male', value: 'male' },
  { label: 'Intersex', value: 'intersex' },
  { label: 'Prefer not to say', value: 'prefer_not_to_say' },
];
const consentText = 'I consent to give the Doctor my true personal, medical, surgical information and I expect it to be used solely for the purpose of my care and treatment, to be kept confidentially and according to the POPI Act.';
const months = Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, '0'));
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 120 }, (_, index) => String(currentYear - index));

export default function BookAppointment() {
  const params = useLocalSearchParams();
  const [doctor, setDoctor] = useState<AppDoctor>(getDoctorById(params.doctorId));
  const selectedSlot = Array.isArray(params.slot) ? params.slot[0] : params.slot;
  const selectedEndSlot = Array.isArray(params.endSlot) ? params.endSlot[0] : params.endSlot;
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [genderAtBirth, setGenderAtBirth] = useState('');
  const [chronicIllnesses, setChronicIllnesses] = useState('');
  const [chronicMedication, setChronicMedication] = useState('');
  const [allergies, setAllergies] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [contactName, setContactName] = useState('HealthClan patient');
  const [consentGiven, setConsentGiven] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const id = Array.isArray(params.doctorId) ? params.doctorId[0] : params.doctorId;
    if (!id) return;

    healthclanApi.doctors.byId(id)
      .then((payload: any) => {
        setDoctor(formatDoctor({ ...payload.doctor, profile: payload.profile }));
      })
      .catch(() => null);
  }, [params.doctorId]);

  useEffect(() => {
    healthclanApi.users.me()
      .then((payload: any) => {
        const details = { ...(payload?.profile || {}), ...(payload?.user || {}) };
        setContactName(details.fullName || [details.firstName, details.lastName].filter(Boolean).join(' ') || 'HealthClan patient');
        setDateOfBirth(details.dateOfBirth ? String(details.dateOfBirth).slice(0, 10) : '');
        setGenderAtBirth(details.genderAtBirth || details.gender || '');
        setChronicIllnesses(details.chronicIllnesses || '');
        setChronicMedication(details.chronicMedication || '');
        setAllergies(details.allergies || '');
        setEmail(details.email || '');
        setPhone(details.phone || '');
        setLocation(addressToText(details.address));
      })
      .catch(() => null);
  }, []);

  async function sendRequest() {
    if (loading) return;

    setMessage('');

    if (!doctor.id) {
      setMessage('Choose a doctor before booking.');
      return;
    }

    if (!selectedSlot) {
      setMessage('Choose an appointment time.');
      return;
    }

    const visitReason = [reason, notes].map(value => value.trim()).filter(Boolean).join(' - ');

    if (visitReason.length < 3) {
      setMessage('Enter a reason for the visit.');
      return;
    }

    if (!dateOfBirth || !genderAtBirth) {
      setMessage('Select date of birth and gender at birth.');
      return;
    }

    if (!isValidEmail(email) || !isValidPhone(phone)) {
      setMessage('Enter a valid email address and phone number.');
      return;
    }

    if (!location.trim()) {
      setMessage('Enter your location.');
      return;
    }

    if (!consentGiven) {
      setMessage('Tick the consent box before sending your appointment request.');
      return;
    }

    const startTime = parseSlotDate(selectedSlot);
    const endTime = selectedEndSlot ? parseSlotDate(selectedEndSlot) : new Date(startTime.getTime() + 30 * 60 * 1000);

    if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime()) || startTime >= endTime) {
      setMessage('Choose a valid appointment time.');
      return;
    }

    setLoading(true);

    try {
      const payload: any = await healthclanApi.doctors.bookAppointment({
        doctor: doctor.id,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        reasonForVisit: visitReason,
        dateOfBirth,
        genderAtBirth,
        chronicIllnesses: chronicIllnesses.trim(),
        chronicMedication: chronicMedication.trim(),
        allergies: allergies.trim(),
        contact: { name: contactName, email: email.trim(), phone: phone.trim() },
        location: location.trim(),
        medicalConsent: { accepted: true, text: consentText, acceptedAt: new Date().toISOString() },
      });
      setMessage(payload?.message || 'Appointment request sent. You will be notified when the doctor responds.');
      router.replace({
        pathname: '/appointments',
        params: { focus: 'requests' },
      } as any);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to create appointment.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <Header title="Book Appointment" backTo={`/doctor-profile?doctorId=${doctor.id}`} />
      <View style={styles.form}>
        <Text style={styles.title}>Confirm Appointment</Text>
        <Card>
          <Text style={styles.cardTitle}>{doctor.name}</Text>
          <Text style={styles.cardSub}>{doctor.specialty} - {doctor.location}</Text>
          <Text style={styles.cardMeta}>{selectedSlot ? formatSlotLabel(selectedSlot) : 'The doctor will accept or reject this request before payment.'}</Text>
        </Card>
        <Field placeholder="Reason for Visit" value={reason} onChangeText={setReason} />
        <Field placeholder="Briefly describe your concern" multiline value={notes} onChangeText={setNotes} />
        <DatePickerField value={dateOfBirth} onChange={setDateOfBirth} />
        <SelectField placeholder="Gender at Birth" value={genderAtBirth} options={genderOptions} onChange={setGenderAtBirth} />
        <Field placeholder="Chronic Illnesses" multiline value={chronicIllnesses} onChangeText={setChronicIllnesses} />
        <Field placeholder="Chronic Medication" multiline value={chronicMedication} onChangeText={setChronicMedication} />
        <Field placeholder="Allergies" multiline value={allergies} onChangeText={setAllergies} />
        <Field placeholder="Email address" value={email} onChangeText={setEmail} />
        <Field placeholder="Phone number" value={phone} onChangeText={setPhone} />
        <Field placeholder="Location" value={location} onChangeText={setLocation} />
        <Pressable style={styles.consentRow} onPress={() => setConsentGiven(current => !current)}>
          <View style={[styles.checkbox, consentGiven && styles.checkboxChecked]}>
            {consentGiven ? <Text style={styles.checkboxMark}>✓</Text> : null}
          </View>
          <Text style={styles.consentText}>{consentText}</Text>
        </Pressable>
        {!!message && <Text style={styles.message}>{message}</Text>}
        <PrimaryButton
          title={loading ? 'Sending request...' : 'Send Appointment Request'}
          onPress={sendRequest}
          loading={loading}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { gap: 14, alignItems: 'center' },
  title: { color: colors.ink, fontFamily: 'Poppins', fontSize: 24, fontWeight: '900', marginBottom: 8 },
  cardTitle: { color: colors.ink, fontFamily: 'Poppins', fontSize: 17, fontWeight: '900' },
  cardSub: { color: colors.teal, fontFamily: 'Poppins', fontSize: 13, fontWeight: '800', marginTop: 4 },
  cardMeta: { color: colors.muted, fontFamily: 'Poppins', fontSize: 12, fontWeight: '700', marginTop: 8 },
  message: { color: '#B42318', fontFamily: 'Poppins', fontSize: 12, fontWeight: '800', textAlign: 'center' },
  selectField: { width: '100%', maxWidth: 520, minHeight: 50, borderRadius: 10, backgroundColor: colors.field, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  selectText: { flex: 1, color: colors.ink, fontFamily: 'Poppins', fontSize: 14, fontWeight: '800' },
  selectPlaceholder: { color: colors.muted },
  chevronDown: { width: 10, height: 10, borderRightWidth: 2, borderBottomWidth: 2, borderColor: colors.teal, transform: [{ rotate: '45deg' }], marginTop: -5 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(8,81,97,0.28)', justifyContent: 'center', padding: 18 },
  optionSheet: { width: '100%', maxWidth: 520, maxHeight: '72%', alignSelf: 'center', borderRadius: 14, backgroundColor: colors.white, padding: 14 },
  optionTitle: { color: colors.ink, fontFamily: 'Poppins', fontSize: 16, fontWeight: '900', marginBottom: 10, textAlign: 'center' },
  optionRow: { minHeight: 46, borderRadius: 8, justifyContent: 'center', paddingHorizontal: 12 },
  optionActive: { backgroundColor: colors.panel },
  optionText: { color: colors.ink, fontFamily: 'Poppins', fontSize: 14, fontWeight: '800' },
  dateSheet: { width: '100%', maxWidth: 520, maxHeight: '82%', alignSelf: 'center', borderRadius: 14, backgroundColor: colors.white, padding: 14, gap: 12 },
  dateColumns: { flexDirection: 'row', gap: 8, minHeight: 260 },
  dateColumn: { flex: 1 },
  dateColumnTitle: { color: colors.muted, fontFamily: 'Poppins', fontSize: 12, fontWeight: '900', textAlign: 'center', marginBottom: 6 },
  dateList: { maxHeight: 250 },
  dateOption: { minHeight: 38, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  dateOptionActive: { backgroundColor: colors.teal },
  dateOptionText: { color: colors.ink, fontFamily: 'Poppins', fontSize: 13, fontWeight: '800' },
  dateOptionTextActive: { color: colors.white },
  consentRow: { width: '100%', maxWidth: 520, borderRadius: 16, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, padding: 12, flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  checkbox: { width: 22, height: 22, borderRadius: 5, borderWidth: 2, borderColor: colors.teal, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  checkboxChecked: { backgroundColor: colors.teal },
  checkboxMark: { color: colors.white, fontFamily: 'Poppins', fontSize: 14, lineHeight: 18, fontWeight: '900' },
  consentText: { flex: 1, color: colors.ink, fontFamily: 'Poppins', fontSize: 11, lineHeight: 17, fontWeight: '700' },
});

function SelectField({ placeholder, value, options, onChange }: { placeholder: string; value: string; options: Option[]; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const selected = options.find(option => option.value === value);
  return <>
    <Pressable style={styles.selectField} onPress={() => setOpen(true)}><Text style={[styles.selectText, !selected && styles.selectPlaceholder]}>{selected?.label || placeholder}</Text><View style={styles.chevronDown} /></Pressable>
    <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
      <Pressable style={styles.modalBackdrop} onPress={() => setOpen(false)}><View style={styles.optionSheet}><Text style={styles.optionTitle}>{placeholder}</Text><FlatList data={options} keyExtractor={item => item.value} renderItem={({ item }) => <Pressable style={[styles.optionRow, item.value === value && styles.optionActive]} onPress={() => { onChange(item.value); setOpen(false); }}><Text style={styles.optionText}>{item.label}</Text></Pressable>} /></View></Pressable>
    </Modal>
  </>;
}

function DatePickerField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(value.split('-')[0] || String(currentYear - 25));
  const [month, setMonth] = useState(value.split('-')[1] || '01');
  const [day, setDay] = useState(value.split('-')[2] || '01');
  const daysInMonth = new Date(Number(year), Number(month), 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, index) => String(index + 1).padStart(2, '0'));
  useEffect(() => { const [y, m, d] = value.split('-'); if (y) setYear(y); if (m) setMonth(m); if (d) setDay(d); }, [value]);
  useEffect(() => { if (Number(day) > daysInMonth) setDay(String(daysInMonth).padStart(2, '0')); }, [day, daysInMonth]);
  const column = (title: string, values: string[], selected: string, choose: (item: string) => void) => <View style={styles.dateColumn}><Text style={styles.dateColumnTitle}>{title}</Text><FlatList data={values} keyExtractor={item => item} style={styles.dateList} renderItem={({ item }) => <Pressable style={[styles.dateOption, item === selected && styles.dateOptionActive]} onPress={() => choose(item)}><Text style={[styles.dateOptionText, item === selected && styles.dateOptionTextActive]}>{item}</Text></Pressable>} /></View>;
  return <>
    <Pressable style={styles.selectField} onPress={() => setOpen(true)}><Text style={[styles.selectText, !value && styles.selectPlaceholder]}>{value || 'Date of Birth'}</Text><View style={styles.chevronDown} /></Pressable>
    <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}><Pressable style={styles.modalBackdrop} onPress={() => setOpen(false)}><View style={styles.dateSheet}><Text style={styles.optionTitle}>Date of Birth</Text><View style={styles.dateColumns}>{column('Day', days, day, setDay)}{column('Month', months, month, setMonth)}{column('Year', years, year, setYear)}</View><PrimaryButton title="Done" onPress={() => { onChange(`${year}-${month}-${day}`); setOpen(false); }} /></View></Pressable></Modal>
  </>;
}

function addressToText(address: unknown) {
  if (typeof address === 'string') return address;
  if (!address || typeof address !== 'object') return '';
  const value = address as Record<string, unknown>;
  return [value.line1, value.line2, value.city, value.state, value.postcode, value.country].filter(Boolean).join(', ');
}

function parseSlotDate(value: string) {
  if (value.includes('T')) return new Date(value);

  const startTime = new Date();
  const [hour, minute = '00'] = value.split(':');
  startTime.setHours(Number(hour), Number(minute), 0, 0);
  return startTime;
}

function formatSlotLabel(value: string) {
  const date = parseSlotDate(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
