# Google Maps Setup Instructions

## Getting Your API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - Maps JavaScript API
   - Geocoding API (optional, for address lookup)
4. Go to "Credentials" → "Create Credentials" → "API Key"
5. Copy your API key

## Adding the API Key

1. Open `src/components/GoogleMap.jsx`
2. Find this line (around line 60):
   ```javascript
   const GOOGLE_MAPS_API_KEY = 'YOUR_GOOGLE_MAPS_API_KEY'
   ```
3. Replace `'YOUR_GOOGLE_MAPS_API_KEY'` with your actual API key:
   ```javascript
   const GOOGLE_MAPS_API_KEY = 'AIzaSyYourActualKeyHere'
   ```

## Customizing Pinpoint Locations

Edit the `PINPOINT_LOCATIONS` array in `src/components/GoogleMap.jsx`:

```javascript
const PINPOINT_LOCATIONS = [
  { id: 1, name: 'Location A', lat: 33.6844, lng: 73.0479, address: 'Your Address' },
  { id: 2, name: 'Location B', lat: 31.5497, lng: 74.3436, address: 'Another Address' },
  // Add more locations...
]
```

## Features

- ✅ Shows user's current GPS location
- ✅ Displays multiple pinpoint locations
- ✅ Automatically finds nearest location
- ✅ Shows distance to each location
- ✅ Highlights nearest location with red marker
- ✅ Interactive map with clickable markers

## Security Note

For production, consider using environment variables:

1. Create a `.env` file in the root directory:
   ```
   VITE_GOOGLE_MAPS_API_KEY=your_api_key_here
   ```

2. Update `GoogleMap.jsx`:
   ```javascript
   const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'YOUR_GOOGLE_MAPS_API_KEY'
   ```

3. Add `.env` to `.gitignore` to keep your key secure



