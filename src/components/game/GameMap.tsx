"use client";

import { useEffect, useMemo, useRef } from "react";
import {
  Map as MapLibreMap,
  NavigationControl,
  type GeoJSONSource,
  type MapMouseEvent,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  LOCAL_MAP_CENTER,
  LOCAL_MAP_ZOOM,
  MAP_STYLE,
  ORDER_RADIUS_KM,
  PLAYING_MAP_ZOOM,
} from "@/lib/game/constants";
import { remainingRoute } from "@/lib/game/geo";
import { useGameStore } from "@/lib/game/store";
import { toast } from "sonner";

const POINTS_SOURCE = "delivery-points";
const ROUTE_SOURCE = "active-route";
const RADIUS_SOURCE = "order-radius";
const POINTS_LAYER = "points-circle";
const POINTS_LABEL = "points-label";
const ROUTE_LAYER = "route-line";
const RADIUS_LAYER = "radius-fill";
const RADIUS_OUTLINE = "radius-outline";

function circlePolygon(
  lng: number,
  lat: number,
  radiusKm: number,
  steps = 64,
): [number, number][] {
  const coords: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const bearing = (i / steps) * Math.PI * 2;
    const dLat = (radiusKm * Math.cos(bearing)) / 111.32;
    const dLng =
      (radiusKm * Math.sin(bearing)) /
      (111.32 * Math.cos((lat * Math.PI) / 180));
    coords.push([lng + dLng, lat + dLat]);
  }
  return coords;
}

