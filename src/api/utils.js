/** Unwraps `{ success, data: { ... } }` API envelopes. */
export function unwrapApiPayload(response) {
  if (!response || typeof response !== "object") {
    return response;
  }

  const nested = response.data;
  const hasNestedPayload =
    nested &&
    typeof nested === "object" &&
    !Array.isArray(nested) &&
    (nested.token != null ||
      nested.access_token != null ||
      nested.user != null ||
      nested.id != null ||
      nested._id != null ||
      Object.keys(nested).length > 0);

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

export function getApiErrorMessage(error, fallback = "Something went wrong") {
  const data = error?.response?.data;
  if (!data) {
    return error?.message ?? fallback;
  }

  if (typeof data === "string") {
    return data;
  }

  const payload = unwrapApiPayload(data);
  return (
    payload?.message ?? data.message ?? data.error ?? fallback
  );
}
