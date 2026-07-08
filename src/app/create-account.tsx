import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Field, Header, PrimaryButton, Screen } from '../components/HealthClanUI';
import { colors } from '../constants/healthclanDesign';
import { signInSession } from '../constants/session';
import { healthclanApi } from '../lib/api';
import { currencyForCountry, setPreferredCurrency } from '../lib/currency';
import { registerTrustedDevice } from '../lib/device-registration';
import { isStrongEnoughPassword, isValidDateString, isValidEmail, isValidPhone } from '../lib/validation';

type Option = { label: string; value: string };
type CountryOption = Option & { dialCode: string };

const countryCodes: CountryOption[] = [
  { label: 'Nigeria (+234)', value: 'NG', dialCode: '+234' },
  { label: 'United Kingdom (+44)', value: 'GB', dialCode: '+44' },
  { label: 'United States (+1)', value: 'US', dialCode: '+1' },
  { label: 'Canada (+1)', value: 'CA', dialCode: '+1' },
  { label: 'Ghana (+233)', value: 'GH', dialCode: '+233' },
  { label: 'Kenya (+254)', value: 'KE', dialCode: '+254' },
  { label: 'South Africa (+27)', value: 'ZA', dialCode: '+27' },
  { label: 'India (+91)', value: 'IN', dialCode: '+91' },
  { label: 'United Arab Emirates (+971)', value: 'AE', dialCode: '+971' },
];

const maritalStatuses: Option[] = [
  { label: 'Single', value: 'single' },
  { label: 'Married', value: 'married' },
  { label: 'Divorced', value: 'divorced' },
  { label: 'Widowed', value: 'widowed' },
  { label: 'Separated', value: 'separated' },
  { label: 'Prefer not to say', value: 'prefer_not_to_say' },
];

const days = Array.from({ length: 31 }, (_, index) => String(index + 1).padStart(2, '0'));
const months = Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, '0'));
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 100 }, (_, index) => String(currentYear - index));

