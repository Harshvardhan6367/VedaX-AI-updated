import axios from 'axios';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

export interface LocationData {
    city: string;
    fullAddress: string;
}

export const getReverseGeocode = async (lat: number, lng: number): Promise<LocationData | null> => {
    try {
        // 1. Try Google Maps API if Key exists
        if (GOOGLE_MAPS_API_KEY) {
            console.log("🗺️ Using Google Maps API for Geocoding...");
            const response = await axios.get(
                `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`
            );

            if (response.data.status === 'OK' && response.data.results.length > 0) {
                const result = response.data.results[0];
                // Extract city (locality)
                const cityComp = result.address_components.find((c: any) => c.types.includes('locality'))
                    || result.address_components.find((c: any) => c.types.includes('administrative_area_level_2'));

                return {
                    city: cityComp ? cityComp.long_name : "Nearby",
                    fullAddress: result.formatted_address
                };
            }
        } else {
            console.warn("⚠️ No Google Maps API Key found. Using OpenStreetMap fallback.");
        }

        // 2. Fallback: OpenStreetMap (Free, No Key)
        // Useful if user hasn't put the key in yet, ensures "workability"
        const response = await axios.get(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
        );

        if (response.data && response.data.address) {
            const city = response.data.address.city || response.data.address.town || response.data.address.village || "Nearby";
            return {
                city: city,
                fullAddress: response.data.display_name
            };
        }

        return null;

    } catch (error) {
        console.error("Geocoding Error:", error);
        return null;
    }
};
