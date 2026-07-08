const FBSDK = require('react-native-fbsdk');
const {
  LoginManager,
} = FBSDK;
    
// ...

// Attempt a login using the Facebook login dialog,
// asking for default permissions.
LoginManager.logInWithReadPermissions(['public_profile']).then(
  function(result) {
    if (result.isCancelled) {
      alert('Login was cancelled');
    } else {
      alert('Login was successful with permissions: '
        + result.grantedPermissions.toString());
    }
  },
  function(error) {
    alert('Login failed with error: ' + error);
  }
);

/**
 componentWillMount(){
    this._panResponder = PanResponder.create({
      onMoveShouldSetResponderCapture: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderGrant: (e, gestureState) => {
        this.fScroll.setNativeProps({ scrollEnabled: false })
      },
      onPanResponderMove: () => {

      },
      onPanResponderTerminationRequest: () => true,
      onPanResponderRelease: () => {
        this.fScroll.setNativeProps({ scrollEnabled: true })
      },
    })
} 

<ScrollView ref={(e) => { this.fScroll = e }} >    
  <ScrollView 
    {...this._panResponder.panHandlers}
    onScrollEndDrag={() => this.fScroll.setNativeProps({ scrollEnabled: true })} >
  </ScrollView>
</ScrollView>
 */