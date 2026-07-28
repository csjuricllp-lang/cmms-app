import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import type { Location } from '../types';
import { useEffect } from 'react';

// Fix for default marker icon in Leaflet + React
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    iconRetinaUrl: markerIcon2x,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface LocationsMapViewProps {
    locations: Location[];
    isLoading: boolean;
}

// Component to handle auto-centering when locations change
const RecenterMap = ({ locations }: { locations: Location[] }) => {
    const map = useMap();
    useEffect(() => {
        const points = (locations || [])
            .map((l, i) => {
                const lat = l.latitude !== null && l.latitude !== undefined ? Number(l.latitude) : null;
                const lng = l.longitude !== null && l.longitude !== undefined ? Number(l.longitude) : null;
                if (lat !== null && lng !== null) {
                    return [lat, lng] as L.LatLngExpression;
                }
                // Fallback mock point for demo
                return [
                    40.7128 + (i * 0.01) - 0.05,
                    -74.0060 + (i * 0.01) - 0.05
                ] as L.LatLngExpression;
            });
        
        if (points.length > 0) {
            map.fitBounds(L.latLngBounds(points), { padding: [50, 50] });
        }
    }, [locations, map]);
    return null;
};

export const LocationsMapView: React.FC<LocationsMapViewProps> = ({ locations, isLoading }) => {
    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-slate-50">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
                    <span className="text-slate-400 font-medium">Initializing Geospatial Data...</span>
                </div>
            </div>
        );
    }

    // Use actual coordinates if present, fallback to generated mock points for demo
    const locationsWithPoints = locations?.map((l, i) => {
        const hasCoords = l.latitude !== null && l.latitude !== undefined && l.longitude !== null && l.longitude !== undefined;
        return {
            ...l,
            lat: hasCoords ? Number(l.latitude) : (40.7128 + (i * 0.01) - 0.05),
            lng: hasCoords ? Number(l.longitude) : (-74.0060 + (i * 0.01) - 0.05)
        };
    }) || [];

    return (
        <div className="flex-1 relative bg-slate-200">
            <MapContainer 
                center={[40.7128, -74.0060]} 
                zoom={13} 
                className="w-full h-full z-0"
                zoomControl={false}
            >
                {/* Clean, Light Gray Tile Layer (Stadia/Alidade Smooth) */}
                <TileLayer
                    url="https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
                />
                
                {locationsWithPoints.map((loc) => (
                    <Marker key={loc.id} position={[loc.lat, loc.lng]}>
                        <Popup className="premium-popup">
                            <div className="p-1">
                                <h4 className="font-bold text-slate-900 text-[14px]">{loc.name}</h4>
                                <p className="text-slate-500 text-[12px] mt-1">{loc.address || 'No address provided'}</p>
                                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between gap-4">
                                    <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">{loc.type}</span>
                                    <span className="text-[11px] text-slate-400">{loc._count?.assets || 0} Assets</span>
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                ))}

                <RecenterMap locations={locations} />
            </MapContainer>

            {/* Custom Interactive Elements on top of Map */}
            <div className="absolute top-4 right-4 flex flex-col gap-2 z-[400]">
                <button className="w-10 h-10 bg-white rounded-lg shadow-lg border border-slate-100 flex items-center justify-center text-slate-600 hover:text-blue-600 transition-all font-bold text-xl">+</button>
                <button className="w-10 h-10 bg-white rounded-lg shadow-lg border border-slate-100 flex items-center justify-center text-slate-600 hover:text-blue-600 transition-all font-bold text-xl">−</button>
            </div>

            <div className="absolute bottom-6 left-6 z-[400]">
                <div className="bg-white/90 backdrop-blur-md px-4 py-3 rounded-xl shadow-xl border border-white flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[13px] font-bold text-slate-800">Tracking {locations?.length || 0} Facilities Globally</span>
                </div>
            </div>
        </div>
    );
};
