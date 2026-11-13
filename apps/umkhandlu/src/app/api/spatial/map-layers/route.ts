import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const CORS = {
	"Access-Control-Allow-Origin": "*",
	"Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
};

// ─── Layer catalogue ──────────────────────────────────────────────────────────
// maxInline=0 → always loadOnDemand (line/polygon datasets too large to inline)
// radiusKm: when a lat/lng is provided, only return features within this radius
// noticeTypes: which notice type profiles include this layer (null = all)

const MAP_DATASETS: Array<{
	namePrefix: string;
	label: string;
	colour: string;
	weight: number;
	fillOpacity: number;
	maxInline: number;
	radiusKm: number | null;
	noticeTypes: string[] | null;
}> = [
	{
		namePrefix: "Giga Schools",
		label: "Schools",
		colour: "#f59e0b",
		weight: 2,
		fillOpacity: 0.7,
		maxInline: 2000,
		radiusKm: 5,
		noticeTypes: null,
	},
	{
		namePrefix: "HOT OSM Education",
		label: "Education facilities",
		colour: "#f59e0b",
		weight: 2,
		fillOpacity: 0.6,
		maxInline: 2000,
		radiusKm: 5,
		noticeTypes: null,
	},
	{
		namePrefix: "HOT OSM Health",
		label: "Health facilities",
		colour: "#ef4444",
		weight: 2,
		fillOpacity: 0.6,
		maxInline: 2000,
		radiusKm: 5,
		noticeTypes: null,
	},
	{
		namePrefix: "HOT OSM Populated Places",
		label: "Populated places",
		colour: "#8b5cf6",
		weight: 2,
		fillOpacity: 0.5,
		maxInline: 3000,
		radiusKm: 10,
		noticeTypes: null,
	},
	{
		namePrefix: "HOT OSM Cultural",
		label: "Cultural & religious places",
		colour: "#ec4899",
		weight: 2,
		fillOpacity: 0.6,
		maxInline: 2000,
		radiusKm: 5,
		noticeTypes: null,
	},
	{
		namePrefix: "HOT OSM Financial",
		label: "Financial services",
		colour: "#06b6d4",
		weight: 2,
		fillOpacity: 0.6,
		maxInline: 2000,
		radiusKm: 5,
		noticeTypes: null,
	},
	{
		namePrefix: "HOT OSM Points of Interest",
		label: "Points of interest",
		colour: "#10b981",
		weight: 2,
		fillOpacity: 0.4,
		maxInline: 3000,
		radiusKm: 5,
		noticeTypes: null,
	},
	{
		namePrefix: "HOT OSM Roads",
		label: "Roads",
		colour: "#6b7280",
		weight: 1.5,
		fillOpacity: 0.8,
		maxInline: 0,
		radiusKm: null,
		noticeTypes: ["rezoning", "infrastructure", "mining", "eia"],
	},
	{
		namePrefix: "HOT OSM Waterways",
		label: "Waterways",
		colour: "#3b82f6",
		weight: 1.5,
		fillOpacity: 0.7,
		maxInline: 0,
		radiusKm: null,
		noticeTypes: ["eia", "mining", "infrastructure"],
	},
	{
		namePrefix: "HOT OSM Railways",
		label: "Railways",
		colour: "#78716c",
		weight: 2,
		fillOpacity: 0.8,
		maxInline: 0,
		radiusKm: null,
		noticeTypes: ["infrastructure", "mining"],
	},
];

const PAGE_SIZE = 1000;

type SpatialFeature = {
	type: "Feature";
	geometry: { type: string; coordinates: unknown };
	properties: Record<string, unknown>;
};

