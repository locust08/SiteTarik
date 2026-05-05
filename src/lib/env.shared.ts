function normalizeEnvValue(value: string | undefined) {
  const trimmedValue = value?.trim();

  return trimmedValue && trimmedValue.length > 0 ? trimmedValue : null;
}

export function readOptionalEnvValue(name: string) {
  return normalizeEnvValue(globalThis.process?.env?.[name]);
}

export function readOptionalPublicEnvValue(name: `NEXT_PUBLIC_${string}`) {
  return readOptionalEnvValue(name) ?? "";
}
