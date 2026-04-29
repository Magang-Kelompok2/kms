export class ApiResponseError extends Error {
  status: number;
  bodyText: string;

  constructor(message: string, status: number, bodyText = "") {
    super(message);
    this.name = "ApiResponseError";
    this.status = status;
    this.bodyText = bodyText;
  }
}

const isHtmlResponse = (contentType: string, bodyText: string) =>
  contentType.includes("text/html") ||
  /^\s*<!doctype html/i.test(bodyText) ||
  /^\s*<html/i.test(bodyText);

export async function parseApiResponse<T>(res: Response): Promise<T> {
  const contentType = res.headers.get("content-type")?.toLowerCase() ?? "";
  const bodyText = await res.text();

  if (!bodyText.trim()) {
    if (!res.ok) {
      throw new ApiResponseError(
        `Request gagal dengan status ${res.status}`,
        res.status,
        bodyText,
      );
    }

    return {} as T;
  }

  if (isHtmlResponse(contentType, bodyText)) {
    throw new ApiResponseError(
      `Server mengembalikan HTML, bukan JSON (status ${res.status})`,
      res.status,
      bodyText,
    );
  }

  try {
    return JSON.parse(bodyText) as T;
  } catch {
    throw new ApiResponseError(
      `Response API tidak valid (status ${res.status})`,
      res.status,
      bodyText,
    );
  }
}
