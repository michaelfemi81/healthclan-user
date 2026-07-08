import Store from '../store/member';

export const initialState = Store;

export default function userReducer(state = initialState, action) {
  switch (action.type) {
    case 'USER_LOGIN': {
      if (action.data) {
        return {
          ...state,
          loading: false,
          error: null,
          name: action.data.name,
          username: action.data.username,
          bio: action.data.bio,
          phone: action.data.phone,
          subscription: action.data.subscription,
          anonymous: action.data.anonymous,
          _id: action.data._id,
          dob: action.data.dob,
          profile_picture: action.data.profile_picture,
          gender: action.data.gender,
          banner: action.data.banner,
          verified: action.data.verified,
          private: action.data.private
        };
      }
      return initialState;
    }
    case 'USER_DETAILS_UPDATE': {
      if (action.data) {
        return {
          ...state,
          loading: false,
          error: null,
           name: action.data.name,
           username: action.data.username,
           bio: action.data.bio,
           phone: action.data.phone,
           subscription: action.data.subscription,
           anonymous: action.data.anonymous,
           _id: action.data._id,
           dob: action.data.dob,
           profile_picture: action.data.profile_picture,
           gender: action.data.gender,
           banner: action.data.banner,
           verified: action.data.verified,
           private: action.data.private
        };
      }
      return initialState;
    }
    case 'USER_ERROR': {
      if (action.data) {
        return {
          ...state,
          loading: false,
          error: action.data,
        };
      }
      return initialState;
    }
    case 'USER_RESET': {
      return initialState;
    }
    default:
      return state;
  }
}
