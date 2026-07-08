import Store from '../store/received';

export const initialState = Store;

export default function linksReducer(state = initialState, action) {
  switch (action.type) {
    case 'RECEIVED_NORMAL_REPLACE': {
      return {
        ...state,
        normal: action.data || [],
      };
    }
    case 'RECEIVED_BROADCAST_REPLACE': {
        return {
          ...state,
          broadcast: action.data || [],
        };
      }
    case 'RECEIVED_TOTAL_NORMAL_REPLACE': {
        return {
          ...state,
          normalTotal: action.data || 0,
        };
      }
      case 'RECEIVED_TOTAL_BROADCAST_REPLACE': {
        return {
          ...state,
          broadcastTotal: action.data || 0,
        };
      }
      case 'RECEIVED_CURRENT_NORMAL_REPLACE': {
        return {
          ...state,
          broadcastCurrent: action.data || 0,
        };
      }
      case 'RECEIVED_CURRENT_BROADCAST_REPLACE': {
        return {
          ...state,
          normalCurrent: action.data || 0,
        };
      } case 'RECEIVED_TOTAL_HISTORY_REPLACE': {
        return {
          ...state,
          historyTotal: action.data || 0,
        };
      }
      case 'RECEIVED_CURRENT_HISTORY_REPLACE': {
        return {
          ...state,
          historyCurrent: action.data || 0,
        };
      }
      case 'RECEIVED_HISTORY_REPLACE': {
        return {
          ...state,
          history: action.data || [],
        };
      }
  
    default:
      return state;
  }
}
