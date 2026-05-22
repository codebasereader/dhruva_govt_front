function hasMeaningfulAuthFields(nested) {
  return Boolean(
    nested?.token ||
      nested?.access_token ||
      nested?.accessToken ||
      nested?.jwt ||
      nested?.user,
  );
}

/** Unwraps `{ success, data: { ... } }` API envelopes. */
export function unwrapApiPayload(response) {
  if (!response || typeof response !== "object") {
    return response;
  }

  if (response.success === false) {
    return response;
  }

  const nested = response.data;
  const hasNestedPayload =
    nested &&
    typeof nested === "object" &&
    !Array.isArray(nested) &&
    (hasMeaningfulAuthFields(nested) ||
      nested.id ||
      nested._id ||
      (response.success === true && Object.keys(nested).length > 0));

  if (hasNestedPayload && response.success !== undefined) {
    return nested;
  }

  if (Array.isArray(nested)) {
    return nested;
  }

  return response;
}

export function unwrapList(response) {
  const payload = unwrapApiPayload(response);

  if (Array.isArray(payload)) {
    return payload;
  }

  if (!payload || typeof payload !== "object") {
    return [];
  }

  const arrayKey = Object.keys(payload).find((key) =>
    Array.isArray(payload[key]),
  );

  return arrayKey ? payload[arrayKey] : [];
}

export function unwrapEntity(response) {
  return unwrapApiPayload(response);
}

export function toErrorString(value, fallback = "") {
  if (value == null) return fallback;
  if (typeof value === "string") return value;
  if (typeof value === "object" && typeof value.message === "string") {
    return value.message;
  }
  return fallback;
}

export function getApiErrorMessage(error, fallback = "Something went wrong") {
  if (typeof error === "string") return error;

  const data = error?.response?.data;
  if (!data) {
    return toErrorString(error, fallback);
  }

  if (typeof data === "string") {
    return data;
  }

  const payload = unwrapApiPayload(data);

  return (
    toErrorString(data.error) ||
    toErrorString(data.message) ||
    toErrorString(payload?.error) ||
    toErrorString(payload?.message) ||
    fallback
  );
}
