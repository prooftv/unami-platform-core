import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import {
	isGeometryWithinRadius,
	isValidWgs84Point,
	type Wgs84Point,
} from "@/lib/gis/spatial-proximity";
import { filterPubliclyRedistributableDatasets } from "@/lib/gis/spatial-public-access";

export const dynamic = "force-dynamic";

const CORS = {
	"Access-Control-Allow-Origin": "*",
	"Cache-Control": "no-store",
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
		radiusKm: 5,
		noticeTypes: ["rezoning", "infrastructure", "mining", "eia"],
	},
	{
		namePrefix: "HOT OSM Waterways",
		label: "Waterways",
		colour: "#3b82f6",
		weight: 1.5,
		fillOpacity: 0.7,
		maxInline: 0,
		radiusKm: 5,
		noticeTypes: ["eia", "mining", "infrastructure"],
	},
	{
		namePrefix: "HOT OSM Railways",
		label: "Railways",
		colour: "#78716c",
		weight: 2,
		fillOpacity: 0.8,
		maxInline: 0,
		radiusKm: 5,
		noticeTypes: ["infrastructure", "mining"],
	},
];

const PAGE_SIZE = 1000;
const MAX_NEARBY_FEATURES = 100;
const MAX_SCANNED_FEATURES = 20_000;

type SpatialFeature = {
	type: "Feature";
	geometry: { type: string; coordinates?: unknown; geometries?: unknown };
	properties: Record<string, unknown>;
};

