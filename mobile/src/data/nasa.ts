export interface NasaApod {
  date: string;
  title: string;
  explanation: string;
  media_type: "image" | "video";
  url: string;
  hdurl?: string;
  copyright?: string;
}

const APOD_URL = "https://api.nasa.gov/planetary/apod";

export async function fetchApod(apiKey: string, date?: string): Promise<NasaApod> {
  const url = new URL(APOD_URL);
  url.searchParams.set("api_key", apiKey || "DEMO_KEY");
  url.searchParams.set("thumbs", "true");
  if (date) {
    url.searchParams.set("date", date);
  }

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`NASA APOD request failed: ${response.status}`);
  }

  return (await response.json()) as NasaApod;
}

