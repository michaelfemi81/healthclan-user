import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRouter } from 'expo-router';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from '../../i18n/useTranslation';
const grad1 = '#085161'
const grad2 = '#11a2c1';
const TopBar = () => {
    const navigation = useNavigation();
    const router = useRouter();
    const { t } = useTranslation();
    return (
        <View style={style.bar}>
            <View style={{ width: 90, height: 27, flexDirection: 'row', alignContent: 'space-between', justifyContent: 'space-between' }} >
                <TouchableOpacity style={style.profile}
                    onPress={() => router.push('/notifications' as any)}
                >
                    <Ionicons name="notifications-outline" size={20} color="#252525" />

                    <LinearGradient
                        start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} colors={[grad1, grad2]}
                        locations={[0.196, 1]}
                        style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#33E4DB', position: 'absolute', top: 5, right: 5 }}
                    ></LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity style={style.profile}
                    onPress={() => router.push('/settings' as any)}
                >
                    <Ionicons name="cog" size={20} color="#252525" />

                </TouchableOpacity>
                <TouchableOpacity style={style.profile}
                    onPress={() => router.push({
                        pathname: '/eachspec' as any,
                        params: {
                            id: 123,
                            name: 'All Doctors',
                        },
                    })}
                >
                    <Ionicons name="search" size={20} color="#252525" />
                </TouchableOpacity>
            </View>
            <View style={{ width: 151, height: 31, flexDirection: 'row', alignContent: 'space-between', justifyContent: 'space-between' }} >
                <View style={{ width: 121, height: 31, borderRadius: 15.5, flexDirection: 'column', alignContent: 'space-between', justifyContent: 'space-between', paddingRight: 8 }} >
                    <Text style={style.wel}>
                        {t('Hi, Welcome Back')}
                    </Text>
                    <Text style={style.name}>
                        HealthClan User
                    </Text>

                </View>
                <TouchableOpacity
                    onPress={() => router.push('/editprofile' as any)}
                    style={{ width: 31, height: 31, borderRadius: 15.5, backgroundColor: '#000', flexDirection: 'row', alignContent: 'space-between', justifyContent: 'space-between' }} >
                    <Image
                        source={require('../../../assets/images/default-doctor-illustration.png')}
                        style={{ width: 31, height: 31, }}
                    // resizeMethod='scale'

                    />
                    <TouchableOpacity style={style.edit}
                        onPress={() => router.push('/editprofile' as any)}
                    >
                        <Ionicons name="pencil-outline" size={10} color="#252525" />
                    </TouchableOpacity>
                </TouchableOpacity>
            </View>

        </View>
    )
}
const style = StyleSheet.create({
    bar: {
        width: '100%',
        height: 31,
        maxHeight: 31,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 30,
        marginTop: 20
    },
    profile: {
        width: 27,
        height: 27,
        maxWidth: 27,
        borderRadius: 13.5,
        backgroundColor: '#E2EAFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    edit: {
        width: 13,
        height: 13,
        maxWidth: 13,
        borderRadius: 6.5,
        backgroundColor: '#E2EAFF',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'absolute',
        bottom: -6.5,
        right: 0,

    },
    menu: {
        width: 30,
        height: 30,

    },
    wel: {
        textAlign: 'right', color: grad1, fontSize: 13, width: '100%',
        fontFamily: 'Poppinsht', fontWeight: '200'

    },
    name: {
        color: '#252525', fontSize: 14, width: '100%',
        fontFamily: 'Poppinsht', fontWeight: '200', textAlign: 'right'

    },

})
export default TopBar
