import React from 'react';
import PropTypes from 'prop-types';
import {Dimensions, ScrollView,View, Image, Platform, PixelRatio, StyleSheet, ListView, TouchableOpacity, Text} from 'react-native';
import { Actions } from 'react-native-router-flux';
const { width, height } = Dimensions.get('window');
import LinearGradient from 'react-native-linear-gradient';


//import ExtraDimensions from 'react-native-extra-dimensions-android'
if (Platform.OS === 'android'){
 // height = ExtraDimensions.get('REAL_WINDOW_HEIGHT');
}


class Nav extends React.Component {

  componentDidMount() {
   // console.log(this.props)
   // console.log(this.props.getLabelText())
  //
  }
  

constructor(props) {
super(props);

}

componentWillUnmount() {
 // FingerprintScanner.release();
}

componentWillReceiveProps(props){
//
}

render() {
  



return (
  
);
}
}


export default Nav;
