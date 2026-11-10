import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const CORS = {
	"Access-Control-Allow-Origin": "*",
	"Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
};

/**
 * Public endpoint — no auth required.
 * Looks up a CC notice by its Governance Node Sanity _id (node_notice_ref).
 * Returns the same safe public intelligence payload as /api/notices/[id].
 *
 * The nodeRef is the Sanity document _id — not a UUID, not a slug.
 * Basic length validation only (Sanity IDs are not predictable UUIDs).
 *
 * Node identity is not validated here because this is a public read endpoint.
 * The node_notice_ref is not secret — it is the Sanity document _id which
 * appears in the Node's public URLs. The response contains no sensitive data.
 */
export async function GET(
	_req: Request,
	{ params }: { params: Promise<{ nodeRef: string }> },
) {
	const { nodeRef } = await params;

	if (!nodeRef || nodeRef.length < 10 || nodeRef.length > 100) {
		return NextResponse.json(
			{ error: "Invalid nodeRef" },
			{ status: 400, headers: CORS },
		);
	}

	const supabase = createServiceClient();

	const { data: notice } = await supabase
		.from("notices")
		.select("id, type, status")
		.eq("node_notice_ref", nodeRef)
		.in("status", ["published", "open", "closed", "approved", "rejected"])
		.maybeSingle();

	if (!notice) {
		return NextResponse.json(
			{ error: "No published CC notice found for this node reference" },
			{ status: 404, headers: CORS },
		);
	}

	const [{ data: risks }, { data: obligations }, { data: findings }] =
		await Promise.all([
			supabase
				.from("risks")
				.select(
					"id, identifier, title, category, likelihood, impact, exposure, status, treatment",
				)
				.eq("notice_id", notice.id)
				.neq("status", "closed")
				.order("exposure", { ascending: false }),
			supabase
				.from("compliance_obligations")
				.select("id, identifier, title, source, due_date, status")
				.eq("notice_id", notice.id)
				.order("due_date", { ascending: true, nullsFirst: false }),
			supabase
				.from("findings")
				.select("id, title, finding_type, severity, status, identified_at")
				.eq("notice_id", notice.id)
				.neq("status", "resolved")
				.order("identified_at", { ascending: false }),
		]);

	const riskRows = risks ?? [];
	const obligationRows = obligations ?? [];
	const findingRows = findings ?? [];

	return NextResponse.json(
		{
			noticeId: notice.id,
			noticeType: notice.type,
			risks: riskRows,
			obligations: obligationRows,
			findings: findingRows,
			summary: {
				riskCount: riskRows.length,
				criticalRisks: riskRows.filter((r) => r.exposure >= 15).length,
				highRisks: riskRows.filter((r) => r.exposure >= 8 && r.exposure < 15)
					.length,
				obligationCount: obligationRows.length,
				nonCompliant: obligationRows.filter((o) => o.status === "non-compliant")
					.length,
				underReview: obligationRows.filter((o) => o.status === "under-review")
					.length,
				findingCount: findingRows.length,
				openFindings: findingRows.filter(
					(f) => f.status === "open" || f.status === "in-progress",
				).length,
				dataConfidence:
					riskRows.length === 0 && obligationRows.length === 0
						? "no-assessment"
						: "operator-assessed",
			},
			meta: {
				source: "unami-platform-core",
				generatedAt: new Date().toISOString(),
			},
		},
		{ headers: CORS },
	);
}

export async function OPTIONS() {
	return new Response(null, { status: 204, headers: CORS });
}
