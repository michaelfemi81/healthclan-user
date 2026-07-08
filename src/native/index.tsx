import React from 'react';
import { StatusBar, Platform, View, } from 'react-native';
import PropTypes from 'prop-types';
import { Provider } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PersistGate } from 'redux-persist/es/integration/react';
import Routes from './routes/index';
import Loading from './components/Loading';
if (Platform.OS === 'android') StatusBar.setHidden(false);


export default class App extends React.Component<{ store: any, persistor: any }> {
    onboard = false;
    loggedin = false;
    static propTypes = {
        store: PropTypes.shape({}).isRequired,
        persistor: PropTypes.shape({}).isRequired,
    }
    state = {
        dark: false, loaded: false

    };
    constructor(props: any) {
        super(props);
        this.state = { dark: props.store.getState().app.dark, loaded: false }

    }
    componentDidMount() {
        this.initAppState();
    }

    initAppState = async () => {
        const onboard = await AsyncStorage.getItem('onboard') ? true : false;
        let loggedin = false;
        const user_token = await AsyncStorage.getItem('user_token');

        if (user_token) {

            loggedin = true;


        }
        this.onboard = onboard;
        this.loggedin = loggedin;
        this.setState({
            loaded: true
        })
    }
    render() {
        let store = this.props.store;
        let persistor = this.props.persistor;
        return (
            <Provider store={store} >
                <PersistGate
                    loading={<Loading isDark={store.getState().app.dark} />}
                    persistor={persistor}
                >

                    {
                        this.state.loaded ?
                            <Routes loggedin={this.loggedin} onboard={this.onboard} store={store}
                                sceneStyle={{
                                    // backgroudColor:store.getState().app.dark?'#262938':'#fff'
                                }}

                            /> :
                            <Loading isDark={store.getState().app.dark} />
                    }


                </PersistGate>
            </Provider>
        );
    }
}



//exp build:android
//exp build:ios
