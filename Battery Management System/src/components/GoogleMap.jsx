import { useState, useEffect, useCallback, useMemo } from 'react'
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api'
import OsmMap from './OsmMap'
import './GoogleMap.css'

const HAS_GOOGLE_KEY = (() => {
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  return Boolean(key && key !== 'YOUR_GOOGLE_MAPS_API_KEY')
})()

// Sample pinpoint locations - you can customize these
const PINPOINT_LOCATIONS = [
  { id: 1, name: 'Location A', lat: 33.6844, lng: 73.0479, address: 'Islamabad, Pakistan' },
  { id: 2, name: 'Location B', lat: 31.5497, lng: 74.3436, address: 'Lahore, Pakistan' },
  { id: 3, name: 'Location C', lat: 24.8607, lng: 67.0011, address: 'Karachi, Pakistan' },
  { id: 4, name: 'Location D', lat: 34.0151, lng: 71.5249, address: 'Peshawar, Pakistan' },
  { id: 5, name: 'Location E', lat: 30.1575, lng: 71.5249, address: 'Multan, Pakistan' },
]

// Calculate distance between two coordinates using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371 // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c // Distance in km
}

// Find nearest location
function findNearestLocation(userLat, userLng, locations) {
  let nearest = null
  let minDistance = Infinity

  locations.forEach(location => {
    const distance = calculateDistance(userLat, userLng, location.lat, location.lng)
    if (distance < minDistance) {
      minDistance = distance
      nearest = { ...location, distance }
    }
  })

  return nearest
}

const mapContainerStyle = {
  width: '100%',
  height: '600px',
}

