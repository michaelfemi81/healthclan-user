import React, { Component } from "react";
import { Image,SafeAreaView,  PixelRatio, StatusBar, Alert, Platform ,View, BackHandler,Text, TouchableOpacity,ScrollView} from "react-native";
import { connect } from 'react-redux';
import { Actions } from 'react-native-router-flux';
import styles from "./style";
var jwt = require('jwt-decode');
var CryptoJS = require("crypto-js");
import Icon from 'react-native-vector-icons/Ionicons';
import { Linking } from 'react-native'
import InAppBrowser from 'react-native-inappbrowser-reborn'
//import  SafeAreaView from 'react-native-safe-area-view';

const datas = [
  {
    name: "Help",
    route: "help",
    icon: 'help-circle',

  },
 
 /**  {
    name: "Discover creators",
    route: "discover",
    icon: 'people'
 
  },**/
  {
    name: "Invite friends",
    route: "invite",
    icon: 'add',
    extra:'https://www.vergly.com/'
   
  },
  {
    name: "Privacy Policy",
    route: "privacy",
    icon: 'warning',
    link: true,
    url:'https://www.vergly.com/privacy-policy'

  },
  {
    name: "Terms and Conditions",
    route: "terms",
    icon: 'paper',
    link: true,
    url:'https://www.vergly.com/terms-of-service'
  
  },


 
];



class SideBar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      shadowOffsetWidth: 1,
      shadowRadius: 4,
      user:{}
    
    };

  }

  componentDidMount() {
   // BackHandler.addEventListener('hardwareBackPress', this.handleBackPress);
    this.initAppState();
  }
  componentWillUnmount() {
   // BackHandler.removeEventListener('hardwareBackPress', this.handleBackPress);
  }



  async openLink(name,url) {
    try {
      if (await InAppBrowser.isAvailable()) {
        StatusBar.setBarStyle('light-content')
        const result = await InAppBrowser.open(url, {
          // iOS Properties
          dismissButtonStyle: 'cancel',
          preferredBarTintColor: this.props.app.dark?'#262938':'#333333',
          preferredControlTintColor: 'white',
          readerMode: false,
          animated: true,
          modalPresentationStyle: 'overFullScreen',
          modalTransitionStyle: 'partialCurl',
          modalEnabled: true,
          // Android Properties
          showTitle: true,
          toolbarColor: this.props.app.dark?'#262938':'#333333',
          secondaryToolbarColor: 'black',
          enableUrlBarHiding: true,
          enableDefaultShare: true,
          forceCloseOnRedirection: false,
          // Specify full animation resource identifier(package:anim/name)
          // or only resource name(in case of animation bundled with app).
          animations: {
            startEnter: 'slide_in_right',
            startExit: 'slide_out_left',
            endEnter: 'slide_in_left',
            endExit: 'slide_out_right'
          },
          headers: {
            'my-custom-header': name
          }
        })
        StatusBar.setBarStyle(this.props.app.dark?'light-content':'dark-content')
       // Alert.alert(JSON.stringify(result))
      }
      else Linking.openURL(url)
    } catch (error) {
      Alert.alert(error.message)
    }
  }
  initAppState = async () => {
    let user = this.props.user
    this.setState({
      user
    })
  }
  handleBackPress = () => {
    return true;
  }


  render() {
  if(Platform.OS!=='android')
    return (
      <SafeAreaView 
  style={{
    flex: 1,
    backgroundColor: this.props.app.dark?'#262938':'#ffffff'
  }}>
  
        <ScrollView
          style={{ flex:1,backgroundColor:this.props.app.dark?'#262938':'#fff', padding: 0,
         // transform: [{ rotate: '0deg'}]
          }}>
   
    <View style={{ height: 40, borderBottomColor:this.props.app.dark?'rgba(255,255,255,0.7)':'rgba(0,0,0,0.7)', borderBottomWidth: 0.5, paddingLeft: 10}}>
    <Text style={{color:this.props.app.dark?'#fff':'#333', textAlign: 'left', fontSize: 17, lineHeight: 40}}>{this.state.user.username} </Text>
    </View>


          <View
           style={{flex:1,}}
           
          >
           {
         
             datas.map((data,i)=>{
               return(
                <TouchableOpacity 
                style={{width: '100%', height: 60, flex: 1, flexDirection: 'row',
                justifyContent: 'space-between', alignItems:'center', paddingLeft:10}}
                key={i}
                onPress={() => {
                       
                     if(data.link){
                      Actions.drawerClose();
                       this.openLink(data.name, data.url)
                     } else{
                      Actions.drawerClose();
                      setTimeout(()=>{
                        if(data.extra){
                          Actions[data.route]({url: data.extra});
                         }else{
                          Actions[data.route]();
                         }
                      },800)
                       
                     
                     }
                     
                   
                }}
              >
                 <Icon name={'md-'+data.icon} style={{
           color:!this.props.app.dark?'#333':'#fff',
           fontSize:25,textAlign:'center',height: 30, lineHeight:30,
         }}></Icon>
                <Text style={{width:'80%', height: 30, lineHeight:30, fontFamily: 'Montserrat-Light', fontWeight: '600', textAlign: 'left', fontSize:15, color:this.props.app.dark?'#fff':'#333'}}>
                   {data.name}
                 </Text>
                </TouchableOpacity>
                
             
               )
             })
             

           }
          </View>
     </ScrollView>
     </SafeAreaView>
    );
    else
    return(
      <ScrollView
      style={{ flex:1,backgroundColor:this.props.app.dark?'#262938':'#fff', padding: 0,
     // transform: [{ rotate: '0deg'}]
      }}>

<View style={{ height: 40, borderBottomColor:this.props.app.dark?'rgba(255,255,255,0.7)':'rgba(0,0,0,0.7)', borderBottomWidth: 0.5, paddingLeft: 10}}>
<Text style={{color:this.props.app.dark?'#fff':'#333', textAlign: 'left', fontSize: 17, lineHeight: 40}}>{this.state.user.username} </Text>
</View>


      <View
       style={{flex:1,}}
       
      >
       {
     
         datas.map((data,i)=>{
           return(
            <TouchableOpacity 
            style={{width: '100%', height: 60, flex: 1, flexDirection: 'row',
            justifyContent: 'space-between', alignItems:'center', paddingLeft:10}}
            key={i}
            onPress={() => {
                
              if(data.link){
                Actions.drawerClose();
                 this.openLink(data.name, data.url)
               } else{
                Actions.drawerClose();
                setTimeout(()=>{
                  if(data.extra){
                    Actions[data.route]({url: data.extra});
                   }else{
                    Actions[data.route]();
                   }
                },800)
                 
               
               }
              
                 
                 
               
            }}
          >
             <Icon name={'md-'+data.icon} style={{
       color:!this.props.app.dark?'#333':'#fff',
       fontSize:25,textAlign:'center',height: 30, lineHeight:30,
     }}></Icon>
            <Text style={{width:'80%', height: 30, lineHeight:30, fontFamily: 'Montserrat-Light', fontWeight: '600', textAlign: 'left', fontSize:15, color:this.props.app.dark?'#fff':'#333'}}>
               {data.name}
             </Text>
            </TouchableOpacity>
            
         
           )
         })
         

       }
      </View>
 </ScrollView>
    );
    
  }
}
const mapStateToProps = state => ({
app: state.app||{},
user: state.member||{}
});

const mapDispatchToProps = {

};

export default connect(mapStateToProps, mapDispatchToProps)(SideBar);