function SelectField({
  placeholder,
  value,
  options,
  onChange,
}: {
  placeholder: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
}) {
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
              keyExtractor={(item, index) => `${item.value}-${index}`}
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
              {renderColumn('Day', days, day, setDay)}
              {renderColumn('Month', months, month, setMonth)}
              {renderColumn('Year', years, year, setYear)}
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

export default function CreateAccount() {
  const [fullName, setFullName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [address, setAddress] = useState('');
  const [countryCode, setCountryCode] = useState('NG');
  const [phone, setPhone] = useState('');
  const [maritalStatus, setMaritalStatus] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  function chooseCountry(value: string) {
    setCountryCode(value);
    setPreferredCurrency(currencyForCountry(value));
  }

  async function submit() {
    if (loading) return;

    const [firstName = '', ...rest] = fullName.trim().split(/\s+/);
    const selectedCountry = countryCodes.find(country => country.value === countryCode) || countryCodes[0];

    setMessage('');

    if (!firstName || rest.join(' ').trim().length === 0) {
      setMessage('Enter your first and last name.');
      return;
    }

    if (!isValidDateString(dateOfBirth)) {
      setMessage('Select a valid date of birth.');
      return;
    }

    if (address.trim().length < 5) {
      setMessage('Enter your address.');
      return;
    }

    if (!countryCode) {
      setMessage('Select a country code.');
      return;
    }

    if (!isValidPhone(phone)) {
      setMessage('Enter a valid phone number.');
      return;
    }

    if (!maritalStatus) {
      setMessage('Select your marital status.');
      return;
    }

    if (!isValidEmail(email)) {
      setMessage('Enter a valid email address.');
      return;
    }

    if (!isStrongEnoughPassword(password)) {
      setMessage('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);

    try {
      const response = await healthclanApi.auth.register({
        firstName,
        lastName: rest.join(' '),
        email: email.trim(),
        countryCode: selectedCountry.dialCode,
        phone: phone.trim(),
        dateOfBirth,
        maritalStatus,
        address: { line1: address.trim(), countryCode: selectedCountry.value },
        password,
        type: 'patient',
      });
      setPreferredCurrency(currencyForCountry(selectedCountry.value));
      signInSession(response.token);
      registerTrustedDevice();
      router.replace({
        pathname: '/email-confirmation',
        params: { email: email.trim(), authToken: response.token },
      } as any);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to create account.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <Header title="New Account" backTo="/onboard" />
      <View style={styles.form}>
        <Field placeholder="Full name" value={fullName} onChangeText={setFullName} />
        <DatePickerField value={dateOfBirth} onChange={setDateOfBirth} />
        <Field placeholder="Address: Plot 123, Street, City, Country" value={address} onChangeText={setAddress} />
        <View style={styles.phoneRow}>
          <View style={styles.countryCode}>
            <SelectField placeholder="Code" value={countryCode} options={countryCodes} onChange={chooseCountry} />
          </View>
          <View style={styles.phoneField}>
            <Field placeholder="Phone number" value={phone} onChangeText={setPhone} />
          </View>
        </View>
        <SelectField placeholder="Marital status" value={maritalStatus} options={maritalStatuses} onChange={setMaritalStatus} />
        <Field placeholder="Email" value={email} onChangeText={setEmail} />
        <Field
          placeholder="Password"
          secureTextEntry={!passwordVisible}
          value={password}
          onChangeText={setPassword}
          rightLabel={passwordVisible ? 'Hide' : 'Show'}
          onRightPress={() => setPasswordVisible(current => !current)}
        />
        {!!message && <Text style={styles.message}>{message}</Text>}
        <Text style={styles.terms}>
          By continuing, you agree to our <Text style={styles.strong} onPress={() => router.push('/terms' as any)}>Terms of Use</Text> and <Text style={styles.strong} onPress={() => router.push('/privacy' as any)}>Privacy Policy</Text>
        </Text>
        <PrimaryButton
          title={loading ? 'Creating account...' : 'Sign Up'}
          onPress={submit}
          loading={loading}
        />
        <Pressable onPress={() => router.replace('/sign-in' as any)}>
          <Text style={styles.center}>Already have an account?  <Text style={styles.strong}>Login</Text></Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { gap: 12, alignItems: 'center' },
  phoneRow: { width: '100%', maxWidth: 520, flexDirection: 'row', gap: 10 },
  countryCode: { width: 156 },
  phoneField: { flex: 1 },
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
  },
  selectText: { flex: 1, color: colors.ink, fontFamily: 'Poppins', fontSize: 14, fontWeight: '700' },
  selectPlaceholder: { color: colors.aqua },
  chevronDown: {
    width: 10,
    height: 10,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: colors.teal,
    transform: [{ rotate: '45deg' }],
    marginLeft: 10,
    marginTop: -5,
  },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(8,81,97,0.28)', justifyContent: 'center', padding: 18 },
  optionSheet: { width: '100%', maxWidth: 520, maxHeight: '72%', alignSelf: 'center', borderRadius: 12, backgroundColor: colors.white, padding: 14 },
  optionTitle: { color: colors.ink, fontFamily: 'Poppins', fontSize: 16, fontWeight: '900', marginBottom: 10, textAlign: 'center' },
  optionRow: { minHeight: 46, borderRadius: 8, justifyContent: 'center', paddingHorizontal: 12 },
  optionActive: { backgroundColor: colors.panel },
  optionText: { color: colors.ink, fontFamily: 'Poppins', fontSize: 14, fontWeight: '700' },
  dateSheet: { width: '100%', maxWidth: 520, maxHeight: '82%', alignSelf: 'center', borderRadius: 12, backgroundColor: colors.white, padding: 14, gap: 12 },
  dateColumns: { flexDirection: 'row', gap: 8, minHeight: 260 },
  dateColumn: { flex: 1 },
  dateColumnTitle: { color: colors.muted, fontFamily: 'Poppins', fontSize: 12, fontWeight: '900', textAlign: 'center', marginBottom: 6 },
  dateList: { maxHeight: 250 },
  dateOption: { minHeight: 38, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  dateOptionActive: { backgroundColor: colors.teal },
  dateOptionText: { color: colors.ink, fontFamily: 'Poppins', fontSize: 13, fontWeight: '800' },
  dateOptionTextActive: { color: colors.white },
  terms: { maxWidth: 430, color: colors.ink, fontFamily: 'Poppins', fontSize: 12, lineHeight: 18, fontWeight: '700', textAlign: 'center', marginVertical: 4 },
  center: { color: colors.ink, fontFamily: 'Poppins', fontSize: 12, fontWeight: '700', textAlign: 'center' },
  strong: { color: colors.teal, fontWeight: '900' },
  message: { maxWidth: 430, color: '#B42318', fontFamily: 'Poppins', fontSize: 12, fontWeight: '800', textAlign: 'center' },
});
