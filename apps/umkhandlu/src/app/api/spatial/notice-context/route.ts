import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const CORS = {
	"Access-Control-Allow-Origin": "*",
	"Cache-Control": "public, s-maxage=120, stale-while-revalidate=300",
};

// ─── Types ────────────────────────────────────────────────────────────────────

type GeoJSONGeometry = { type: string; coordinates: unknown };

type SpatialFeature = {
	type: "Feature";
	geometry: GeoJSONGeometry;
	properties: Record<string, unknown>;
};

type DatasetResult = {
	status: "found" | "not-found" | "unavailable" | "pending-permission" | "not-applicable";
	datasetName: string | null;
	attribution: string | null;
	datasetDate: string | null;
	featureCount: number;
	features: SpatialFeature[];
	note: string | null;
};

export type NoticeContextResponse = {
	noticeType: string;
	wardNumber: number | null;
	catB: string | null;
	lat: number | null;
	lng: number | null;
	locationPrecision: string | null;
	administrative: {
		ward: DatasetResult;
		municipality: DatasetResult;
		district: DatasetResult;
	};
	proximity: {
		traditionalAreas: DatasetResult;
		licensedPremises: DatasetResult;
		schools: DatasetResult;
		religiousInstitutions: DatasetResult;
		recreationFacilities: DatasetResult;
	};
	siteContext: {
		landUse: DatasetResult;
		cadastre: DatasetResult;
	};
	proximityRadiusMetres: number | null;
	proximityRadiusNote: string | null;
	generatedAt: string;
	disclaimer: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractCatB(props: Record<string, unknown>): string | null {
	if (typeof props.CAT_B === "string" && props.CAT_B) return props.CAT_B;
	if (typeof props.MDB_CAT_B === "string" && props.MDB_CAT_B) return props.MDB_CAT_B;
	if (typeof props.NAMECODE === "string") {
		const match = props.NAMECODE.match(/\(([A-Z]{2,3}\d{3})\)/);
		if (match) return match[1];
	}
	return null;
}

async function fetchPublishedDataset(
	supabase: ReturnType<typeof createServiceClient>,
	nameFragment: string,
): Promise<{ id: string; name: string; attribution: string | null; dataset_date: string | null } | null> {
	const { data } = await supabase
		.from("spatial_datasets")
		.select("id, name, attribution, dataset_date")
		.eq("status", "published")
		.eq("active", true)
		.ilike("name", `%${nameFragment}%`)
		.order("published_at", { ascending: false })
		.limit(1)
		.maybeSingle();
	return data ?? null;
}

async function fetchApprovedFeatures(
	supabase: ReturnType<typeof createServiceClient>,
	datasetId: string,
): Promise<SpatialFeature[]> {
	const { data: rows } = await supabase
		.from("spatial_staged_features")
		.select("feature_geojson, feature_properties")
		.eq("dataset_id", datasetId)
		.eq("operator_status", "approved");
	return (rows ?? []).map((r) => ({
		type: "Feature" as const,
		geometry: r.feature_geojson as GeoJSONGeometry,
		properties: (r.feature_properties ?? {}) as Record<string, unknown>,
	}));
}

function unavailable(note: string): DatasetResult {
	return { status: "unavailable", datasetName: null, attribution: null, datasetDate: null, featureCount: 0, features: [], note };
}

function pendingPermission(note: string): DatasetResult {
	return { status: "pending-permission", datasetName: null, attribution: null, datasetDate: null, featureCount: 0, features: [], note };
}

function notApplicable(): DatasetResult {
	return { status: "not-applicable", datasetName: null, attribution: null, datasetDate: null, featureCount: 0, features: [], note: null };
}

// ─── Administrative layers ────────────────────────────────────────────────────

async function resolveWard(
	supabase: ReturnType<typeof createServiceClient>,
	wardNumber: number | null,
	catB: string | null,
): Promise<DatasetResult> {
	const dataset = await fetchPublishedDataset(supabase, "MDB Wards 2026");
	if (!dataset) return unavailable("MDB Wards 2026 dataset not published in Control Centre.");
	const all = await fetchApprovedFeatures(supabase, dataset.id);
	if (!all.length) return unavailable("No approved ward features in dataset.");
	if (wardNumber == null || !catB) {
		return {
			status: "found",
			datasetName: dataset.name,
			attribution: dataset.attribution,
			datasetDate: dataset.dataset_date,
			featureCount: all.length,
			features: all,
			note: "Ward number or municipality not specified — returning all Amajuba wards.",
		};
	}
	const filtered = all.filter(
		(f) => f.properties.WardNo === wardNumber && f.properties.CAT_B === catB,
	);
	if (!filtered.length) {
		return {
			status: "not-found",
			datasetName: dataset.name,
			attribution: dataset.attribution,
			datasetDate: dataset.dataset_date,
			featureCount: 0,
			features: [],
			note: `Ward ${wardNumber} (${catB}) not found in published dataset. Dataset covers ${all.length} Amajuba wards.`,
		};
	}
	return {
		status: "found",
		datasetName: dataset.name,
		attribution: dataset.attribution,
		datasetDate: dataset.dataset_date,
		featureCount: filtered.length,
		features: filtered,
		note: null,
	};
}

async function resolveMunicipality(
	supabase: ReturnType<typeof createServiceClient>,
	catB: string | null,
): Promise<DatasetResult> {
	const dataset = await fetchPublishedDataset(supabase, "Amajuba Local Municipalities");
	if (!dataset) return unavailable("Amajuba Local Municipalities dataset not published.");
	const all = await fetchApprovedFeatures(supabase, dataset.id);
	if (!all.length) return unavailable("No approved municipality features.");
	if (!catB) {
		return {
			status: "found",
			datasetName: dataset.name,
			attribution: dataset.attribution,
			datasetDate: dataset.dataset_date,
			featureCount: all.length,
			features: all,
			note: "Municipality code not specified — returning all Amajuba local municipalities.",
		};
	}
	const filtered = all.filter((f) => extractCatB(f.properties) === catB);
	if (!filtered.length) {
		return {
			status: "not-found",
			datasetName: dataset.name,
			attribution: dataset.attribution,
			datasetDate: dataset.dataset_date,
			featureCount: 0,
			features: all, // return all as context fallback
			note: `Municipality ${catB} not matched by CAT_B — returning all Amajuba municipalities as context.`,
		};
	}
	return {
		status: "found",
		datasetName: dataset.name,
		attribution: dataset.attribution,
		datasetDate: dataset.dataset_date,
		featureCount: filtered.length,
		features: filtered,
		note: null,
	};
}

async function resolveDistrict(
	supabase: ReturnType<typeof createServiceClient>,
): Promise<DatasetResult> {
	const dataset = await fetchPublishedDataset(supabase, "Amajuba District Municipality Boundary");
	if (!dataset) return unavailable("Amajuba District Municipality Boundary dataset not published.");
	const features = await fetchApprovedFeatures(supabase, dataset.id);
	if (!features.length) return unavailable("No approved district boundary features.");
	return {
		status: "found",
		datasetName: dataset.name,
		attribution: dataset.attribution,
		datasetDate: dataset.dataset_date,
		featureCount: features.length,
		features,
		note: null,
	};
}

// ─── Proximity layers (all pending/unavailable — honest status) ───────────────

function resolveProximityLayers(noticeType: string): NoticeContextResponse["proximity"] {
	const isLiquor = noticeType === "liquor";
	return {
		traditionalAreas: pendingPermission(
			"Authoritative traditional authority boundary dataset not confirmed. COGTA ILIS Land Tenure Component v2 is accessible but redistribution permission is pending.",
		),
		licensedPremises: isLiquor
			? pendingPermission(
				"KZNERA does not publish a machine-readable licensed premises register. No authorised dataset available. Manual verification required.",
			)
			: notApplicable(),
		schools: isLiquor
			? pendingPermission(
				"DBE school location data is available via EMIS but redistribution requires formal permission. No authorised dataset confirmed.",
			)
			: notApplicable(),
		religiousInstitutions: isLiquor
			? unavailable(
				"No authoritative published dataset of religious institutions exists for this area. OpenStreetMap data is community-contributed and unverified for statutory purposes.",
			)
			: notApplicable(),
		recreationFacilities: isLiquor
			? pendingPermission(
				"Newcastle PMU dataset is registered in the source catalogue but access is pending. No published GIS layer confirmed.",
			)
			: notApplicable(),
	};
}

function resolveSiteContext(): NoticeContextResponse["siteContext"] {
	return {
		landUse: pendingPermission(
			"COGTA Land Use Scheme Pillar 2026 is accessible via ArcGIS FeatureServer but redistribution permission is pending.",
		),
		cadastre: pendingPermission(
			"NGI cadastral data requires a formal licence. No authorised dataset confirmed for redistribution.",
		),
	};
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function GET(req: Request) {
	const url = new URL(req.url);
	const noticeType = url.searchParams.get("noticeType") ?? "other";
	const wardNumber = url.searchParams.get("wardNumber") ? Number(url.searchParams.get("wardNumber")) : null;
	const catB = url.searchParams.get("catB") ?? null;
	const lat = url.searchParams.get("lat") ? Number(url.searchParams.get("lat")) : null;
	const lng = url.searchParams.get("lng") ? Number(url.searchParams.get("lng")) : null;
	const locationPrecision = url.searchParams.get("locationPrecision") ?? null;

	const supabase = createServiceClient();

	const [ward, municipality, district] = await Promise.all([
		resolveWard(supabase, wardNumber, catB),
		resolveMunicipality(supabase, catB),
		resolveDistrict(supabase),
	]);

	const response: NoticeContextResponse = {
		noticeType,
		wardNumber,
		catB,
		lat,
		lng,
		locationPrecision,
		administrative: { ward, municipality, district },
		proximity: resolveProximityLayers(noticeType),
		siteContext: resolveSiteContext(),
		// 500m is a common reference distance for KZN Liquor Act s.43 proximity considerations.
		// This is an exploratory context radius — not a verified statutory threshold.
		// Verify applicable statutory provision before treating as a legal rule.
		proximityRadiusMetres: noticeType === "liquor" ? 500 : null,
		proximityRadiusNote: noticeType === "liquor"
			? "500m exploratory context radius. Not a verified statutory threshold. KZN Liquor Licensing Act s.43 proximity requirements must be verified against current legislation before use as a legal determination."
			: null,
		generatedAt: new Date().toISOString(),
		disclaimer:
			"Spatial context is provided for reference only. Availability and permission status reflect the current state of the Control Centre spatial catalogue. Missing datasets indicate data access is pending — absence of a dataset does not imply absence of relevant features. This is not a legal determination.",
	};

	return NextResponse.json(response, { headers: CORS });
}

export async function OPTIONS() {
	return new Response(null, { status: 204, headers: CORS });
}
