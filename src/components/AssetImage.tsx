import { Image as RNImage, ImageSourcePropType, ImageStyle, Platform, StyleProp, StyleSheet, View } from 'react-native';

function getAssetUri(source: ImageSourcePropType) {
  if (typeof source === 'object' && source !== null && !Array.isArray(source) && 'uri' in source) {
    return source.uri;
  }

  return undefined;
}

export function AssetImage({
  source,
  style,
  resizeMode = 'contain',
}: {
  source: ImageSourcePropType;
  style?: StyleProp<ImageStyle>;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
}) {
  if (Platform.OS === 'web') {
    const uri = getAssetUri(source);
    const backgroundSize = resizeMode === 'stretch' ? '100% 100%' : resizeMode === 'center' ? 'auto' : resizeMode;

    return (
      <View
        style={[
          style,
          {
            backgroundImage: uri ? `url("${uri}")` : undefined,
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundSize,
          } as ImageStyle,
        ]}
      />
    );
  }

  return <RNImage source={source} style={style} resizeMode={resizeMode} />;
}
