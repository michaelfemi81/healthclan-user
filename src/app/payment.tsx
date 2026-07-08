import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card, Header, PrimaryButton, Screen } from '../components/HealthClanUI';
import { colors, pages } from '../constants/healthclanDesign';
import { getDoctorById } from '../constants/doctors';
import { healthclanApi } from '../lib/api';
import { convertedCurrencyLabel, formatCurrency, getPreferredCurrency, loadBackendExchangeRates } from '../lib/currency';
import { formatDoctor, type AppDoctor } from '../lib/doctor-format';

const DEFAULT_CONSULTATION_FEE = 25;
const DEFAULT_CONSULTATION_CURRENCY = 'GBP';

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function entityId(value: any) {
  return String(value?._id || value?.id || value || '');
}

function appointmentDate(value: any) {
  const raw = value?.startTime || value?.scheduledAt || value?.appointmentDate || value?.date;
  if (!raw) return null;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function isExpiredPaymentAppointment(value: any) {
  const date = appointmentDate(value);
  return value?.status === 'pending_payment' && Boolean(date && date.getTime() <= Date.now());
}

function paymentErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : '';
  if (/appointment.*(id|required)|appointmentId/i.test(message)) {
    return 'We could not find the appointment details for this checkout. Please open the appointment again from your records.';
  }
  if (/expired|past|slot.*(unavailable|passed)|appointment.*(ended|elapsed)/i.test(message)) {
    return 'This appointment time has passed, so payment can no longer be completed. Please book a new slot.';
  }
  return message || 'Unable to complete payment.';
}

function moneyValue(...values: any[]) {
  for (const value of values) {
    const numeric = Number(value);
    if (Number.isFinite(numeric) && numeric > 0) return numeric;
  }
  return 0;
}

