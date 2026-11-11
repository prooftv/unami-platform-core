import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const CORS = {
	"Access-Control-Allow-Origin": "*",
	"Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
};

type Availability = "available" | "pending-permission" | "not-available";

interface LayerProfile {
	id: string;
	label: string;
	role: string;
	geometryType: string;
	sourceOrg: string;
	sourceDataset: string | null;
	availability: Availability;
	permissionNote: string | null;
	attribution: string | null;
	statutoryRelevance: string;
}

// ---------------------------------------------------------------------------
// Shared administrative base layers — used by all notice types
// ---------------------------------------------------------------------------
const ADMIN_LAYERS: LayerProfile[] = [
	{
		id: "wards",
		label: "Ward boundaries (MDB 2026)",
		role: "administrative",
		geometryType: "Polygon",
		sourceOrg: "Municipal Demarcation Board",
		sourceDataset: "MDB Wards 2026 — Amajuba DC25",
		availability: "available",
		permissionNote: null,
		attribution: "MDB — public domain, CC-BY",
		statutoryRelevance: "Ward context for jurisdiction and community notification.",
	},
	{
		id: "municipalities",
		label: "Local municipality boundaries",
		role: "administrative",
		geometryType: "Polygon",
		sourceOrg: "KZN DARD (MDB data)",
		sourceDataset: "KZN DARD Local Municipalities",
		availability: "available",
		permissionNote: null,
		attribution: "MDB — public domain, CC-BY. Hosted by KZN DARD.",
		statutoryRelevance: "Determines which authority has jurisdiction.",
	},
	{
		id: "district",
		label: "District municipality boundary",
		role: "administrative",
		geometryType: "Polygon",
		sourceOrg: "KZN DARD (MDB data)",
		sourceDataset: "KZN DARD District Municipality",
		availability: "available",
		permissionNote: null,
		attribution: "MDB — public domain, CC-BY. Hosted by KZN DARD.",
		statutoryRelevance: "Amajuba DC25 district context.",
	},
];

