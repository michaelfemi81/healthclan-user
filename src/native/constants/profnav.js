import React from 'react';
import PropTypes from 'prop-types';
import {Dimensions, ScrollView,View, Image, Platform, PixelRatio, StyleSheet, ListView, TouchableOpacity, Text} from 'react-native';
import { Actions } from 'react-native-router-flux';
const { width, height } = Dimensions.get('window');
import { connect } from 'react-redux'
import AsyncStorage from '@react-native-community/async-storage';
import  SafeAreaView from 'react-native-safe-area-view';

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
  


  if( Platform.OS !== 'android'){
return (
  <SafeAreaView 
  forceInset={{ bottom: 'never'}}
  style={{
    flex: Platform.OS === 'android'?0:1,
    backgroundColor: this.props.app.dark?'#262938':'#ffffff'
  }}>
  <View style={{minWidth: '100%', height:40, paddingTop: 0,backgroundColor:this.props.app.dark?'#262938':'#fff', paddingHorizontal: '2.5%',maxHeight: 40,
  flex:1, justifyContent:'space-between',alignItems:'center', flexDirection:'row',
  
}}>
 <TouchableOpacity
   style={{width: '10%', height: '100%',flex:1, flexDirection:'column' , alignItems: "flex-start", justifyContent:'center'
   }}onPress={()=>{
     Actions.pop()
   }}>

  <Image source={this.props.app.dark?require('../../images/left.png'):require('../../images/left_dark.png')} style={{ height: 19,width:10}} /> 
   </TouchableOpacity>

  <View/>

  <TouchableOpacity
  style={{width: '15%', height: '100%',flex:1, flexDirection:'column' , alignItems: "flex-end", justifyContent:'center'
  }}
  onPress=
  {() =>{
    if( Actions.currentScene.replace("_","") !== "settab"){
      AsyncStorage.setItem('fromprofile','1')
      Actions.settab()
    }
  }}>

<Image source={this.props.app.dark?require('../../images/set.png'):require('../../images/set_dark.png')} style={{ width: 30, height: 30}} /> 
  </TouchableOpacity>
  

  </View>
  </SafeAreaView>

);
  }else{
    return (
      <View style={{minWidth: '100%', height:40, paddingTop: 0,backgroundColor:this.props.app.dark?'#262938':'#fff', paddingHorizontal: '2.5%',maxHeight: 40,
      flex:1, justifyContent:'space-between',alignItems:'center', flexDirection:'row',
    }}>
     <TouchableOpacity
       style={{width: '10%', height: '100%',flex:1, flexDirection:'column' , alignItems: "flex-start", justifyContent:'center'
       }}onPress={()=>{
         Actions.pop()
       }}>
    
      <Image source={this.props.app.dark?require('../../images/left.png'):require('../../images/left_dark.png')} style={{ height: 19,width:10}} /> 
       </TouchableOpacity>
    
      <View/>
    
      <TouchableOpacity
      style={{width: '15%', height: '100%',flex:1, flexDirection:'column' , alignItems: "flex-end", justifyContent:'center'
      }}
      onPress=
      {() =>{
        if(Actions.currentScene.replace("_","")  !== "settab"){
          Actions.settab()
        }
      }}>
    
    <Image source={this.props.app.dark?require('../../images/set.png'):require('../../images/set_dark.png')} style={{ width: 30, height:30}} /> 
      </TouchableOpacity>
      
    
      </View>
    )
  }
}
}


const mapStateToProps = state => ({
  app: state.app
  });
  
  const mapDispatchToProps = {
  
  };
  
  export default connect(mapStateToProps, mapDispatchToProps)(Nav);
