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
	tableName: string,
	recordId: string,
	actor: string,
	action: string,
	prev: unknown,
	next: unknown,
) {
	await supabase.from("gis_audit_log").insert({
		table_name: tableName,
		record_id: recordId,
		actor,
		action,
		previous_state: prev ?? null,
		new_state: next ?? null,
	});
}

export async function createFindingAction(formData: FormData) {
	const session = await requireOperator();
	const supabase = await createClient();

	const finding_type = formData.get("finding_type") as string;
	const title = formData.get("title") as string;
	const description = formData.get("description") as string;
	const severity = formData.get("severity") as string;
	const owner = formData.get("owner") as string;

	if (!finding_type || !title || !severity || !owner) {
		return { error: "Type, title, severity and owner are required." };
	}

	const notice_id = (formData.get("notice_id") as string) || null;

	const { data, error } = await supabase
		.from("findings")
		.insert({
			finding_type,
			title,
			severity,
			owner,
			description: description || null,
			notice_id: notice_id || null,
			identified_at: new Date().toISOString().split("T")[0],
		})
		.select()
		.single();

	if (error) return { error: error.message };
	await writeAudit(
		supabase,
		"findings",
		data.id,
		session.email,
		"create",
		null,
		data,
	);
	revalidatePath("/findings");
	return { success: true };
}

export async function updateFindingAction(id: string, formData: FormData) {
	const session = await requireOperator();
	const supabase = await createClient();
	const { data: prev } = await supabase
		.from("findings")
		.select("*")
		.eq("id", id)
		.single();

	const status = formData.get("status") as string;
	const closed_at =
		status === "resolved" ? new Date().toISOString().split("T")[0] : null;

	const { data, error } = await supabase
		.from("findings")
		.update({
			finding_type: formData.get("finding_type") as string,
			title: formData.get("title") as string,
			description: (formData.get("description") as string) || null,
			severity: formData.get("severity") as string,
			owner: formData.get("owner") as string,
			status,
			closed_at,
			updated_at: new Date().toISOString(),
		})
		.eq("id", id)
		.select()
		.single();

	if (error) return { error: error.message };
	await writeAudit(
		supabase,
		"findings",
		id,
		session.email,
		"update",
		prev,
		data,
	);
	revalidatePath("/findings");
	revalidatePath(`/findings/${id}`);
	return { success: true };
}

export async function createRemediationAction(
	findingId: string,
	formData: FormData,
) {
	const session = await requireOperator();
	const supabase = await createClient();

	const title = formData.get("title") as string;
	const owner = formData.get("owner") as string;
	const due_date = formData.get("due_date") as string;
	const description = formData.get("description") as string;

	if (!title || !owner) return { error: "Title and owner are required." };

	const { data, error } = await supabase
		.from("remediation_actions")
		.insert({
			finding_id: findingId,
			title,
			owner,
			description: description || null,
			due_date: due_date || null,
		})
		.select()
		.single();

	if (error) return { error: error.message };
	await writeAudit(
		supabase,
		"remediation_actions",
		data.id,
		session.email,
		"create",
		null,
		data,
	);

	// Move finding to in-progress if still open
	await supabase
		.from("findings")
		.update({ status: "in-progress", updated_at: new Date().toISOString() })
		.eq("id", findingId)
		.eq("status", "open");

	revalidatePath(`/findings/${findingId}`);
	return { success: true };
}

export async function completeRemediationAction(id: string, findingId: string) {
	const session = await requireOperator();
	const supabase = await createClient();
	const { error } = await supabase
		.from("remediation_actions")
		.update({
			status: "completed",
			completed_at: new Date().toISOString().split("T")[0],
			updated_at: new Date().toISOString(),
		})
		.eq("id", id);
	if (error) return { error: error.message };
	await writeAudit(
		supabase,
		"remediation_actions",
		id,
		session.email,
		"update",
		null,
		{ status: "completed" },
	);
	revalidatePath(`/findings/${findingId}`);
	return { success: true };
}
