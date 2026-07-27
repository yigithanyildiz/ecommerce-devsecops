import axios from "axios";

export function getApiErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const message = error.response?.data?.message;
    const normalizedMessage = Array.isArray(message)
      ? message.join(", ")
      : message;

    if (status && normalizedMessage) {
      return `${fallback} (${status}: ${normalizedMessage})`;
    }

    if (status) {
      return `${fallback} (${status})`;
    }
  }

  return fallback;
}
