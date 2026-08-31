import Drawer from "../../../components/common/Drawer";
import { cn } from "../../../utils/cn";
import {
  formatBookingAmount,
  formatBookingDate,
  getCeremonyName,
  getEventName,
  getPersonName,
  getVenueName,
  isCompletePaymentWedding,
} from "../../../utils/clientBooking";

function Field({ label, children }) {
  return (
    <div className="space-y-1">
      <dt className="text-xs font-medium uppercase tracking-wider text-zinc-500">
        {label}
      </dt>
      <dd className="text-sm text-zinc-800">{children || "—"}</dd>
    </div>
  );
}

function AmountBreakdown({ et }) {
  if (!et) return null;
  const rows = [
    ["Agreed amount", et.agreedAmount],
    ["Account amount", et.accountAmount],
    ["Account GST", et.accountGst],
    ["Account + GST", et.accountAmountWithGst],
    ["Cash amount", et.cashAmount],
    ["Total payable", et.totalPayable],
  ];
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200">
      <table className="w-full text-sm">
        <tbody className="divide-y divide-zinc-100">
          {rows.map(([label, value]) => (
            <tr key={label}>
              <td className="px-3 py-2 text-zinc-500">{label}</td>
              <td className="px-3 py-2 text-right font-medium tabular-nums text-zinc-900">
                {formatBookingAmount(value)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AdvancesTable({ advances }) {
  const rows = Array.isArray(advances) ? advances : [];
  if (!rows.length) {
    return <p className="text-sm text-zinc-400">No advance payments.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200">
      <table className="w-full min-w-[900px] text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-100 bg-zinc-50/80">
            {[
              "Advance #",
              "Expected Amount",
              "Expected Date",
              "Received Amount",
              "Received Date",
              "Given by",
              "Collected by",
              "Mode of payment",
              "Remarks",
            ].map((h) => (
              <th
                key={h}
                className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-zinc-500"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {rows.map((adv, idx) => {
            const received = Number(adv.receivedAmount) || 0;
            return (
              <tr key={`${adv.advanceNumber ?? idx}`}>
                <td className="px-3 py-2.5">{adv.advanceNumber ?? idx + 1}</td>
                <td className="px-3 py-2.5 tabular-nums">
                  {formatBookingAmount(adv.expectedAmount)}
                </td>
                <td className="px-3 py-2.5 whitespace-nowrap">
                  {formatBookingDate(adv.advanceDate)}
                </td>
                <td
                  className={cn(
                    "px-3 py-2.5 tabular-nums",
                    received > 0 && "font-medium text-emerald-700",
                  )}
                >
                  {formatBookingAmount(adv.receivedAmount)}
                </td>
                <td className="px-3 py-2.5 whitespace-nowrap">
                  {formatBookingDate(adv.receivedDate)}
                </td>
                <td className="px-3 py-2.5">{adv.givenBy || "—"}</td>
                <td className="px-3 py-2.5">{adv.collectedBy || "—"}</td>
                <td className="px-3 py-2.5">{adv.modeOfPayment || "—"}</td>
                <td className="px-3 py-2.5">{adv.remarks || "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function CeremonyMeta({ et }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <Field label="Start date">{formatBookingDate(et.startDate)}</Field>
      <Field label="End date">{formatBookingDate(et.endDate)}</Field>
      <Field label="Venue">{getVenueName(et.venueLocation)}</Field>
      <Field label="Sub venue">{getVenueName(et.subVenueLocation)}</Field>
      <Field label="Coordinator">{getPersonName(et.coordinator) || "—"}</Field>
    </div>
  );
}

function BookingDetailDrawer({ open, onClose, booking }) {
  const completeWedding = booking ? isCompletePaymentWedding(booking) : false;
  const eventTypes = booking?.eventTypes || [];
  const title = booking ? getEventName(booking.eventName) : "Booking details";

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={title}
      description="View-only booking details"
      size="booking"
    >
      {!booking ? (
        <p className="py-10 text-center text-sm text-zinc-400">No booking selected.</p>
      ) : (
        <div className="space-y-6">
          <section className="rounded-2xl border border-zinc-200 bg-zinc-50/50 p-4">
            <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Client Name">{booking.clientName || "—"}</Field>
              {booking.brideName && booking.groomName ? (
                <Field label="Bride / Groom">
                  {booking.brideName} & {booking.groomName}
                </Field>
              ) : null}
              <Field label="Contact">{booking.contactNumber || "—"}</Field>
              <Field label="Alt Contact">{booking.altContactNumber || "—"}</Field>
              <Field label="Project Coordinator 1">
                {getPersonName(booking.lead1) || "—"}
              </Field>
              <Field label="Project Coordinator 2">
                {getPersonName(booking.lead2) || "—"}
              </Field>
            </dl>
          </section>

          {completeWedding ? (
            <>
              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-zinc-900">
                  Complete Package Amount Breakdown
                </h3>
                <AmountBreakdown et={eventTypes[0]} />
              </section>

              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-zinc-900">Ceremonies</h3>
                {eventTypes.map((et, idx) => (
                  <div
                    key={et._id ?? et.id ?? idx}
                    className="space-y-3 rounded-2xl border border-zinc-200 p-4"
                  >
                    <p className="font-medium text-zinc-900">{getCeremonyName(et)}</p>
                    <CeremonyMeta et={et} />
                  </div>
                ))}
              </section>

              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-zinc-900">
                  Common Advance Payments
                </h3>
                <AdvancesTable advances={eventTypes[0]?.advances} />
              </section>
            </>
          ) : (
            <section className="space-y-4">
              {eventTypes.length === 0 ? (
                <p className="text-sm text-zinc-400">No event types.</p>
              ) : (
                eventTypes.map((et, idx) => (
                  <div
                    key={et._id ?? et.id ?? idx}
                    className="space-y-4 rounded-2xl border border-zinc-200 p-4"
                  >
                    <p className="font-medium text-zinc-900">{getCeremonyName(et)}</p>
                    <CeremonyMeta et={et} />
                    <AmountBreakdown et={et} />
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                        Advances
                      </h4>
                      <AdvancesTable advances={et.advances} />
                    </div>
                  </div>
                ))
              )}
            </section>
          )}
        </div>
      )}
    </Drawer>
  );
}

export default BookingDetailDrawer;