// ---------------------------------------------------------------------------
// Layer profiles per notice type
// ---------------------------------------------------------------------------
const LAYER_PROFILES: Record<string, LayerProfile[]> = {
	liquor: [
		...ADMIN_LAYERS,
		{
			id: "traditional-areas",
			label: "Traditional authority / community areas",
			role: "community",
			geometryType: "Polygon",
			sourceOrg: "KZN CoGTA / Commission on Traditional Leadership",
			sourceDataset: null,
			availability: "pending-permission",
			permissionNote:
				"COGTA ILIS Land Tenure Component v2 accessible but feature queries blocked from external IPs. IP allowlisting request submitted.",
			attribution: null,
			statutoryRelevance:
				"KZN Liquor Licensing Act s.43 — traditional council consultation area.",
		},
		{
			id: "schools",
			label: "Learning institutions (OSM)",
			role: "proximity",
			geometryType: "Point",
			sourceOrg: "Humanitarian OpenStreetMap Team (HOT)",
			sourceDataset: "HOT OSM Education Facilities — Amajuba DC25",
			availability: "available",
			permissionNote: null,
			attribution: "OpenStreetMap contributors — ODbL. Surrogate for DBE EMIS pending formal permission.",
			statutoryRelevance:
				"KZN Liquor Licensing Act s.43 — proximity to schools is a statutory consideration.",
		},
		{
			id: "religious-institutions",
			label: "Religious and cultural places (OSM)",
			role: "proximity",
			geometryType: "Point",
			sourceOrg: "Humanitarian OpenStreetMap Team (HOT)",
			sourceDataset: "HOT OSM Cultural Places — Amajuba DC25",
			availability: "available",
			permissionNote: null,
			attribution: "OpenStreetMap contributors — ODbL.",
			statutoryRelevance:
				"KZN Liquor Licensing Act s.43 — proximity to places of worship is a statutory consideration.",
		},
		{
			id: "health-facilities",
			label: "Health facilities (OSM)",
			role: "proximity",
			geometryType: "Point",
			sourceOrg: "Humanitarian OpenStreetMap Team (HOT)",
			sourceDataset: "HOT OSM Health Facilities — Amajuba DC25",
			availability: "available",
			permissionNote: null,
			attribution: "OpenStreetMap contributors — ODbL.",
			statutoryRelevance:
				"KZN Liquor Licensing Act s.43 — proximity to health facilities is a statutory consideration.",
		},
		{
			id: "recreation-facilities",
			label: "Recreation and public facilities (OSM POI)",
			role: "proximity",
			geometryType: "Point",
			sourceOrg: "Humanitarian OpenStreetMap Team (HOT)",
			sourceDataset: "HOT OSM Points of Interest — Amajuba DC25",
			availability: "available",
			permissionNote: null,
			attribution: "OpenStreetMap contributors — ODbL.",
			statutoryRelevance:
				"KZN Liquor Licensing Act s.43 — proximity to recreation facilities is a statutory consideration.",
		},
		{
			id: "licensed-premises",
			label: "Existing licensed premises",
			role: "proximity",
			geometryType: "Point",
			sourceOrg: "KwaZulu-Natal Economic Regulatory Authority (KZNERA)",
			sourceDataset: null,
			availability: "not-available",
			permissionNote:
				"KZNERA does not publish a machine-readable licensed premises register. Manual verification required.",
			attribution: null,
			statutoryRelevance:
				"KZN Liquor Licensing Act s.43 — proximity to existing licensed premises.",
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
				"COGTA Land Use Scheme Pillar 2026 accessible via ArcGIS FeatureServer but redistribution permission pending.",
			attribution: null,
			statutoryRelevance: "Land use context for the proposed premises location.",
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
				"NGI cadastral data requires a formal licence. Not yet confirmed for redistribution.",
			attribution: null,
			statutoryRelevance: "Identifies the specific property parcel subject to the application.",
		},
	],

	eia: [
		...ADMIN_LAYERS,
		{
			id: "waterways",
			label: "Rivers, streams and waterways (OSM)",
			role: "environmental",
			geometryType: "LineString",
			sourceOrg: "Humanitarian OpenStreetMap Team (HOT)",
			sourceDataset: "HOT OSM Waterways — Amajuba DC25",
			availability: "available",
			permissionNote: null,
			attribution: "OpenStreetMap contributors — ODbL.",
			statutoryRelevance:
				"NEMA EIA Regulations — watercourse setback (32m) and wetland proximity assessment.",
		},
		{
			id: "populated-places",
			label: "Populated places and settlements (OSM)",
			role: "community",
			geometryType: "Point",
			sourceOrg: "Humanitarian OpenStreetMap Team (HOT)",
			sourceDataset: "HOT OSM Populated Places — Amajuba DC25",
			availability: "available",
			permissionNote: null,
			attribution: "OpenStreetMap contributors — ODbL.",
			statutoryRelevance:
				"NEMA EIA — affected community identification for public participation.",
		},
		{
			id: "health-facilities",
			label: "Health facilities (OSM)",
			role: "proximity",
			geometryType: "Point",
			sourceOrg: "Humanitarian OpenStreetMap Team (HOT)",
			sourceDataset: "HOT OSM Health Facilities — Amajuba DC25",
			availability: "available",
			permissionNote: null,
			attribution: "OpenStreetMap contributors — ODbL.",
			statutoryRelevance:
				"NEMA EIA — receptor sensitivity assessment for health facilities.",
		},
		{
			id: "schools",
			label: "Learning institutions (OSM)",
			role: "proximity",
			geometryType: "Point",
			sourceOrg: "Humanitarian OpenStreetMap Team (HOT)",
			sourceDataset: "HOT OSM Education Facilities — Amajuba DC25",
			availability: "available",
			permissionNote: null,
			attribution: "OpenStreetMap contributors — ODbL.",
			statutoryRelevance:
				"NEMA EIA — receptor sensitivity assessment for schools.",
		},
		{
			id: "traditional-areas",
			label: "Traditional authority / community areas",
			role: "community",
			geometryType: "Polygon",
			sourceOrg: "KZN CoGTA",
			sourceDataset: null,
			availability: "pending-permission",
			permissionNote:
				"COGTA ILIS accessible but feature queries blocked from external IPs.",
			attribution: null,
			statutoryRelevance:
				"IPILRA — traditional community consultation requirement.",
		},
		{
			id: "land-use",
			label: "Zoning / land-use scheme",
			role: "context",
			geometryType: "Polygon",
			sourceOrg: "KZN CoGTA",
			sourceDataset: null,
			availability: "pending-permission",
			permissionNote:
				"COGTA Land Use Scheme Pillar 2026 accessible but redistribution permission pending.",
			attribution: null,
			statutoryRelevance:
				"NEMA s.24 — land use compatibility assessment.",
		},
		{
			id: "cadastre",
			label: "Property / cadastral boundaries",
			role: "site",
			geometryType: "Polygon",
			sourceOrg: "NGI",
			sourceDataset: null,
			availability: "pending-permission",
			permissionNote: "NGI cadastral data requires a formal licence.",
			attribution: null,
			statutoryRelevance: "Property parcel identification for the activity footprint.",
		},
	],

	rezoning: [
		...ADMIN_LAYERS,
		{
			id: "populated-places",
			label: "Populated places and settlements (OSM)",
			role: "community",
			geometryType: "Point",
			sourceOrg: "Humanitarian OpenStreetMap Team (HOT)",
			sourceDataset: "HOT OSM Populated Places — Amajuba DC25",
			availability: "available",
			permissionNote: null,
			attribution: "OpenStreetMap contributors — ODbL.",
			statutoryRelevance:
				"SPLUMA — affected community identification for public participation.",
		},
		{
			id: "roads",
			label: "Road network (OSM)",
			role: "infrastructure",
			geometryType: "LineString",
			sourceOrg: "Humanitarian OpenStreetMap Team (HOT)",
			sourceDataset: "HOT OSM Roads — Amajuba DC25",
			availability: "available",
			permissionNote: null,
			attribution: "OpenStreetMap contributors — ODbL.",
			statutoryRelevance:
				"SPLUMA — road access and servitude analysis for rezoning.",
		},
		{
			id: "land-use",
			label: "Zoning / land-use scheme",
			role: "context",
			geometryType: "Polygon",
			sourceOrg: "KZN CoGTA",
			sourceDataset: null,
			availability: "pending-permission",
			permissionNote:
				"COGTA Land Use Scheme Pillar 2026 accessible but redistribution permission pending.",
			attribution: null,
			statutoryRelevance: "SPLUMA s.42 — existing zoning context.",
		},
		{
			id: "cadastre",
			label: "Property / cadastral boundaries",
			role: "site",
			geometryType: "Polygon",
			sourceOrg: "NGI",
			sourceDataset: null,
			availability: "pending-permission",
			permissionNote: "NGI cadastral data requires a formal licence.",
			attribution: null,
			statutoryRelevance: "SPLUMA — property parcel identification.",
		},
	],

	infrastructure: [
		...ADMIN_LAYERS,
		{
			id: "roads",
			label: "Road network (OSM)",
			role: "infrastructure",
			geometryType: "LineString",
			sourceOrg: "Humanitarian OpenStreetMap Team (HOT)",
			sourceDataset: "HOT OSM Roads — Amajuba DC25",
			availability: "available",
			permissionNote: null,
			attribution: "OpenStreetMap contributors — ODbL.",
			statutoryRelevance: "Road access and servitude analysis.",
		},
		{
			id: "railways",
			label: "Railway lines and stations (OSM)",
			role: "infrastructure",
			geometryType: "LineString",
			sourceOrg: "Humanitarian OpenStreetMap Team (HOT)",
			sourceDataset: "HOT OSM Railways — Amajuba DC25",
			availability: "available",
			permissionNote: null,
			attribution: "OpenStreetMap contributors — ODbL.",
			statutoryRelevance:
				"Rail corridor proximity — Newcastle coal line and freight infrastructure.",
		},
		{
			id: "waterways",
			label: "Rivers, streams and waterways (OSM)",
			role: "environmental",
			geometryType: "LineString",
			sourceOrg: "Humanitarian OpenStreetMap Team (HOT)",
			sourceDataset: "HOT OSM Waterways — Amajuba DC25",
			availability: "available",
			permissionNote: null,
			attribution: "OpenStreetMap contributors — ODbL.",
			statutoryRelevance: "Watercourse crossing and setback requirements.",
		},
		{
			id: "populated-places",
			label: "Populated places and settlements (OSM)",
			role: "community",
			geometryType: "Point",
			sourceOrg: "Humanitarian OpenStreetMap Team (HOT)",
			sourceDataset: "HOT OSM Populated Places — Amajuba DC25",
			availability: "available",
			permissionNote: null,
			attribution: "OpenStreetMap contributors — ODbL.",
			statutoryRelevance: "Affected community identification.",
		},
	],

	mining: [
		...ADMIN_LAYERS,
		{
			id: "waterways",
			label: "Rivers, streams and waterways (OSM)",
			role: "environmental",
			geometryType: "LineString",
			sourceOrg: "Humanitarian OpenStreetMap Team (HOT)",
			sourceDataset: "HOT OSM Waterways — Amajuba DC25",
			availability: "available",
			permissionNote: null,
			attribution: "OpenStreetMap contributors — ODbL.",
			statutoryRelevance:
				"MPRDA / NEMA — watercourse setback and acid mine drainage risk.",
		},
		{
			id: "populated-places",
			label: "Populated places and settlements (OSM)",
			role: "community",
			geometryType: "Point",
			sourceOrg: "Humanitarian OpenStreetMap Team (HOT)",
			sourceDataset: "HOT OSM Populated Places — Amajuba DC25",
			availability: "available",
			permissionNote: null,
			attribution: "OpenStreetMap contributors — ODbL.",
			statutoryRelevance:
				"MPRDA s.5 — affected community consultation and surface rights.",
		},
		{
			id: "health-facilities",
			label: "Health facilities (OSM)",
			role: "proximity",
			geometryType: "Point",
			sourceOrg: "Humanitarian OpenStreetMap Team (HOT)",
			sourceDataset: "HOT OSM Health Facilities — Amajuba DC25",
			availability: "available",
			permissionNote: null,
			attribution: "OpenStreetMap contributors — ODbL.",
			statutoryRelevance:
				"Receptor sensitivity — health facilities near mining operations.",
		},
		{
			id: "schools",
			label: "Learning institutions (OSM)",
			role: "proximity",
			geometryType: "Point",
			sourceOrg: "Humanitarian OpenStreetMap Team (HOT)",
			sourceDataset: "HOT OSM Education Facilities — Amajuba DC25",
			availability: "available",
			permissionNote: null,
			attribution: "OpenStreetMap contributors — ODbL.",
			statutoryRelevance:
				"Receptor sensitivity — schools near mining operations.",
		},
		{
			id: "traditional-areas",
			label: "Traditional authority / community areas",
			role: "community",
			geometryType: "Polygon",
			sourceOrg: "KZN CoGTA",
			sourceDataset: null,
			availability: "pending-permission",
			permissionNote:
				"COGTA ILIS accessible but feature queries blocked from external IPs.",
			attribution: null,
			statutoryRelevance:
				"MPRDA s.5 — traditional community surface rights consultation.",
		},
	],
};

