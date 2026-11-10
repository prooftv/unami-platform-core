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

export async function createControlAction(formData: FormData) {
	const session = await requireOperator();
	const supabase = await createClient();

	const identifier = formData.get("identifier") as string;
	const title = formData.get("title") as string;
	const description = formData.get("description") as string;
	const control_type = formData.get("control_type") as string;
	const owner = formData.get("owner") as string;
	const test_frequency = formData.get("test_frequency") as string;
	const notice_id = (formData.get("notice_id") as string) || null;
	const obligation_id = (formData.get("obligation_id") as string) || null;
	const risk_id = (formData.get("risk_id") as string) || null;

	if (!identifier || !title || !control_type || !owner) {
		return { error: "Identifier, title, type and owner are required." };
	}

	const { data, error } = await supabase
		.from("controls")
		.insert({
			identifier,
			title,
			control_type,
			owner,
			description: description || null,
			test_frequency: test_frequency || null,
			notice_id: notice_id || null,
			obligation_id: obligation_id || null,
			risk_id: risk_id || null,
		})
		.select()
		.single();

	if (error) return { error: error.message };
	await writeAudit(
		supabase,
		"controls",
		data.id,
		session.email,
		"create",
		null,
		data,
	);
	revalidatePath("/controls");
	return { success: true, id: data.id };
}

export async function updateControlAction(id: string, formData: FormData) {
	const session = await requireOperator();
	const supabase = await createClient();

	const { data: prev } = await supabase
		.from("controls")
		.select("*")
		.eq("id", id)
		.single();

	const { data, error } = await supabase
		.from("controls")
		.update({
			identifier: formData.get("identifier") as string,
			title: formData.get("title") as string,
			description: (formData.get("description") as string) || null,
			control_type: formData.get("control_type") as string,
			owner: formData.get("owner") as string,
			test_frequency: (formData.get("test_frequency") as string) || null,
			status: formData.get("status") as string,
			obligation_id: (formData.get("obligation_id") as string) || null,
			risk_id: (formData.get("risk_id") as string) || null,
			updated_at: new Date().toISOString(),
		})
		.eq("id", id)
		.select()
		.single();

	if (error) return { error: error.message };
	await writeAudit(
		supabase,
		"controls",
		id,
		session.email,
		"update",
		prev,
		data,
	);
	revalidatePath("/controls");
	revalidatePath(`/controls/${id}`);
	return { success: true };
}

export async function createControlTestAction(
	controlId: string,
	formData: FormData,
) {
	const session = await requireOperator();
	const supabase = await createClient();

	const result = formData.get("result") as string;
	const tested_at = formData.get("tested_at") as string;
	const notes = formData.get("notes") as string;

	if (!result || !tested_at) {
		return { error: "Result and test date are required." };
	}

	const { data, error } = await supabase
		.from("control_tests")
		.insert({
			control_id: controlId,
			tested_by: session.email,
			tested_at,
			result,
			notes: notes || null,
		})
		.select()
		.single();

	if (error) return { error: error.message };

	await supabase
		.from("controls")
		.update({
			last_tested_at: tested_at,
			last_test_result: result,
			updated_at: new Date().toISOString(),
		})
		.eq("id", controlId);

	await writeAudit(
		supabase,
		"control_tests",
		data.id,
		session.email,
		"create",
		null,
		data,
	);
	revalidatePath(`/controls/${controlId}`);
	return { success: true, id: data.id };
}
