import { configureStore } from "@reduxjs/toolkit";
import reducer from "./reducers";

const CART_KEY_BASE = "redux_cart";
const USER_KEY = "redux_user";

function getCartKeyForUser(user) {
  if (user && user.id) return `${CART_KEY_BASE}_${user.id}`;
  return `${CART_KEY_BASE}_anon`;
}

function loadState() {
  try {
    const userRaw = localStorage.getItem(USER_KEY);
    const user = userRaw ? JSON.parse(userRaw) : undefined;

    const cartKey = getCartKeyForUser(user);
    const cartRaw = localStorage.getItem(cartKey);
    const cart = cartRaw ? JSON.parse(cartRaw) : undefined;

    if (cart || user) {
      return { cart: cart || {}, user: user || null };
    }
    return undefined;
  } catch (e) {
    return undefined;
  }
}

const preloadedState = typeof window !== "undefined" ? loadState() : undefined;

const store = configureStore({
  reducer,
  preloadedState,
});

let lastSavedUserKey = null;

store.subscribe(() => {
  try {
    const state = store.getState();
    
    if (state.user) {
      localStorage.setItem(USER_KEY, JSON.stringify(state.user));
      lastSavedUserKey = state.user.id;
    } else {
      localStorage.removeItem(USER_KEY);
      lastSavedUserKey = null;
    }

    const cartKey = getCartKeyForUser(state.user);
    localStorage.setItem(cartKey, JSON.stringify(state.cart));
  } catch (e) {
  }
});

export default store;
