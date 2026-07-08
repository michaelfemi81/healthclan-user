import status from './status';
import member from './member';
import links from './links';
import search from './search';
import locale from './locale';
import sent from './sent';
import received from './received';
import currency from './currency'
import app from './app'

const rehydrated = (state = false, action) => {
  switch (action.type) {
    case 'persist/REHYDRATE':
      return true;
    default:
      return state;
  }
};

export default {
  rehydrated,
  status,
  member,
   app,
  links,
  search,
  locale,
   received,
  sent,
  currency,
};
