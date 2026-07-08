import Store from '../store/sent';

export const initialState = Store;

export default function linksReducer(state = initialState, action) {
  switch (action.type) {
    case 'SENT_NORMAL_REPLACE': {
      return {
        ...state,
        normal: action.data || [],
      };
    }
    case 'SENT_BROADCAST_REPLACE': {
        return {
          ...state,
          broadcast: action.data || [],
        };
      }
    case 'SENT_TOTAL_NORMAL_REPLACE': {
        return {
          ...state,
          normalTotal: action.data || 0,
        };
      }
      case 'SENT_TOTAL_BROADCAST_REPLACE': {
        return {
          ...state,
          broadcastTotal: action.data || 0,
        };
      }
      case 'SENT_CURRENT_NORMAL_REPLACE': {
        return {
          ...state,
          broadcastCurrent: action.data || 0,
        };
      }
      case 'SENT_CURRENT_BROADCAST_REPLACE': {
        return {
          ...state,
          normalCurrent: action.data || 0,
        };
      }
  
    default:
      return state;
  }
}
