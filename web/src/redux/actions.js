export const ADD_TO_CART = "ADD_TO_CART";
export const REMOVE_FROM_CART = "REMOVE_FROM_CART";
export const CLEAR_CART = "CLEAR_CART";
export const SET_USER = "SET_USER";
export const LOGOUT_USER = "LOGOUT_USER";
export const SET_CART = "SET_CART";

export const addToCart = (item, variant) => ({
  type: ADD_TO_CART,
  payload: { item, variant },
});

export const removeFromCart = (itemId, variant) => ({
  type: REMOVE_FROM_CART,
  payload: { itemId, variant },
});

export const clearCart = () => ({
  type: CLEAR_CART,
});

export const setCart = (cart) => ({
  type: SET_CART,
  payload: cart,
});

export const setUser = (user) => ({
  type: SET_USER,
  payload: user,
});

export const logoutUser = () => ({
  type: LOGOUT_USER,
});