export default function Payment() {
  const params = useLocalSearchParams();
  const fallbackDoctor = getDoctorById(firstParam(params.doctorId));
  const [doctor, setDoctor] = useState<AppDoctor>(fallbackDoctor);
  const [appointment, setAppointment] = useState<any>(null);
  const slot = typeof params.slot === 'string' ? params.slot : '10:30 AM';
  const appointmentId = firstParam(params.appointmentId) || '';
  const [cards, setCards] = useState<any[]>([]);
  const [selectedMethod, setSelectedMethod] = useState('');
  const [paid, setPaid] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [appointmentLoading, setAppointmentLoading] = useState(false);
  const [displayCurrency, setDisplayCurrency] = useState(() => getPreferredCurrency());
  const [rateRefresh, setRateRefresh] = useState(0);
  const [pricingQuote, setPricingQuote] = useState<any>(null);
  const service = appointment?.service;
  const paidPayment = appointment?.payment;
  const fee = useMemo(() => {
    return moneyValue(
      paidPayment?.amount,
      pricingQuote?.amount,
      pricingQuote?.price,
      pricingQuote?.grossAmount,
      service?.amount,
      service?.price,
      appointment?.amount,
      appointment?.price,
      DEFAULT_CONSULTATION_FEE
    );
  }, [appointment?.amount, appointment?.price, paidPayment?.amount, pricingQuote?.amount, pricingQuote?.grossAmount, pricingQuote?.price, service?.amount, service?.price]);
  const currency = paidPayment?.currency || pricingQuote?.currency || service?.currency || appointment?.currency || DEFAULT_CONSULTATION_CURRENCY;
  const total = fee;
  const convertedTotal = useMemo(
    () => convertedCurrencyLabel(total, currency, displayCurrency),
    [currency, displayCurrency, rateRefresh, total]
  );
  const chargeTotal = formatCurrency(total, currency);
  const appointmentTime = appointmentDate(appointment);
  const displaySlot = appointmentTime
    ? appointmentTime.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
    : slot;

  const loadCards = useCallback(() => {
    healthclanApi.payments.cards()
      .then(items => {
        const nextCards = Array.isArray(items) ? items : [];
        setCards(nextCards);
        setSelectedMethod(current => current || nextCards.find((card: any) => card.isDefault)?._id || nextCards[0]?._id || '');
      })
      .catch(() => setCards([]));
  }, []);

  const loadAppointment = useCallback(() => {
    if (!appointmentId) return;

    setAppointmentLoading(true);
    healthclanApi.doctors.appointment(appointmentId)
      .then((payload: any) => {
        const nextAppointment = payload?.appointment || payload;
        setAppointment(nextAppointment);
        if (isExpiredPaymentAppointment(nextAppointment)) {
          setMessage('This appointment time has passed, so payment can no longer be completed. Please book a new slot.');
        }
        if (nextAppointment?.doctor) {
          setDoctor(formatDoctor(nextAppointment.doctor));
        }

        const doctorId = entityId(nextAppointment?.doctor) || firstParam(params.doctorId) || '';
        const serviceId = entityId(nextAppointment?.service);

        if (doctorId) {
          healthclanApi.doctors.byId(doctorId)
            .then((doctorPayload: any) => {
              const services = Array.isArray(doctorPayload?.services) ? doctorPayload.services : [];
              const pricedService = services.find((item: any) => entityId(item) === serviceId) || services[0];
              if (pricedService) setPricingQuote(pricedService);
            })
            .catch(() => null);
        }
      })
      .catch(error => setMessage(error instanceof Error ? error.message : 'Unable to load appointment.'))
      .finally(() => setAppointmentLoading(false));
  }, [appointmentId, params.doctorId]);

  useFocusEffect(
    useCallback(() => {
      setDisplayCurrency(getPreferredCurrency());
      loadBackendExchangeRates()
        .then(() => setRateRefresh(current => current + 1))
        .catch(() => null);
      loadCards();
      loadAppointment();
    }, [loadAppointment, loadCards])
  );

  async function completePayment() {
    if (loading) return;

    if (paid) {
      router.replace({
        pathname: '/video-call',
        params: { appointmentId, doctorId: doctor.id, slot, active: 'true' },
      } as any);
      return;
    }

    setMessage('');

    if (!appointmentId) {
      setMessage('Missing appointment details. Please book the appointment again.');
      return;
    }

    if (appointment?.status === 'requested') {
      setMessage('This appointment is still waiting for the doctor to accept it.');
      return;
    }

    if (appointment?.status === 'rejected') {
      setMessage('This appointment request was rejected. Please choose another doctor or time.');
      return;
    }

    if (isExpiredPaymentAppointment(appointment)) {
      setMessage('This appointment time has passed, so payment can no longer be completed. Please book a new slot.');
      return;
    }

    if (!selectedMethod) {
      setMessage('Select or add a payment card before paying.');
      return;
    }

    setLoading(true);

    try {
      const payload: any = await healthclanApi.payments.chargeSavedCard({
        cardId: selectedMethod,
        purpose: 'doctor_appointment',
        appointment: appointmentId,
        appointmentId,
      });
      if (payload?.appointment) setAppointment(payload.appointment);
      setPaid(true);
    } catch (error) {
      setMessage(paymentErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <Header title="Payment" backTo={`/book-appointment?doctorId=${doctor.id}&slot=${slot}`} />
      <View style={styles.wrap}>
        <Card>
          <Text style={styles.eyebrow}>Appointment checkout</Text>
          <Text style={styles.title}>{doctor.name}</Text>
          <Text style={styles.subtitle}>{service?.title || `${doctor.specialty} consultation`} | {displaySlot}</Text>
          {appointmentLoading ? <Text style={styles.loadingText}>Loading appointment details...</Text> : null}
        </Card>

        <View style={styles.summary}>
          <SummaryRow label="Amount to charge" value={chargeTotal} strong />
          {displayCurrency !== currency ? <SummaryRow label={`Estimated in ${displayCurrency}`} value={convertedTotal} /> : null}
        </View>

        <Pressable style={styles.currencyRow} onPress={() => router.push('/currency' as any)}>
          <Text style={styles.currencyText}>Currency: {displayCurrency}</Text>
          <Text style={styles.currencyAction}>Change</Text>
        </Pressable>

        <Text style={styles.sectionTitle}>Payment method</Text>
        {cards.map((card: any) => (
          <Pressable key={card._id} style={[styles.method, selectedMethod === card._id && styles.methodActive]} onPress={() => setSelectedMethod(card._id)}>
            <View style={styles.methodIcon}><Text style={styles.methodIconText}>{(card.brand || 'C').charAt(0)}</Text></View>
            <View style={styles.methodCopy}>
              <Text style={styles.methodTitle}>{card.brand || 'Card'} ending in {card.last4}</Text>
              <Text style={styles.methodMeta}>{card.isDefault ? 'Default card' : 'Saved card'}</Text>
            </View>
            <Text style={styles.methodStatus}>{selectedMethod === card._id ? 'Selected' : 'Use'}</Text>
          </Pressable>
        ))}

        <Pressable style={styles.addCard} onPress={() => router.push({ pathname: '/add-card', params: { returnTo: `/payment?doctorId=${doctor.id}&slot=${slot}&appointmentId=${appointmentId}`, purpose: 'appointment' } } as any)}>
          <Text style={styles.addCardText}>{cards.length ? 'Add another card' : 'Add payment card'}</Text>
        </Pressable>

        {!!message && <Text style={styles.errorText}>{message}</Text>}

        {isExpiredPaymentAppointment(appointment) ? (
          <Pressable style={styles.secondaryAction} onPress={() => router.replace('/specialties' as any)}>
            <Text style={styles.secondaryActionText}>Book a new slot</Text>
          </Pressable>
        ) : null}

        {paid ? (
          <View style={styles.success}>
            <Text style={styles.successTitle}>Payment successful</Text>
            <Text style={styles.successText}>Your appointment is confirmed. You can join the video room at the scheduled time.</Text>
          </View>
        ) : null}

        <PrimaryButton
          title={loading ? 'Processing...' : paid ? 'Open video room' : `Pay ${chargeTotal}`}
          onPress={completePayment}
          loading={loading}
          disabled={isExpiredPaymentAppointment(appointment)}
        />
      </View>
    </Screen>
  );
}

function SummaryRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={[styles.summaryLabel, strong && styles.summaryStrong]}>{label}</Text>
      <Text style={[styles.summaryValue, strong && styles.summaryStrong]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', maxWidth: pages.maxWidth, alignSelf: 'center', gap: 14 },
  eyebrow: { color: colors.teal, fontFamily: 'Poppins', fontSize: 12, fontWeight: '900' },
  title: { color: colors.ink, fontFamily: 'Poppins', fontSize: 20, fontWeight: '900', marginTop: 6 },
  subtitle: { color: colors.muted, fontFamily: 'Poppins', fontSize: 13, lineHeight: 19, fontWeight: '700', marginTop: 4 },
  loadingText: { color: colors.muted, fontFamily: 'Poppins', fontSize: 12, fontWeight: '700', marginTop: 8 },
  summary: { borderRadius: 18, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, padding: 14, gap: 10 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  summaryLabel: { color: colors.muted, fontFamily: 'Poppins', fontSize: 13, fontWeight: '800' },
  summaryValue: { color: colors.ink, fontFamily: 'Poppins', fontSize: 13, fontWeight: '900' },
  summaryStrong: { color: colors.teal, fontSize: 16 },
  sectionTitle: { color: colors.ink, fontFamily: 'Poppins', fontSize: 17, fontWeight: '900' },
  method: { minHeight: 76, borderRadius: 16, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  methodActive: { borderColor: 'rgba(8,81,97,0.42)' },
  methodIcon: { width: 46, height: 46, borderRadius: 16, backgroundColor: colors.panel, alignItems: 'center', justifyContent: 'center' },
  methodIconText: { color: colors.teal, fontFamily: 'Poppins', fontSize: 18, fontWeight: '900' },
  methodCopy: { flex: 1, minWidth: 0 },
  methodTitle: { color: colors.ink, fontFamily: 'Poppins', fontSize: 14, fontWeight: '900' },
  methodMeta: { color: colors.muted, fontFamily: 'Poppins', fontSize: 12, fontWeight: '700', marginTop: 4 },
  methodStatus: { color: colors.teal, fontFamily: 'Poppins', fontSize: 12, fontWeight: '900' },
  addCard: { minHeight: 48, borderRadius: 14, backgroundColor: colors.panel, alignItems: 'center', justifyContent: 'center' },
  addCardText: { color: colors.teal, fontFamily: 'Poppins', fontSize: 14, fontWeight: '900' },
  secondaryAction: { minHeight: 48, borderRadius: 14, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  secondaryActionText: { color: colors.teal, fontFamily: 'Poppins', fontSize: 14, fontWeight: '900' },
  currencyRow: { minHeight: 46, borderRadius: 14, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  currencyText: { color: colors.ink, fontFamily: 'Poppins', fontSize: 13, fontWeight: '800' },
  currencyAction: { color: colors.teal, fontFamily: 'Poppins', fontSize: 12, fontWeight: '900' },
  success: { borderRadius: 16, backgroundColor: 'rgba(17,162,111,0.12)', padding: 14 },
  successTitle: { color: '#11a26f', fontFamily: 'Poppins', fontSize: 14, fontWeight: '900' },
  successText: { color: colors.ink, fontFamily: 'Poppins', fontSize: 12, lineHeight: 18, fontWeight: '700', marginTop: 4 },
  errorText: { color: '#B42318', fontFamily: 'Poppins', fontSize: 12, fontWeight: '800', textAlign: 'center' },
});