// Default: administrative context only
const DEFAULT_LAYERS = ADMIN_LAYERS;

type LayerWithFeatures = LayerProfile & {
	features?: {
		type: "FeatureCollection";
		features: Array<{
			type: "Feature";
			geometry: { type: string; coordinates: unknown };
			properties: Record<string, unknown>;
		}>;
		meta: { dataset: string; attribution: string | null; count: number };
	} | null;
};

async function fetchDatasetFeatures(
	supabase: ReturnType<typeof createServiceClient>,
	datasetName: string,
): Promise<LayerWithFeatures["features"]> {
	const searchTerm = datasetName.split("—")[0].trim();
	const { data: dataset } = await supabase
		.from("spatial_datasets")
		.select("id, name, attribution")
		.eq("status", "published")
		.eq("active", true)
		.ilike("name", `%${searchTerm}%`)
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
		meta: { dataset: dataset.name, attribution: dataset.attribution, count: rows.length },
	};
}

function filterFeaturesForNotice(
	features: LayerWithFeatures["features"],
	layerId: string,
	wardNumber: number | null,
	catB: string | null,
): LayerWithFeatures["features"] {
	if (!features?.features.length) return features;
	if (layerId === "wards" && wardNumber != null && catB) {
		const filtered = features.features.filter(
			(f) => f.properties.WardNo === wardNumber && f.properties.CAT_B === catB,
		);
		if (!filtered.length) return features;
		return { ...features, features: filtered, meta: { ...features.meta, count: filtered.length } };
	}
	if (layerId === "municipalities" && catB) {
		const filtered = features.features.filter(
			(f) =>
				f.properties.cat_b === catB ||
				f.properties.CAT_B === catB ||
				f.properties.MDB_CAT_B === catB,
		);
		if (!filtered.length) return features;
		return { ...features, features: filtered, meta: { ...features.meta, count: filtered.length } };
	}
	return features;
}

