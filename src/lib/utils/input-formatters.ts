export function formatCurrencyCodeInput(value: string) {
  return value.replace(/[^a-zA-Z]/g, "").slice(0, 3).toUpperCase();
}

export function formatGstinInput(value: string) {
  return value.replace(/[^a-zA-Z0-9]/g, "").slice(0, 15).toUpperCase();
}

export function formatPanInput(value: string) {
  return value.replace(/[^a-zA-Z0-9]/g, "").slice(0, 10).toUpperCase();
}

export function formatInvoicePrefixInput(value: string) {
  return value.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8).toUpperCase();
}

export function formatPhoneInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 12);

  if (!digits) {
    return "";
  }

  if (digits.startsWith("91")) {
    const localPart = digits.slice(2);

    if (!localPart) {
      return "+91";
    }

    if (localPart.length <= 5) {
      return `+91 ${localPart}`.trim();
    }

    return `+91 ${localPart.slice(0, 5)} ${localPart.slice(5, 10)}`.trim();
  }

  if (digits.length <= 5) {
    return digits;
  }

  return `${digits.slice(0, 5)} ${digits.slice(5, 10)}`.trim();
}
