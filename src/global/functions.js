
import { Dimensions, Platform, PixelRatio } from 'react-native';

const {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
} = Dimensions.get('window');

// based on iphone 5s's scale 414
const scale = SCREEN_WIDTH / 404;

export function normalize(size) {
    const newSize = size * scale
    //   if (Platform.OS === 'ios') {
    //     return Math.round(PixelRatio.roundToNearestPixel(newSize)) 
    //   } else {
    //     return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 2
    //   }

    if (Platform.OS === 'ios') {
        return Math.round(PixelRatio.roundToNearestPixel(newSize)) + 1.5;
    } else {
        return Math.round(PixelRatio.roundToNearestPixel(newSize)) + 1;
    }

}

export function capitilize(s) {
    return s.replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase());
}
export function isUpperCase(string) {
    var re = /(?=.*[A-Z])/;
    return re.test(string)
}

export function isNumeric(string) {
    var re = /(?=.*\d)/;
    return re.test(string)
}

export function isSpecial(string) {
    var re = /(?=.*[!#$%&?@^*() "])/;
    return re.test(string)
}

export function validateEmail(text) {
    if (!text || text == "") {
        return;
    }
    if (text.length < 3) {
        return false;
    }
    let reg = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (reg.test(text) === false) {
        return false;
    } else {
        return true;
    }
}


export function validatePhone(text) {
    if (!text || text == "") {
        return;
    }
    // if(text.length != 11) { 
    //     return false;
    // } else {
    //     if (/^\d{10}/.test(text)) {
    //     return true;
    //     } else {
    //     return false;
    //     }
    // } 
    return text.match(/\d/g).length == 10 || text.match(/\d/g).length == 11;
}

export function currencyFormat(num) {
    return '₦ ' + parseFloat(num).toFixed(2).replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
}

export function getFormattedDate(oldDate) {

    var tempDate = new Date(oldDate);
    var oldTime = Math.round(tempDate.getTime() / 1000);
    var shownDate = '';
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    var year = tempDate.getFullYear();
    var month = tempDate.getMonth();
    var day = tempDate.getDate();
    shownDate = months[month] + ' ' + day + ', ' + year;

    return shownDate;
}

export function secondsToHms(d) {
    d = Number(d);
    var h = Math.floor(d / 3600);
    var m = Math.floor(d % 3600 / 60);
    var s = Math.floor(d % 3600 % 60);

    var hDisplay = h > 0 ? h + (h == 1 ? " hour, " : " hours, ") : "";
    var mDisplay = m > 0 ? m + (m == 1 ? " minute, " : " minutes, ") : "";
    var sDisplay = s > 0 ? s + (s == 1 ? " second" : " seconds") : "";
    return mDisplay + sDisplay;
}

export function validateBVN(text) {
    if (text.length != 11) {
        return false;
    } else {
        return true
    }
}

export function randomString(length = 10, chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ") {
    var result = '';
    for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
}

export function showCurrency(type) {
    if (type == "naira") {
        return "₦";
    } else if (type == "dollar") {
        return "$";
    } else if (type == "pound") {
        return "£";
    } else if (type == "euro") {
        return "€";
    } else {
        return "₦";
    }
}


export function showC(name) {
    if (name == "NGN") {
        return "naira";
    } else if (name == "USD") {
        return "dollar";
    } else if (name == "EUR") {
        return "euro";
    } else if (name == "GBP") {
        return "pound";
    } else {
        return "naira";
    }
}


export function showC2(name) {
    if (name == "naira") {
        return "NGN";
    } else if (name == "dollar") {
        return "USD";
    } else if (name == "euro") {
        return "EUR";
    } else if (name == "pound") {
        return "GBP";
    } else {
        return "NGN";
    }
}


export function checkPlan(plan, userPlan) {
    var plans = ['classic', 'silver', 'gold', 'diamond', 'platinum'];
    var planIndex = plans.indexOf(plan);
    if (planIndex >= 0) {
        for (var i = planIndex; i < plans.length; i++) {
            if (userPlan === plans[i]) {
                return true;
            }
        }
    }
    // console.log('here');
    return false;
}




export function roundNumber(num, scale = 2) {
    if (!("" + num).includes("e")) {
        return +(Math.round(num + "e+" + scale) + "e-" + scale);
    } else {
        var arr = ("" + num).split("e");
        var sig = ""
        if (+arr[1] + scale > 0) {
            sig = "+";
        }
        return +(Math.round(+arr[0] + "e" + sig + (+arr[1] + scale)) + "e-" + scale);
    }
}


export function cc_format(value) {
    var v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    var matches = v.match(/\d{4,16}/g);
    var match = matches && matches[0] || ''
    var parts = []
    var i;
    var len;

    for (i = 0, len = match.length; i < len; i += 4) {
        parts.push(match.substring(i, i + 4))
    }

    if (parts.length) {
        return parts.join(' ')
    } else {
        return value
    }
}

export function number_format(number, decimals, dec_point, thousands_sep) {
    // Strip all characters but numerical ones.
    number = (number + '').replace(/[^0-9+\-Ee.]/g, '');
    var n = !isFinite(+number) ? 0 : +number,
        prec = !isFinite(+decimals) ? 0 : Math.abs(decimals),
        sep = (typeof thousands_sep === 'undefined') ? ',' : thousands_sep,
        dec = (typeof dec_point === 'undefined') ? '.' : dec_point,
        s = '',
        toFixedFix = function (n, prec) {
            var k = Math.pow(10, prec);
            return '' + Math.round(n * k) / k;
        };
    // Fix for IE parseFloat(0.55).toFixed(0) = 0;
    s = (prec ? toFixedFix(n, prec) : '' + Math.round(n)).split('.');
    if (s[0].length > 3) {
        s[0] = s[0].replace(/\B(?=(?:\d{3})+(?!\d))/g, sep);
    }
    if ((s[1] || '').length < prec) {
        s[1] = s[1] || '';
        s[1] += new Array(prec - s[1].length + 1).join('0');
    }
    return '₦' + s.join(dec);
}



