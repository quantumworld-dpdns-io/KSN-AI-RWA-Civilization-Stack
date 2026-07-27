export interface ElectricityPriceRow {
  region: string;
  currentPrice: number;
  averagePrice: number;
  minimumPrice: number;
  maximumPrice: number;
  currency: string;
  updatedAt: string;
  source: string;
  alert: boolean;
}

const ACTOR_ID = "mukedlii~global-electricity-price-monitor";

export async function fetchElectricityPrices(token?: string): Promise<ElectricityPriceRow[]> {
  if (!token) {
    return fallbackElectricityRows();
  }

  const url = new URL(`https://api.apify.com/v2/acts/${ACTOR_ID}/run-sync-get-dataset-items`);
  url.searchParams.set("format", "json");
  url.searchParams.set("clean", "true");
  url.searchParams.set("token", token);

  const response = await fetch(url.toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({})
  });

  if (!response.ok) {
    throw new Error(`Apify request failed: ${response.status}`);
  }

  const raw = (await response.json()) as unknown;
  const rows = normalizeRows(raw);
  return rows.length > 0 ? rows : fallbackElectricityRows();
}

function normalizeRows(raw: unknown): ElectricityPriceRow[] {
  const items = Array.isArray(raw) ? raw : Array.isArray((raw as { items?: unknown[] } | null)?.items) ? (raw as { items: unknown[] }).items : [];

  return items
    .map((item, index) => {
      const record = isRecord(item) ? item : {};
      const region = pickString(record, ["region", "country", "countryName", "market", "area"], `Market ${index + 1}`);
      const currentPrice = pickNumber(record, ["currentPrice", "price", "spotPrice", "value", "avgPrice"], 0);
      const averagePrice = pickNumber(record, ["averagePrice", "avgPrice", "meanPrice", "average"], currentPrice);
      const minimumPrice = pickNumber(record, ["minimumPrice", "minPrice", "low", "min"], currentPrice);
      const maximumPrice = pickNumber(record, ["maximumPrice", "maxPrice", "high", "max"], currentPrice);
      const currency = pickString(record, ["currency", "currencyCode"], "EUR");
      const updatedAt = pickString(record, ["updatedAt", "timestamp", "time", "date"], new Date().toISOString());
      const source = pickString(record, ["source", "provider", "origin"], "Apify");
      const threshold = pickNumber(record, ["threshold", "alertThreshold"], averagePrice * 1.1);

      return {
        region,
        currentPrice,
        averagePrice,
        minimumPrice,
        maximumPrice,
        currency,
        updatedAt,
        source,
        alert: currentPrice >= threshold
      };
    })
    .filter((row) => Number.isFinite(row.currentPrice));
}

function fallbackElectricityRows(): ElectricityPriceRow[] {
  return [
    {
      region: "Germany",
      currentPrice: 92.4,
      averagePrice: 84.7,
      minimumPrice: 63.2,
      maximumPrice: 119.5,
      currency: "EUR",
      updatedAt: new Date().toISOString(),
      source: "Fallback demo data",
      alert: true
    },
    {
      region: "France",
      currentPrice: 68.1,
      averagePrice: 71.3,
      minimumPrice: 54.9,
      maximumPrice: 87.6,
      currency: "EUR",
      updatedAt: new Date().toISOString(),
      source: "Fallback demo data",
      alert: false
    },
    {
      region: "Spain",
      currentPrice: 74.8,
      averagePrice: 69.2,
      minimumPrice: 52.1,
      maximumPrice: 91.4,
      currency: "EUR",
      updatedAt: new Date().toISOString(),
      source: "Fallback demo data",
      alert: false
    }
  ];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function pickString(record: Record<string, unknown>, keys: string[], fallback: string): string {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }
  return fallback;
}

function pickNumber(record: Record<string, unknown>, keys: string[], fallback: number): number {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === "string") {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }
  return fallback;
}

