import { ADD_TO_CART, REMOVE_FROM_CART, CLEAR_CART, SET_USER, LOGOUT_USER, SET_CART } from "./actions";

const initialState = {
  cart: {},
  user: null,
};

export default function rootReducer(state = initialState, action) {
  switch (action.type) {
    case ADD_TO_CART: {
      const { item, variant } = action.payload;
      const key = `${item.id}-${variant}`;
      
      return {
        ...state,
        cart: {
          ...state.cart,
          [key]: {
            ...item,
            variant,
            quantity: (state.cart[key]?.quantity || 0) + 1,
          },
        },
      };
    }

    case REMOVE_FROM_CART: {
      const { itemId, variant } = action.payload;
      const key = `${itemId}-${variant}`;

      const old = state.cart[key];
      if (!old) return state;

      if (old.quantity <= 1) {
        const newCart = { ...state.cart };
        delete newCart[key];
        return { ...state, cart: newCart };
      }

      return {
        ...state,
        cart: {
          ...state.cart,
          [key]: { ...old, quantity: old.quantity - 1 },
        },
      };
    }

    case CLEAR_CART:
      return {
        ...state,
        cart: {},
      };

    case SET_CART:
      return {
        ...state,
        cart: action.payload || {},
      };

    case SET_USER:
      return {
        ...state,
        user: action.payload,
      };

    case LOGOUT_USER:
      return {
        ...state,
        user: null,
      };

    default:
      return state;
  }
}
