import React from 'react';
import PropTypes from 'prop-types';
import {Dimensions, ScrollView,View, Image, Platform, PixelRatio, StyleSheet, ListView, StatusBar,TouchableOpacity, Text, Keyboard} from 'react-native';
import { Actions } from 'react-native-router-flux';
const { width, height } = Dimensions.get('window');
import Icon from 'react-native-vector-icons/Ionicons';
import { connect } from 'react-redux'
import { ifIphoneX } from 'react-native-iphone-x-helper'


//import ExtraDimensions from 'react-native-extra-dimensions-android'
if (Platform.OS === 'android'){
 // height = ExtraDimensions.get('REAL_WINDOW_HEIGHT');
}


class Side extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      keyb: false
    };
  
  } 
  componentDidMount() {
    this.keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', this._keyboardDidShow)
    this.keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', this._keyboardDidHide)
  }
  componentWillUnmount () {
    this.keyboardDidShowListener.remove();
    this.keyboardDidHideListener.remove();
  }
  _keyboardDidShow =() =>{
    this.setState({
      keyb: true
    })
  }

  _keyboardDidHide =()=> {
    this.setState({
      keyb: false
    })
  }
  

render() {
  


if(!this.state.keyb){
  return (
    
 <View style={{width: '100%', 
 ...ifIphoneX({
  height:90
}, {
  height:80
})
 }}>
  <StatusBar
     backgroundColor={this.props.app.dark?'#262938':'#fff'}
     barStyle={this.props.app.dark?"light-content":"dark-content"}
   />
  {/** 
   !(this.props.navigation.state.index===2 &&this.props.navigation.state.routeName==='tabbar') ?
 <TouchableOpacity
     style={{width: 49, height: 49, backgroundColor:'#00ECCA',zIndex:100,borderRadius:24.5 ,position:'absolute',
     left: width/2 - 24.5,
     ...ifIphoneX({
      bottom: 73,
    }, {
      bottom: 63,
    })
     }}
     onPress={()=>{
       Actions.add({direction:'none' })
     }}
     >
  
  <Icon name="md-add" style={{color:'#fff'
       , fontSize:33, lineHeight:49, textAlign:'center'}} >

       </Icon>
     </TouchableOpacity>:  
 <LinearGradient
 start={{x: 0, y: 0}} end={{x: 0, y: 1}} colors={['#5D6CFF', '#9C57F3',]}
 locations={[0.196,1]}
    style={{width: 49, height: 49,
     backgroundColor:'#00ECCA', zIndex:100, borderRadius:24.5 , 
     position:'absolute',
       left: width/2 - 24.5, 
       ...ifIphoneX({
        bottom: 73,
      }, {
        bottom: 63,
      })
       }}>
 <TouchableOpacity
     style={{width: 49, height: 49,
     }}>
  
  <Icon name="md-add" style={{color:'#fff'
       , fontSize:33, lineHeight:49, textAlign:'center'}} >

       </Icon>
     </TouchableOpacity>
 </LinearGradient>
 
 
    **/}
     <View style={{width: '100%',  backgroundColor:this.props.app.dark?'#262938':'#fff', 
       height:'100%'
 }}>
   
       

 
 
 
  <View style={{ backgroundColor: this.props.app.dark?'#2E2F40':'#f2f2f2', height:64 , width:'95%',position:'absolute', borderWidth:1,paddingHorizontal:20,
   borderColor: this.props.app.dark?'#262938':'#fff',
   left: '2.5%',  borderRadius: 10, zIndex:1,flex:1, justifyContent:'space-between',alignItems:'center', flexDirection:'row',
   // shadowColor:'rgba(49, 49, 63, 0.5)',
   shadowOffset: { width: 0, height: 4 },
   shadowOpacity: 0.1,
   elevation:5,
   shadowRadius: 2,
   ...ifIphoneX({
   bottom:26
  }, {
    bottom:16
  })
 }}>
 <TouchableOpacity
     style={{width: '20%', height: '100%', alignItems:'center', flex:1,justifyContent:'center', maxWidth:'20%'
     }}onPress={()=>{
       Actions.home({direction:'none' })
     }}>
  
    <Image source={!(this.props.navigation.state.index===0 &&this.props.navigation.state.routeName==='tabbar' )?this.props.app.dark? require('../../images/home.png'):require('../../images/home_dark.png') :require('../../images/home_sel.png')} style={{ width: 24.44, height: 24.48,  }} /> 
     </TouchableOpacity>
 
     <TouchableOpacity
     style={{width: '20%', height: '100%', alignItems:'center', flex:1,justifyContent:'center', maxWidth:'20%'
     }} onPress={()=>{
       Actions.search({direction:'none' })
     }}>
  
    <Image source={!(this.props.navigation.state.index===1 &&this.props.navigation.state.routeName==='tabbar' ) ? this.props.app.dark?require('../../images/search.png'):require('../../images/search_dark.png') :require('../../images/search_sel.png')} style={{ width: 24, height: 24, }}  /> 
     </TouchableOpacity>
     <TouchableOpacity
     style={{width: '20%', height: '100%', alignItems:'center', flex:1,justifyContent:'center', maxWidth:'20%'
     }}
     onPress={()=>{
       Actions.calendar({direction:'none' })
     }}>
  
    <Image source={!(this.props.navigation.state.index===3 &&this.props.navigation.state.routeName==='tabbar' )? this.props.app.dark?require('../../images/calendar.png'):
    require('../../images/calendar_dark.png') :require('../../images/calendar_sel.png')} style={{ width: 24.48, height: 24.48,}} /> 
     </TouchableOpacity>
     <TouchableOpacity
     style={{width: '20%', height: '100%', alignItems:'center', flex:1,justifyContent:'center', maxWidth:'20%'
     }}onPress={()=>{
       Actions.notification({direction:'none' })
     }}>
  
    <Image source={!(this.props.navigation.state.index===4 &&this.props.navigation.state.routeName==='tabbar' ) ? this.props.app.dark?require('../../images/notification.png'): require('../../images/notification_dark.png') :require('../../images/notification_sel.png')} style={{ width: 20.4, height: 24, }} /> 
     </TouchableOpacity>
   
     <TouchableOpacity
     style={{width: '20%', height: '100%', alignItems:'center', flex:1,justifyContent:'center', maxWidth:'20%'
     }}onPress={()=>{
       Actions.connections({direction:'none' })
     }}>
  
    <Image source={!(this.props.navigation.state.index===5 && this.props.navigation.state.routeName==='tabbar' ) ? this.props.app.dark?require('../../images/profile.png'):require('../../images/profile_dark.png') :require('../../images/profile_sel.png')} style={{ width: 30, height: 29,}} /> 
     </TouchableOpacity>
 
 </View>
 
    </View>
 </View>
  
 );
} else{
  return (
    <View/>
  );
}

}
}



const mapStateToProps = state => ({
  app: state.app
  });
  
  const mapDispatchToProps = {
  
  };
  
  export default connect(mapStateToProps, mapDispatchToProps)(Side);
