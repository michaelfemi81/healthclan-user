const React = require("react-native");

const { StyleSheet, Dimensions, Platform } = React;

const { width, height } = Dimensions.get("window");
const SCREEN_WIDTH = width;
const SCREEN_HEIGHT = height;
import { ifIphoneX } from 'react-native-iphone-x-helper';
import colors from "./colors";
import fonts from './fonts';
import * as functions from "./functions";
const deviceHeight = Dimensions.get("window").height;
const deviceWidth = Dimensions.get("window").width;

export default {
  mini: {
    fontSize: functions.normalize(12),
  },
  small: {
    fontSize: functions.normalize(15),
  },
  medium: {
    fontSize: functions.normalize(17),
  },
  large: {
    fontSize: functions.normalize(20),
  },
  xlarge: {
    fontSize: functions.normalize(24),
  },
  paddingTop: {
    ...ifIphoneX({
      paddingTop: 50
    }, {
      paddingTop: 30
    }),
  },
  container: {
    flex: 1,
    backgroundColor: '#262938',
  },
  headSpacing: {
    ...ifIphoneX({
      paddingTop: 40,

    }, {
      paddingTop: 30,
    })
  },
  head2: {
    // paddingTop: 10,
    alignContent: 'center',
    // height: 50,
    width: "100%",
    backgroundColor: 'transparent',
    flexDirection: "row",
    alignContent: "center",
    justifyContent: 'center',
    // marginBottom: 20,
    ...ifIphoneX({
      paddingTop: 40,
      paddingBottom: 20,

    }, {
      paddingTop: 30,
      paddingBottom: 20,

    })
  },

  head: {
    // paddingTop: 10,
    alignContent: 'center',
    // height: 50,
    width: "100%",
    backgroundColor: '#FFF',
    flexDirection: "row",
    alignContent: "center",
    justifyContent: 'center',
    // marginBottom: 20,
    ...ifIphoneX({
      paddingTop: 40,
      paddingBottom: 20,

    }, {
      paddingTop: 20,
      paddingBottom: 5,
      // borderBottomWidth: 1
    })
  },
  pos: {
    position: "absolute",
    zIndex: 2,
    ...ifIphoneX({
      top: 40,
    }, {
      top: 25,
    }),
    left: 20,


  },

  posRight: {
    position: "absolute",
    zIndex: 2,
    ...ifIphoneX({
      top: 40,
    }, {
      top: 25,
    }),
    right: 20,


  },
  iphoneHeight: {
    ...ifIphoneX({
      height: functions.normalize(60),
    }, {
      height: functions.normalize(30),
    }),
  },

  // iphoneHeight2: {
  //   ...ifIphoneX({
  //     height: 73,
  //   }, {
  //     height: 30,
  //   }),

  // },
  posLeft: {
    position: "absolute",
    zIndex: 1,
    top: 10,
    right: 20,
  },
  text: [fonts.small, {
    fontSize: functions.normalize(15),
    textAlign: 'center',
    color: colors.text_black,
    letterSpacing: 0,
  }],
  bold: [fonts.bold, {
  }],
  textItalics: {
    fontSize: 15,
    textAlign: 'center',
    color: colors.inactive_color,
    // fontFamily: Platform.OS == 'ios' ? 'CircularStd-Book-Italic' : 'circular-book-italic',

    // fontFamily: 'CircularStd-Italic',
    letterSpacing: 0.18,
  },
  textBold: [fonts.regular, {
    fontSize: 15,
    textAlign: 'center',
    color: colors.text_dark,
  }],
  textBlack: [fonts.black, {
    fontSize: 15,
    textAlign: 'center',
    color: colors.text_dark,
  }],

  center: {
    justifyContent: 'center',
    alignContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: 25,
    height: 25,
    paddingRight: 20,
  },



  pinInputStyle: [fonts.small, {
    height: 50,
    borderColor: colors.text_input_border,
    borderWidth: 1,
    // fontFamily: "CircularStd-Medium",

    fontSize: 16,
    backgroundColor: colors.white,
    paddingLeft: 15,
    borderRadius: 7,
    marginBottom: 20,
    color: colors.text_dark,
    // shadowColor: '#EEE',
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.8,
    // shadowRadius: 5,
    // shadowColor: colors.text_input_border,
    // elevation: 2,

  }],

  pinInputStyle2: [fonts.small, {
    height: 50,
    borderColor: colors.text_input_border,
    borderWidth: 1,
    fontSize: 16,
    backgroundColor: colors.white,
    paddingLeft: 15,
    borderRadius: 7,
    marginBottom: 20,
    color: colors.text_dark,
    shadowColor: '#EEE',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
    shadowColor: colors.text_input_border,
  }],

  padup: {
    paddingHorizontal: 20,
    paddingVertical: 0,
  },
  elevationLow: {
    ...Platform.select({
      ios: {
        shadowColor: '#CCC',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.6,
        shadowRadius: 5,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  eye: {
    position: "absolute",
    top: 15,
    right: 20,
    // zIndex: 1,
    fontSize: 20,
    color: colors.text_dark,
  },
  chevron: {
    position: "absolute",
    top: 15,
    zIndex: 1,
    right: 20,
    color: '#A9A9B0',
    fontSize: 20
  },
  modal: {
    marginVertical: 100,
    marginHorizontal: 20,
    backgroundColor: "#FFF",
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.button_container_color_active,
    borderStyle: 'dashed',
  },
  tabCunt: { backgroundColor: '#FFF', height: 114, paddingTop: 40, borderColor: 'transparent', marginBottom: 20, shadowColor: '#AAA', shadowRadius: 10, borderWidth: 0 },
  // smallText: {fontSize: 10, textAlign: 'left', color: colors.text_black, fontWeight: '500', paddingBottom: 5},
  line: { borderWidth: .5, flex: 1, borderStyle: "dashed", borderColor: colors.inactive_color, marginBottom: 20 },
  avaView: { height: 52, width: 52, backgroundColor: colors.white, borderRadius: 26, borderWidth: 1, borderColor: colors.text_black },

  bigText: [fonts.regular, { fontSize: 15, textAlign: 'left', color: colors.text_black, textTransform: 'capitalize' }],
  smallText: [fonts.small, { fontSize: 13, textAlign: 'left', color: colors.text_dark, textTransform: 'capitalize', marginTop: 3 }],
  layout: { flexDirection: 'row', alignItems: 'center', borderBottomColor: '#F7F7F7', borderBottomWidth: 1, paddingBottom: 20, marginVertical: 10 },
  boxOf: { height: 75, top: 170, position: 'absolute', width: width - 80, borderRadius: 10, backgroundColor: colors.white, alignSelf: 'center', paddingHorizontal: 10, paddingVertical: 5, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  boxOf2: { height: 75, elevation: 2, width: width - 80, borderRadius: 10, backgroundColor: colors.white, alignSelf: 'center', paddingHorizontal: 10, paddingVertical: 5, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },

  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(154, 159, 191, 0.1)', borderRadius: 10,
    height: functions.normalize(42), justifyContent: 'space-around', marginBottom: 20
  },
  circle: {
    height: 150,
    width: 150,
    borderRadius: 75,
    // borderColor: '#FFF',
    // backgroundColor: '#FFF',
    borderWidth: 0,
    justifyContent: 'center',
    alignContent: 'center',
    alignItems: 'center',
    marginVertical: 20,


  },


  customView: {
    width: '100%',
    // height: 70,
    // marginTop: 20,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: .5,
    borderColor: '#CCC',
    borderRadius: 10,
  },
  customViewAndroid: {
    // backgroundColor: 'white',
    // top: 30,
    // position: 'absoute',
    width: '100%',
    // height: 70,
    // marginTop: 20,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    borderRadius: 5,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    // elevation: 2,
  },
  progress: {
    // height: 6,
    // width: '100%',
    borderColor: 'transparent',
    borderWidth: 0,
    marginVertical: 20,
    // alignItems: 'flex-start',
  },
  butt: {
    position: 'absolute',
    zIndex: 2,
    ...ifIphoneX({
      bottom: 40,
    }, {
      bottom: 20,
    })
  },
  // butt2: {
  //   position: 'absolute',
  //   zIndex: 2,
  //   ...ifIphoneX({
  //     bottom: 60,
  //   }, {
  //     bottom: 40,
  //   }) 
  // },

  butt2: {
    position: 'absolute',
    zIndex: 0,
    elevation: 0,
    ...ifIphoneX({
      bottom: 60,
    }, {
      bottom: 40,
    })
  },
  blueText: [fonts.regular, {
    color: colors.btn_blue, textAlign: 'left',
    // fontWeight: Platform.OS == 'ios' ? '500' : 'normal',
    fontSize: functions.normalize(18), marginVertical: 10,
  }],
  smallText2: [fonts.regular, {
    color: colors.text_black, textAlign: 'left',
    fontSize: functions.normalize(18)
  }],

  newHead: { flexDirection: 'row', marginBottom: functions.normalize(20), alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, width: '100%' },
  newHeadText: [fonts.regular, {
    color: colors.btn_orange,
    fontSize: functions.normalize(18)
  }],
  newHead: { flexDirection: 'row', marginBottom: functions.normalize(20), alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, width: '100%' },
  // newHeadText: {color: colors.btn_orange,  
  // ...Platform.select({
  //   ios: {
  //       fontWeight: '500',
  //   },
  //   android: {
  //       fontFamily: 'circular-medium',
  //   },
  // }), fontSize: functions.normalize(18)},
  newRight: { position: 'absolute', right: functions.normalize(24) },
  newLeft: { position: 'absolute', left: functions.normalize(24) },
  newContainer: { marginVertical: functions.normalize(20), height: functions.normalize(163), backgroundColor: colors.white, borderRadius: 10 },
  requestGrid: {
    marginVertical: functions.normalize(20),
    height: functions.normalize(134),
    backgroundColor: colors.white,
    borderRadius: 10,
    alignItems: 'center', flexDirection: 'row'
  },
};


