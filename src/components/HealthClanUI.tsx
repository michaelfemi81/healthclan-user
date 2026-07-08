import { router } from 'expo-router';
import { ReactNode, useRef } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions, type TextInputProps } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, pages } from '../constants/healthclanDesign';
import { useTranslation } from '../i18n/useTranslation';

export function Screen({ children, bottom = 28 }: { children: ReactNode; bottom?: number }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isSmall = width < 390;
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={[styles.content, isSmall && styles.contentSmall, { paddingBottom: insets.bottom + bottom }]} showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function Header({ title, backTo = '/' }: { title: string; backTo?: string }) {
  const { t } = useTranslation();

  function goBack() {
    if ((router as any).canGoBack?.()) {
      router.back();
      return;
    }

    router.replace(backTo as any);
  }

  return (
    <View style={styles.header}>
      <Pressable style={styles.back} onPress={goBack}>
        <Text style={styles.backText}>‹</Text>
      </Pressable>
      <Text style={styles.headerTitle}>{t(title)}</Text>
      <View style={styles.back} />
    </View>
  );
}

export function PrimaryButton({
  title,
  onPress,
  loading = false,
  disabled = false,
}: {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  const isDisabled = loading || disabled;

  return (
    <Pressable
      accessibilityState={{ busy: loading, disabled: isDisabled }}
      disabled={isDisabled}
      style={({ pressed }) => [styles.primary, isDisabled && styles.primaryDisabled, pressed && !isDisabled && styles.pressed]}
      onPress={onPress}
    >
      <View style={styles.primaryContent}>
        {loading ? <ActivityIndicator color={colors.white} size="small" /> : null}
        <Text style={styles.primaryText}>{t(title)}</Text>
      </View>
    </Pressable>
  );
}

export function Field({
  placeholder,
  secureTextEntry = false,
  multiline = false,
  value,
  onChangeText,
  rightLabel,
  onRightPress,
  inputProps,
  code = false,
}: {
  placeholder: string;
  secureTextEntry?: boolean;
  multiline?: boolean;
  value?: string;
  onChangeText?: (value: string) => void;
  rightLabel?: string;
  onRightPress?: () => void;
  inputProps?: TextInputProps;
  code?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <View style={[styles.field, multiline && styles.fieldTall, code && styles.fieldCode]}>
      <TextInput
        {...inputProps}
        placeholder={t(placeholder)}
        placeholderTextColor={colors.aqua}
        secureTextEntry={secureTextEntry}
        multiline={multiline}
        value={value}
        onChangeText={onChangeText}
        textAlignVertical={multiline ? 'top' : 'center'}
        style={[styles.input, multiline && styles.inputTall, code && styles.inputCode]}
      />
      {rightLabel ? (
        <Pressable style={styles.fieldAction} onPress={onRightPress}>
          <Text style={styles.fieldActionText}>{t(rightLabel)}</Text>
        </Pressable>
      ) : secureTextEntry ? (
        <Text style={styles.fieldIcon}>○</Text>
      ) : null}
    </View>
  );
}

export function CodeInput({
  value,
  onChangeText,
  length = 6,
}: {
  value: string;
  onChangeText: (value: string) => void;
  length?: number;
}) {
  const inputs = useRef<Array<TextInput | null>>([]);
  const digits = value.replace(/\D/g, '').slice(0, length).split('');

  function updateDigit(index: number, nextValue: string) {
    const nextDigit = nextValue.replace(/\D/g, '').slice(-1);
    const nextDigits = Array.from({ length }, (_, digitIndex) => digits[digitIndex] || '');
    nextDigits[index] = nextDigit;
    onChangeText(nextDigits.join('').slice(0, length));

    if (nextDigit && index < length - 1) {
      inputs.current[index + 1]?.focus();
    }
  }

  return (
    <View style={styles.codeRow}>
      {Array.from({ length }, (_, index) => (
        <TextInput
          key={index}
          ref={input => {
            inputs.current[index] = input;
          }}
          value={digits[index] || ''}
          onChangeText={nextValue => updateDigit(index, nextValue)}
          onKeyPress={({ nativeEvent }) => {
            if (nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
              inputs.current[index - 1]?.focus();
            }
          }}
          keyboardType="number-pad"
          maxLength={1}
          textContentType="oneTimeCode"
          style={styles.codeBox}
        />
      ))}
    </View>
  );
}

export function Card({ children }: { children: ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

export function Row({ title, subtitle, right, onPress }: { title: string; subtitle?: string; right?: string; onPress?: () => void }) {
  const { t } = useTranslation();
  return (
    <Pressable style={styles.row} onPress={onPress} disabled={!onPress}>
      <View style={styles.rowIcon}>
        <Text style={styles.rowIconText}>{title.charAt(0)}</Text>
      </View>
      <View style={styles.rowCopy}>
        <Text style={styles.rowTitle}>{t(title)}</Text>
        {subtitle ? <Text style={styles.rowSubtitle}>{t(subtitle)}</Text> : null}
      </View>
      <Text style={styles.rowRight}>{right ? t(right) : (onPress ? '›' : '')}</Text>
    </Pressable>
  );
}

export function BottomTabs({ active }: { active: 'home' | 'doctors' | 'record' | 'profile' }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const tabs = [
    { key: 'home', label: 'Home', route: '/' },
    { key: 'doctors', label: 'Doctors', route: '/specialties' },
    { key: 'record', label: 'Record', route: '/history' },
    { key: 'profile', label: 'Profile', route: '/profile' },
  ] as const;

  return (
    <View style={[styles.tabsWrap, { bottom: Math.max(insets.bottom + 8, 14) }]}>
      <View style={styles.tabs}>
        {tabs.map(tab => (
          <Pressable key={tab.key} style={[styles.tab, active === tab.key && styles.tabSelected]} onPress={() => router.replace(tab.route as any)}>
            <Text style={[styles.tabMark, active === tab.key && styles.tabMarkActive]}>{tab.label.charAt(0)}</Text>
            <Text style={[styles.tabLabel, active === tab.key && styles.tabActive]}>{t(tab.label)}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { flexGrow: 1, width: '100%', maxWidth: pages.wideMaxWidth, alignSelf: 'center', padding: 18 },
  contentSmall: { padding: 14 },
  header: {
    minHeight: 84,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    backgroundColor: colors.teal,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginHorizontal: -18,
    marginTop: -18,
    marginBottom: 22,
  },
  back: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  backText: { color: colors.white, fontSize: 36, lineHeight: 40, fontWeight: '700' },
  headerTitle: { flex: 1, color: colors.white, fontFamily: 'Poppins', fontSize: 24, fontWeight: '800', textAlign: 'center' },
  primary: {
    width: '100%',
    maxWidth: pages.maxWidth,
    minHeight: 54,
    borderRadius: 10,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.teal,
    shadowColor: colors.teal,
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  primaryDisabled: { opacity: 0.68 },
  primaryContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  pressed: { opacity: 0.78 },
  primaryText: { color: colors.white, fontFamily: 'Poppins', fontSize: 18, fontWeight: '800' },
  field: {
    width: '100%',
    maxWidth: pages.maxWidth,
    minHeight: 50,
    borderRadius: 10,
    alignSelf: 'center',
    backgroundColor: colors.field,
    borderWidth: 0.8,
    borderColor: 'rgba(255,255,255,0.5)',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  fieldTall: { minHeight: 104, alignItems: 'flex-start', paddingTop: 12 },
  fieldCode: { maxWidth: 240, minHeight: 58, paddingHorizontal: 18 },
  input: { flex: 1, minHeight: 48, color: colors.ink, fontFamily: 'Poppins', fontSize: 14, fontWeight: '700', padding: 0, outlineStyle: 'none' as any },
  inputTall: { minHeight: 80 },
  inputCode: { textAlign: 'center', fontSize: 24, letterSpacing: 0, fontWeight: '900' },
  fieldIcon: { color: colors.aqua, fontSize: 20 },
  fieldAction: { minHeight: 38, minWidth: 54, alignItems: 'center', justifyContent: 'center', paddingLeft: 8 },
  fieldActionText: { color: colors.teal, fontFamily: 'Poppins', fontSize: 12, fontWeight: '900' },
  codeRow: { width: '100%', maxWidth: 320, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  codeBox: {
    flex: 1,
    minWidth: 0,
    maxWidth: 44,
    height: 52,
    borderRadius: 12,
    backgroundColor: colors.field,
    borderWidth: 1,
    borderColor: 'rgba(8,81,97,0.16)',
    color: colors.ink,
    fontFamily: 'Poppins',
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    outlineStyle: 'none' as any,
  },
  card: {
    borderRadius: 18,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
    shadowColor: colors.teal,
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
  },
  row: {
    minHeight: 72,
    borderRadius: 16,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.panel, alignItems: 'center', justifyContent: 'center' },
  rowIconText: { color: colors.teal, fontFamily: 'Poppins', fontSize: 16, fontWeight: '900' },
  rowCopy: { flex: 1, minWidth: 0 },
  rowTitle: { color: colors.ink, fontFamily: 'Poppins', fontSize: 15, fontWeight: '800' },
  rowSubtitle: { color: colors.muted, fontFamily: 'Poppins', fontSize: 12, fontWeight: '600', marginTop: 3 },
  rowRight: { color: colors.teal, fontSize: 24, fontWeight: '700' },
  tabsWrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center', paddingHorizontal: 18 },
  tabs: {
    width: '100%',
    maxWidth: pages.maxWidth,
    minHeight: 72,
    borderRadius: 24,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: 'rgba(8,81,97,0.12)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    padding: 7,
    shadowColor: colors.teal,
    shadowOpacity: 0.18,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  tab: { flex: 1, minHeight: 58, borderRadius: 18, alignItems: 'center', justifyContent: 'center', gap: 4 },
  tabSelected: { backgroundColor: 'rgba(8,81,97,0.08)' },
  tabMark: { width: 28, height: 28, borderRadius: 14, textAlign: 'center', lineHeight: 28, color: colors.muted, backgroundColor: colors.panel, fontWeight: '900', overflow: 'hidden' },
  tabMarkActive: { color: colors.white, backgroundColor: colors.teal },
  tabLabel: { color: colors.muted, fontFamily: 'Poppins', fontSize: 11, lineHeight: 14, fontWeight: '800' },
  tabActive: { color: colors.teal },
});
