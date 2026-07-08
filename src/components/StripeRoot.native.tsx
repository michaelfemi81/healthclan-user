import type { ReactNode } from 'react';
import { StripeProvider } from '@stripe/stripe-react-native';
import { appConfig } from '../lib/config';

export function StripeRoot({ children }: { children: ReactNode }) {
  if (!appConfig.stripePublishableKey) {
    return <>{children}</>;
  }

  return (
    <StripeProvider
      publishableKey={appConfig.stripePublishableKey}
      merchantIdentifier="merchant.com.healthclan.user"
      urlScheme="healthclanuser"
    >
      <>{children}</>
    </StripeProvider>
  );
}
