const BASE_URL = "https://api.geckoterminal.com/api/v2";

export async function geckoFetch(endpoint: string) {
  const res = await fetch(BASE_URL + endpoint, {
    headers: {
      accept: "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("GeckoTerminal API Error");
  }

  return res.json();
}