"use client";

import { useEffect, useMemo, useRef } from "react";
import {
  Map as MapLibreMap,
  NavigationControl,
  type GeoJSONSource,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { CITIES } from "@/lib/game/cities";
import { ES_MAP_CENTER, ES_MAP_ZOOM, MAP_STYLE } from "@/lib/game/constants";
import { remainingRoute } from "@/lib/game/geo";
import { useGameStore } from "@/lib/game/store";

const CITIES_SOURCE = "cities";
const ROUTE_SOURCE = "active-route";
const CITIES_LAYER = "cities-circle";
const CITIES_LABEL = "cities-label";
const ROUTE_LAYER = "route-line";

export function GameMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const readyRef = useRef(false);

  const vehicle = useGameStore((s) => s.player.vehicle);
  const contracts = useGameStore((s) => s.contracts);
  const selectedCityId = useGameStore((s) => s.selectedCityId);
  const selectCity = useGameStore((s) => s.selectCity);

  const reachableIds = useMemo(() => {
    const ids = new Set<string>();
    for (const c of contracts) {
      if (c.fromCityId === vehicle.cityId) ids.add(c.toCityId);
    }
    return ids;
  }, [contracts, vehicle.cityId]);

  const activeToCityId = useMemo(() => {
    if (vehicle.status !== "en_route" || !vehicle.contractId) return null;
    return contracts.find((c) => c.id === vehicle.contractId)?.toCityId ?? null;
  }, [contracts, vehicle.contractId, vehicle.status]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new MapLibreMap({
      container: containerRef.current,
      style: MAP_STYLE,
      center: ES_MAP_CENTER,
      zoom: ES_MAP_ZOOM,
      attributionControl: { compact: true },
    });

    map.addControl(new NavigationControl({ showCompass: false }), "bottom-right");
    mapRef.current = map;

    map.on("load", () => {
      map.addSource(CITIES_SOURCE, {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [],
        },
      });

      map.addSource(ROUTE_SOURCE, {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [],
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
        id: CITIES_LAYER,
        type: "circle",
        source: CITIES_SOURCE,
        paint: {
          "circle-radius": [
            "match",
            ["get", "role"],
            "current",
            10,
            "destination",
            9,
            "reachable",
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
            "reachable",
            "#2563eb",
            "#64748b",
          ],
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
        },
      });

      map.addLayer({
        id: CITIES_LABEL,
        type: "symbol",
        source: CITIES_SOURCE,
        layout: {
          "text-field": ["get", "name"],
          "text-size": 11,
          "text-offset": [0, 1.2],
          "text-anchor": "top",
          "text-font": ["Noto Sans Regular"],
        },
        paint: {
          "text-color": "#0f172a",
          "text-halo-color": "#ffffff",
          "text-halo-width": 1.2,
        },
      });

      map.on("mouseenter", CITIES_LAYER, () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", CITIES_LAYER, () => {
        map.getCanvas().style.cursor = "";
      });
      map.on("click", CITIES_LAYER, (e) => {
        const id = e.features?.[0]?.properties?.id as string | undefined;
        if (!id) return;
        selectCity(id);
      });

      readyRef.current = true;
      map.resize();
    });

    return () => {
      readyRef.current = false;
      map.remove();
      mapRef.current = null;
    };
  }, [selectCity]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;

    const source = map.getSource(CITIES_SOURCE) as GeoJSONSource | undefined;
    if (!source) return;

    source.setData({
      type: "FeatureCollection",
      features: CITIES.map((city) => {
        let role = "idle";
        if (city.id === vehicle.cityId) role = "current";
        else if (city.id === activeToCityId) role = "destination";
        else if (reachableIds.has(city.id)) role = "reachable";

        return {
          type: "Feature",
          properties: {
            id: city.id,
            name: city.name,
            role,
            selected: city.id === selectedCityId,
          },
          geometry: {
            type: "Point",
            coordinates: [city.lng, city.lat],
          },
        };
      }),
    });
  }, [activeToCityId, reachableIds, selectedCityId, vehicle.cityId]);

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
      <div className="pointer-events-none absolute bottom-3 left-3 z-10 rounded-md bg-background/90 px-3 py-2 text-xs text-muted-foreground shadow-sm">
        <div className="flex items-center gap-2">
          <span className="inline-block size-2.5 rounded-full bg-teal-700" /> Atual
        </div>
        <div className="mt-1 flex items-center gap-2">
          <span className="inline-block size-2.5 rounded-full bg-blue-600" /> Com contrato
        </div>
        <div className="mt-1 flex items-center gap-2">
          <span className="inline-block size-2.5 rounded-full bg-orange-700" /> Destino
        </div>
      </div>
    </div>
  );
}
