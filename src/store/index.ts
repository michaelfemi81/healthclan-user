/* global window */
import { StoreCreator, applyMiddleware, compose } from 'redux';
import { configureStore } from '@reduxjs/toolkit'
import { persistStore, persistCombineReducers } from 'redux-persist';
//import storage from 'redux-persist/es/storage'; // default: localStorage if web, AsyncStorage if react-native
import { thunk } from 'redux-thunk';
import reducers from '../reducers';
import AsyncStorage from '@react-native-async-storage/async-storage';
//import { init as websocketInit, emit, connect } from '../actions/websocket'

// Redux Persist config
const config = {
    key: 'root-popin',
    storage: AsyncStorage,
    timeout: 10000,
    blacklist: ['status'],
};

const reducer = persistCombineReducers(config, reducers);

const middleWare: any = applyMiddleware(thunk);


export const store = configureStore({
    reducer: reducer,
    // window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__(),
    middleware: compose(middleWare),
});

export const persistor = persistStore(
    store,
    null,
    () => { store.getState(); },
);


// Get the type of our store variable
export type AppStore = typeof store
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<AppStore['getState']>
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = AppStore['dispatch']