// ─── Haversine distance (km) ──────────────────────────────────────────────────
function haversineKm(
	lat1: number,
	lng1: number,
	lat2: number,
	lng2: number,
): number {
	const R = 6371;
	const dLat = ((lat2 - lat1) * Math.PI) / 180;
	const dLng = ((lng2 - lng1) * Math.PI) / 180;
	const a =
		Math.sin(dLat / 2) ** 2 +
		Math.cos((lat1 * Math.PI) / 180) *
			Math.cos((lat2 * Math.PI) / 180) *
			Math.sin(dLng / 2) ** 2;
	return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Extract the representative point from a GeoJSON geometry (first coord for lines/polygons)
function geometryPoint(
	geom: { type: string; coordinates: unknown },
): [number, number] | null {
	const c = geom.coordinates;
	if (geom.type === "Point" && Array.isArray(c) && c.length >= 2) {
		return [c[1] as number, c[0] as number]; // [lat, lng]
	}
	if (
		(geom.type === "LineString" || geom.type === "MultiPoint") &&
		Array.isArray(c) &&
		Array.isArray(c[0])
	) {
		const p = c[0] as number[];
		return [p[1], p[0]];
	}
	if (
		geom.type === "Polygon" &&
		Array.isArray(c) &&
		Array.isArray(c[0]) &&
		Array.isArray((c[0] as unknown[])[0])
	) {
		const p = (c[0] as number[][])[0];
		return [p[1], p[0]];
	}
	return null;
}

function filterByRadius(
	features: SpatialFeature[],
	lat: number,
	lng: number,
	radiusKm: number,
): SpatialFeature[] {
	return features.filter((f) => {
		const pt = geometryPoint(f.geometry);
		if (!pt) return true; // keep if we can't determine position
		return haversineKm(lat, lng, pt[0], pt[1]) <= radiusKm;
	});
}

async function fetchFeaturesForDataset(
	supabase: ReturnType<typeof createServiceClient>,
	datasetId: string,
	maxInline: number,
): Promise<{ features: SpatialFeature[]; total: number; loadOnDemand: boolean }> {
	const { count } = await supabase
		.from("spatial_staged_features")
		.select("id", { count: "exact", head: true })
		.eq("dataset_id", datasetId)
		.eq("operator_status", "approved");

	const total = count ?? 0;
	if (maxInline === 0 || total > maxInline) {
		return { features: [], total, loadOnDemand: true };
	}

	const allRows: Array<{
		feature_geojson: unknown;
		feature_properties: unknown;
	}> = [];
	let page = 0;
	while (true) {
		const { data: rows } = await supabase
			.from("spatial_staged_features")
			.select("feature_geojson, feature_properties")
			.eq("dataset_id", datasetId)
			.eq("operator_status", "approved")
			.range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
		if (!rows?.length) break;
		allRows.push(...rows);
		if (rows.length < PAGE_SIZE) break;
		page++;
	}

	return {
		features: allRows.map((r) => ({
			type: "Feature" as const,
			geometry: r.feature_geojson as { type: string; coordinates: unknown },
			properties: (r.feature_properties ?? {}) as Record<string, unknown>,
		})),
		total,
		loadOnDemand: false,
	};
}

export type MapLayer = {
	id: string;
	datasetId: string;
	label: string;
	colour: string;
	weight: number;
	fillOpacity: number;
	featureCount: number;
	returnedCount: number;
	loadOnDemand: boolean;
	features: SpatialFeature[];
	attribution: string | null;
	publishedAt: string | null;
	datasetDate: string | null;
	radiusFiltered: boolean;
};

export type MapLayersResponse = {
	layers: MapLayer[];
	filterLat: number | null;
	filterLng: number | null;
	generatedAt: string;
};

export async function GET(req: Request) {
	const url = new URL(req.url);
	const lat = url.searchParams.get("lat")
		? Number(url.searchParams.get("lat"))
		: null;
	const lng = url.searchParams.get("lng")
		? Number(url.searchParams.get("lng"))
		: null;
	const noticeType = url.searchParams.get("noticeType") ?? null;

	// Validate coordinates if provided
	const hasLocation =
		lat !== null &&
		lng !== null &&
		Number.isFinite(lat) &&
		Number.isFinite(lng) &&
		lat >= -35 &&
		lat <= -22 &&
		lng >= 16 &&
		lng <= 33;

	const supabase = createServiceClient();

	const { data: datasets } = await supabase
		.from("spatial_datasets")
		.select("id, name, attribution, published_at, dataset_date")
		.eq("status", "published")
		.eq("active", true);

	if (!datasets?.length) {
		return NextResponse.json(
			{
				layers: [],
				filterLat: hasLocation ? lat : null,
				filterLng: hasLocation ? lng : null,
				generatedAt: new Date().toISOString(),
			} satisfies MapLayersResponse,
			{ headers: CORS },
		);
	}

	const layers = await Promise.all(
		MAP_DATASETS.map(async (cfg) => {
			// Skip layers not relevant to this notice type
			if (
				noticeType &&
				cfg.noticeTypes !== null &&
				!cfg.noticeTypes.includes(noticeType)
			) {
				return null;
			}

			const dataset = datasets.find((d) => d.name.startsWith(cfg.namePrefix));
			if (!dataset) return null;

			const { features, total, loadOnDemand } = await fetchFeaturesForDataset(
				supabase,
				dataset.id,
				cfg.maxInline,
			);

			if (total === 0) return null;

			// Apply radius filter to point datasets when location is available
			let filtered = features;
			let radiusFiltered = false;
			if (hasLocation && cfg.radiusKm !== null && features.length > 0) {
				filtered = filterByRadius(
					features,
					lat as number,
					lng as number,
					cfg.radiusKm,
				);
				radiusFiltered = true;
			}

			return {
				id: cfg.namePrefix.toLowerCase().replace(/\s+/g, "-"),
				datasetId: dataset.id,
				label: cfg.label,
				colour: cfg.colour,
				weight: cfg.weight,
				fillOpacity: cfg.fillOpacity,
				featureCount: total,
				returnedCount: loadOnDemand ? 0 : filtered.length,
				loadOnDemand,
				features: filtered,
				attribution: dataset.attribution,
				publishedAt: dataset.published_at,
				datasetDate: dataset.dataset_date,
				radiusFiltered,
			} satisfies MapLayer;
		}),
	);

	const response: MapLayersResponse = {
		layers: layers.filter((l): l is MapLayer => l !== null),
		filterLat: hasLocation ? (lat as number) : null,
		filterLng: hasLocation ? (lng as number) : null,
		generatedAt: new Date().toISOString(),
	};

	return NextResponse.json(response, { headers: CORS });
}

export async function OPTIONS() {
	return new Response(null, { status: 204, headers: CORS });
}
