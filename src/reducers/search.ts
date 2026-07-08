import Store from '../store/search';

export const initialState = Store;

export default function searchReducer(state = initialState, action) {
  switch (action.type) {
    case 'SEARCH_REPLACE': {
      return {
        ...state,
        searchs: action.data || [],
      };
    }
    case 'SEARCH_TOTAL_REPLACE': {
        return {
          ...state,
          total: action.data || 0,
        };
      }
      case 'SEARCH_CURRENT_REPLACE':{
        return {
          ...state,
          current: action.data || 0,
        };
      }
      case 'SEARCH_QUERY_REPLACE':{
        return {
          ...state,
         query: action.data || '',
        };
      }
      case 'SEARCH_BY_ITEM_TOGGLE':{
        return {
          ...state,
         item: action.data || false,
        };
      }
    default:
      return state;
  }

}
