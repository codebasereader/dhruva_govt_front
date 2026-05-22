import { createSlice } from "@reduxjs/toolkit";
import { setAuthToken } from "../api/client";

const initialValue = {
  id: "",
  name: "",
  role: "",
  email_id: "",
  access_token: "",
  refresh_token: "",
  is_change_password: false,
  is_logged_in: false,
};

export const userSlice = createSlice({
  name: "user",
  initialState: {
    value: initialValue,
    loading: false,
    error: null,
  },
  reducers: {
    login: (state, action) => {
      state.value = { ...state.value, ...action.payload, is_logged_in: true };
      state.loading = false;
      state.error = null;
    },
    logout: (state) => {
      state.value = initialValue;
      state.loading = false;
      state.error = null;
      setAuthToken(null);
    },
    updateUser: (state, action) => {
      state.value = { ...state.value, ...action.payload };
    },
    passwordChanged: (state) => {
      state.value.is_change_password = false;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      const next = action.payload;
      if (next == null) {
        state.error = null;
        return;
      }
      if (typeof next === "string") {
        state.error = next;
        return;
      }
      if (typeof next === "object" && typeof next.message === "string") {
        state.error = next.message;
        return;
      }
      state.error = "Something went wrong";
    },
  },
});

export const {
  login,
  logout,
  updateUser,
  passwordChanged,
  setLoading,
  setError,
} = userSlice.actions;

export default userSlice.reducer;
