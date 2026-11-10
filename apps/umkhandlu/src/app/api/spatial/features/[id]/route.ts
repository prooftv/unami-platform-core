import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const CORS = {
	"Access-Control-Allow-Origin": "*",
	"Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
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

	const { data: row } = await supabase
		.from("spatial_staged_features")
		.select("id, feature_geojson, feature_properties, dataset_id")
		.eq("id", id)
		.eq("operator_status", "approved")
		.maybeSingle();

	if (!row) {
		return NextResponse.json(
			{ error: "Feature not found or not approved" },
			{ status: 404, headers: CORS },
		);
	}

	return NextResponse.json(
		{
			type: "Feature",
			geometry: row.feature_geojson,
			properties: row.feature_properties ?? {},
			meta: { source: "unami-platform-core", featureId: row.id },
		},
		{ headers: CORS },
	);
}

export async function OPTIONS() {
	return new Response(null, { status: 204, headers: CORS });
}
