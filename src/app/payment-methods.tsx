import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card, Header, PrimaryButton, Screen } from '../components/HealthClanUI';
import { colors, pages } from '../constants/healthclanDesign';
import { healthclanApi } from '../lib/api';

type PaymentCard = {
  id: string;
  brand: string;
  last4: string;
  expiry: string;
  isDefault: boolean;
};

export default function PaymentMethods() {
  const params = useLocalSearchParams();
  const addedCard = typeof params.cardSaved === 'string' && params.cardSaved === 'true';
  const addedBrand = typeof params.cardBrand === 'string' ? params.cardBrand : 'Visa';
  const addedLast4 = typeof params.last4 === 'string' ? params.last4 : '4242';
  const [cards, setCards] = useState<PaymentCard[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const loadCards = useCallback(() => {
    setLoading(true);
    setMessage('');
    healthclanApi.payments.cards()
      .then(items => setCards(items.map((card: any) => ({
        id: card._id,
        brand: card.brand || 'Card',
        last4: card.last4,
        expiry: `${card.expMonth || '--'}/${card.expYear || '--'}`,
        isDefault: Boolean(card.isDefault),
      }))))
      .catch(error => {
        setCards([]);
        setMessage(error instanceof Error ? error.message : 'Unable to load payment methods.');
      })
      .finally(() => setLoading(false));
  }, [addedBrand, addedCard, addedLast4]);

  useFocusEffect(loadCards);

  function setDefault(cardId: string) {
    if (!cardId) return;

    setCards(current => current.map(card => ({ ...card, isDefault: card.id === cardId })));
    healthclanApi.payments.setDefaultCard(cardId).catch(() => loadCards());
  }

  return (
    <Screen>
      <Header title="Payment Methods" backTo="/settings" />
      <View style={styles.wrap}>
        <Card>
          <Text style={styles.title}>Cards and billing</Text>
          <Text style={styles.subtitle}>Use saved cards for appointments and video consultations. Your default card is selected automatically at checkout.</Text>
        </Card>

        {!!message && <Text style={styles.error}>{message}</Text>}
        {loading ? <Text style={styles.loading}>Loading payment methods...</Text> : null}
        {cards.map(card => (
          <Pressable key={card.id} style={[styles.cardRow, card.isDefault && styles.cardRowActive]} onPress={() => setDefault(card.id)}>
            <View style={styles.cardIcon}>
              <Text style={styles.cardIconText}>{card.brand.charAt(0)}</Text>
            </View>
            <View style={styles.cardCopy}>
              <Text style={styles.cardTitle}>{card.brand} ending in {card.last4}</Text>
              <Text style={styles.cardMeta}>{card.expiry} {card.isDefault ? '| Default card' : '| Tap to set default'}</Text>
            </View>
            <Text style={[styles.badge, card.isDefault && styles.badgeActive]}>{card.isDefault ? 'Default' : 'Use'}</Text>
          </Pressable>
        ))}

        {!loading && cards.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No saved cards yet</Text>
            <Text style={styles.emptySub}>Add a payment card to make appointment checkout faster.</Text>
          </View>
        ) : null}

        <PrimaryButton title="Add new card" onPress={() => router.push('/add-card' as any)} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', maxWidth: pages.maxWidth, alignSelf: 'center', gap: 12 },
  title: { color: colors.ink, fontFamily: 'Poppins', fontSize: 18, fontWeight: '900' },
  subtitle: { color: colors.muted, fontFamily: 'Poppins', fontSize: 13, lineHeight: 20, fontWeight: '700', marginTop: 6 },
  cardRow: { minHeight: 78, borderRadius: 16, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardRowActive: { borderColor: 'rgba(8,81,97,0.38)' },
  cardIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: colors.panel, alignItems: 'center', justifyContent: 'center' },
  cardIconText: { color: colors.teal, fontFamily: 'Poppins', fontSize: 18, fontWeight: '900' },
  cardCopy: { flex: 1, minWidth: 0 },
  cardTitle: { color: colors.ink, fontFamily: 'Poppins', fontSize: 14, fontWeight: '900' },
  cardMeta: { color: colors.muted, fontFamily: 'Poppins', fontSize: 12, fontWeight: '700', marginTop: 4 },
  badge: { color: colors.teal, fontFamily: 'Poppins', fontSize: 12, fontWeight: '900' },
  badgeActive: { color: '#11a26f' },
  empty: { borderRadius: 18, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, padding: 18, alignItems: 'center' },
  emptyTitle: { color: colors.ink, fontFamily: 'Poppins', fontSize: 16, fontWeight: '900', textAlign: 'center' },
  emptySub: { color: colors.muted, fontFamily: 'Poppins', fontSize: 12, lineHeight: 18, fontWeight: '700', textAlign: 'center', marginTop: 4 },
  error: { color: '#B42318', fontFamily: 'Poppins', fontSize: 12, fontWeight: '800', textAlign: 'center' },
  loading: { color: colors.muted, fontFamily: 'Poppins', fontSize: 12, fontWeight: '800', textAlign: 'center' },
});
