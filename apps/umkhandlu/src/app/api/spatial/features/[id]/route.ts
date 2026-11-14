import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { filterPubliclyRedistributableDatasets } from "@/lib/gis/spatial-public-access";
import { isValidGeoJSONGeometry } from "@/lib/gis/spatial-proximity";

export const dynamic = "force-dynamic";

const CORS = {
	"Access-Control-Allow-Origin": "*",
	"Cache-Control": "no-store",
};

type SpatialSourceSummary = {
	name: string;
	institution: string;
	attribution: string | null;
};

function getSource(
	source: SpatialSourceSummary | SpatialSourceSummary[] | null,
): SpatialSourceSummary | null {
	if (Array.isArray(source)) return source[0] ?? null;
	return source;
}

/**
 * Public endpoint — no auth required.
 * Returns a single approved spatial feature as a GeoJSON Feature.
 * Consumed by Governance Nodes to render verified site boundaries on notice pages.
 */
export async function GET(
	_req: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const { id } = await params;

	if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
		return NextResponse.json(
			{ error: "Invalid feature id" },
			{ status: 400, headers: CORS },
		);
	}

	const supabase = createServiceClient();

	const { data: row, error: featureError } = await supabase
		.from("spatial_staged_features")
		.select("id, feature_geojson, feature_properties, dataset_id")
		.eq("id", id)
		.eq("operator_status", "approved")
		.maybeSingle();

	if (featureError) {
		console.error("Could not read published spatial feature:", featureError.message);
		return NextResponse.json(
			{ error: "Spatial feature is temporarily unavailable" },
			{ status: 500, headers: CORS },
		);
	}
	if (!row) {
		return NextResponse.json(
			{ error: "Feature not found or not approved" },
			{ status: 404, headers: CORS },
		);
	}
	if (!isValidGeoJSONGeometry(row.feature_geojson)) {
		console.error("Published spatial feature contains invalid geometry.");
		return NextResponse.json(
			{ error: "Spatial feature contains invalid geometry" },
			{ status: 500, headers: CORS },
		);
	}

	const { data: dataset, error: datasetError } = await supabase
		.from("spatial_datasets")
		.select("id, name, status, active, source_id, permission_classification, attribution, dataset_date, published_at, spatial_sources(name, institution, attribution)")
		.eq("id", row.dataset_id)
		.maybeSingle();
	if (datasetError) {
		console.error("Could not read spatial dataset permissions:", datasetError.message);
		return NextResponse.json(
			{ error: "Spatial feature is temporarily unavailable" },
			{ status: 500, headers: CORS },
		);
	}
	if (!dataset || dataset.status !== "published" || !dataset.active) {
		return NextResponse.json(
			{ error: "Feature not found or not published" },
			{ status: 404, headers: CORS },
		);
	}
	try {
		const { datasets } = await filterPubliclyRedistributableDatasets(
			supabase,
			[dataset],
		);
		if (!datasets.length) {
			return NextResponse.json(
				{ error: "Dataset is not cleared for public redistribution" },
				{ status: 403, headers: CORS },
			);
		}
	} catch (error) {
		console.error(
			"Could not verify spatial dataset permissions:",
			error instanceof Error ? error.message : String(error),
		);
		return NextResponse.json(
			{ error: "Spatial dataset permissions are temporarily unavailable" },
			{ status: 500, headers: CORS },
		);
	}
	const source = getSource(
		dataset.spatial_sources as SpatialSourceSummary | SpatialSourceSummary[] | null,
	);

	return NextResponse.json(
		{
			type: "Feature",
			id: row.id,
			geometry: row.feature_geojson,
			properties: row.feature_properties ?? {},
			meta: {
				source: "unami-platform-core",
				featureId: row.id,
				datasetId: dataset.id,
				dataset: dataset.name,
				sourceId: dataset.source_id,
				sourceName: source?.name ?? null,
				sourceInstitution: source?.institution ?? null,
				attribution: dataset.attribution ?? source?.attribution ?? null,
				datasetDate: dataset.dataset_date,
				publishedAt: dataset.published_at,
			},
		},
		{ headers: CORS },
	);
}

export async function OPTIONS() {
	return new Response(null, { status: 204, headers: CORS });
}
