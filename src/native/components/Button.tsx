import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useCallback } from 'react';
import {
    Pressable,
    StyleSheet
} from 'react-native';
import Animated, {
    useAnimatedStyle,
    withSpring,
    withTiming,
} from 'react-native-reanimated';

import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
type Props = {
    currentIndex: any;
    length: number;
    flatListRef: any;
};
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const grad1 = '#085161'
const grad2 = '#11a2c1';

const Button = ({ currentIndex, length, flatListRef }: Props) => {
    const router = useRouter();
    const rnBtnStyle = useAnimatedStyle(() => {
        return {
            width:
                currentIndex.value === length - 1 ? withSpring(140) : withSpring(60),
            height: 60,
        };
    }, [currentIndex, length]);

    const rnTextStyle = useAnimatedStyle(() => {
        return {
            opacity:
                currentIndex.value === length - 1 ? withTiming(1) : withTiming(0),
            transform: [
                {
                    translateX:
                        currentIndex.value === length - 1 ? withTiming(0) : withTiming(100),
                },
            ],
        };
    }, [currentIndex, length]);

    const imageAnimatedStyle = useAnimatedStyle(() => {
        return {
            opacity:
                currentIndex.value !== length - 1 ? withTiming(1) : withTiming(0),
            transform: [
                {
                    translateX:
                        currentIndex.value !== length - 1 ? withTiming(0) : withTiming(100),
                },
            ],
        };
    }, [currentIndex, length]);

    const onPress = useCallback(() => {
        if (currentIndex.value === length - 1) {
            router.replace('/create-account' as any);
            return;
        } else {
            flatListRef?.current?.scrollToIndex({
                index: currentIndex.value + 1,
            });
        }
    }, []);
    return (
        <LinearGradient
            start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} colors={[grad1, grad2]}
            locations={[0.196, 1]}
            style={[styles.container, {
                flex: 1,

            }]}
        >
            <AnimatedPressable style={[styles.container, rnBtnStyle]} onPress={onPress}>
                <Animated.Text style={[styles.textStyle, rnTextStyle]}>
                    Get Started
                </Animated.Text>
                <Animated.View style={[styles.imageStyle, imageAnimatedStyle]}>
                    <Ionicons name="chevron-forward" size={24} color="white" />
                </Animated.View>
            </AnimatedPressable>
        </LinearGradient>

    );
};

export default Button;

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        paddingHorizontal: 24,
        paddingVertical: 16,
        borderRadius: 100,
        //  backgroundColor: '#33E4DB',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        maxHeight: 60,
    },
    textStyle: {
        fontFamily: 'Poppins',
        color: 'white',
        position: 'absolute',
        fontWeight: '900',
        fontSize: 24,
    },
    imageStyle: {
        width: 45,
        height: 45,
        lineHeight: 60,
        marginTop: 15,
        marginLeft: 15,
        position: 'absolute',
    },
});
