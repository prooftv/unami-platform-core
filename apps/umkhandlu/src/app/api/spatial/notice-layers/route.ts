import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const CORS = {
	"Access-Control-Allow-Origin": "*",
	"Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
};

/**
 * Layer profile definitions per notice type.
 * Each entry describes a spatial layer relevant to the statutory process.
 * availability: 'available' | 'pending-permission' | 'not-available'
 * source: maps to spatial_datasets.name or spatial_sources.name in the CC DB
 */
const LAYER_PROFILES: Record<
	string,
	Array<{
		id: string;
		label: string;
		role: string;
		geometryType: string;
		sourceOrg: string;
		sourceDataset: string | null;
		availability: "available" | "pending-permission" | "not-available";
		permissionNote: string | null;
		attribution: string | null;
		statutoryRelevance: string;
	}>
> = {
	liquor: [
		{
			id: "wards",
			label: "Ward boundaries (MDB 2026)",
			role: "administrative",
			geometryType: "Polygon",
			sourceOrg: "Municipal Demarcation Board of South Africa",
			sourceDataset: "MDB Wards 2026 — Amajuba DC25",
			availability: "available",
			permissionNote: null,
			attribution: "Municipal Demarcation Board (MDB) — public domain, CC-BY",
			statutoryRelevance:
				"Ward context for KZNERA local committee jurisdiction and community notification.",
		},
		{
			id: "municipalities",
			label: "Local municipality boundaries",
			role: "administrative",
			geometryType: "Polygon",
			sourceOrg: "Municipal Demarcation Board of South Africa",
			sourceDataset: "Amajuba Local Municipalities (DC25)",
			availability: "available",
			permissionNote: null,
			attribution: "Municipal Demarcation Board (MDB) — public domain, CC-BY",
			statutoryRelevance:
				"Determines which KZNERA local committee has jurisdiction.",
		},
		{
			id: "district",
			label: "District municipality boundary",
			role: "administrative",
			geometryType: "Polygon",
			sourceOrg: "Municipal Demarcation Board of South Africa",
			sourceDataset: "Amajuba District Municipality Boundary (DC25)",
			availability: "available",
			permissionNote: null,
			attribution: "Municipal Demarcation Board (MDB) — public domain, CC-BY",
			statutoryRelevance: "Amajuba DC25 district context.",
		},
		{
			id: "traditional-areas",
			label: "Traditional authority / community areas",
			role: "community",
			geometryType: "Polygon",
			sourceOrg: "KZN CoGTA / Commission on Traditional Leadership",
			sourceDataset: null,
			availability: "pending-permission",
			permissionNote:
				"Authoritative traditional authority boundary dataset not yet confirmed. COGTA ILIS Land Tenure Component v2 is accessible but redistribution permission is pending.",
			attribution: null,
			statutoryRelevance:
				"Traditional council consultation area for KZN Liquor Licensing Act s.43 community notification.",
		},
		{
			id: "licensed-premises",
			label: "Existing licensed premises",
			role: "proximity",
			geometryType: "Point",
			sourceOrg: "KwaZulu-Natal Economic Regulatory Authority (KZNERA)",
			sourceDataset: null,
			availability: "pending-permission",
			permissionNote:
				"KZNERA does not publish a machine-readable licensed premises register. No authorised dataset available. Manual verification required.",
			attribution: null,
			statutoryRelevance:
				"Proximity to existing licensed premises is a consideration under KZN Liquor Licensing Act s.43.",
		},
		{
			id: "schools",
			label: "Learning institutions",
			role: "proximity",
			geometryType: "Point",
			sourceOrg: "Department of Basic Education / KZN DoE",
			sourceDataset: null,
			availability: "pending-permission",
			permissionNote:
				"DBE school location data is available via the EMIS system but redistribution requires formal permission. No authorised dataset confirmed.",
			attribution: null,
			statutoryRelevance:
				"KZN Liquor Licensing Act s.43 — proximity to schools is a statutory consideration.",
		},
		{
			id: "religious-institutions",
			label: "Religious institutions",
			role: "proximity",
			geometryType: "Point",
			sourceOrg: "No authoritative published source",
			sourceDataset: null,
			availability: "not-available",
			permissionNote:
				"No authoritative published dataset of religious institutions exists for this area. OpenStreetMap data is available but is community-contributed and unverified for statutory purposes.",
			attribution: null,
			statutoryRelevance:
				"KZN Liquor Licensing Act s.43 — proximity to places of worship is a statutory consideration.",
		},
		{
			id: "recreation-facilities",
			label: "Public recreation facilities",
			role: "proximity",
			geometryType: "Point",
			sourceOrg: "Newcastle LM / Amajuba DM",
			sourceDataset: null,
			availability: "pending-permission",
			permissionNote:
				"Newcastle PMU dataset is registered in the source catalogue but access is pending. No published GIS layer confirmed.",
			attribution: null,
			statutoryRelevance:
				"KZN Liquor Licensing Act s.43 — proximity to recreation facilities is a statutory consideration.",
		},
		{
			id: "land-use",
			label: "Zoning / land-use scheme",
			role: "context",
			geometryType: "Polygon",
			sourceOrg: "Newcastle LM / KZN CoGTA",
			sourceDataset: null,
			availability: "pending-permission",
			permissionNote:
				"COGTA Land Use Scheme Pillar 2026 is accessible via ArcGIS FeatureServer but redistribution permission is pending. Newcastle LM zoning data access is unknown.",
			attribution: null,
			statutoryRelevance:
				"Land use context for the proposed premises location.",
		},
		{
			id: "cadastre",
			label: "Property / cadastral boundaries",
			role: "site",
			geometryType: "Polygon",
			sourceOrg: "Chief Directorate: National Geo-spatial Information (NGI)",
			sourceDataset: null,
			availability: "pending-permission",
			permissionNote:
				"NGI cadastral data requires a formal licence. No authorised dataset confirmed for redistribution.",
			attribution: null,
			statutoryRelevance:
				"Identifies the specific property parcel subject to the application.",
		},
	],
};

