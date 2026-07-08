import { Dimensions, Platform } from 'react-native';

export const WEB_APP_WIDTH = 430;

export function getAppWidth() {
    const { width } = Dimensions.get('window');
    return Platform.OS === 'web' ? Math.min(width, WEB_APP_WIDTH) : width;
}
