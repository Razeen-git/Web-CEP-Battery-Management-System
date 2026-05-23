import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})
L.Marker.prototype.options.icon = DefaultIcon

const greenIcon = L.divIcon({
  className: 'osm-marker osm-marker-site',
  html: '<span></span>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
})

const userIcon = L.divIcon({
  className: 'osm-marker osm-marker-user',
  html: '<span></span>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
})

const nearestIcon = L.divIcon({
  className: 'osm-marker osm-marker-nearest',
  html: '<span></span>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
})

function OsmMap({ center, userPosition, locations, nearestLocation, address, onSelectLocation }) {
  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={6}
      className="osm-map"
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; CARTO'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      {userPosition && (
        <Marker position={[userPosition.lat, userPosition.lng]} icon={userIcon}>
          <Popup>
            <strong>You are here</strong>
            <br />
            {address}
          </Popup>
        </Marker>
      )}
      {locations.map((loc) => {
        const isNearest = nearestLocation?.id === loc.id
        return (
          <Marker
            key={loc.id}
            position={[loc.lat, loc.lng]}
            icon={isNearest ? nearestIcon : greenIcon}
            eventHandlers={{ click: () => onSelectLocation?.(loc) }}
          >
            <Popup>
              <strong>{loc.name}</strong>
              <br />
              {loc.address}
              {isNearest && (
                <>
                  <br />
                  <em>Nearest to you</em>
                </>
              )}
            </Popup>
          </Marker>
        )
      })}
    </MapContainer>
  )
}

export default OsmMap
