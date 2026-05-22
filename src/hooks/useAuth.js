import { useSelector } from "react-redux";
import { toErrorString } from "../api/utils";

export function useAuth() {
  const { value: user, loading, error } = useSelector((state) => state.user);

  return {
    user,
    loading,
    error: toErrorString(error) || null,
    isLoggedIn: user.is_logged_in,
    role: user.role,
    accessToken: user.access_token,
  };
}