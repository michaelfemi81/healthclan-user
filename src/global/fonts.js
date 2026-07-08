import { Platform } from "react-native"

export default {
    small: {
        //Gordita
        // fontFamily: Platform.OS == 'ios' ? 'CircularStd-Book' : 'circular-book',
        fontFamily: Platform.OS == 'ios' ? 'CircularStd-Book' : 'circular-book',
    },
    regular: {
        fontFamily: Platform.OS == 'ios' ? 'CircularStd-Medium' : 'circular-medium',
    },
    semibold: {
        fontFamily: Platform.OS == 'ios' ? 'CircularStd-Bold' : 'circular-bold',
    },
    bold: {
        fontFamily: Platform.OS == 'ios' ? 'CircularStd-Bold' : 'circular-bold',
    },
    black: {
        fontFamily: Platform.OS == 'ios' ? 'CircularStd-Black' : 'circular-black',
    },
    small_italic: {
        fontFamily: Platform.OS == 'ios' ? 'CircularStd-Book-Italic' : 'circular-book-italic',
    },
    regular_italic: {
        fontFamily: Platform.OS == 'ios' ? 'CircularStd-Medium-Italic' : 'circular-medium-italic',
    },
}