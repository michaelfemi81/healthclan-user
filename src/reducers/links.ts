import Store from '../store/links';

export const initialState = Store;

export default function linksReducer(state = initialState, action) {
  switch (action.type) {
    case 'LINKS_REPLACE': {
      return {
        ...state,
        links: action.data || [],
      };
    }
    case 'LINKS_TOTAL_REPLACE': {
        return {
          ...state,
          total: action.data || 0,
        };
      }
      case 'LINKS_TOTAL_CHANGE': {
        return {
          ...state,
          total: action.data || 0,
        };
      } 
      case 'LINK_CURRENT_REPLACE':{
        return {
          ...state,
          current: action.data || 0,
        };
      }
    default:
      return state;
  }
}
