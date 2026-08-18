import { useCallback, useState } from "react";

// Wraps the browser Geolocation API. Calling `locate()` triggers the native
// permission prompt (the same popup GrabFood shows on first visit) and, on
// success, returns high-accuracy coordinates.
//
// High accuracy asks the browser to use GPS / Wi-Fi / cell data instead of a
// coarse IP lookup. Requires a secure context (HTTPS or localhost).
const messageForError = (error) => {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return "Location permission denied. Enable it in your browser to auto-fill your address.";
    case error.POSITION_UNAVAILABLE:
      return "Your location is currently unavailable. Try again or pick a point on the map.";
    case error.TIMEOUT:
      return "Locating you took too long. Try again.";
    default:
      return "Could not get your location.";
  }
};

export default function useGeolocation() {
  const [loading, setLoading] = useState(false);
  const [coords, setCoords] = useState(null);
  const [error, setError] = useState(null);

  const locate = useCallback(() => {
    return new Promise((resolve) => {
      if (!("geolocation" in navigator)) {
        const message = "Geolocation is not supported by this browser.";
        setError(message);
        resolve({ error: message });
        return;
      }

      setLoading(true);
      setError(null);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const next = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
          };
          setCoords(next);
          setLoading(false);
          resolve({ coords: next });
        },
        (geoError) => {
          const message = messageForError(geoError);
          setError(message);
          setLoading(false);
          resolve({ error: message });
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  }, []);

  return { loading, coords, error, locate };
}
