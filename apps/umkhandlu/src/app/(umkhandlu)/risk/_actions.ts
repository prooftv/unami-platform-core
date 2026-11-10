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

// ---------------------------------------------------------------------------
// Risk registers
// ---------------------------------------------------------------------------

export async function createRegisterAction(formData: FormData) {
	const session = await requireOperator();
	const supabase = await createClient();
	const title = formData.get("title") as string;
	const description = formData.get("description") as string;
	const owner = formData.get("owner") as string;
	if (!title || !owner) return { error: "Title and owner are required." };
	const { data, error } = await supabase
		.from("risk_registers")
		.insert({
			title,
			owner,
			description: description || null,
		})
		.select()
		.single();
	if (error) return { error: error.message };
	await writeAudit(
		supabase,
		"risk_registers",
		data.id,
		session.email,
		"create",
		null,
		data,
	);
	revalidatePath("/risk");
	return { success: true };
}

// ---------------------------------------------------------------------------
// Risks
// ---------------------------------------------------------------------------

export async function createRiskAction(formData: FormData) {
	const session = await requireOperator();
	const supabase = await createClient();

	const register_id = formData.get("register_id") as string;
	const identifier = formData.get("identifier") as string;
	const title = formData.get("title") as string;
	const description = formData.get("description") as string;
	const category = formData.get("category") as string;
	const likelihood = Number(formData.get("likelihood"));
	const impact = Number(formData.get("impact"));
	const owner = formData.get("owner") as string;
	const treatment = formData.get("treatment") as string;
	const treatment_plan = formData.get("treatment_plan") as string;
	const treatment_deadline = formData.get("treatment_deadline") as string;
	const methodology = formData.get("methodology") as string;

	if (
		!register_id ||
		!identifier ||
		!title ||
		!category ||
		!owner ||
		!treatment
	) {
		return {
			error:
				"Register, identifier, title, category, owner and treatment are required.",
		};
	}
	if (likelihood < 1 || likelihood > 5 || impact < 1 || impact > 5) {
		return { error: "Likelihood and impact must be between 1 and 5." };
	}

	const notice_id = (formData.get("notice_id") as string) || null;

	const { data, error } = await supabase
		.from("risks")
		.insert({
			register_id,
			identifier,
			title,
			category,
			likelihood,
			impact,
			owner,
			treatment,
			description: description || null,
			treatment_plan: treatment_plan || null,
			treatment_deadline: treatment_deadline || null,
			methodology: methodology || null,
			notice_id: notice_id || null,
			assessed_by: session.email,
			assessed_at: new Date().toISOString().split("T")[0],
		})
		.select()
		.single();

	if (error) return { error: error.message };

	// Record initial revision
	await supabase.from("risk_revisions").insert({
		risk_id: data.id,
		likelihood,
		impact,
		exposure: likelihood * impact,
		treatment,
		assessed_by: session.email,
		assessed_at: new Date().toISOString().split("T")[0],
		reason: "Initial assessment",
	});

	await writeAudit(
		supabase,
		"risks",
		data.id,
		session.email,
		"create",
		null,
		data,
	);
	revalidatePath("/risk");
	return { success: true };
}

export async function updateRiskAction(id: string, formData: FormData) {
	const session = await requireOperator();
	const supabase = await createClient();

	const { data: prev } = await supabase
		.from("risks")
		.select("*")
		.eq("id", id)
		.single();

	const likelihood = Number(formData.get("likelihood"));
	const impact = Number(formData.get("impact"));
	const treatment = formData.get("treatment") as string;
	const reason = formData.get("reason") as string;

	const { data, error } = await supabase
		.from("risks")
		.update({
			identifier: formData.get("identifier") as string,
			title: formData.get("title") as string,
			description: (formData.get("description") as string) || null,
			category: formData.get("category") as string,
			likelihood,
			impact,
			owner: formData.get("owner") as string,
			treatment,
			treatment_plan: (formData.get("treatment_plan") as string) || null,
			treatment_deadline:
				(formData.get("treatment_deadline") as string) || null,
			methodology: (formData.get("methodology") as string) || null,
			assessed_by: session.email,
			assessed_at: new Date().toISOString().split("T")[0],
			updated_at: new Date().toISOString(),
		})
		.eq("id", id)
		.select()
		.single();

	if (error) return { error: error.message };

	// Record revision if likelihood/impact/treatment changed
	if (
		prev &&
		(prev.likelihood !== likelihood ||
			prev.impact !== impact ||
			prev.treatment !== treatment)
	) {
		await supabase.from("risk_revisions").insert({
			risk_id: id,
			likelihood,
			impact,
			exposure: likelihood * impact,
			treatment,
			assessed_by: session.email,
			assessed_at: new Date().toISOString().split("T")[0],
			reason: reason || "Reassessment",
		});
	}

	await writeAudit(supabase, "risks", id, session.email, "update", prev, data);
	revalidatePath("/risk");
	revalidatePath(`/risk/${id}`);
	return { success: true };
}

export async function closeRiskAction(
	id: string,
	status: "closed" | "accepted",
) {
	const session = await requireOperator();
	const supabase = await createClient();
	const { data: prev } = await supabase
		.from("risks")
		.select("*")
		.eq("id", id)
		.single();
	const { error } = await supabase
		.from("risks")
		.update({ status, updated_at: new Date().toISOString() })
		.eq("id", id);
	if (error) return { error: error.message };
	await writeAudit(
		supabase,
		"risks",
		id,
		session.email,
		status === "closed" ? "archive" : "update",
		prev,
		{ status },
	);
	revalidatePath("/risk");
	revalidatePath(`/risk/${id}`);
	return { success: true };
}
