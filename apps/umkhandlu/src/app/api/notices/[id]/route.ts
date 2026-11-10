import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const CORS = {
	"Access-Control-Allow-Origin": "*",
	"Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
};

/**
 * Public endpoint — no auth required.
 * Returns the risk/compliance intelligence summary for a CC notice.
 * Consumed by Governance Nodes to render the risk and planning panel.
 *
 * Public response shape deliberately excludes:
 * - treatment_plan (internal operational detail)
 * - methodology (internal)
 * - assessed_at / assessed_by (internal)
 * - responsible_party (may contain personal information)
 * - recurrence (internal scheduling detail)
 * - node_notice_ref (internal cross-reference)
 *
 * Only published/open/closed/approved/rejected notices are accessible.
 * Draft notices are never exposed.
 */
export async function GET(
	_req: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const { id } = await params;

	if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
		return NextResponse.json(
			{ error: "Invalid notice id" },
			{ status: 400, headers: CORS },
		);
	}

	const supabase = createServiceClient();

	const { data: notice } = await supabase
		.from("notices")
		.select("id, type, status, is_statutory")
		.eq("id", id)
		.in("status", ["published", "open", "closed", "approved", "rejected"])
		.maybeSingle();

	if (!notice) {
		return NextResponse.json(
			{ error: "Notice not found or not published" },
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
				.eq("notice_id", id)
				.neq("status", "closed")
				.order("exposure", { ascending: false }),
			supabase
				.from("compliance_obligations")
				.select("id, identifier, title, source, due_date, status")
				.eq("notice_id", id)
				.order("due_date", { ascending: true, nullsFirst: false }),
			supabase
				.from("findings")
				.select("id, title, finding_type, severity, status, identified_at")
				.eq("notice_id", id)
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
