const ENABLE_PREFERRED_IP_FOR_LIVELY_MATH = true;
const LIVELY_MATH_WORKER_HOST =
  "lively-math-8061.185023893.workers.dev";
const PREFERRED_IP_URLS = [
  "https://cf.090227.xyz/ct?ips=6",
  "https://cf.090227.xyz/cu",
  "https://cf.090227.xyz/cmcc?ips=8",
];
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
  const results = await Promise.allSettled(
    PREFERRED_IP_URLS.map(fetchPreferredIpSource)
  );
  const pools: string[][] = [];

  for (const result of results) {
    if (result.status === "fulfilled" && result.value.length > 0) {
      pools.push(result.value);
    }
  }

  if (pools.length === 0) {
    throw new Error("三网优选接口均未返回有效 IPv4");
  }

  const preferredIps: string[] = [];
  const seen = new Set<string>();
  const maxPoolSize = Math.max(...pools.map((pool) => pool.length));

  for (let index = 0; index < maxPoolSize; index += 1) {
    for (const pool of pools) {
      const ip = pool[index];
      if (ip && !seen.has(ip)) {
        seen.add(ip);
        preferredIps.push(ip);
      }
    }
  }

  return preferredIps;
}

async function fetchPreferredIpSource(url: string): Promise<string[]> {
  const response = await fetch(url, {
    headers: { Accept: "text/plain" },
    cf: {
      cacheEverything: true,
      cacheTtl: PREFERRED_IP_CACHE_SECONDS,
    },
  } as RequestInit);

  if (!response.ok) {
    throw new Error(`优选接口返回 HTTP ${response.status}`);
  }

  return [
    ...new Set(
      (await response.text())
        .split(/\r?\n/)
        .map((line) => line.split("#", 1)[0].trim())
        .filter(isIpv4)
    ),
  ];
}

function isIpv4(value: string): boolean {
  const parts = value.split(".");

  return (
    parts.length === 4 &&
    parts.every(
      (part) => /^\d{1,3}$/.test(part) && Number(part) <= 255
    )
  );
}
