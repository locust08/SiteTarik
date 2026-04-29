type DebugDetails = Record<string, unknown>;

function toSerializableDetails(details: DebugDetails = {}) {
  return Object.fromEntries(
    Object.entries(details).map(([key, value]) => {
      if (value instanceof Error) {
        return [
          key,
          {
            name: value.name,
            message: value.message,
          },
        ];
      }

      return [key, value];
    }),
  );
}

export function logServerEvent(
  scope: string,
  message: string,
  details: DebugDetails = {},
) {
  console.log(`[debug:${scope}] ${message}`, toSerializableDetails(details));
}

export function logServerError(
  scope: string,
  message: string,
  error: unknown,
  details: DebugDetails = {},
) {
  const normalizedError =
    error instanceof Error
      ? {
          name: error.name,
          message: error.message,
          stack: error.stack,
        }
      : { value: error };

  console.error(`[debug:${scope}] ${message}`, {
    ...toSerializableDetails(details),
    error: normalizedError,
  });
}

export function getRequestDebugContext(request: Request) {
  const url = new URL(request.url);

  return {
    method: request.method,
    pathname: url.pathname,
    search: url.search,
    hasOriginHeader: Boolean(request.headers.get("origin")),
    userAgent: request.headers.get("user-agent") ?? "unknown",
  };
}
