import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation, Check, AlertCircle } from 'lucide-react';
import type { LocationDetails } from '../types/portalTypes';

interface LocationMapPickerProps {
  location: LocationDetails;
  onChange: (updatedLocation: LocationDetails) => void;
  isRtl?: boolean;
}

// Default fallback coordinates (Sana'a / Middle East region center)
const DEFAULT_LAT = 15.3694;
const DEFAULT_LNG = 44.1910;

export default function LocationMapPicker({ location, onChange, isRtl = true }: LocationMapPickerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState('');

  // Initial lat/lng state
  const currentLat = location.lat ?? DEFAULT_LAT;
  const currentLng = location.lng ?? DEFAULT_LNG;

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Create Leaflet map if not initialized
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [currentLat, currentLng],
        zoom: location.lat ? 15 : 12,
        zoomControl: false,
      });

      // Add OpenStreetMap tiles (CartoDB Dark Matter for sleek premium dark look or Standard OSM)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO',
        maxZoom: 19,
      }).addTo(map);

      // Custom Gold Pin Marker
      const goldIcon = L.divIcon({
        className: 'custom-gold-marker',
        html: `
          <div style="
            width: 32px;
            height: 32px;
            background: radial-gradient(circle, #f59e0b 0%, #d4af37 100%);
            border: 2px solid #ffffff;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            box-shadow: 0 4px 14px rgba(212, 175, 55, 0.6);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <div style="width: 10px; height: 10px; background: #000; border-radius: 50%;"></div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      });

      const marker = L.marker([currentLat, currentLng], {
        icon: goldIcon,
        draggable: true,
      }).addTo(map);

      markerRef.current = marker;
      mapInstanceRef.current = map;

      // Click on map to set position
      map.on('click', (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        onChange({
          ...location,
          lat: parseFloat(lat.toFixed(6)),
          lng: parseFloat(lng.toFixed(6)),
        });
      });

      // Drag marker to adjust position
      marker.on('dragend', () => {
        const position = marker.getLatLng();
        onChange({
          ...location,
          lat: parseFloat(position.lat.toFixed(6)),
          lng: parseFloat(position.lng.toFixed(6)),
        });
      });

      // Add zoom control at bottom right
      L.control.zoom({ position: 'bottomright' }).addTo(map);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, []);

  // Sync map center & marker when location props change externally
  useEffect(() => {
    if (mapInstanceRef.current && markerRef.current && location.lat && location.lng) {
      const latLng = new L.LatLng(location.lat, location.lng);
      markerRef.current.setLatLng(latLng);
      mapInstanceRef.current.panTo(latLng);
    }
  }, [location.lat, location.lng]);

  // GPS Current Location handler
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeoError(isRtl ? 'خاصية تحديد الموقع غير مدعومة في متصفحك' : 'Geolocation is not supported by your browser');
      return;
    }

    setGeoLoading(true);
    setGeoError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = parseFloat(position.coords.latitude.toFixed(6));
        const lng = parseFloat(position.coords.longitude.toFixed(6));

        setGeoLoading(false);
        onChange({
          ...location,
          lat,
          lng,
        });

        if (mapInstanceRef.current && markerRef.current) {
          const latLng = new L.LatLng(lat, lng);
          markerRef.current.setLatLng(latLng);
          mapInstanceRef.current.setView(latLng, 16);
        }
      },
      (err) => {
        setGeoLoading(false);
        setGeoError(isRtl ? 'تعذر جلب موقعك الحالي، يرجى تفعيل الـ GPS والتأكد من إذن الموقع' : 'Failed to retrieve location, please check GPS permissions');
        console.warn('Geolocation error:', err);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Detailed Address Text Fields */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem' }}>
        <div className="form-group">
          <label className="form-label">{isRtl ? 'الدولة' : 'Country'} <span style={{ color: 'var(--gold)' }}>*</span></label>
          <input
            type="text"
            required
            className="form-input"
            value={location.country || ''}
            onChange={(e) => onChange({ ...location, country: e.target.value })}
            placeholder={isRtl ? 'اليمن، السعودية، إلخ...' : 'Yemen, KSA...'}
          />
        </div>

        <div className="form-group">
          <label className="form-label">{isRtl ? 'المحافظة / المنطقة' : 'Governorate / State'} <span style={{ color: 'var(--gold)' }}>*</span></label>
          <input
            type="text"
            required
            className="form-input"
            value={location.governorate || ''}
            onChange={(e) => onChange({ ...location, governorate: e.target.value })}
            placeholder={isRtl ? 'صنعاء، عدن، الرياض...' : 'Sana\'a, Aden, Riyadh...'}
          />
        </div>

        <div className="form-group">
          <label className="form-label">{isRtl ? 'المدينة' : 'City'} <span style={{ color: 'var(--gold)' }}>*</span></label>
          <input
            type="text"
            required
            className="form-input"
            value={location.city || ''}
            onChange={(e) => onChange({ ...location, city: e.target.value })}
            placeholder={isRtl ? 'المدينة...' : 'City...'}
          />
        </div>

        <div className="form-group">
          <label className="form-label">{isRtl ? 'الشارع / الحي' : 'Street / District'} <span style={{ color: 'var(--gold)' }}>*</span></label>
          <input
            type="text"
            required
            className="form-input"
            value={location.street || ''}
            onChange={(e) => onChange({ ...location, street: e.target.value })}
            placeholder={isRtl ? 'شارع السبعين، حدة...' : 'Main St...'}
          />
        </div>
      </div>

      {/* Additional Address Notes */}
      <div className="form-group">
        <label className="form-label">{isRtl ? 'تفاصيل ومعالم العنوان الإضافية' : 'Detailed Address Landmarks'}</label>
        <input
          type="text"
          className="form-input"
          value={location.addressDetails || ''}
          onChange={(e) => onChange({ ...location, addressDetails: e.target.value })}
          placeholder={isRtl ? 'بجوار مسجد... عمارة رقم... الشقة...' : 'Near landmark, building number, apt...'}
        />
      </div>

      {/* Interactive Map Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label className="form-label" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--gold)' }}>
            <MapPin size={16} />
            {isRtl ? 'تحديد وتثبيت الموقع الجغرافي على الخريطة (أساسي)' : 'Pin Exact Location on Map (Required)'}
          </label>

          <button
            type="button"
            onClick={handleGetCurrentLocation}
            disabled={geoLoading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.4rem 0.8rem',
              borderRadius: '0.5rem',
              background: 'rgba(212,175,55,0.12)',
              border: '1px solid rgba(212,175,55,0.3)',
              color: 'var(--gold)',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <Navigation size={13} className={geoLoading ? 'animate-spin' : ''} />
            {geoLoading
              ? (isRtl ? 'جاري التحديد...' : 'Locating...')
              : (isRtl ? 'موقعي الحالي (GPS)' : 'Current GPS Location')}
          </button>
        </div>

        {geoError && (
          <div className="alert alert-error" style={{ fontSize: '0.75rem', padding: '0.5rem 0.75rem' }}>
            <AlertCircle size={14} />
            <span>{geoError}</span>
          </div>
        )}

        {/* Map Canvas Box */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '280px',
            borderRadius: '0.85rem',
            overflow: 'hidden',
            border: location.lat ? '1.5px solid var(--gold)' : '1px solid var(--bg-border)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          }}
        >
          <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

          {/* Coordinates Badge */}
          <div
            style={{
              position: 'absolute',
              top: '10px',
              insetInlineStart: '10px',
              zIndex: 1000,
              background: 'rgba(13, 13, 15, 0.85)',
              backdropFilter: 'blur(8px)',
              padding: '0.4rem 0.75rem',
              borderRadius: '0.6rem',
              border: '1px solid rgba(212, 175, 55, 0.3)',
              color: '#e2e8f0',
              fontSize: '0.72rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <MapPin size={13} style={{ color: 'var(--gold)' }} />
            {location.lat && location.lng ? (
              <span>
                {location.lat}, {location.lng}
              </span>
            ) : (
              <span style={{ color: 'var(--text-muted)' }}>
                {isRtl ? 'اضغط على الخريطة لتثبيت المكان' : 'Click map to place pin'}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
