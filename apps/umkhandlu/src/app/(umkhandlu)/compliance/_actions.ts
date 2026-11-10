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
		table_name: "compliance_obligations",
		record_id: recordId,
		actor,
		action,
		previous_state: prev ?? null,
		new_state: next ?? null,
	});
}

export async function createObligationAction(formData: FormData) {
	const session = await requireOperator();
	const supabase = await createClient();

	const identifier = formData.get("identifier") as string;
	const title = formData.get("title") as string;
	const description = formData.get("description") as string;
	const source = formData.get("source") as string;
	const responsible_party = formData.get("responsible_party") as string;
	const due_date = formData.get("due_date") as string;
	const recurrence = formData.get("recurrence") as string;
	const status = (formData.get("status") as string) || "under-review";

	if (!identifier || !title || !source || !responsible_party) {
		return {
			error: "Identifier, title, source and responsible party are required.",
		};
	}

	const notice_id = (formData.get("notice_id") as string) || null;

	const { data, error } = await supabase
		.from("compliance_obligations")
		.insert({
			identifier,
			title,
			source,
			responsible_party,
			status,
			description: description || null,
			due_date: due_date || null,
			recurrence: recurrence || null,
			notice_id: notice_id || null,
			assessed_by: session.email,
			assessed_at: new Date().toISOString().split("T")[0],
		})
		.select()
		.single();

	if (error) return { error: error.message };
	await writeAudit(supabase, data.id, session.email, "create", null, data);
	revalidatePath("/compliance");
	return { success: true };
}

export async function updateObligationAction(id: string, formData: FormData) {
	const session = await requireOperator();
	const supabase = await createClient();
	const { data: prev } = await supabase
		.from("compliance_obligations")
		.select("*")
		.eq("id", id)
		.single();

	const { data, error } = await supabase
		.from("compliance_obligations")
		.update({
			identifier: formData.get("identifier") as string,
			title: formData.get("title") as string,
			description: (formData.get("description") as string) || null,
			source: formData.get("source") as string,
			responsible_party: formData.get("responsible_party") as string,
			due_date: (formData.get("due_date") as string) || null,
			recurrence: (formData.get("recurrence") as string) || null,
			status: formData.get("status") as string,
			assessed_by: session.email,
			assessed_at: new Date().toISOString().split("T")[0],
			updated_at: new Date().toISOString(),
		})
		.eq("id", id)
		.select()
		.single();

	if (error) return { error: error.message };
	await writeAudit(supabase, id, session.email, "update", prev, data);
	revalidatePath("/compliance");
	revalidatePath(`/compliance/${id}`);
	return { success: true };
}
