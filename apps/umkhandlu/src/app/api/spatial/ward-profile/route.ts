import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const CORS = {
	"Access-Control-Allow-Origin": "*",
	"Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
};

export type WardProfileRecord = {
	WardID: string;
	WardNo: number;
	Ward_Label: string;
	CAT_B: string;
	Municipality: string;
	Province: string;
	Total_Pop: number;
	Pop_Density: number;
	Black_African: number;
	White: number;
	Coloured: number;
	Indian_or_Asian: number;
	Employed: number;
	Unemployed: number;
	Discouraged_Work_Seeker: number;
	Not_Economically_Active: number;
	Not_Applicable_Emp: number;
	Unspecified_Emp: number;
	Grade_12_Std10: number;
	Higher: number;
	No_schooling: number;
	Some_Primary: number;
	Completed_Primary: number;
	Some_Secondary: number;
	Not_Applicable_Edu: number;
	Flush_Toilet_SewerSystem: number;
	Flush_Toilet_SepticTank: number;
	Chemical_Toilet: number;
	Pit_Toilet_VIP: number;
	Pit_Toilet_NoVentilation: number;
	Bucket_Toilet: number;
	None_Toilet: number;
	Unspecified_Toilet: number;
	Tap_In_Dwelling: number;
	tap_in_Yard: number;
	No_access_to_piped_water: number;
	Unspecified_Water: number;
	Removed_Weekly: number;
	Removed_Seldom: number;
	Communal_dump: number;
	Own_dump: number;
	No_Disposal: number;
	Unspecified_Refuse: number;
	Reg_Voters: number;
	Area_SqKm: number;
};

export type WardProfileResponse = {
	datasetName: string;
	attribution: string;
	datasetDate: string;
	wardCount: number;
	wards: WardProfileRecord[];
};

export async function GET(req: Request) {
	const url = new URL(req.url);
	const catB = url.searchParams.get("catB");
	const wardNo = url.searchParams.get("wardNo") ? Number(url.searchParams.get("wardNo")) : null;

	const supabase = createServiceClient();

	const { data: dataset } = await supabase
		.from("spatial_datasets")
		.select("id, name, attribution, dataset_date")
		.eq("status", "published")
		.eq("active", true)
		.ilike("name", "MDB WardProfile 2021%")
		.order("published_at", { ascending: false })
		.limit(1)
		.maybeSingle();

	if (!dataset) {
		return NextResponse.json(
			{ error: "WardProfile 2021 dataset not published." },
			{ status: 404, headers: CORS },
		);
	}

	let query = supabase
		.from("spatial_staged_features")
		.select("feature_properties")
		.eq("dataset_id", dataset.id)
		.eq("operator_status", "approved");

	if (catB) {
		query = query.eq("feature_properties->>CAT_B", catB);
	}
	if (wardNo != null) {
		query = query.eq("feature_properties->>WardNo", String(wardNo));
	}

	const { data: rows } = await query;
	const wards = (rows ?? []).map((r) => r.feature_properties as WardProfileRecord);

	return NextResponse.json(
		{
			datasetName: dataset.name,
			attribution: dataset.attribution ?? "Municipal Demarcation Board (MDB) — Ward Profile 2021, public domain",
			datasetDate: dataset.dataset_date ?? "2021",
			wardCount: wards.length,
			wards,
		} satisfies WardProfileResponse,
		{ headers: CORS },
	);
}

export async function OPTIONS() {
	return new Response(null, { status: 204, headers: CORS });
}
