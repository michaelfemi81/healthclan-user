import Store from '../store/app';


export const initialState = Store;

export default function appReducer(state = initialState, action) {
  switch (action.type) {
    case 'TOGGLE_THEME': {
      return {
        ...state,
        dark: action.value ,
      };
    }
    case 'TOGGLE_LOGIN': {
      return {
        ...state,
        loggedIn : action.value ,
      };
    }
    case 'TOGGLE_PRIVACY': {
        return {
          ...state,
          private: action.value ,
        };
      }
      default:
      return state;
  
}
}