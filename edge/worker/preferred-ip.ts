const ENABLE_PREFERRED_IP_FOR_LIVELY_MATH = true;
const LIVELY_MATH_WORKER_HOST =
  "lively-math-8061.185023893.workers.dev";
const PREFERRED_IP_URL = "https://cf.090227.xyz/cmcc?ips=8";
const PREFERRED_IP_CACHE_SECONDS = 5 * 24 * 60 * 60;

function preferredServerPattern(): RegExp {
  return /(\bserver:\s*)(["']?)[a-z0-9-]+\.cf\.090227\.xyz\2(?![a-z0-9.-])/gi;
}

export async function applyPreferredIpsToYaml(yaml: string): Promise<string> {
  if (
    !ENABLE_PREFERRED_IP_FOR_LIVELY_MATH ||
    !yaml.includes(LIVELY_MATH_WORKER_HOST)
  ) {
    return yaml;
  }

  if (!preferredServerPattern().test(yaml)) return yaml;

  try {
    const preferredIps = await fetchPreferredIps();
    let index = 0;

    return yaml.replace(
      preferredServerPattern(),
      (_match: string, prefix: string, quote: string) => {
        const ip = preferredIps[index % preferredIps.length];
        index += 1;
        return `${prefix}${quote}${ip}${quote}`;
      }
    );
  } catch (error) {
    console.warn("[preferred-ip] 优选 IP 获取失败，保留原节点", error);
    return yaml;
  }
}

async function fetchPreferredIps(): Promise<string[]> {
  const response = await fetch(PREFERRED_IP_URL, {
    headers: { Accept: "text/plain" },
    cf: {
      cacheEverything: true,
      cacheTtl: PREFERRED_IP_CACHE_SECONDS,
    },
  } as RequestInit);

  if (!response.ok) {
    throw new Error(`优选接口返回 HTTP ${response.status}`);
  }

  const preferredIps = [
    ...new Set(
      (await response.text())
        .split(/\r?\n/)
        .map((line) => line.split("#", 1)[0].trim())
        .filter(isIPv4)
    ),
  ];

  if (preferredIps.length === 0) {
    throw new Error("优选接口没有返回有效 IPv4");
  }

  return preferredIps;
}

function isIPv4(value: string): boolean {
  const parts = value.split(".");

  return (
    parts.length === 4 &&
    parts.every(
      (part) => /^\d{1,3}$/.test(part) && Number(part) <= 255
    )
  );
}
