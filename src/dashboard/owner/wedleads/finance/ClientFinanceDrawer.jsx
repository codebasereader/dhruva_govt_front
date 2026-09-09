import { useEffect, useState } from "react";
import {
  createClientFinance,
  updateClientFinance,
} from "../../../../api/clientFinances";
import { getApiErrorMessage } from "../../../../api/utils";
import Drawer from "../../../../components/common/Drawer";
import IndianAmountField from "../../../../components/common/IndianAmountField";
import { ADVANCE_STATUSES, ADVANCE_STATUS_OPTIONS } from "../../../../constants/finance";
import { cn } from "../../../../utils/cn";
import { computeAccountSplit, computeBalance } from "../../../../utils/clientFinanceAmounts";
import { formatAmountINR } from "../../../../utils/clientLead";

function genAdvanceId() {
  return `adv_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

function emptyForm() {
  return { agreedAmount: "", accountAmount: "", advances: [] };
}

function formFromRecord(record) {
  if (!record) return emptyForm();
  return {
    agreedAmount: String(record.agreedAmount ?? ""),
    accountAmount: String(record.accountAmount ?? ""),
    advances: (record.advances ?? []).map((advance) => ({
      ...advance,
      amount: String(advance.amount ?? ""),
    })),
  };
}

function ClientFinanceDrawer({
  open,
  onClose,
  sourceType,
  sourceId,
  financeRecord,
  readOnly,
  onSaved,
}) {
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setForm(formFromRecord(financeRecord));
    setError("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, financeRecord?.id]);

  const split = computeAccountSplit({
    agreedAmount: form.agreedAmount,
    accountAmount: form.accountAmount,
  });
  const balance = computeBalance({
    agreedAmount: form.agreedAmount,
    advances: form.advances,
  });

  const addAdvance = () => {
    setForm((prev) => ({
      ...prev,
      advances: [
        ...prev.advances,
        { id: genAdvanceId(), amount: "", date: "", status: ADVANCE_STATUSES.PENDING },
      ],
    }));
  };

  const removeAdvance = (id) => {
    setForm((prev) => ({
      ...prev,
      advances: prev.advances.filter((advance) => advance.id !== id),
    }));
  };

  const updateAdvance = (id, field, value) => {
    setForm((prev) => ({
      ...prev,
      advances: prev.advances.map((advance) =>
        advance.id === id ? { ...advance, [field]: value } : advance,
      ),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (readOnly) return;

    setSubmitting(true);
    setError("");
    try {
      const payload = {
        sourceType,
        sourceId,
        agreedAmount: Number(form.agreedAmount) || 0,
        accountAmount: Number(form.accountAmount) || 0,
        advances: form.advances.map((advance) => ({
          id: advance.id,
          amount: Number(advance.amount) || 0,
          date: advance.date,
          status: advance.status,
        })),
      };

      const saved = financeRecord
        ? await updateClientFinance(financeRecord.id, payload)
        : await createClientFinance(payload);

      onSaved?.(saved);
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to save finance details."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      size="wide"
      title={readOnly ? "Finance details" : "Edit finance details"}
      description="Agreed amount, account/cash split, and advances — stored separately from the client's source record."
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <IndianAmountField
            id="finance-agreed-amount"
            label="Agreed amount"
            value={form.agreedAmount}
            onChange={(digits) =>
              setForm((prev) => ({ ...prev, agreedAmount: digits }))
            }
            disabled={readOnly || submitting}
            required
          />
          <IndianAmountField
            id="finance-account-amount"
            label="Account amount"
            value={form.accountAmount}
            onChange={(digits) =>
              setForm((prev) => ({ ...prev, accountAmount: digits }))
            }
            disabled={readOnly || submitting}
            placeholder="0 = fully cash"
          />
        </div>

        <div className="grid gap-3 rounded-2xl border border-zinc-200/90 bg-zinc-50/60 p-4 text-sm sm:grid-cols-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Account GST (18%)
            </p>
            <p className="mt-1 font-semibold tabular-nums text-zinc-900">
              {formatAmountINR(split.accountGst)}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Account amount + GST
            </p>
            <p className="mt-1 font-semibold tabular-nums text-zinc-900">
              {formatAmountINR(split.accountAmountWithGst)}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Cash amount
            </p>
            <p className="mt-1 font-semibold tabular-nums text-zinc-900">
              {formatAmountINR(split.cashAmount)}
            </p>
          </div>
        </div>

        {split.isOverAgreed ? (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Account amount + GST exceeds the agreed amount — double-check the
            account amount before saving.
          </p>
        ) : null}

        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-zinc-900">Advances</h3>
              <p className="text-xs text-zinc-500">
                Only advances marked Received reduce the balance below.
              </p>
            </div>
            {!readOnly ? (
              <button
                type="button"
                onClick={addAdvance}
                disabled={submitting}
                className="cursor-pointer rounded-full border border-zinc-200 px-3.5 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
              >
                Add advance
              </button>
            ) : null}
          </div>

          <div className="space-y-3">
            {form.advances.length === 0 ? (
              <p className="rounded-xl border border-dashed border-zinc-200 px-4 py-6 text-center text-sm text-zinc-400">
                No advances yet.
              </p>
            ) : null}
            {form.advances.map((advance, index) => (
              <div
                key={advance.id}
                className="rounded-2xl border border-zinc-200 bg-zinc-50/50 p-4"
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Advance {index + 1}
                  </span>
                  {!readOnly ? (
                    <button
                      type="button"
                      onClick={() => removeAdvance(advance.id)}
                      disabled={submitting}
                      className="cursor-pointer text-sm font-medium text-red-500 hover:text-red-600 disabled:opacity-50"
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <IndianAmountField
                    id={`advance-amount-${advance.id}`}
                    label="Amount"
                    value={advance.amount}
                    onChange={(digits) => updateAdvance(advance.id, "amount", digits)}
                    disabled={readOnly || submitting}
                  />
                  <div className="space-y-2">
                    <label
                      htmlFor={`advance-date-${advance.id}`}
                      className="block text-xs font-medium uppercase tracking-wider text-zinc-500"
                    >
                      Date
                    </label>
                    <input
                      id={`advance-date-${advance.id}`}
                      type="date"
                      value={advance.date}
                      onChange={(e) =>
                        updateAdvance(advance.id, "date", e.target.value)
                      }
                      disabled={readOnly || submitting}
                      className="w-full rounded-xl border border-zinc-200 bg-zinc-50/60 px-4 py-3 text-sm text-zinc-900 outline-none transition-colors focus:border-zinc-300 focus:bg-white focus:ring-2 focus:ring-zinc-400/40 disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor={`advance-status-${advance.id}`}
                      className="block text-xs font-medium uppercase tracking-wider text-zinc-500"
                    >
                      Status
                    </label>
                    <select
                      id={`advance-status-${advance.id}`}
                      value={advance.status}
                      onChange={(e) =>
                        updateAdvance(advance.id, "status", e.target.value)
                      }
                      disabled={readOnly || submitting}
                      className="w-full cursor-pointer rounded-xl border border-zinc-200 bg-zinc-50/60 px-4 py-3 text-sm text-zinc-900 outline-none transition-colors focus:border-zinc-300 focus:bg-white focus:ring-2 focus:ring-zinc-400/40 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {ADVANCE_STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="flex items-center justify-between rounded-2xl border border-zinc-200/90 bg-white px-4 py-4 shadow-sm shadow-zinc-900/[0.02]">
          <span className="text-sm font-medium text-zinc-600">Balance</span>
          <span
            className={cn(
              "text-lg font-semibold tabular-nums",
              balance <= 0 ? "text-emerald-700" : "text-amber-800",
            )}
          >
            {formatAmountINR(balance)}
          </span>
        </div>

        {error ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        {!readOnly ? (
          <footer className="sticky bottom-0 -mx-6 mt-8 flex gap-3 border-t border-zinc-100 bg-white px-6 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 cursor-pointer rounded-full border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 cursor-pointer rounded-full bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
            >
              {submitting ? "Saving…" : "Save"}
            </button>
          </footer>
        ) : null}
      </form>
    </Drawer>
  );
}

export default ClientFinanceDrawer;
