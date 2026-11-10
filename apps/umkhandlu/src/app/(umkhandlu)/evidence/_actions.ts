"use server";

import { revalidatePath } from "next/cache";
import { getOperatorSession } from "@/lib/auth/operator";
import { createClient } from "@/lib/supabase/server";

async function requireOperator() {
	const session = await getOperatorSession();
	if (!session) throw new Error("Unauthorized");
	return session;
}

async function writeAudit(
	supabase: Awaited<ReturnType<typeof createClient>>,
	recordId: string,
	actor: string,
	action: string,
	prev: unknown,
	next: unknown,
) {
	await supabase.from("gis_audit_log").insert({
		table_name: "evidence_records",
		record_id: recordId,
		actor,
		action,
		previous_state: prev ?? null,
		new_state: next ?? null,
	});
}

export async function createEvidenceAction(formData: FormData) {
	const session = await requireOperator();
	const supabase = await createClient();

	const title = formData.get("title") as string;
	const document_type = formData.get("document_type") as string;
	const source_type = formData.get("source_type") as string;
	const description = formData.get("description") as string;
	const provided_by = formData.get("provided_by") as string;
	const evidence_date = formData.get("evidence_date") as string;
	const file_url = formData.get("file_url") as string;

	if (!title || !document_type || !source_type) {
		return { error: "Title, document type and source type are required." };
	}

	const { data, error } = await supabase
		.from("evidence_records")
		.insert({
			title,
			document_type,
			source_type,
			description: description || null,
			provided_by: provided_by || session.email,
			evidence_date: evidence_date || null,
			file_url: file_url || null,
			notice_id: (formData.get("notice_id") as string) || null,
			linked_risk_id: (formData.get("linked_risk_id") as string) || null,
			linked_obligation_id:
				(formData.get("linked_obligation_id") as string) || null,
			linked_control_id: (formData.get("linked_control_id") as string) || null,
			linked_finding_id: (formData.get("linked_finding_id") as string) || null,
			control_test_id: (formData.get("control_test_id") as string) || null,
		})
		.select()
		.single();

	if (error) return { error: error.message };
	await writeAudit(supabase, data.id, session.email, "create", null, data);
	revalidatePath("/evidence");
	return { success: true, id: data.id };
}

export async function updateEvidenceAction(id: string, formData: FormData) {
	const session = await requireOperator();
	const supabase = await createClient();

	const { data: prev } = await supabase
		.from("evidence_records")
		.select("*")
		.eq("id", id)
		.single();

	const { data, error } = await supabase
		.from("evidence_records")
		.update({
			title: formData.get("title") as string,
			document_type: formData.get("document_type") as string,
			source_type: formData.get("source_type") as string,
			description: (formData.get("description") as string) || null,
			provided_by: (formData.get("provided_by") as string) || null,
			evidence_date: (formData.get("evidence_date") as string) || null,
			file_url: (formData.get("file_url") as string) || null,
			retention_status: formData.get("retention_status") as string,
			updated_at: new Date().toISOString(),
		})
		.eq("id", id)
		.select()
		.single();

	if (error) return { error: error.message };
	await writeAudit(supabase, id, session.email, "update", prev, data);
	revalidatePath("/evidence");
	revalidatePath(`/evidence/${id}`);
	return { success: true };
}

export async function verifyEvidenceAction(id: string) {
	const session = await requireOperator();
	const supabase = await createClient();

	const { error } = await supabase
		.from("evidence_records")
		.update({
			verified_by: session.email,
			verified_at: new Date().toISOString().split("T")[0],
			updated_at: new Date().toISOString(),
		})
		.eq("id", id);

	if (error) return { error: error.message };
	await writeAudit(supabase, id, session.email, "approve", null, {
		verified_by: session.email,
	});
	revalidatePath(`/evidence/${id}`);
	return { success: true };
}
