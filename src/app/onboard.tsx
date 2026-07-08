import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, FlatList, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from '../components/HealthClanUI';
import { colors, pages } from '../constants/healthclanDesign';
import { completeOnboarding, isAuthenticated } from '../constants/session';

const slides = [
  {
    title: 'Choose your doctor',
    sub: 'Find trusted clinicians by specialty, experience, and availability.',
    image: require('../../assets/images/choose.png'),
  },
  {
    title: 'Start a video visit',
    sub: 'Join secure face-to-face appointments from wherever you are.',
    image: require('../../assets/images/call.png'),
  },
  {
    title: 'Request a carer',
    sub: 'Get practical home support and companionship when you need it.',
    image: require('../../assets/images/carer.png'),
  },
];

export default function Onboard() {
  const { width, height } = useWindowDimensions();
  const list = useRef<FlatList<(typeof slides)[number]>>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const [index, setIndex] = useState(0);
  const isWide = width >= 760;
  const isShort = height < 720;
  const carouselWidth = Math.min(width - 36, isWide ? 980 : pages.maxWidth);

  useEffect(() => {
    if (isAuthenticated()) {
      router.replace('/');
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      const next = (index + 1) % slides.length;
      list.current?.scrollToOffset({ offset: next * carouselWidth, animated: true });
      setIndex(next);
    }, 3600);
    return () => clearInterval(timer);
  }, [carouselWidth, index]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={[styles.wrap, isWide && styles.wrapWide]}>
        <View style={[styles.shell, { width: carouselWidth }, isWide && styles.shellWide, isShort && styles.shellShort]}>
        <View style={styles.top}>
          <Text style={styles.brand}>HealthClan</Text>
          <Pressable
            onPress={() => {
              completeOnboarding();
              router.replace('/sign-in' as any);
            }}
          >
            <Text style={styles.signIn}>Sign in</Text>
          </Pressable>
        </View>

        <Animated.FlatList
          ref={list}
          horizontal
          pagingEnabled
          style={[styles.carousel, { width: carouselWidth }]}
          data={slides}
          keyExtractor={item => item.title}
          showsHorizontalScrollIndicator={false}
          getItemLayout={(_, itemIndex) => ({ length: carouselWidth, offset: carouselWidth * itemIndex, index: itemIndex })}
          onMomentumScrollEnd={event => setIndex(Math.round(event.nativeEvent.contentOffset.x / carouselWidth))}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: false })}
          renderItem={({ item, index: itemIndex }) => (
            <View style={[styles.slide, { width: carouselWidth }]}>
              <View style={[styles.slideInner, isWide && styles.slideInnerWide]}>
                <View style={[styles.imagePanel, isWide && styles.imagePanelWide, isShort && styles.imagePanelShort]}>
                  <View style={styles.step}>
                    <Text style={styles.stepText}>Step {itemIndex + 1}</Text>
                  </View>
                  <Image source={item.image} style={styles.image} contentFit="contain" />
                </View>
                <View style={[styles.copy, isWide && styles.copyWide]}>
                  <Text style={[styles.title, isWide && styles.titleWide]}>{item.title}</Text>
                  <Text style={[styles.sub, isWide && styles.subWide]}>{item.sub}</Text>
                </View>
              </View>
            </View>
          )}
        />

        <View style={styles.bottom}>
          <View style={styles.dots}>
            {slides.map((item, dotIndex) => (
              <View key={item.title} style={[styles.dot, index === dotIndex && styles.dotActive]} />
            ))}
          </View>
          <PrimaryButton
            title="Get Started"
            onPress={() => {
              completeOnboarding();
              router.replace('/create-account' as any);
            }}
          />
          <Pressable
            style={styles.secondary}
            onPress={() => {
              completeOnboarding();
              router.replace('/sign-in' as any);
            }}
          >
            <Text style={styles.secondaryText}>Already have an account</Text>
          </Pressable>
        </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg, paddingHorizontal: 18, paddingVertical: 14 },
  wrapWide: { paddingVertical: 28 },
  shell: { flex: 1, maxHeight: 820, alignItems: 'center', justifyContent: 'center' },
  shellWide: {
    flex: 0,
    minHeight: 620,
    maxHeight: 700,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.34)',
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 22,
    paddingVertical: 18,
  },
  shellShort: { maxHeight: 660 },
  top: { width: '100%', minHeight: 54, paddingHorizontal: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { color: colors.teal, fontFamily: 'Poppins', fontSize: 22, fontWeight: '900' },
  signIn: { color: colors.teal, fontFamily: 'Poppins', fontSize: 14, fontWeight: '900' },
  carousel: { flexGrow: 0, flexShrink: 1 },
  slide: { alignItems: 'center', justifyContent: 'center' },
  slideInner: { width: '100%', alignItems: 'center', paddingHorizontal: 20 },
  slideInnerWide: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 34, paddingHorizontal: 18 },
  imagePanel: { width: '100%', aspectRatio: 1.1, maxHeight: 390, borderRadius: 28, backgroundColor: colors.panel, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: 22 },
  imagePanelWide: { flex: 1, width: 'auto', maxWidth: 440, marginBottom: 0 },
  imagePanelShort: { maxHeight: 300 },
  step: { position: 'absolute', top: 18, left: 18, borderRadius: 999, backgroundColor: 'rgba(19,202,214,0.18)', paddingHorizontal: 14, paddingVertical: 8 },
  stepText: { color: colors.teal, fontFamily: 'Poppins', fontWeight: '900', fontSize: 12 },
  image: { width: '72%', height: '72%' },
  copy: { width: '100%', alignItems: 'center' },
  copyWide: { flex: 1, alignItems: 'flex-start', maxWidth: 390 },
  title: { color: colors.ink, fontFamily: 'Poppins', fontSize: 28, lineHeight: 34, fontWeight: '900', textAlign: 'center' },
  titleWide: { fontSize: 36, lineHeight: 44, textAlign: 'left' },
  sub: { color: colors.muted, fontFamily: 'Poppins', fontSize: 15, lineHeight: 23, fontWeight: '700', textAlign: 'center', marginTop: 10 },
  subWide: { fontSize: 16, lineHeight: 25, textAlign: 'left' },
  bottom: { width: '100%', maxWidth: pages.maxWidth, paddingHorizontal: 20, paddingBottom: 4, gap: 14 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 12, marginBottom: 2 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: 'rgba(8,81,97,0.2)' },
  dotActive: { width: 28, backgroundColor: colors.teal },
  secondary: { minHeight: 34, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { color: colors.teal, fontFamily: 'Poppins', fontSize: 13, fontWeight: '900' },
});
