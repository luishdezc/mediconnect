import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import styles from "./DoctorMap.module.scss";
import type { Doctor } from "../../types";

interface Props {
  doctors: Doctor[];
  selectedId?: string;
  onSelect: (doc: Doctor) => void;
  userLat?: number;
  userLng?: number;
}

const DoctorMap = ({ doctors, selectedId, onSelect }: Props) => {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current).setView([20.67, -103.34], 13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap",
    }).addTo(map);

    markersRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    setTimeout(() => {
      map.invalidateSize();
    }, 0);
  }, []);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      () => {
        console.warn("No se pudo obtener ubicación");
      }
    );
  }, []);

  useEffect(() => {
    if (!mapRef.current || !userLocation) return;

    const map = mapRef.current;

    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
    }

    const icon = L.divIcon({
      html: `<div class="${styles.userMarker}">🏠</div>`,
      className: "",
    });

    const marker = L.marker(
      [userLocation.lat, userLocation.lng],
      { icon }
    ).addTo(map);

    marker.bindPopup("Tu ubicación");

    userMarkerRef.current = marker;

    map.setView([userLocation.lat, userLocation.lng], 14);
  }, [userLocation]);

  const getDistance = (lat1:number, lon1:number, lat2:number, lon2:number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI/180;
    const dLon = (lon2 - lon1) * Math.PI/180;

    const a =
      Math.sin(dLat/2)**2 +
      Math.cos(lat1*Math.PI/180) *
      Math.cos(lat2*Math.PI/180) *
      Math.sin(dLon/2)**2;

    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  };

  useEffect(() => {
    if (!mapRef.current || !markersRef.current) return;

    const layer = markersRef.current;
    layer.clearLayers();

    let processed = doctors
      .filter(doc =>
        doc.locationLat != null &&
        doc.locationLng != null &&
        !isNaN(doc.locationLat) &&
        !isNaN(doc.locationLng)
      )
      .map(doc => {
        if (!userLocation) return doc;

        const distance = getDistance(
          userLocation.lat,
          userLocation.lng,
          doc.locationLat!,
          doc.locationLng!
        );

        return { ...doc, distance };
      });

    processed.sort((a:any, b:any) => (a.distance || 0) - (b.distance || 0));
    const top3 = processed.slice(0, 3);

    processed.forEach((doc:any) => {
      const isTop = top3.some(d => d._id === doc._id);
      const isSelected = doc._id === selectedId;

      const icon = L.divIcon({
        html: `
          <div class="${styles.doctorMarker} 
            ${isTop ? styles.top : ""} 
            ${isSelected ? styles.selected : ""}">
            <span>${doc.userId?.name?.[0] || "D"}</span>
          </div>
        `,
        className: "",
      });

      const marker = L.marker(
        [doc.locationLat, doc.locationLng],
        { icon }
      )
        .addTo(layer)
        .bindPopup(`
          <div class="${styles.popup}">
            <h4>${doc.userId?.name || "Doctor"}</h4>
            <p>${doc.specialization || ""}</p>
            <p>${doc.locationAddress || ""}</p>
            ${doc.distance ? `<p>${doc.distance.toFixed(1)} km</p>` : ""}
          </div>
        `)
        .on("click", () => onSelect(doc));

      if (isSelected && userLocation) {
        mapRef.current!.flyTo(
          [doc.locationLat, doc.locationLng],
          15
        );
        marker.openPopup();
      }
    });
  }, [doctors, selectedId, userLocation]);

  return (
    <div className={styles.mapWrapper}>
      <div ref={containerRef} className={styles.map} />
    </div>
  );
};

export default DoctorMap;