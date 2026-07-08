import React from 'react';
import PropTypes from 'prop-types';
import {Dimensions,SafeAreaView, StatusBar, ScrollView,View, Image, Platform, PixelRatio, StyleSheet, ListView, TouchableOpacity, Text, Keyboard} from 'react-native';
import { Actions } from 'react-native-router-flux';
const { width, height } = Dimensions.get('window');
import { connect } from 'react-redux'
import {ActionSheetCustom as ActionSheet } from 'react-native-actionsheet'
import Icon from 'react-native-vector-icons/Ionicons';
import { ifIphoneX } from 'react-native-iphone-x-helper'
//import  SafeAreaView from 'react-native-safe-area-view';
import Orientation from 'react-native-orientation-locker';

//import ExtraDimensions from 'react-native-extra-dimensions-android'
if (Platform.OS === 'android'){
 // height = ExtraDimensions.get('REAL_WINDOW_HEIGHT');
}


class Nav extends React.Component {

  componentDidMount() {
   // console.log(this.props)
   // console.log(this.props.getLabelText())
   Orientation.lockToPortrait();
  //
  }
  

constructor(props) {
super(props);
this.state={user:(props.scenes[0].route.params.user)}

}

componentWillUnmount() {
 // FingerprintScanner.release();
}

componentWillReceiveProps(props){
//
}

render() {
  
let {user} = this.state;


return (
  <SafeAreaView 
  style={{
    flex: Platform.OS === 'android'?0:1,
    backgroundColor: this.props.app.dark?'#262938':'#ffffff'
  }}>
  <StatusBar
      backgroundColor={this.props.app.dark?'#262938':'#fff'}
      barStyle={this.props.app.dark?"light-content":"dark-content"}
    />
   <View style={{width: '100%', height:40, backgroundColor:this.props.app.dark?'#262938':'#fff', paddingHorizontal: '2.5%',maxHeight: 40,
   flex:1, justifyContent:'space-between',alignItems:'center', flexDirection:'row',
   borderBottomColor: this.props.app.dark?'rgba(255, 255,255,0.3)':'rgba(0, 0, 0, 0.3)',
   borderBottomWidth:1,paddingTop:Platform.OS==='android'? 20:15,
   paddingBottom:20,
   ...ifIphoneX({
    paddingTop: 10,
  })
}}>
 
    <ActionSheet 
    ref={o => this.ActionSheet = o}
    //title={'Which one do you like ?'}
    options={[<Text style={{color:'#2E2F40'}}>Report Event</Text>,
    <Text style={{color:'#2E2F40'}}>View Profile</Text>,
    <Text  style={{color:'#2E2F40'}}>Cancel</Text>
]}
  cancelButtonIndex={2}
   //destructiveButtonIndex={-1}
    onPress={(index) => { /* do something */ }}
  />
   <TouchableOpacity
    style={{width: 30,height: 30,
    }} 
    onPress= {() => {
      Actions.pop();
    }}
    >
    <Icon name="md-arrow-round-back" style={{color:this.props.app.dark?'#fff':'#333'
       , fontSize:33, lineHeight:30, textAlign:'center'}} ></Icon>
    </TouchableOpacity>

     <TouchableOpacity
    style={{width: width-120, maxWidth:width-120, height: '100%',flex:1, flexDirection:'column' , alignItems: "flex-start", justifyContent:'center', alignSelf:'center',
    }}onPress={()=>{
      Actions.proftab({userId:user._id||Math.random()+"" })
      Keyboard.dismiss();
    }}>
 
  <Text style={{width: '100%', height:20, lineHeight:20, marginBottom:7, textAlign: "center", fontFamily:'Montserrat-Light', fontWeight:'600',color:this.props.app.dark?'#fff':'#333',
    fontSize:15, letterSpacing:-0.2}}>
     {this.state.user.name} 
   </Text>
    <View style={{ width:55,height: 13,flex: 1, flexDirection: 'row', justifyContent:'center',  alignItems:'center',alignSelf:'center'}}>
    <Text style={{ height: 13, lineHeight: 13,textAlign: "center", fontFamily:'Montserrat-Light', fontWeight:'600',color:this.props.app.dark?'#fff':'#333',
    fontSize:8, letterSpacing:-0.2, paddingRight: 3}}>
 { this.state.user.online? 'Active now': this.state.user.idle?'Idle':'Offline'}
   </Text>
   <View style={{ height: 5, width: 5, borderRadius:2.5, backgroundColor: this.state.user.online?'#71C285':
   this.state.user.idle?'#F2C94C':'red', alignSelf:'center', justifyContent:'center', marginTop: 3}}/>
    </View>
 
    </TouchableOpacity>

  
<View //style={{ width: 90, maxWidth: 90, height: 30, alignSelf: 'center', 
style={{ width: '10%', maxWidth: '10%', height: 30, alignSelf: 'center',
  flex:1, justifyContent:'space-between',alignItems:'center', flexDirection:'row'
}}>
     <TouchableOpacity
    style={{width: 30,height: 30,
    }} 
    onPress= {() => {
      Actions.pop();
    }}
    >
    <Icon name="md-more" style={{color:this.props.app.dark?'#fff':'#333'
       , fontSize:33, lineHeight:30, textAlign:'center'}} ></Icon>
    </TouchableOpacity>
  </View>

 

   </View>
   </SafeAreaView>
);

}
}


const mapStateToProps = state => ({
  app: state.app
  });
  
  const mapDispatchToProps = {
  
  };
  
  export default connect(mapStateToProps, mapDispatchToProps)(Nav);

