import { useState } from "react";
import { useDispatch } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { getApiErrorMessage, login as loginRequest } from "../../api/auth";
import { setAuthToken } from "../../api/client";
import AuthField from "../../components/auth/AuthField";
import LoginBrand from "../../components/auth/LoginBrand";
import { getDefaultPathForRole } from "../../config/navigation";
import { useAuth } from "../../hooks/useAuth";
import { login as loginAction, setError, setLoading } from "../../reducers/user";
import { cn } from "../../utils/cn";
import verifyToken from "../../utils/verifyToken";

const primaryButtonStyles =
  "w-full rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium tracking-tight text-white transition-colors hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/60 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";

function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { loading, error } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");
    dispatch(setError(null));
    setSubmitting(true);
    dispatch(setLoading(true));

    try {
      const { access_token, refresh_token, user } = await loginRequest({
        email: email.trim(),
        password,
      });

      const { status } = verifyToken(access_token);
      if (!status) {
        throw new Error("Invalid or unauthorized account.");
      }

      setAuthToken(access_token);

      dispatch(
        loginAction({
          id: user._id,
          name: user.name,
          email_id: user.email,
          role: user.role,
          access_token,
          refresh_token,
          is_logged_in: true,
        }),
      );

      const redirectTo =
        location.state?.from?.pathname ?? getDefaultPathForRole(user.role);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      const message = getApiErrorMessage(
        err,
        "Unable to sign in. Please check your credentials.",
      );
      setFormError(message);
      dispatch(setError(message));
    } finally {
      setSubmitting(false);
      dispatch(setLoading(false));
    }
  };

  const displayError = formError || error;
  const isBusy = submitting || loading;

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center bg-[#fafafa] px-4 py-12 text-zinc-900 antialiased">
      <div
        className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(120,119,198,0.08),transparent)]"
        aria-hidden
      />

      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-zinc-200/90 bg-white p-8 shadow-sm shadow-zinc-900/[0.02] sm:p-10">
          <LoginBrand className="mb-8" />

          <header className="mb-8 text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
              Welcome back
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-zinc-500">
              Sign in to access your workspace
            </p>
          </header>

          {displayError ? (
            <p
              className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              role="alert"
            >
              {displayError}
            </p>
          ) : null}

          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            <AuthField
              label="Email address"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@example.com"
              autoComplete="email"
              disabled={isBusy}
            />

            <AuthField
              label="Password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              disabled={isBusy}
            >
              <button
                type="button"
                className={cn(
                  "absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-zinc-400 transition-colors hover:text-zinc-700",
                  "outline-none focus-visible:ring-2 focus-visible:ring-zinc-400/60",
                )}
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                disabled={isBusy}
              >
                {showPassword ? (
                  <svg
                    className="size-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg
                    className="size-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </AuthField>

            <button
              type="submit"
              className={primaryButtonStyles}
              disabled={isBusy}
            >
              {isBusy ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;
