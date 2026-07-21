type RemoteFetchOptions = {
  maxBytes: number;
  timeoutMs: number;
  userAgent: string;
  method?: "GET" | "HEAD";
  maxRedirects?: number;
};

export type RemoteFetchResult = {
  content: string;
  headers: Record<string, string>;
  status: number;
  finalUrl: string;
};

function isBlockedIpv4(hostname: string): boolean {
  const parts = hostname.split(".");
  if (parts.length !== 4 || parts.some((part) => !/^\d{1,3}$/.test(part))) return false;
  const bytes = parts.map(Number);
  if (bytes.some((part) => part > 255)) return true;
  const [a, b] = bytes;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 0) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  );
}

function isBlockedIpv6(hostname: string): boolean {
  const value = hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (!value.includes(":")) return false;
  if (value === "::" || value === "::1") return true;
  if (value.startsWith("fc") || value.startsWith("fd")) return true;
  if (/^fe[89ab]/.test(value)) return true;
  if (value.startsWith("2001:db8:")) return true;
  const mappedIpv4 = value.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/)?.[1];
  return mappedIpv4 ? isBlockedIpv4(mappedIpv4) : false;
}

export function assertPublicHttpUrl(input: string): URL {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw new Error("无效的订阅 URL");
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("只支持 HTTP 或 HTTPS 订阅 URL");
  }
  if (url.username || url.password) {
    throw new Error("订阅 URL 不允许包含用户名或密码");
  }

  const hostname = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (
    !hostname ||
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal") ||
    isBlockedIpv4(hostname) ||
    isBlockedIpv6(hostname)
  ) {
    throw new Error("禁止访问本机或内网地址");
  }

  return url;
}

function headersToRecord(headers: Headers): Record<string, string> {
  const result: Record<string, string> = {};
  headers.forEach((value, key) => {
    result[key.toLowerCase()] = value;
  });
  return result;
}

export async function fetchRemoteText(
  input: string,
  options: RemoteFetchOptions,
  fetchImpl: typeof fetch = fetch
): Promise<RemoteFetchResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs);
  let currentUrl = assertPublicHttpUrl(input).toString();

  try {
    for (let redirectCount = 0; redirectCount <= (options.maxRedirects ?? 3); redirectCount += 1) {
      assertPublicHttpUrl(currentUrl);
      const response = await fetchImpl(currentUrl, {
        method: options.method ?? "GET",
        redirect: "manual",
        signal: controller.signal,
        headers: {
          "User-Agent": options.userAgent,
          Accept: "text/plain, application/yaml, application/x-yaml, */*;q=0.8",
          "Cache-Control": "no-cache",
        },
      });

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        if (!location) throw new Error(`HTTP ${response.status}`);
        if (redirectCount === (options.maxRedirects ?? 3)) throw new Error("订阅重定向次数过多");
        currentUrl = new URL(location, currentUrl).toString();
        continue;
      }

      const contentLength = Number(response.headers.get("content-length") || "0");
      if (Number.isFinite(contentLength) && contentLength > options.maxBytes) {
        throw new Error("订阅响应过大");
      }

      const buffer = options.method === "HEAD" ? new ArrayBuffer(0) : await response.arrayBuffer();
      if (buffer.byteLength > options.maxBytes) throw new Error("订阅响应过大");
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      return {
        content: new TextDecoder().decode(buffer),
        headers: headersToRecord(response.headers),
        status: response.status,
        finalUrl: currentUrl,
      };
    }

    throw new Error("订阅重定向次数过多");
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("订阅请求超时");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
