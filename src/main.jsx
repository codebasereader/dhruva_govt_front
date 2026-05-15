import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import AuthInitializer from "./components/auth/AuthInitializer.jsx";
import apiClient from "./api/client.js";
import userReducer, { logout } from "./reducers/user.js";
import "./index.css";

const STORAGE_KEY = "government_user";

const loadState = () => {
  try {
    const serialized = localStorage.getItem(STORAGE_KEY);
    return serialized ? { user: JSON.parse(serialized) } : undefined;
  } catch {
    return undefined;
  }
};

const saveState = (state) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.user));
  } catch {
    // ignore quota errors
  }
};

const store = configureStore({
  reducer: combineReducers({ user: userReducer }),
  preloadedState: loadState(),
});

store.subscribe(() => saveState(store.getState()));

apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const url = err.config?.url ?? "";
      const isAuthEndpoint = /auth\/(login|register)$/.test(url);
      if (!isAuthEndpoint) {
        store.dispatch(logout());
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  },
);

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
