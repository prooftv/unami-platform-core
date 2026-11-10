import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const CORS = {
	"Access-Control-Allow-Origin": "https://umkhandlu.unamifoundation.org",
	"Access-Control-Allow-Methods": "POST, OPTIONS",
	"Access-Control-Allow-Headers": "Content-Type, Authorization",
};

/**
 * Node-to-CC integration endpoint.
 * Called server-side from the Governance Node to establish or retrieve
 * the CC notice anchor for a Sanity developmentNotice document.
 *
 * Authentication: Bearer <node_api_key> in Authorization header.
 * The api_key is validated against governance_nodes via validate_node_api_key().
 *
 * Idempotent: safe to call multiple times. Returns the same CC notice UUID.
 * The Node stores this UUID in Sanity as ccNoticeRef.
 *
 * Never called from the browser. Server action or API route on the Node only.
 */
export async function POST(req: Request) {
	// 1. Extract and validate node api_key
	const authHeader = req.headers.get("Authorization");
	const apiKey = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

	if (!apiKey) {
		return NextResponse.json(
			{ error: "Authorization required" },
			{ status: 401, headers: CORS },
		);
	}

	const supabase = createServiceClient();

	// validate_node_api_key is SECURITY DEFINER, only callable by service_role
	const { data: nodeId, error: keyError } = await supabase.rpc(
		"validate_node_api_key",
		{ p_api_key: apiKey },
	);

	if (keyError || !nodeId) {
		return NextResponse.json(
			{ error: "Invalid or inactive node api_key" },
			{ status: 403, headers: CORS },
		);
	}

	// 2. Parse and validate body
	let body: Record<string, unknown>;
	try {
		body = await req.json();
	} catch {
		return NextResponse.json(
			{ error: "Invalid JSON" },
			{ status: 400, headers: CORS },
		);
	}

	const nodeNoticeRef = body.nodeNoticeRef as string | undefined;
	const type = body.type as string | undefined;
	const title = body.title as string | undefined;

	if (!nodeNoticeRef || !type || !title) {
		return NextResponse.json(
			{ error: "Required: nodeNoticeRef (Sanity _id), type, title" },
			{ status: 400, headers: CORS },
		);
	}

	// Sanity _id format: basic length check (not a UUID)
	if (
		typeof nodeNoticeRef !== "string" ||
		nodeNoticeRef.length < 10 ||
		nodeNoticeRef.length > 100
	) {
		return NextResponse.json(
			{ error: "Invalid nodeNoticeRef" },
			{ status: 400, headers: CORS },
		);
	}

	// 3. Upsert the CC notice anchor via the SECURITY DEFINER function
	const { data: ccNoticeId, error: upsertError } = await supabase.rpc(
		"upsert_notice_anchor",
		{
			p_governance_node_id: nodeId,
			p_node_notice_ref: nodeNoticeRef,
			p_type: type,
			p_title: title,
			p_content: (body.description as string) ?? "",
			p_is_statutory: (body.isStatutory as boolean) ?? true,
			p_comment_deadline: (body.commentDeadline as string) ?? null,
			p_ward_ref: (body.wardRef as string) ?? null,
			p_latitude: (body.lat as number) ?? null,
			p_longitude: (body.lng as number) ?? null,
			p_created_by: "node-integration",
		},
	);

	if (upsertError || !ccNoticeId) {
		console.error(
			"[notices/register] upsert_notice_anchor failed:",
			upsertError?.message,
		);
		return NextResponse.json(
			{
				error: "Failed to establish CC notice anchor",
				detail: upsertError?.message,
			},
			{ status: 500, headers: CORS },
		);
	}

	// 4. Audit log
	await supabase.from("gis_audit_log").insert({
		table_name: "notices",
		record_id: ccNoticeId,
		actor: `node:${nodeId}`,
		action: "create",
		previous_state: null,
		new_state: { nodeNoticeRef, type, title, governance_node_id: nodeId },
	});

	return NextResponse.json(
		{ ccNoticeId, nodeNoticeRef, status: "anchored" },
		{ status: 200, headers: CORS },
	);
}

export async function OPTIONS() {
	return new Response(null, { status: 204, headers: CORS });
}