/** Dark green sci-fi map tiles — matches app theme */
const DARK_MAP_STYLES = [
  { elementType: 'geometry', stylers: [{ color: '#060d09' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#020504' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#6b8f7a' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#1e3d2c' }] },
  { featureType: 'administrative.land_parcel', elementType: 'labels.text.fill', stylers: [{ color: '#4a6356' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#0f1a14' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#5a7a68' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#0a1810' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#152219' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#1a2e22' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#1f3d2c' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#2d5c42' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#7a9a87' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#0f1a14' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#030a06' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#3d5c4a' }] },
]

const defaultCenter = {
  lat: 33.6844,
  lng: 73.0479
}

function GoogleMapComponent() {
  const [userPosition, setUserPosition] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [nearestLocation, setNearestLocation] = useState(null)
  const [map, setMap] = useState(null)
  const [address, setAddress] = useState('Loading address...')

  const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''

  useEffect(() => {
    if (navigator.geolocation) {
      const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords
          setUserPosition({ lat: latitude, lng: longitude })
          setLoading(false)

          // Find nearest location
          const nearest = findNearestLocation(latitude, longitude, PINPOINT_LOCATIONS)
          setNearestLocation(nearest)

          // Get address using reverse geocoding
          fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`)
            .then(res => res.json())
            .then(data => {
              if (data.display_name) {
                setAddress(data.display_name)
              }
            })
            .catch(() => setAddress('Address not available'))

          // Watch position for updates
          navigator.geolocation.watchPosition(
            (pos) => {
              const { latitude, longitude } = pos.coords
              setUserPosition({ lat: latitude, lng: longitude })
              const nearest = findNearestLocation(latitude, longitude, PINPOINT_LOCATIONS)
              setNearestLocation(nearest)
            },
            (err) => console.error('Error watching position:', err),
            options
          )
        },
        (err) => {
          setError(err.message)
          setLoading(false)
          // Use default location if GPS fails
          const defaultPos = { lat: 33.6844, lng: 73.0479 }
          setUserPosition(defaultPos)
          const nearest = findNearestLocation(defaultPos.lat, defaultPos.lng, PINPOINT_LOCATIONS)
          setNearestLocation(nearest)
        },
        options
      )
    } else {
      setError('Geolocation is not supported')
      setLoading(false)
      const defaultPos = { lat: 33.6844, lng: 73.0479 }
      setUserPosition(defaultPos)
      const nearest = findNearestLocation(defaultPos.lat, defaultPos.lng, PINPOINT_LOCATIONS)
      setNearestLocation(nearest)
    }
  }, [])

  const onLoad = useCallback((map) => {
    setMap(map)
  }, [])

  const onUnmount = useCallback(() => {
    setMap(null)
  }, [])

  const center = useMemo(() => {
    return userPosition || defaultCenter
  }, [userPosition])

  if (loading) {
    return (
      <div className="map-container">
        <div className="map-loading">
          <div className="spinner-large"></div>
          <p>Getting your location...</p>
          <p className="loading-hint">Please allow location access when prompted</p>
        </div>
      </div>
    )
  }

  return (
    <div className="map-container">
      <div className="map-header">
        <div className="location-info">
          <h2>Nearest charge point</h2>
          {userPosition && (
            <div className="location-details">
              <div className="location-item">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M10 10.8333C11.3807 10.8333 12.5 9.71405 12.5 8.33333C12.5 6.95262 11.3807 5.83333 10 5.83333C8.61929 5.83333 7.5 6.95262 7.5 8.33333C7.5 9.71405 8.61929 10.8333 10 10.8333Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M10 18.3333C13.3333 15 16.6667 12.0152 16.6667 8.33333C16.6667 4.65143 13.6814 1.66667 10 1.66667C6.31858 1.66667 3.33333 4.65143 3.33333 8.33333C3.33333 12.0152 6.66667 15 10 18.3333Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>{address}</span>
              </div>
              <div className="location-item">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M10 1.66667V3.33333M10 16.6667V18.3333M18.3333 10H16.6667M3.33333 10H1.66667M15.8333 4.16667L14.6583 5.34167M5.34167 14.6583L4.16667 15.8333M15.8333 15.8333L14.6583 14.6583M5.34167 5.34167L4.16667 4.16667" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Lat: {userPosition.lat.toFixed(6)}, Lng: {userPosition.lng.toFixed(6)}</span>
              </div>
            </div>
          )}
          {nearestLocation && (
            <div className="nearest-location-banner">
              <div className="nearest-icon">📍</div>
              <div className="nearest-info">
                <strong>Nearest Location: {nearestLocation.name}</strong>
                <p>{nearestLocation.address}</p>
                <p className="distance">Distance: {nearestLocation.distance.toFixed(2)} km away</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="map-wrapper">
        {!HAS_GOOGLE_KEY ? (
          <OsmMap
            center={center}
            userPosition={userPosition}
            locations={PINPOINT_LOCATIONS}
            nearestLocation={nearestLocation}
            address={address}
            onSelectLocation={setSelectedLocation}
          />
        ) : (
          <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY}>
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={center}
              zoom={10}
              onLoad={onLoad}
              onUnmount={onUnmount}
              options={{
                styles: DARK_MAP_STYLES,
                backgroundColor: '#060d09',
                zoomControl: true,
                streetViewControl: false,
                mapTypeControl: false,
                fullscreenControl: true,
              }}
            >
              {/* User's current location marker */}
              {userPosition && (
                <Marker
                  position={userPosition}
                  icon={{
                    url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
                  }}
                  title="Your Location"
                >
                  <InfoWindow>
                    <div className="marker-popup">
                      <strong>You are here!</strong>
                      <p>{address}</p>
                    </div>
                  </InfoWindow>
                </Marker>
              )}

              {/* Pinpoint location markers */}
              {PINPOINT_LOCATIONS.map((location) => {
                const isNearest = nearestLocation && nearestLocation.id === location.id
                return (
                  <Marker
                    key={location.id}
                    position={{ lat: location.lat, lng: location.lng }}
                    icon={{
                      url: isNearest
                        ? 'http://maps.google.com/mapfiles/ms/icons/yellow-dot.png'
                        : 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
                    }}
                    title={location.name}
                    onClick={() => setSelectedLocation(location)}
                  >
                    {selectedLocation && selectedLocation.id === location.id && (
                      <InfoWindow onCloseClick={() => setSelectedLocation(null)}>
                        <div className="marker-popup">
                          <strong>{location.name}</strong>
                          <p>{location.address}</p>
                          {nearestLocation && nearestLocation.id === location.id && (
                            <p className="nearest-indicator">⭐ Nearest to you!</p>
                          )}
                          {userPosition && (
                            <p className="distance-info">
                              Distance: {calculateDistance(userPosition.lat, userPosition.lng, location.lat, location.lng).toFixed(2)} km
                            </p>
                          )}
                        </div>
                      </InfoWindow>
                    )}
                  </Marker>
                )
              })}
            </GoogleMap>
          </LoadScript>
        )}
      </div>

      <div className="locations-list-panel">
        <h3>All Locations</h3>
        <div className="locations-grid">
          {PINPOINT_LOCATIONS.map((location) => {
            const isNearest = nearestLocation && nearestLocation.id === location.id
            const distance = userPosition 
              ? calculateDistance(userPosition.lat, userPosition.lng, location.lat, location.lng)
              : null
            return (
              <div 
                key={location.id} 
                className={`location-card ${isNearest ? 'nearest' : ''}`}
                onClick={() => setSelectedLocation(location)}
              >
                <div className="location-card-header">
                  <strong>{location.name}</strong>
                  {isNearest && <span className="nearest-badge">Nearest</span>}
                </div>
                <p>{location.address}</p>
                {distance !== null && (
                  <p className="distance-text">📍 {distance.toFixed(2)} km away</p>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default GoogleMapComponent