export async function GET(req: Request) {
	const url = new URL(req.url);
	const noticeType = url.searchParams.get("noticeType") ?? "other";
	const includeFeatures = url.searchParams.get("features") !== "false";
	const wardNumber = url.searchParams.get("wardNumber")
		? Number(url.searchParams.get("wardNumber"))
		: null;
	const catB = url.searchParams.get("catB") ?? null;

	const profile = LAYER_PROFILES[noticeType] ?? DEFAULT_LAYERS;
	const supabase = createServiceClient();

	const layers: LayerWithFeatures[] = await Promise.all(
		profile.map(async (layer) => {
			if (!includeFeatures || layer.availability !== "available" || !layer.sourceDataset) {
				return { ...layer, features: null };
			}
			const features = await fetchDatasetFeatures(supabase, layer.sourceDataset);
			const filtered = filterFeaturesForNotice(features, layer.id, wardNumber, catB);
			return { ...layer, features: filtered };
		}),
	);

	const availableCount = layers.filter((l) => l.availability === "available").length;
	const pendingCount = layers.filter((l) => l.availability === "pending-permission").length;
	const unavailableCount = layers.filter((l) => l.availability === "not-available").length;
	const withFeatures = layers.filter((l) => l.features?.features.length).length;

	return NextResponse.json(
		{
			noticeType,
			wardNumber,
			catB,
			layers,
			summary: { total: layers.length, available: availableCount, pending: pendingCount, unavailable: unavailableCount, withFeatures },
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
