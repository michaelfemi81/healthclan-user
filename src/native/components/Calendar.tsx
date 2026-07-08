import Ionicons from '@expo/vector-icons/Ionicons';
import { getAppWidth } from '../../global/responsive';
import React, { useEffect, useRef, useState } from 'react';
import {
    FlatList,
    Platform,
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const width = getAppWidth();
const DAY_WIDTH = (width - 40) / 7; // smaller → allows scrolling + centering
const grad1 = '#085161'
const grad2 = '#11a2c1';
type CalendarAppointment = {
    id: string;
    doctor: string;
    time: string;
    status: string;
};
const appointments: CalendarAppointment[] = [];
// Generate a range of days around a base date
const generateDays = (baseDate, range = 10) => {
    const days = [];
    for (let i = -range; i <= range; i++) {
        const d = new Date(baseDate);
        d.setDate(baseDate.getDate() + i);
        days.push(d);
    }
    return days;
};

export default function WeekCalendar() {
    const listRef = useRef(null);
    const appointmentsRef = useRef<ScrollView>(null);
    const appointmentsOffsetRef = useRef(0);

    const [selectedDate, setSelectedDate] = useState(new Date());
    const [days, setDays] = useState(generateDays(new Date()));

    // Center selected day
    const centerIndex = Math.floor(days.length / 2);

    useEffect(() => {
        setTimeout(() => {
            listRef.current?.scrollToIndex({
                index: centerIndex,
                animated: false,
            });
        }, 0);
    }, []);

    const centerDay = (index) => {
        listRef.current?.scrollToIndex({
            index,
            animated: true,
            viewPosition: 0.5, // 👈 centers it perfectly
        });
    };

    const handleSelect = (date, index) => {
        setSelectedDate(date);
        centerDay(index);
    };

    const goToNext = () => {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() + 7);

        const newDays = generateDays(newDate);
        setDays(newDays);
        setSelectedDate(newDate);

        setTimeout(() => {
            centerDay(Math.floor(newDays.length / 2));
        }, 50);
    };

    const goToPrev = () => {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() - 7);

        const newDays = generateDays(newDate);
        setDays(newDays);
        setSelectedDate(newDate);

        setTimeout(() => {
            centerDay(Math.floor(newDays.length / 2));
        }, 50);
    };

    const isToday = (date) =>
        date.toDateString() === new Date().toDateString();

    const isSelected = (date) =>
        date.toDateString() === selectedDate.toDateString();

    const renderItem = ({ item, index }) => (
        <TouchableOpacity
            onPress={() => handleSelect(item, index)}
            activeOpacity={0.7}
            style={{
                width: DAY_WIDTH,
                alignItems: 'center',
                paddingVertical: 10,
                borderRadius: 20,
            }}
        >


            <View
                style={{
                    marginTop: 6,
                    width: 40,
                    height: 64,
                    borderRadius: 20,
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderWidth: isSelected(item) ? 0 : 2,
                    borderColor: '#fff',
                    backgroundColor: isSelected(item)
                        ? '#FFF'
                        : isToday(item)
                            ? 'grey'
                            : 'transparent',
                }}
            >
                <Text
                    style={{
                        fontWeight: 'bold',
                        color: isSelected(item) ? grad1 : '#fff',
                    }}
                >
                    {item.getDate()}
                </Text>
                <Text style={{ fontSize: 12, color: isSelected(item) ? grad1 : '#fff' }}>
                    {item.toLocaleDateString('en-US', { weekday: 'short' })}
                </Text>
            </View>

        </TouchableOpacity>
    );

    const appointmentScrollProps = Platform.OS === 'web'
        ? {
            onWheel: (event) => {
                event.preventDefault();
                appointmentsOffsetRef.current = Math.max(0, appointmentsOffsetRef.current + event.deltaY);
                appointmentsRef.current?.scrollTo({
                    y: appointmentsOffsetRef.current,
                    animated: false,
                });
            },
        }
        : {};

    return (
        <View style={{ paddingVertical: 10, paddingHorizontal: 20 }}>

            {/* Header with buttons */}
            <View
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingHorizontal: 10,
                    marginBottom: 10,
                }}
            >
                <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={goToPrev}
                    style={{
                        position: 'absolute',
                        top: 66,
                        left: -8,
                        zIndex: 1,
                        width: 34,
                        height: 34,
                        borderRadius: 17,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'rgba(255,255,255,0.18)',
                        borderWidth: 1,
                        borderColor: 'rgba(255,255,255,0.28)',
                    }}
                >
                    <Ionicons name="chevron-back" size={22} color="#fff" />
                </TouchableOpacity>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#fff' }}>
                    Upcoming Appointments
                </Text>

                <Text style={{ fontSize: 16, fontWeight: '600', color: '#fff' }}>
                    {selectedDate.toLocaleDateString('en-US', {
                        month: 'long',
                        year: 'numeric',
                    })}
                </Text>

                <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={goToNext}
                    style={{
                        position: 'absolute',
                        top: 66,
                        right: -8,
                        zIndex: 10,
                        width: 34,
                        height: 34,
                        borderRadius: 17,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'rgba(255,255,255,0.18)',
                        borderWidth: 1,
                        borderColor: 'rgba(255,255,255,0.28)',
                    }}
                >
                    <Ionicons name="chevron-forward" size={22} color="#fff" />
                </TouchableOpacity>

            </View>
            <View style={{
                height: 1,
                backgroundColor: '#E2EAFF',
                marginVertical: 3,
                width: width - 48,
            }} />
            {/* Days List */}
            <FlatList
                ref={listRef}
                data={days}
                keyExtractor={(_, i) => i.toString()}
                horizontal
                showsHorizontalScrollIndicator={false}
                renderItem={renderItem}
                snapToInterval={DAY_WIDTH}
                decelerationRate="fast"
                getItemLayout={(_, index) => ({
                    length: DAY_WIDTH,
                    offset: DAY_WIDTH * index,
                    index,
                })}
            />
            <View style={{ height: 128, width: width - 40, borderColor: '#E2EAFF', borderWidth: 1, borderRadius: 20, marginTop: 10, alignItems: 'center', justifyContent: 'flex-start', overflow: 'hidden' }}>
                <ScrollView
                    ref={appointmentsRef}
                    nestedScrollEnabled
                    style={{ width: '100%', flex: 1 }}
                    contentContainerStyle={{ padding: 12 }}
                    showsVerticalScrollIndicator
                    bounces
                    scrollEventThrottle={16}
                    onScroll={event => {
                        appointmentsOffsetRef.current = event.nativeEvent.contentOffset.y;
                    }}
                    {...appointmentScrollProps}
                >

                    {!appointments.length ? (
                        <View style={{ minHeight: 94, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 }}>
                            <Text style={{ fontSize: 14, fontWeight: '800', color: '#fff', textAlign: 'center' }}>
                                No upcoming appointments
                            </Text>
                            <Text style={{ fontSize: 11, lineHeight: 16, fontWeight: '600', color: 'rgba(255,255,255,0.78)', textAlign: 'center', marginTop: 4 }}>
                                Your scheduled visits will appear here when they are available.
                            </Text>
                        </View>
                    ) : appointments.map((appointment) => {
                        const online = appointment.status === 'Online';

                        return (
                            <View
                                key={appointment.id}
                                style={{
                                    minHeight: 34, paddingHorizontal: 6, flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between',

                                    borderRadius: 12, width: '100%',
                                }}
                            >

                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' }} >
                                    <View style={{ flexDirection: 'row', alignItems: 'center', width: 66 }}>
                                        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: online ? '#35D07F' : '#AEB8C2', marginRight: 6 }} />
                                        <Text style={{ fontSize: 10, fontWeight: '700', color: '#fff' }}>
                                            {appointment.status}
                                        </Text>
                                    </View>
                                    <Text style={{ fontSize: 12, color: '#fff' }}>
                                        {appointment.time}
                                    </Text>
                                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff', maxWidth: width - 210 }} numberOfLines={1}>
                                        {appointment.doctor}
                                    </Text>

                                </View>
                                <View style={{ width: '100%', height: 1, backgroundColor: '#E2EAFF', marginVertical: 3 }} />


                            </View>

                        );
                    })}
                </ScrollView>

            </View>
        </View>
    );
}
