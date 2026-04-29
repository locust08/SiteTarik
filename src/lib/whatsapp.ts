type WhatsAppHrefOptions = {
  message?: string;
  fallbackHref: string;
};

function normalizeWhatsAppNumber(value: string) {
  return value.replace(/[^\d]/g, "");
}

function buildWhatsAppHrefFromNumber(number: string, message?: string) {
  const normalizedNumber = normalizeWhatsAppNumber(number);

  if (!normalizedNumber) {
    return null;
  }

  const url = new URL(`https://wa.me/${normalizedNumber}`);

  if (message) {
    url.searchParams.set("text", message);
  }

  return url.toString();
}

export function getSiteTarikWhatsAppHref({ message, fallbackHref }: WhatsAppHrefOptions) {
  const configuredChatUrl = globalThis.process?.env?.NEXT_PUBLIC_WHATSAPP_CHAT_URL?.trim();

  if (configuredChatUrl) {
    return configuredChatUrl;
  }

  const configuredNumber = globalThis.process?.env?.NEXT_PUBLIC_WHATSAPP_NUMBER?.trim();

  if (configuredNumber) {
    const configuredHref = buildWhatsAppHrefFromNumber(configuredNumber, message);

    if (configuredHref) {
      return configuredHref;
    }
  }

  return fallbackHref;
}
