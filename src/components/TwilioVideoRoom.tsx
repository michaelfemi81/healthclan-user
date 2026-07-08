import { Text, View } from 'react-native';
import { colors } from '../constants/healthclanDesign';

export type TwilioVideoSession = {
  roomId: string;
  token: string;
  expiresAt?: string;
};

export function TwilioVideoRoom(_props: { session: TwilioVideoSession; onLeave: () => void }) {
  return (
    <View style={{ borderRadius: 18, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, padding: 16 }}>
      <Text style={{ color: colors.ink, fontFamily: 'Poppins', fontSize: 14, lineHeight: 20, fontWeight: '800', textAlign: 'center' }}>
        Video session is ready. Use HealthClan web to join this video visit until the native video module is added.
      </Text>
    </View>
  );
}
