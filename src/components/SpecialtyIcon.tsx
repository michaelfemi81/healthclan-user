import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/healthclanDesign';
import type { SpecialtyName } from '../constants/doctors';

const iconMap: Record<SpecialtyName, { tint: string; soft: string }> = {
  Cardiology: { tint: '#D94A38', soft: '#FFE8E4' },
  Dermatology: { tint: '#C97839', soft: '#FFF0E3' },
  'General Medicine': { tint: colors.teal, soft: '#DFF4F8' },
  Gynecology: { tint: '#B24C86', soft: '#FFE4F3' },
  Oncology: { tint: '#6C5BD4', soft: '#ECE9FF' },
  Orthopedics: { tint: '#3F6FB5', soft: '#E4EEFF' },
  Ophthalmology: { tint: '#0E8CA8', soft: '#E1F8FC' },
  Dentistry: { tint: '#168F77', soft: '#E2F8F2' },
};

export function SpecialtyIcon({ name, size = 58 }: { name: SpecialtyName; size?: number }) {
  const icon = iconMap[name] ?? iconMap['General Medicine'];

  return (
    <View style={[styles.shell, { width: size, height: size, borderRadius: Math.round(size * 0.3), backgroundColor: icon.soft }]}>
      {renderSymbol(name, icon.tint, size)}
    </View>
  );
}

function renderSymbol(name: SpecialtyName, tint: string, size: number) {
  const markSize = Math.max(18, Math.round(size * 0.48));
  const line = Math.max(3, Math.round(size * 0.08));

  switch (name) {
    case 'Cardiology':
      return (
        <>
          <Text style={[styles.symbol, { color: tint, fontSize: markSize, lineHeight: markSize + 4 }]}>♥</Text>
          <View style={[styles.pulse, { backgroundColor: tint, height: line }]} />
        </>
      );
    case 'Dermatology':
      return (
        <View style={styles.cellCluster}>
          {[0, 1, 2, 3].map(index => (
            <View key={index} style={[styles.cell, { borderColor: tint, backgroundColor: index === 0 ? tint : 'transparent' }]} />
          ))}
        </View>
      );
    case 'General Medicine':
      return (
        <View style={styles.crossWrap}>
          <View style={[styles.crossBar, { backgroundColor: tint, width: size * 0.48, height: line }]} />
          <View style={[styles.crossStem, { backgroundColor: tint, width: line, height: size * 0.48 }]} />
        </View>
      );
    case 'Gynecology':
      return <Text style={[styles.symbol, { color: tint, fontSize: markSize, lineHeight: markSize + 4 }]}>♀</Text>;
    case 'Oncology':
      return (
        <View style={styles.ribbonWrap}>
          <Text style={[styles.symbol, { color: tint, fontSize: markSize + 2, lineHeight: markSize + 6 }]}>∞</Text>
          <View style={[styles.ribbonTail, { backgroundColor: tint, height: size * 0.32 }]} />
        </View>
      );
    case 'Orthopedics':
      return (
        <View style={styles.boneWrap}>
          <View style={[styles.boneShaft, { backgroundColor: tint, height: line, width: size * 0.42 }]} />
          {[styles.boneA, styles.boneB, styles.boneC, styles.boneD].map((style, index) => (
            <View key={index} style={[styles.boneEnd, style, { backgroundColor: tint, width: size * 0.18, height: size * 0.18, borderRadius: size * 0.09 }]} />
          ))}
        </View>
      );
    case 'Ophthalmology':
      return (
        <View style={[styles.eye, { borderColor: tint, width: size * 0.62, height: size * 0.34, borderRadius: size * 0.24 }]}>
          <View style={[styles.pupil, { backgroundColor: tint, width: size * 0.17, height: size * 0.17, borderRadius: size * 0.085 }]} />
        </View>
      );
    case 'Dentistry':
      return (
        <View style={[styles.tooth, { borderColor: tint, width: size * 0.38, height: size * 0.5 }]}>
          <View style={[styles.toothSplit, { backgroundColor: tint }]} />
        </View>
      );
    default:
      return <Text style={[styles.symbol, { color: tint, fontSize: markSize, lineHeight: markSize + 4 }]}>+</Text>;
  }
}

const styles = StyleSheet.create({
  shell: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  symbol: {
    fontFamily: 'Poppins',
    fontWeight: '900',
    textAlign: 'center',
  },
  pulse: {
    position: 'absolute',
    bottom: '24%',
    width: '42%',
    borderRadius: 99,
  },
  cellCluster: {
    width: '62%',
    height: '62%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cell: {
    width: '38%',
    height: '38%',
    borderRadius: 99,
    borderWidth: 2,
  },
  crossWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  crossBar: {
    position: 'absolute',
    borderRadius: 99,
  },
  crossStem: {
    borderRadius: 99,
  },
  ribbonWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ribbonTail: {
    position: 'absolute',
    bottom: '19%',
    width: 4,
    borderRadius: 99,
  },
  boneWrap: {
    width: '64%',
    height: '42%',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-18deg' }],
  },
  boneShaft: {
    borderRadius: 99,
  },
  boneEnd: {
    position: 'absolute',
  },
  boneA: { left: 0, top: 0 },
  boneB: { left: 0, bottom: 0 },
  boneC: { right: 0, top: 0 },
  boneD: { right: 0, bottom: 0 },
  eye: {
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-8deg' }],
  },
  pupil: {},
  tooth: {
    borderWidth: 3,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderBottomLeftRadius: 7,
    borderBottomRightRadius: 7,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  toothSplit: {
    position: 'absolute',
    left: '46%',
    bottom: 0,
    width: 2,
    height: '30%',
    borderRadius: 99,
  },
});
