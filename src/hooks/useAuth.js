import { useSelector } from "react-redux";

export function useAuth() {
  const { value: user, loading, error } = useSelector((state) => state.user);

  return {
    user,
    loading,
    error,
    isLoggedIn: user.is_logged_in,
    role: user.role,
    accessToken: user.access_token,
  };
}
