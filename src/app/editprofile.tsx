import { Header, Field, PrimaryButton, Screen } from '../components/HealthClanUI';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/healthclanDesign';
import { healthclanApi } from '../lib/api';
import { isValidEmail, isValidPhone } from '../lib/validation';

function addressToText(address: any) {
  if (!address) return '';
  return address.line1 || [address.city, address.state || address.county, address.country].filter(Boolean).join(', ');
}

type Option = { label: string; value: string };

const genderAtBirthOptions: Option[] = [
  { label: 'Female', value: 'female' },
  { label: 'Male', value: 'male' },
  { label: 'Intersex', value: 'intersex' },
  { label: 'Prefer not to say', value: 'prefer_not_to_say' },
];

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

export default function EditProfile() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [addressObject, setAddressObject] = useState<any>({});
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [genderAtBirth, setGenderAtBirth] = useState('');
  const [chronicIllnesses, setChronicIllnesses] = useState('');
  const [chronicMedication, setChronicMedication] = useState('');
  const [allergies, setAllergies] = useState('');
  const [avatar, setAvatar] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const avatarSource = avatar ? { uri: avatar } : require('../../assets/images/default-user-illustration.png');

  useEffect(() => {
    healthclanApi.users.me()
      .then((payload: any) => {
        const user = payload?.user || {};
        setFullName(user.fullName || '');
        setEmail(user.email || '');
        setPhone(user.phone || '');
        setAddressObject(user.address || {});
        setAddress(addressToText(user.address));
        setDateOfBirth(user.dateOfBirth ? String(user.dateOfBirth).slice(0, 10) : '');
        setGenderAtBirth(user.genderAtBirth || user.gender || '');
        setChronicIllnesses(user.chronicIllnesses || '');
        setChronicMedication(user.chronicMedication || '');
        setAllergies(user.allergies || '');
        setAvatar(user.avatar || '');
      })
      .catch(() => null);
  }, []);

  async function choosePicture() {
    setMessage('');

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setMessage('Allow photo access to choose a profile picture from your gallery.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.72,
      base64: true,
    });

    if (result.canceled) return;

    const asset = result.assets[0];
    if (!asset) return;

    const mimeType = asset.mimeType || 'image/jpeg';
    setAvatar(asset.base64 ? `data:${mimeType};base64,${asset.base64}` : asset.uri);
  }

  async function save() {
    if (loading) return;

    setMessage('');

    if (fullName.trim().split(/\s+/).length < 2) {
      setMessage('Enter your first and last name.');
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

    if (!address.trim()) {
      setMessage('Enter your address.');
      return;
    }

    setLoading(true);

    try {
      await healthclanApi.users.updateMe({
        fullName,
        email,
        phone,
        avatar: avatar.trim(),
        dateOfBirth: dateOfBirth.trim() || undefined,
        genderAtBirth: genderAtBirth || undefined,
        chronicIllnesses: chronicIllnesses.trim() || undefined,
        chronicMedication: chronicMedication.trim() || undefined,
        allergies: allergies.trim() || undefined,
        address: { ...addressObject, line1: address.trim() },
      });
      router.replace('/profile' as any);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to save profile.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <Header title="Edit Profile" backTo="/profile" />
      <View style={styles.form}>
        <View style={styles.avatarPanel}>
          <Image source={avatarSource} style={styles.avatar} contentFit="cover" />
          <View style={styles.avatarActions}>
            <Pressable style={styles.avatarButton} onPress={choosePicture}>
              <Text style={styles.avatarButtonText}>Change Picture</Text>
            </Pressable>
            {!!avatar && (
              <Pressable style={styles.avatarButtonLight} onPress={() => setAvatar('')}>
                <Text style={styles.avatarButtonLightText}>Use Default</Text>
              </Pressable>
            )}
          </View>
        </View>
        <Field placeholder="Full name" value={fullName} onChangeText={setFullName} />
        <Field placeholder="Email address" value={email} onChangeText={setEmail} />
        <Field placeholder="Phone number" value={phone} onChangeText={setPhone} />
        <Field placeholder="Address" value={address} onChangeText={setAddress} />
        <Field placeholder="Date of Birth" value={dateOfBirth} onChangeText={setDateOfBirth} inputProps={{ placeholder: 'Date of Birth: DD/MM/YYYY' }} />
        <SelectField placeholder="Gender at Birth" value={genderAtBirth} options={genderAtBirthOptions} onChange={setGenderAtBirth} />
        <Field placeholder="Chronic Illnesses" multiline value={chronicIllnesses} onChangeText={setChronicIllnesses} />
        <Field placeholder="Chronic Medication" multiline value={chronicMedication} onChangeText={setChronicMedication} />
        <Field placeholder="Allergies" multiline value={allergies} onChangeText={setAllergies} />
        {!!message && <Text style={styles.message}>{message}</Text>}
        <PrimaryButton title={loading ? 'Saving...' : 'Save Changes'} onPress={save} loading={loading} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { gap: 12, alignItems: 'center' },
  avatarPanel: { width: '100%', maxWidth: 520, borderRadius: 18, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, padding: 14, alignItems: 'center', gap: 12 },
  avatar: { width: 104, height: 104, borderRadius: 52, backgroundColor: colors.panel },
  avatarActions: { width: '100%', flexDirection: 'row', gap: 10 },
  avatarButton: { flex: 1, minHeight: 46, borderRadius: 14, backgroundColor: colors.teal, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  avatarButtonText: { color: colors.white, fontFamily: 'Poppins', fontSize: 13, fontWeight: '900' },
  avatarButtonLight: { flex: 1, minHeight: 46, borderRadius: 14, backgroundColor: colors.panel, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  avatarButtonLightText: { color: colors.teal, fontFamily: 'Poppins', fontSize: 13, fontWeight: '900' },
  selectField: { width: '100%', maxWidth: 520, minHeight: 50, borderRadius: 10, alignSelf: 'center', backgroundColor: colors.field, borderWidth: 0.8, borderColor: 'rgba(255,255,255,0.5)', paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  selectText: { flex: 1, minWidth: 0, color: colors.ink, fontFamily: 'Poppins', fontSize: 14, fontWeight: '800' },
  selectPlaceholder: { color: colors.muted },
  chevronDown: { width: 10, height: 10, borderRightWidth: 2, borderBottomWidth: 2, borderColor: colors.teal, transform: [{ rotate: '45deg' }], marginTop: -5 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(8,81,97,0.24)', justifyContent: 'flex-end', padding: 16 },
  optionSheet: { width: '100%', maxHeight: '72%', maxWidth: 560, alignSelf: 'center', borderRadius: 18, backgroundColor: colors.white, padding: 14 },
  optionTitle: { color: colors.ink, fontFamily: 'Poppins', fontSize: 18, fontWeight: '900', marginBottom: 4 },
  optionRow: { minHeight: 48, borderRadius: 12, justifyContent: 'center', paddingHorizontal: 12 },
  optionActive: { backgroundColor: colors.panel },
  optionText: { color: colors.ink, fontFamily: 'Poppins', fontSize: 14, fontWeight: '800' },
  message: { color: '#B42318', fontFamily: 'Poppins', fontSize: 12, fontWeight: '800', textAlign: 'center' },
});
