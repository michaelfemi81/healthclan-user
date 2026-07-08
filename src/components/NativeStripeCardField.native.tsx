import { StyleSheet } from 'react-native';
import { CardField, useConfirmSetupIntent } from '@stripe/stripe-react-native';
import { colors } from '../constants/healthclanDesign';

const stripeFieldBg = '#D9F7FA';

export function useNativeSetupIntent() {
  const { confirmSetupIntent } = useConfirmSetupIntent();
  return confirmSetupIntent;
}

export function NativeStripeCardField({ onCompleteChange }: { onCompleteChange: (complete: boolean) => void }) {
  return (
    <CardField
      postalCodeEnabled={false}
      placeholders={{ number: '4242 4242 4242 4242', expiration: 'MM/YY', cvc: 'CVC' }}
      cardStyle={{
        backgroundColor: stripeFieldBg,
        borderRadius: 12,
        fontSize: 15,
        placeholderColor: colors.muted,
        textColor: colors.ink,
        textErrorColor: '#B42318',
      }}
      style={styles.field}
      onCardChange={(details) => onCompleteChange(Boolean(details.complete))}
    />
  );
}

const styles = StyleSheet.create({
  field: { minHeight: 52, borderRadius: 12, backgroundColor: stripeFieldBg },
});
