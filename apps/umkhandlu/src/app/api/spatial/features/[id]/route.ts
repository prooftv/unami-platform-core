import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { filterPubliclyRedistributableDatasets } from "@/lib/gis/spatial-public-access";

export const dynamic = "force-dynamic";

const CORS = {
	"Access-Control-Allow-Origin": "*",
	"Cache-Control": "no-store",
};

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

	if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
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

	const { data: dataset, error: datasetError } = await supabase
		.from("spatial_datasets")
		.select("id, name, status, active, source_id, permission_classification, attribution, dataset_date")
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

	return NextResponse.json(
		{
			type: "Feature",
			geometry: row.feature_geojson,
			properties: row.feature_properties ?? {},
			meta: {
				source: "unami-platform-core",
				featureId: row.id,
				dataset: dataset.name,
				attribution: dataset.attribution,
				datasetDate: dataset.dataset_date,
			},
		},
		{ headers: CORS },
	);
}

export async function OPTIONS() {
	return new Response(null, { status: 204, headers: CORS });
}
