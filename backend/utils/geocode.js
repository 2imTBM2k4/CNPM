// Forward geocoding via TrackAsia: turns an address string into coordinates.
// Best-effort — callers treat a null result as "unknown location" rather than
// an error, so a geocoding hiccup never blocks creating/updating a restaurant.
//
// `public_key` works for development but is rate-limited; set TRACKASIA_KEY to
// your own key for production.
const KEY = process.env.TRACKASIA_KEY || "public_key";
const BASE = "https://maps.track-asia.com/api/v2";

export async function geocodeAddress(address) {
  if (!address || !address.trim()) return null;

  try {
    const url =
      `${BASE}/geocode/json?address=${encodeURIComponent(address)}` +
      `&key=${KEY}&new_admin=true&size=1`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;

    const data = await res.json();
    if (data.status !== "OK" || !data.results?.length) return null;

    const loc = data.results[0].geometry?.location;
    if (typeof loc?.lat !== "number" || typeof loc?.lng !== "number") {
      return null;
    }
    return { lat: loc.lat, lng: loc.lng };
  } catch {
    return null;
  }
}
