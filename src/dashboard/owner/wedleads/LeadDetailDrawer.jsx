import { useEffect, useState } from "react";
import { getClientLeadById } from "../../../api/clientLeads";
import { getApiErrorMessage } from "../../../api/utils";
import Drawer from "../../../components/common/Drawer";
import {
  CLIENT_LEAD_STATUS_STYLES,
} from "../../../constants/wedLeads";
import { cn } from "../../../utils/cn";
import {
  formatAmountINR,
  formatDateDisplay,
  getPersonDisplayName,
} from "../../../utils/clientLead";

function DetailRow({ label, children, preWrap }) {
  return (
    <div className="space-y-1.5">
      <dt className="text-xs font-medium uppercase tracking-wider text-zinc-500">
        {label}
      </dt>
      <dd
        className={cn(
          "text-sm text-zinc-800",
          preWrap && "whitespace-pre-wrap break-words",
        )}
      >
        {children || "—"}
      </dd>
    </div>
  );
}

function LeadDetailDrawer({ open, onClose, leadId }) {
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !leadId) {
      setLead(null);
      setError("");
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const detail = await getClientLeadById(leadId);
        if (!cancelled) setLead(detail);
      } catch (err) {
        if (!cancelled) {
          setError(getApiErrorMessage(err, "Failed to load lead details."));
          setLead(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, leadId]);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Lead details"
      description="View-only lead information from the marketing tracker."
      size="panel"
    >
      {loading ? (
        <p className="py-12 text-center text-sm text-zinc-400">Loading…</p>
      ) : null}

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {!loading && !error && lead ? (
        <dl className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium",
                CLIENT_LEAD_STATUS_STYLES[lead.status] ??
                  "border-zinc-200 bg-zinc-50 text-zinc-700",
              )}
            >
              {lead.status || "—"}
            </span>
            {lead.convertedByMarketing ? (
              <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
                Converted by Marketing
              </span>
            ) : null}
          </div>

          <DetailRow label="Estimated budget">
            {formatAmountINR(lead.estimatedBudget)}
          </DetailRow>
          <DetailRow label="Client details" preWrap>
            {lead.clientDetails?.trim() || "—"}
          </DetailRow>
          <DetailRow label="Event type details" preWrap>
            {lead.eventTypeDetails?.trim() || "—"}
          </DetailRow>
          <div className="grid gap-5 sm:grid-cols-2">
            <DetailRow label="Start date">
              {formatDateDisplay(lead.startDate)}
            </DetailRow>
            <DetailRow label="End date">
              {formatDateDisplay(lead.endDate)}
            </DetailRow>
          </div>
          <DetailRow label="Assigned to">
            {getPersonDisplayName(lead.assignedTo) || "—"}
          </DetailRow>
          <DetailRow label="Notes" preWrap>
            {lead.notes?.trim() || "—"}
          </DetailRow>
        </dl>
      ) : null}
    </Drawer>
  );
}

export default LeadDetailDrawer;
