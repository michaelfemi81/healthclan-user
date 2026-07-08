import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Header, PrimaryButton, Screen } from '../components/HealthClanUI';
import { colors } from '../constants/healthclanDesign';
import { specialties } from '../constants/doctors';

const specialtyOptions = ['Any specialty', ...specialties.map(item => item.name)];
const availabilityOptions = ['Any availability', 'Today', 'This week', 'Next available'];
const ratingOptions = ['Any rating', '4.5+', '4.8+'];

function SelectBox({
  label,
  value,
  options,
  open,
  onToggle,
  onSelect,
}: {
  label: string;
  value: string;
  options: string[];
  open: boolean;
  onToggle: () => void;
  onSelect: (value: string) => void;
}) {
  return (
    <View style={styles.selectWrap}>
      <Pressable style={[styles.select, open && styles.selectOpen]} onPress={onToggle}>
        <View style={styles.selectCopy}>
          <Text style={styles.selectLabel}>{label}</Text>
          <Text style={styles.selectValue}>{value}</Text>
        </View>
        <Text style={styles.chevron}>{open ? '⌃' : '⌄'}</Text>
      </Pressable>
      {open ? (
        <View style={styles.options}>
          {options.map(option => (
            <Pressable
              key={option}
              style={[styles.option, value === option && styles.optionActive]}
              onPress={() => onSelect(option)}
            >
              <Text style={[styles.optionText, value === option && styles.optionTextActive]}>{option}</Text>
              <Text style={[styles.optionMark, value === option && styles.optionTextActive]}>{value === option ? '✓' : ''}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

export default function DoctorFilter() {
  const [openSelect, setOpenSelect] = useState('');
  const [specialty, setSpecialty] = useState('Any specialty');
  const [availability, setAvailability] = useState('Any availability');
  const [rating, setRating] = useState('Any rating');

  function choose(selectKey: string, value: string, setter: (value: string) => void) {
    setter(value);
    setOpenSelect(openSelect === selectKey ? '' : openSelect);
  }

  function showDoctors() {
    const chosenSpecialty = specialties.find(item => item.name === specialty);
    router.replace({
      pathname: '/eachspec' as any,
      params: {
        specialty: chosenSpecialty?.slug ?? 'all',
        availability,
        rating,
      },
    });
  }

  function resetFilters() {
    setSpecialty('Any specialty');
    setAvailability('Any availability');
    setRating('Any rating');
    setOpenSelect('');
  }

  return (
    <Screen>
      <Header title="Doctor Filter" backTo="/search" />
      <View style={styles.hero}>
        <Text style={styles.title}>Find the right doctor</Text>
        <Text style={styles.copy}>Choose filters below. HealthClan currently supports video appointments only.</Text>
      </View>
      <View style={styles.list}>
        <SelectBox
          label="Specialty"
          value={specialty}
          options={specialtyOptions}
          open={openSelect === 'specialty'}
          onToggle={() => setOpenSelect(openSelect === 'specialty' ? '' : 'specialty')}
          onSelect={value => choose('specialty', value, setSpecialty)}
        />
        <SelectBox
          label="Availability"
          value={availability}
          options={availabilityOptions}
          open={openSelect === 'availability'}
          onToggle={() => setOpenSelect(openSelect === 'availability' ? '' : 'availability')}
          onSelect={value => choose('availability', value, setAvailability)}
        />
        <SelectBox
          label="Rating"
          value={rating}
          options={ratingOptions}
          open={openSelect === 'rating'}
          onToggle={() => setOpenSelect(openSelect === 'rating' ? '' : 'rating')}
          onSelect={value => choose('rating', value, setRating)}
        />
        <View style={styles.videoOnly}>
          <Text style={styles.videoTitle}>Care type</Text>
          <Text style={styles.videoSub}>Video visit</Text>
        </View>
      </View>
      <View style={styles.actions}>
        <PrimaryButton title="Show Doctors" onPress={showDoctors} />
        <Pressable style={styles.reset} onPress={resetFilters}>
          <Text style={styles.resetText}>Reset filters</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { borderRadius: 22, backgroundColor: colors.teal, padding: 18, marginBottom: 16 },
  title: { color: colors.white, fontFamily: 'Poppins', fontSize: 24, fontWeight: '900' },
  copy: { color: 'rgba(255,255,255,0.84)', fontFamily: 'Poppins', fontSize: 13, lineHeight: 20, fontWeight: '700', marginTop: 6 },
  list: { gap: 12, marginBottom: 22 },
  selectWrap: { gap: 8 },
  select: { minHeight: 72, borderRadius: 16, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  selectOpen: { borderColor: colors.teal },
  selectCopy: { flex: 1, minWidth: 0 },
  selectLabel: { color: colors.muted, fontFamily: 'Poppins', fontSize: 12, fontWeight: '800' },
  selectValue: { color: colors.ink, fontFamily: 'Poppins', fontSize: 16, fontWeight: '900', marginTop: 4 },
  chevron: { color: colors.teal, fontSize: 22, fontWeight: '900' },
  options: { overflow: 'hidden', borderRadius: 16, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line },
  option: { minHeight: 48, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: colors.line },
  optionActive: { backgroundColor: colors.panel },
  optionText: { color: colors.ink, fontFamily: 'Poppins', fontSize: 13, fontWeight: '800' },
  optionTextActive: { color: colors.teal },
  optionMark: { width: 24, color: colors.teal, fontFamily: 'Poppins', fontSize: 15, fontWeight: '900', textAlign: 'right' },
  videoOnly: { minHeight: 72, borderRadius: 16, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, padding: 12, justifyContent: 'center' },
  videoTitle: { color: colors.muted, fontFamily: 'Poppins', fontSize: 12, fontWeight: '800' },
  videoSub: { color: colors.teal, fontFamily: 'Poppins', fontSize: 16, fontWeight: '900', marginTop: 4 },
  actions: { gap: 12, alignItems: 'center' },
  reset: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  resetText: { color: colors.teal, fontFamily: 'Poppins', fontSize: 13, fontWeight: '900' },
});
