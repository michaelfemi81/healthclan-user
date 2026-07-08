
export const initialState = {symbol: '$', value: 1};

export default function currencyReducer(state = initialState, action) {
  switch (action.type) {
    
    case 'CURRENCY_REPLACE': {
      if (action.symbol && action.value) {
      
        return {...state,
            symbol: action.symbol, 
            value: action.value};
      }
      return initialState;
    }
    default:
      return state;
  }
}