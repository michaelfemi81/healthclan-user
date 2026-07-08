import React from 'react';
import PropTypes from 'prop-types';
import {Dimensions, StatusBar,View, Image, Platform,SafeAreaView, PixelRatio, StyleSheet, ListView, TouchableOpacity, Text} from 'react-native';
import { Actions } from 'react-native-router-flux';
const { width, height } = Dimensions.get('window');
import { connect } from 'react-redux'
import Icon from 'react-native-vector-icons/Ionicons';
export const IOS = Platform.OS === "ios";
//import  SafeAreaView from 'react-native-safe-area-view';
import { ifIphoneX } from 'react-native-iphone-x-helper'
import Orientation from 'react-native-orientation-locker';
class Nav extends React.Component {

  componentDidMount() {
   Orientation.lockToPortrait();
  }
  

constructor(props) {
super(props);
this.state={r: props.routeName||props.title}
this.menu =this.state.r !=='sharetab' &&  this.state.r !=='changetab' &&
 this.state.r !=='assettab'&& this.state.r !=='globaltab'&& this.state.r !=='wallettab' && this.state.r !=='subtab'&& this.state.r !=='paytab'&&
this.state.r !=='addcard' && this.state.r !=='globalsingle' && this.state.r !=='edittab' &&this.state.r !=='donate' &&this.state.r !=='capacity'
&& this.state.r !=='withdraw'&& this.state.r !=='fund'&& this.state.r !=='bank' &&  this.state.r !=='explore'&&  this.state.r !=='subscriber'
&&  this.state.r !=='allevent' && this.state.r !=='allasset'&& this.state.r !=='likes' &&this.state.r !=='help' && this.state.r !=='discover'
&& this.state.r !=='privacy' && this.state.r !=='terms' && this.state.r !=='invite';

this.setor=this.state.r==='Settings' || this.state.r==='sharetab' || this.state.r==='changetab'
|| this.state.r==='assettab'  || this.state.r==='globaltab'  || this.state.r==='wallettab'||  this.state.r==='subtab'||  this.state.r==='paytab'
||   this.state.r ==='addcard'||this.state.r ==='globalsingle'|| this.state.r==='edittab'||this.state.r ==='donate'||this.state.r ==='capacity'||
this.state.r ==='withdraw'||this.state.r ==='fund'||this.state.r ==='bank'||  this.state.r ==='explore'|| this.state.r ==='subscriber'
||  this.state.r ==='allevent'|| this.state.r ==='allasset' || this.state.r ==='likes'||this.state.r ==='help'||this.state.r ==='discover'
||this.state.r ==='privacy' ||this.state.r ==='terms' ||this.state.r ==='invite';

this.setnot=  this.state.r !=='Settings' && this.menu
}

componentWillUnmount() {
  //
}

componentWillReceiveProps(props){
//
}

render() {
  
return (
  <SafeAreaView 
  style={{
    flex: Platform.OS==='android'?0:1,
    backgroundColor: this.props.app.dark?'#262938':'#ffffff'
  }}>
   <View style={{width: '100%', height:40, maxHeight:40, backgroundColor:this.props.app.dark?'#262938':'#fff', paddingHorizontal: '2.5%',maxHeight: 40,
   flex:1, justifyContent:'space-between',alignItems:'center', flexDirection:'row',paddingTop:Platform.OS==='android'? 20:15,
   borderBottomColor: this.props.app.dark?'rgba(255, 255,255,0.3)':'rgba(0, 0, 0, 0.3)',
   borderBottomWidth:1,
   paddingBottom:20,
   ...ifIphoneX({
    paddingTop: 10,
  })
}}>

  <StatusBar
     backgroundColor={this.props.app.dark?'#262938':'#fff'}
     barStyle={this.props.app.dark?"light-content":"dark-content"}
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


     {this.setor
     ?
   <Text style={{
     height: 30, lineHeight: 30,textAlign: "left", fontFamily:'Montserrat-Light', fontWeight:'600',
   color:this.props.app.dark?'#fff':'#333',
    fontSize:18, letterSpacing:-0.2}}>
    {this.props.title}
   </Text>
   :<View/>
  }
 {
 this.setnot? 
   <TouchableOpacity
   style={{width: 30, height: '100%',flex:1, flexDirection:'column' , alignItems: "flex-end", justifyContent:'center'
   }}onPress={()=>{
     //drop call
    Actions.pop()
   }}>

  <Image source={require('../../images/drop.png')} style={{ width: 24, height: 8.8, }} /> 
   </TouchableOpacity>
   : this.menu
   ? 
   <TouchableOpacity
   style={{width: 30,height:30
   }} 
   onPress={()=>{
    Actions.drawerOpen()
  }}
   >
   <Icon name="md-menu" style={{color:this.props.app.dark?'#fff':'#333'
      , fontSize:30, lineHeight:30, textAlign:'center'}} ></Icon>
   </TouchableOpacity>:
    this.state.r ==='paytab'?

    <TouchableOpacity
    style={{width: 30,maxWidth:30, height: 30,flex:1,
    }} 
    onPress= {() => Actions.currentScene !== "adddcard" ? Actions.addcard() : {}}
    >
    <Icon name="md-add" style={{color:this.props.app.dark?'#fff':'#333'
       , fontSize:33, lineHeight:30, textAlign:'center'}} ></Icon>
    </TouchableOpacity>
    
   :<View    style={{width: 30, height: 30,flex:1,maxWidth:30,}}></View>
 }

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
