import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const CORS = {
	"Access-Control-Allow-Origin": "*",
	"Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
};

// Datasets to render on the notice map — name prefix → display config
// maxInline=0 means always loadOnDemand (too large to inline)
const MAP_DATASETS: Array<{
	namePrefix: string;
	label: string;
	colour: string;
	weight: number;
	fillOpacity: number;
	maxInline: number;
}> = [
	{ namePrefix: "Giga Schools", label: "Schools", colour: "#f59e0b", weight: 2, fillOpacity: 0.6, maxInline: 2000 },
	{ namePrefix: "HOT OSM Education", label: "Education facilities", colour: "#f59e0b", weight: 2, fillOpacity: 0.5, maxInline: 2000 },
	{ namePrefix: "HOT OSM Health", label: "Health facilities", colour: "#ef4444", weight: 2, fillOpacity: 0.5, maxInline: 2000 },
	{ namePrefix: "HOT OSM Populated Places", label: "Populated places", colour: "#8b5cf6", weight: 2, fillOpacity: 0.5, maxInline: 3000 },
	{ namePrefix: "HOT OSM Cultural", label: "Cultural sites", colour: "#ec4899", weight: 2, fillOpacity: 0.5, maxInline: 2000 },
	{ namePrefix: "HOT OSM Financial", label: "Financial services", colour: "#06b6d4", weight: 2, fillOpacity: 0.5, maxInline: 2000 },
	{ namePrefix: "HOT OSM POI", label: "Points of interest", colour: "#10b981", weight: 2, fillOpacity: 0.4, maxInline: 3000 },
	{ namePrefix: "HOT OSM Roads", label: "Roads", colour: "#6b7280", weight: 1.5, fillOpacity: 0.8, maxInline: 0 },
	{ namePrefix: "HOT OSM Waterways", label: "Waterways", colour: "#3b82f6", weight: 1.5, fillOpacity: 0.7, maxInline: 0 },
	{ namePrefix: "HOT OSM Railways", label: "Railways", colour: "#78716c", weight: 2, fillOpacity: 0.8, maxInline: 0 },
];

const PAGE_SIZE = 1000;

type SpatialFeature = {
	type: "Feature";
	geometry: { type: string; coordinates: unknown };
	properties: Record<string, unknown>;
};

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

	const allRows: Array<{ feature_geojson: unknown; feature_properties: unknown }> = [];
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
	label: string;
	colour: string;
	weight: number;
	fillOpacity: number;
	featureCount: number;
	loadOnDemand: boolean;
	features: SpatialFeature[];
	attribution: string | null;
};

export type MapLayersResponse = {
	layers: MapLayer[];
	generatedAt: string;
};

export async function GET() {
	const supabase = createServiceClient();

	const { data: datasets } = await supabase
		.from("spatial_datasets")
		.select("id, name, attribution")
		.eq("status", "published")
		.eq("active", true);

	if (!datasets?.length) {
		return NextResponse.json(
			{ layers: [], generatedAt: new Date().toISOString() } satisfies MapLayersResponse,
			{ headers: CORS },
		);
	}

	const layers = await Promise.all(
		MAP_DATASETS.map(async (cfg) => {
			const dataset = datasets.find((d) => d.name.startsWith(cfg.namePrefix));
			if (!dataset) return null;

			const { features, total, loadOnDemand } = await fetchFeaturesForDataset(
				supabase,
				dataset.id,
				cfg.maxInline,
			);

			if (total === 0) return null;

			return {
				id: cfg.namePrefix.toLowerCase().replace(/\s+/g, "-"),
				label: cfg.label,
				colour: cfg.colour,
				weight: cfg.weight,
				fillOpacity: cfg.fillOpacity,
				featureCount: total,
				loadOnDemand,
				features,
				attribution: dataset.attribution,
			} satisfies MapLayer;
		}),
	);

	const response: MapLayersResponse = {
		layers: layers.filter((l): l is MapLayer => l !== null),
		generatedAt: new Date().toISOString(),
	};

	return NextResponse.json(response, { headers: CORS });
}

export async function OPTIONS() {
	return new Response(null, { status: 204, headers: CORS });
}
