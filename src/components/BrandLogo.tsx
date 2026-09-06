import { Image, Text, View } from 'react-native';

/** Shared artwork and sizing for native and web surfaces. */
export function BrandLogo({ compact = false, size, showRole = false }: { compact?: boolean; size?: number; showRole?: boolean }) {
  const dimension = size ?? (compact ? 40 : 112);
  return (
    <View style={{ alignItems: 'center', flexShrink: 0 }}>
      <Image
        source={compact ? require('../../assets/brand/mark-256.png') : require('../../assets/brand/logo-512.png')}
        accessibilityLabel="Careful Carers"
        resizeMode="contain"
        style={{ width: dimension, height: dimension, borderRadius: compact ? 8 : 12, backgroundColor: '#FFFFFF' }}
      />
      {showRole && <Text style={{ color: '#2C2A73', backgroundColor: '#FFFFFF', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, fontSize: 11, fontWeight: '700', marginTop: 4 }}>User</Text>}
    </View>
  );
}