async function fetchFeaturesForDataset(
	supabase: ReturnType<typeof createServiceClient>,
	datasetId: string,
	maxInline: number,
	location: Wgs84Point | null,
	radiusKm: number | null,
): Promise<{
	features: SpatialFeature[];
	total: number;
	loadOnDemand: boolean;
	truncated: boolean;
}> {
	const { count, error: countError } = await supabase
		.from("spatial_staged_features")
		.select("id", { count: "exact", head: true })
		.eq("dataset_id", datasetId)
		.eq("operator_status", "approved");
	if (countError) {
		throw new Error(`Could not count published spatial features: ${countError.message}`);
	}

	const total = count ?? 0;
	const loadOnDemand = maxInline === 0 || total > maxInline;
	const needsNearbyQuery = location !== null && radiusKm !== null;
	if (loadOnDemand && !needsNearbyQuery) {
		return { features: [], total, loadOnDemand, truncated: false };
	}

	const allRows: Array<{
		id: string;
		feature_geojson: unknown;
		feature_properties: unknown;
	}> = [];
	let page = 0;
	let scanned = 0;
	let truncated = false;
	const maxFeatures = needsNearbyQuery ? MAX_NEARBY_FEATURES : maxInline;
	while (true) {
		const remaining = needsNearbyQuery
			? MAX_SCANNED_FEATURES - scanned
			: Number.POSITIVE_INFINITY;
		if (remaining <= 0) {
			truncated = true;
			break;
		}
		const { data: rows, error } = await supabase
			.from("spatial_staged_features")
			.select("id, feature_geojson, feature_properties")
			.eq("dataset_id", datasetId)
			.eq("operator_status", "approved")
			.order("id", { ascending: true })
			.range(
				page * PAGE_SIZE,
				page * PAGE_SIZE + Math.min(PAGE_SIZE, remaining) - 1,
			);
		if (error) {
			throw new Error(`Could not read published spatial features: ${error.message}`);
		}
		if (!rows?.length) break;
		scanned += rows.length;
		for (const row of rows) {
			const geometry = row.feature_geojson as SpatialFeature["geometry"];
			if (
				needsNearbyQuery &&
				!isGeometryWithinRadius(geometry, location, radiusKm * 1000)
			) {
				continue;
			}
			allRows.push(row);
			if (allRows.length > maxFeatures) {
				truncated = true;
				break;
			}
		}
		if (rows.length < PAGE_SIZE) break;
		if (truncated) break;
		if (needsNearbyQuery && scanned >= MAX_SCANNED_FEATURES) {
			truncated = scanned < total;
			break;
		}
		page++;
	}

	const features = allRows.slice(0, maxFeatures).map((row) => ({
		type: "Feature" as const,
		geometry: row.feature_geojson as SpatialFeature["geometry"],
		properties: (row.feature_properties ?? {}) as Record<string, unknown>,
	}));
	return {
		features,
		total,
		loadOnDemand,
		truncated,
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
	truncated: boolean;
	radiusKm: number | null;
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
	permissionFiltered: boolean;
	generatedAt: string;
};

export async function GET(req: Request) {
	const url = new URL(req.url);
	const hasLat = url.searchParams.has("lat");
	const hasLng = url.searchParams.has("lng");
	if (hasLat !== hasLng) {
		return NextResponse.json(
			{ error: "lat and lng must be provided together" },
			{ status: 400, headers: CORS },
		);
	}
	const latValue = url.searchParams.get("lat");
	const lngValue = url.searchParams.get("lng");
	const location = hasLat
		? {
				lat: latValue?.trim() ? Number(latValue) : Number.NaN,
				lng: lngValue?.trim() ? Number(lngValue) : Number.NaN,
			}
		: null;
	if (location && !isValidWgs84Point(location)) {
		return NextResponse.json(
			{ error: "lat and lng must be valid WGS84 coordinates" },
			{ status: 400, headers: CORS },
		);
	}
	const noticeType = url.searchParams.get("noticeType") ?? null;
	const reliableLocation = ["verified", "operator-provided"].includes(
		url.searchParams.get("locationPrecision") ?? "",
	);

	const supabase = createServiceClient();

	const { data: datasets, error: datasetsError } = await supabase
		.from("spatial_datasets")
		.select("id, name, attribution, published_at, dataset_date, source_id, permission_classification")
		.eq("status", "published")
		.eq("active", true)
		.order("published_at", { ascending: false });
	if (datasetsError) {
		console.error("Could not read published spatial datasets:", datasetsError.message);
		return NextResponse.json(
			{ error: "Spatial catalogue is temporarily unavailable" },
			{ status: 500, headers: CORS },
		);
	}

	if (!datasets?.length) {
		return NextResponse.json(
			{
				layers: [],
				filterLat: location?.lat ?? null,
				filterLng: location?.lng ?? null,
				permissionFiltered: false,
				generatedAt: new Date().toISOString(),
			} satisfies MapLayersResponse,
			{ headers: CORS },
		);
	}

	let publicDatasets: typeof datasets;
	try {
		const filtered = await filterPubliclyRedistributableDatasets(
			supabase,
			datasets,
		);
		publicDatasets = filtered.datasets;
	} catch (error) {
		console.error(
			"Could not verify spatial dataset permissions:",
			error instanceof Error ? error.message : String(error),
		);
		return NextResponse.json(
			{ error: "Spatial catalogue permissions are temporarily unavailable" },
			{ status: 500, headers: CORS },
		);
	}
	const publicDatasetIds = new Set(publicDatasets.map((dataset) => dataset.id));
	const permissionFiltered = datasets.some(
		(dataset) =>
			MAP_DATASETS.some(
				(cfg) =>
					dataset.name.startsWith(cfg.namePrefix) &&
					(!noticeType ||
						cfg.noticeTypes === null ||
						cfg.noticeTypes.includes(noticeType)),
			) && !publicDatasetIds.has(dataset.id),
	);

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

			const dataset = publicDatasets.find((d) => d.name.startsWith(cfg.namePrefix));
			if (!dataset) return null;
			const radiusKm =
				noticeType === "liquor" &&
				reliableLocation &&
				[
					"Giga Schools",
					"HOT OSM Education",
					"HOT OSM Health",
					"HOT OSM Cultural",
					"HOT OSM Populated Places",
				].includes(cfg.namePrefix)
					? 0.5
					: cfg.radiusKm;

			const {
				features,
				total,
				loadOnDemand,
				truncated,
			} = await fetchFeaturesForDataset(
				supabase,
				dataset.id,
				cfg.maxInline,
				location,
				radiusKm,
			);

			if (total === 0) return null;

			return {
				id: cfg.namePrefix.toLowerCase().replace(/\s+/g, "-"),
				datasetId: dataset.id,
				label: cfg.label,
				colour: cfg.colour,
				weight: cfg.weight,
				fillOpacity: cfg.fillOpacity,
				featureCount: total,
				returnedCount: features.length,
				loadOnDemand,
				truncated,
				radiusKm,
				features,
				attribution: dataset.attribution,
				publishedAt: dataset.published_at,
				datasetDate: dataset.dataset_date,
				radiusFiltered: location !== null && radiusKm !== null,
			} satisfies MapLayer;
		}),
	);

	const response: MapLayersResponse = {
		layers: layers.filter((l): l is MapLayer => l !== null),
		filterLat: location?.lat ?? null,
		filterLng: location?.lng ?? null,
		permissionFiltered,
		generatedAt: new Date().toISOString(),
	};

	return NextResponse.json(response, { headers: CORS });
}

export async function OPTIONS() {
	return new Response(null, { status: 204, headers: CORS });
}
