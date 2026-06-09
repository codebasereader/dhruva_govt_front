import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import AuthInitializer from "./components/auth/AuthInitializer.jsx";
import { setupAuthInterceptor } from "./api/authInterceptor.js";
import apiClient from "./api/client.js";
import userReducer, { setError } from "./reducers/user.js";
import { toErrorString } from "./api/utils.js";
import "./index.css";

const STORAGE_KEY = "government_user";

const loadState = () => {
  try {
    const serialized = localStorage.getItem(STORAGE_KEY);
    if (!serialized) return undefined;

    const parsed = JSON.parse(serialized);
    const value = parsed?.value ?? parsed;

    if (!value || typeof value !== "object") {
      return undefined;
    }

    return {
      user: {
        value,
        loading: false,
        error: null,
      },
    };
  } catch {
    return undefined;
  }
};

const saveState = (state) => {
  try {
    const { value } = state.user;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ value }));
  } catch {
    // ignore quota errors
  }
};

const preloadedState = loadState();
if (preloadedState?.user?.value?.is_logged_in) {
  preloadedState.user.loading = true;
}

const store = configureStore({
  reducer: combineReducers({ user: userReducer }),
  preloadedState,
});

const initialError = store.getState().user.error;
if (initialError != null && typeof initialError !== "string") {
  store.dispatch(setError(toErrorString(initialError) || null));
}

store.subscribe(() => saveState(store.getState()));

setupAuthInterceptor(apiClient, store);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <AuthInitializer>
          <App />
        </AuthInitializer>
      </BrowserRouter>
    </Provider>
  </StrictMode>,
);
