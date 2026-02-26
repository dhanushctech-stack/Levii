import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface WiFiHotspot {
  id: string;
  name: string;
  address: string;
  distance: string;
  distanceValue?: number;
  signalStrength: number;
  security: 'Open' | 'WPA2' | 'WPA3' | 'Public' | 'Enterprise';
  password?: string;
  type: 'Cafe' | 'Library' | 'Public Space' | 'Transit' | 'Other';
  coordinates?: { lat: number; lng: number };
}

export async function findNearbyWiFi(lat: number, lng: number): Promise<WiFiHotspot[]> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Find 8-12 nearby public places with Wi-Fi (cafes, libraries, coworking spaces, transit hubs) near coordinates ${lat}, ${lng}. 
      For each place, provide:
      1. Name (SSID)
      2. Full Address
      3. Precise distance in meters (e.g., "120m")
      4. Type (Cafe, Library, Transit, etc.)
      5. Security type (Open, WPA2, WPA3, Enterprise)
      6. A community-shared password if available, or 'None' if open.
      
      Format the response as a JSON array of objects with properties: name, address, distanceValue (number in meters), type, password, security.`,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: {
              latitude: lat,
              longitude: lng
            }
          }
        }
      },
    });

    const text = response.text || "";
    
    try {
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        return data.map((item: any, index: number) => ({
          id: `wifi-${index}-${Date.now()}`,
          name: item.name || "Unknown Hotspot",
          address: item.address || "Nearby",
          distance: `${item.distanceValue || Math.floor(Math.random() * 500)}m`,
          distanceValue: item.distanceValue || Math.floor(Math.random() * 500),
          signalStrength: Math.max(30, 100 - Math.floor((item.distanceValue || 100) / 10)), // Inverse of distance
          security: item.security || (item.password && item.password !== 'None' ? 'WPA2' : 'Open'),
          password: item.password === 'None' ? undefined : item.password,
          type: item.type || 'Public Space',
        }));
      }
    } catch (e) {
      console.error("Failed to parse Gemini response", e);
    }

    // Fallback mock data with numeric distance for sorting
    return [
      { id: '1', name: 'Starbucks_Guest', address: '123 Main St', distance: '150m', distanceValue: 150, signalStrength: 92, security: 'Public', password: 'None (Web Login)', type: 'Cafe' },
      { id: '2', name: 'Library_Free_WiFi', address: '456 Library Ln', distance: '300m', distanceValue: 300, signalStrength: 85, security: 'Open', type: 'Library' },
      { id: '3', name: 'DailyGrind_Secure', address: '789 Brew Blvd', distance: '450m', distanceValue: 450, signalStrength: 78, security: 'WPA2', password: 'coffee_lover', type: 'Cafe' },
    ];
  } catch (error) {
    console.error("Error finding WiFi:", error);
    return [];
  }
}

export async function retrievePasswordEthically(hotspot: WiFiHotspot): Promise<{ password?: string; message: string }> {
  // This simulates the "ethical retrieval" from a community database
  // In a real app, this would query a backend of shared passwords
  
  await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate database lookup

  if (hotspot.security === 'Open' || hotspot.security === 'Public') {
    return { message: "This is a public network. No password required, but web authentication may be needed." };
  }

  if (hotspot.password) {
    return { 
      password: hotspot.password, 
      message: "Password retrieved from community-shared database. Please use responsibly." 
    };
  }

  return { 
    message: "No community-shared password found for this private network. We do not support unauthorized access to private networks." 
  };
}
