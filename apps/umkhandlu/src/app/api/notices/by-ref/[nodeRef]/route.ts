import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const CORS = {
	"Access-Control-Allow-Origin": "*",
	"Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
};

/**
 * Public endpoint — no auth required.
 * Looks up a CC notice by its Governance Node Sanity document _id (node_notice_ref),
 * then returns the same intelligence payload as /api/notices/[id].
 *
 * Called by the Governance Node notice page when it has a ccNoticeRef (Sanity _id)
 * but not the CC UUID.
 */
export async function GET(
	_req: Request,
	{ params }: { params: Promise<{ nodeRef: string }> },
) {
	const { nodeRef } = await params;

	if (!nodeRef) {
		return NextResponse.json(
			{ error: "Missing nodeRef" },
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

	// Delegate to the same data fetch as /api/notices/[id]
	const [{ data: risks }, { data: obligations }, { data: findings }] =
		await Promise.all([
			supabase
				.from("risks")
				.select(
					"id, identifier, title, category, likelihood, impact, exposure, status, treatment, treatment_plan, methodology, assessed_at",
				)
				.eq("notice_id", notice.id)
				.neq("status", "closed")
				.order("exposure", { ascending: false }),
			supabase
				.from("compliance_obligations")
				.select(
					"id, identifier, title, source, responsible_party, due_date, status, recurrence, assessed_at",
				)
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
