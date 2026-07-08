import React from 'react';
import PropTypes from 'prop-types';
import {Dimensions,SafeAreaView, ScrollView, StatusBar,View, Image, Platform,Vibration, TouchableOpacity, Text,
    PermissionsAndroid, Linking, } from 'react-native';
import { Actions } from 'react-native-router-flux';
const { width, height } = Dimensions.get('window');
import { connect } from 'react-redux'
var jwt = require('jwt-decode');
import CachedImage from 'react-native-image-cache-wrapper';
import {pushNoti} from '../../actions/member'
//import  SafeAreaView from 'react-native-safe-area-view';
import Icon from 'react-native-vector-icons/Ionicons';
import { ifIphoneX } from 'react-native-iphone-x-helper'
import Orientation from 'react-native-orientation-locker';

//import ExtraDimensions from 'react-native-extra-dimensions-android'
if (Platform.OS === 'android'){
 // height = ExtraDimensions.get('REAL_WINDOW_HEIGHT');
}


class Nav extends React.Component {


constructor(props) {
super(props);

this.state={ color:['#F5A81B','#F51B42','#F357E9', '#89549D', '#4C8056','#89889A','#27AAE1',],
user:{}}
const current= Math.floor(Math.random() * (this.state.color.length))
this.state.current =current;
}
componentDidMount(){
  Orientation.lockToPortrait();
this.initAppState();
if (Platform.OS === 'android') {
  Linking.getInitialURL().then(url => {
    this.navigate(url);
  });
} else {
    Linking.addEventListener('url', this.handleOpenURL);
  }

}
componentWillUnmount() { // C
  Linking.removeEventListener('url', this.handleOpenURL);
}
handleOpenURL = (event) => { // D
  this.navigate(event.url);
}
navigate = (url) => { // E
  if(url){
    const route = url.replace(/.*?:\/\//g, '');
    const id = route.match(/\/([^\/]+)\/?$/)[1];
    const routeName = route.split('/')[0];
  
    if (routeName === 'search') {
     // navigate('People', { id, name: 'chris' })
     Actions.search({key:'Hello'})
    };
  }
  
}


componentWillUnmount() {

}
initAppState = async () => {
  let user=this.props.user||{}
  this.setState({
    user, name: user && user.name, bio: user && user.bio,
    dob: user && user.dob && new Date(user.dob) , gender: user && user.gender
  })
}
reset=() =>{
  this.setState(initialState);
}
componentWillReceiveProps(props){
  if(props.user){
    this.initAppState();
  }
}

render() {
  


if(this.props.title !== 'search')
return (
  <SafeAreaView 
  style={{
    flex:Platform.OS==='android'? 0:1,
    backgroundColor: this.props.app.dark?'#262938':'#ffffff'
  }}>

<StatusBar
      backgroundColor={this.props.app.dark?'#262938':'#fff'}
      barStyle={this.props.app.dark?"light-content":"dark-content"}
    />
   <View style={{width: '100%', height:40, backgroundColor:this.props.app.dark?'#262938':'#fff', paddingHorizontal: '2.5%',maxHeight: 40,
   flex:1, justifyContent:'space-between',alignItems:'center', flexDirection:'row',
   borderBottomColor: this.props.app.dark?'rgba(255, 255,255,0.3)':'rgba(0, 0, 0, 0.3)',
   borderBottomWidth:1,
   paddingTop:20,
   paddingBottom:20,
   ...ifIphoneX({
    paddingTop: 10,
  })
}}>

<TouchableOpacity
    style={{width: 30, height: 30, borderRadius: 15,
    }} onPress=
    {() =>{
     if(Actions.currentScene.replace("_","")  !== "proftab") {
      Actions.proftab()
     }
      

    }}
    >
    

{              
    (this.state.user.gender === 'female' || this.state.user.gender === 'male')?
   <CachedImage source={this.state.user && this.state.user.profile_picture?
  {uri:this.state.user.profile_picture}:(this.state.user.gender === 'male'? require('../../images/avatar2.png'): require('../../images/avatar.png'))
  } style={{ width: 30, height: 30,  borderRadius: 15, backgroundColor:this.state.color[this.state.current]}} /> :
  <View style={{width: 30, height: 30,borderRadius: 15,backgroundColor:this.state.color[this.state.current]}}>
 <Text style={{width: '100%', textAlign: 'center', fontSize:20,lineHeight:30, 
  color:'#fff',width: 30, height: 30,  borderRadius: 15,
  fontWeight: "900"}}>
    {this.state.user.username?this.state.user.username.charAt(0).toUpperCase():''}
  </Text>
  </View>
 
} 
    </TouchableOpacity>
    
    <Text style={{height: 30, width: width -100 - (0.05* width), lineHeight: 30,
     color:this.props.app.dark?'#fff':'#333',
     fontFamily: 'Montserrat', fontWeight: '600', textAlign:'left', letterSpacing: -0.2,fontSize: 18, marginLeft:20}}>
     {this.props.title.charAt(0).toUpperCase()}{this.props.title.slice(1)}
    </Text> 
    {/** <TouchableOpacity
    style={{width: 30, height: 30,marginRight: 20
    }} onPress=
    {() => Actions.currentScene !== "globaltab" ? Actions.globaltab() : {}}
    >
    
 


    <Icon name="md-globe" style={{color:this.props.app.dark?'#fff':'#333'
       , fontSize:33, lineHeight:30, textAlign:'center'}} ></Icon>
  </TouchableOpacity>**/}
    <TouchableOpacity
    style={{width: 30, height: 30,
    }} onPress=
    {() => Actions.currentScene !== "settab" ? Actions.settab() : {}}
    >
    
 


    <Icon name="md-settings" style={{color:this.props.app.dark?'#fff':'#333'
       , fontSize:33, lineHeight:30, textAlign:'center'}} ></Icon>
    </TouchableOpacity>
    

 

   </View>
   </SafeAreaView>
  
);
return  (  <SafeAreaView 
  style={{
    flex: Platform.OS === 'android'?0:1,
    backgroundColor: this.props.app.dark?'#262938':'#ffffff'
  }}>
    <StatusBar
      backgroundColor={this.props.app.dark?'#262938':'#fff'}
      barStyle={this.props.app.dark?"light-content":"dark-content"}
    />
  </SafeAreaView>
)
  
}
}


const mapStateToProps = state => ({
app: state.app, user: state.member
});

const mapDispatchToProps = {
  updatePushId: pushNoti
};

export default connect(mapStateToProps, mapDispatchToProps)(Nav);