// Default profile for notice types without a specific profile
const DEFAULT_LAYERS = LAYER_PROFILES.liquor.filter((l) =>
	["wards", "municipalities", "district"].includes(l.id),
);

type LayerWithFeatures = (typeof LAYER_PROFILES.liquor)[0] & {
	features?: {
		type: "FeatureCollection";
		features: Array<{
			type: "Feature";
			geometry: { type: string; coordinates: unknown };
			properties: Record<string, unknown>;
		}>;
		meta: {
			dataset: string;
			attribution: string | null;
			count: number;
		};
	} | null;
};

async function fetchDatasetFeatures(
	supabase: ReturnType<typeof createServiceClient>,
	datasetName: string,
): Promise<LayerWithFeatures["features"]> {
	const { data: dataset } = await supabase
		.from("spatial_datasets")
		.select("id, name, attribution, dataset_date")
		.eq("status", "published")
		.eq("active", true)
		.ilike("name", `%${datasetName.split("—")[0].trim()}%`)
		.limit(1)
		.maybeSingle();

	if (!dataset) return null;

	const { data: rows } = await supabase
		.from("spatial_staged_features")
		.select("feature_geojson, feature_properties")
		.eq("dataset_id", dataset.id)
		.eq("operator_status", "approved");

	if (!rows?.length) return null;

	return {
		type: "FeatureCollection",
		features: rows.map((r) => ({
			type: "Feature" as const,
			geometry: r.feature_geojson as { type: string; coordinates: unknown },
			properties: (r.feature_properties ?? {}) as Record<string, unknown>,
		})),
		meta: {
			dataset: dataset.name,
			attribution: dataset.attribution,
			count: rows.length,
		},
	};
}

/**
 * Extract CAT_B from a feature's properties.
 * Handles both direct CAT_B field and NAMECODE format "Newcastle (KZN252)".
 */
function extractCatB(props: Record<string, unknown>): string | null {
	if (typeof props.CAT_B === "string" && props.CAT_B) return props.CAT_B;
	if (typeof props.MDB_CAT_B === "string" && props.MDB_CAT_B) return props.MDB_CAT_B;
	// NAMECODE format: "Newcastle (KZN252)" or "Newcastle Local Municipality (KZN252)"
	if (typeof props.NAMECODE === "string") {
		const match = props.NAMECODE.match(/\(([A-Z]{2,3}\d{3})\)/);
		if (match) return match[1];
	}
	return null;
}

/**
 * Filter a FeatureCollection to only features relevant to the notice location.
 * wardNumber + catB narrow wards to the specific ward; municipality to its LM;
 * district is always the single Amajuba DC25 feature.
 */
function filterFeaturesForNotice(
	features: LayerWithFeatures["features"],
	layerId: string,
	wardNumber: number | null,
	catB: string | null,
): LayerWithFeatures["features"] {
	if (!features?.features.length) return features;
	if (layerId === "wards" && wardNumber != null && catB) {
		const filtered = features.features.filter(
			(f) =>
				f.properties.WardNo === wardNumber &&
				f.properties.CAT_B === catB,
		);
		if (!filtered.length) return features;
		return { ...features, features: filtered, meta: { ...features.meta, count: filtered.length } };
	}
	if (layerId === "municipalities" && catB) {
		const filtered = features.features.filter(
			(f) => extractCatB(f.properties) === catB,
		);
		if (!filtered.length) return features;
		return { ...features, features: filtered, meta: { ...features.meta, count: filtered.length } };
	}
	// district: always single feature, return as-is
	return features;
}

export async function GET(req: Request) {
	const url = new URL(req.url);
	const noticeType = url.searchParams.get("noticeType") ?? "other";
	const includeFeatures = url.searchParams.get("features") !== "false";
	// Ward context for spatial filtering — passed by the notice page
	const wardNumber = url.searchParams.get("wardNumber")
		? Number(url.searchParams.get("wardNumber"))
		: null;
	const catB = url.searchParams.get("catB") ?? null;

	const profile = LAYER_PROFILES[noticeType] ?? DEFAULT_LAYERS;
	const supabase = createServiceClient();

	const layers: LayerWithFeatures[] = await Promise.all(
		profile.map(async (layer) => {
			if (
				!includeFeatures ||
				layer.availability !== "available" ||
				!layer.sourceDataset
			) {
				return { ...layer, features: null };
			}
			const features = await fetchDatasetFeatures(supabase, layer.sourceDataset);
			const filtered = filterFeaturesForNotice(features, layer.id, wardNumber, catB);
			return { ...layer, features: filtered };
		}),
	);

	return NextResponse.json(
		{
			noticeType,
			wardNumber,
			catB,
			layers,
			generatedAt: new Date().toISOString(),
			disclaimer:
				"Spatial layers are provided for contextual reference only. Availability and permission status reflect the current state of the Control Centre spatial catalogue. Missing layers indicate data access is pending — absence of a layer does not imply absence of relevant features.",
		},
		{ headers: CORS },
	);
}

export async function OPTIONS() {
	return new Response(null, { status: 204, headers: CORS });
}