export function GameMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const readyRef = useRef(false);

  const hasLocation = useGameStore((s) => s.player.hasLocation);
  const vehicle = useGameStore((s) => s.player.vehicle);
  const orders = useGameStore((s) => s.orders);
  const selectedOrderId = useGameStore((s) => s.selectedOrderId);
  const placingLocation = useGameStore((s) => s.placingLocation);
  const selectOrder = useGameStore((s) => s.selectOrder);
  const setLocation = useGameStore((s) => s.setLocation);

  const activeOrder = useMemo(() => {
    if (vehicle.status !== "en_route" || !vehicle.orderId) return null;
    return orders.find((o) => o.id === vehicle.orderId) ?? null;
  }, [orders, vehicle.orderId, vehicle.status]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new MapLibreMap({
      container: containerRef.current,
      style: MAP_STYLE,
      center: LOCAL_MAP_CENTER,
      zoom: LOCAL_MAP_ZOOM,
      attributionControl: { compact: true },
    });

    map.addControl(new NavigationControl({ showCompass: false }), "bottom-right");
    mapRef.current = map;

    map.on("load", () => {
      map.addSource(RADIUS_SOURCE, {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      map.addSource(POINTS_SOURCE, {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      map.addSource(ROUTE_SOURCE, {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });

      map.addLayer({
        id: RADIUS_LAYER,
        type: "fill",
        source: RADIUS_SOURCE,
        paint: {
          "fill-color": "#0f766e",
          "fill-opacity": 0.08,
        },
      });
      map.addLayer({
        id: RADIUS_OUTLINE,
        type: "line",
        source: RADIUS_SOURCE,
        paint: {
          "line-color": "#0f766e",
          "line-width": 1.5,
          "line-opacity": 0.45,
          "line-dasharray": [2, 2],
        },
      });

      map.addLayer({
        id: ROUTE_LAYER,
        type: "line",
        source: ROUTE_SOURCE,
        layout: {
          "line-cap": "round",
          "line-join": "round",
        },
        paint: {
          "line-color": "#0f766e",
          "line-width": 5,
          "line-opacity": 0.9,
        },
      });

      map.addLayer({
        id: POINTS_LAYER,
        type: "circle",
        source: POINTS_SOURCE,
        paint: {
          "circle-radius": [
            "match",
            ["get", "role"],
            "current",
            11,
            "destination",
            10,
            "order",
            8,
            6,
          ],
          "circle-color": [
            "match",
            ["get", "role"],
            "current",
            "#0f766e",
            "destination",
            "#c2410c",
            "order",
            "#2563eb",
            "#64748b",
          ],
          "circle-stroke-width": [
            "case",
            ["boolean", ["get", "selected"], false],
            3,
            2,
          ],
          "circle-stroke-color": [
            "case",
            ["boolean", ["get", "selected"], false],
            "#fbbf24",
            "#ffffff",
          ],
        },
      });

      map.addLayer({
        id: POINTS_LABEL,
        type: "symbol",
        source: POINTS_SOURCE,
        filter: ["!=", ["get", "role"], "current"],
        layout: {
          "text-field": ["get", "name"],
          "text-size": 11,
          "text-offset": [0, 1.25],
          "text-anchor": "top",
          "text-font": ["Noto Sans Regular"],
        },
        paint: {
          "text-color": "#0f172a",
          "text-halo-color": "#ffffff",
          "text-halo-width": 1.2,
        },
      });

      map.on("mouseenter", POINTS_LAYER, () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", POINTS_LAYER, () => {
        map.getCanvas().style.cursor = "";
      });

      readyRef.current = true;
      map.resize();
    });

    return () => {
      readyRef.current = false;
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const onClick = (e: MapMouseEvent) => {
      if (useGameStore.getState().placingLocation) {
        const { lng, lat } = e.lngLat;
        setLocation({
          lat,
          lng,
          label: "Ponto marcado no mapa",
        });
        toast.success("Localização marcada no mapa");
        return;
      }

      if (!readyRef.current) return;
      const features = map.queryRenderedFeatures(e.point, {
        layers: [POINTS_LAYER],
      });
      const id = features[0]?.properties?.id as string | undefined;
      const role = features[0]?.properties?.role as string | undefined;
      if (id && role === "order") {
        selectOrder(id);
      }
    };

    map.on("click", onClick);
    return () => {
      map.off("click", onClick);
    };
  }, [selectOrder, setLocation]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    map.getCanvas().style.cursor = placingLocation ? "crosshair" : "";
  }, [placingLocation]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current || !hasLocation) return;
    map.easeTo({
      center: [vehicle.lng, vehicle.lat],
      zoom: PLAYING_MAP_ZOOM,
      duration: 800,
    });
  }, [hasLocation, vehicle.lat, vehicle.lng]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;

    const radiusSource = map.getSource(RADIUS_SOURCE) as GeoJSONSource | undefined;
    const pointsSource = map.getSource(POINTS_SOURCE) as GeoJSONSource | undefined;
    if (!radiusSource || !pointsSource) return;

    if (!hasLocation) {
      radiusSource.setData({ type: "FeatureCollection", features: [] });
      pointsSource.setData({ type: "FeatureCollection", features: [] });
      return;
    }

    radiusSource.setData({
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {},
          geometry: {
            type: "Polygon",
            coordinates: [
              circlePolygon(vehicle.lng, vehicle.lat, ORDER_RADIUS_KM),
            ],
          },
        },
      ],
    });

    const features: Array<{
      type: "Feature";
      properties: Record<string, string | boolean>;
      geometry: { type: "Point"; coordinates: [number, number] };
    }> = [
      {
        type: "Feature",
        properties: {
          id: "player",
          name: "Você",
          role: "current",
          selected: false,
        },
        geometry: {
          type: "Point",
          coordinates: [vehicle.lng, vehicle.lat],
        },
      },
    ];

    if (activeOrder) {
      features.push({
        type: "Feature",
        properties: {
          id: activeOrder.id,
          name: activeOrder.title,
          role: "destination",
          selected: true,
        },
        geometry: {
          type: "Point",
          coordinates: [activeOrder.toLng, activeOrder.toLat],
        },
      });
    } else {
      for (const order of orders) {
        features.push({
          type: "Feature",
          properties: {
            id: order.id,
            name: order.title,
            role: "order",
            selected: order.id === selectedOrderId,
          },
          geometry: {
            type: "Point",
            coordinates: [order.toLng, order.toLat],
          },
        });
      }
    }

    pointsSource.setData({
      type: "FeatureCollection",
      features,
    });
  }, [
    activeOrder,
    hasLocation,
    orders,
    selectedOrderId,
    vehicle.lat,
    vehicle.lng,
  ]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;

    const source = map.getSource(ROUTE_SOURCE) as GeoJSONSource | undefined;
    if (!source) return;

    if (
      vehicle.status !== "en_route" ||
      !vehicle.routeCoords ||
      vehicle.routeCoords.length < 2
    ) {
      source.setData({ type: "FeatureCollection", features: [] });
      return;
    }

    const coords = remainingRoute(vehicle.routeCoords, vehicle.progress01 ?? 0);
    source.setData({
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: coords,
          },
        },
      ],
    });
  }, [vehicle.progress01, vehicle.routeCoords, vehicle.status]);

  useEffect(() => {
    const onResize = () => mapRef.current?.resize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <div className="relative min-h-0 flex-1">
      <div ref={containerRef} className="absolute inset-0 h-full w-full" />
      {hasLocation ? (
        <div className="pointer-events-none absolute bottom-3 left-3 z-10 rounded-md bg-background/90 px-3 py-2 text-xs text-muted-foreground shadow-sm">
          <div className="flex items-center gap-2">
            <span className="inline-block size-2.5 rounded-full bg-teal-700" /> Você
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span className="inline-block size-2.5 rounded-full bg-blue-600" /> Pedido (≤2 km)
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span className="inline-block size-2.5 rounded-full bg-orange-700" /> Destino ativo
          </div>
        </div>
      ) : null}
    </div>
  );
}
