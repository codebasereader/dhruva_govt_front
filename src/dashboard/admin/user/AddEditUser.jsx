import { useState } from "react";
import { createUser, updateUser } from "../../../api/user";
import { getApiErrorMessage } from "../../../api/utils";
import FormField from "../../../components/common/FormField";
import { ROLE_OPTIONS } from "../../../constants/roleOptions";
import { ROLES } from "../../../../config.js";
import { getEntityId } from "../../../utils/entity";
import { cn } from "../../../utils/cn";

const btnPrimary =
  "cursor-pointer rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50";
const btnSecondary =
  "cursor-pointer rounded-full border border-zinc-200 px-5 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50";

function AddEditUser({ user, onSuccess, onCancel }) {
  const isEdit = Boolean(user);
  const [form, setForm] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
    password: "",
    role: user?.role?.toLowerCase?.() ?? ROLES.Owner,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        role: form.role,
      };

      if (!isEdit || form.password) {
        payload.password = form.password;
      }

      if (isEdit) {
        await updateUser(getEntityId(user), payload);
      } else {
        if (!payload.password) {
          setError("Password is required for new users.");
          setSubmitting(false);
          return;
        }
        await createUser(payload);
      }

      onSuccess();
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to save user."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="flex h-full flex-col" onSubmit={handleSubmit}>
      <div className="flex-1 space-y-5">
        {error ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <FormField
          id="user-name"
          label="Name"
          value={form.name}
          onChange={handleChange("name")}
          placeholder="Staff Admin"
          required
          disabled={submitting}
        />

        <FormField
          id="user-email"
          label="Email"
          type="email"
          value={form.email}
          onChange={handleChange("email")}
          placeholder="staff@example.com"
          required
          disabled={submitting}
        />

        <FormField
          id="user-password"
          label={isEdit ? "Password (leave blank to keep)" : "Password"}
          type="password"
          value={form.password}
          onChange={handleChange("password")}
          placeholder="Staff@12345"
          required={!isEdit}
          disabled={submitting}
        />

        <FormField
          id="user-role"
          label="Role"
          as="select"
          value={form.role}
          onChange={handleChange("role")}
          options={ROLE_OPTIONS}
          required
          disabled={submitting}
        />
      </div>

      <div className="mt-8 flex gap-3 border-t border-zinc-100 pt-6">
        <button
          type="button"
          className={cn(btnSecondary, "flex-1")}
          onClick={onCancel}
          disabled={submitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className={cn(btnPrimary, "flex-1")}
          disabled={submitting}
        >
          {submitting ? "Saving…" : isEdit ? "Update" : "Create"}
        </button>
      </div>
    </form>
  );
}

export default AddEditUser;
