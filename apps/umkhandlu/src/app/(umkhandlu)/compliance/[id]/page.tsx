import { PageHeader } from "@unami/ui";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createServiceClient } from "@/lib/supabase/server";
import { ObligationForm } from "../_components/ObligationForm";

export const dynamic = "force-dynamic";

const statusColour: Record<string, string> = {
	compliant: "bg-green-100 text-green-800",
	"non-compliant": "bg-red-100 text-red-800",
	"under-review": "bg-amber-100 text-amber-800",
	"not-applicable": "bg-gray-100 text-gray-700",
};

const testResultColour: Record<string, string> = {
	pass: "bg-green-100 text-green-800",
	fail: "bg-red-100 text-red-800",
	partial: "bg-amber-100 text-amber-800",
};

interface Props {
	params: Promise<{ id: string }>;
}

export default async function ObligationDetailPage({ params }: Props) {
	const { id } = await params;
	const supabase = createServiceClient();

	const [{ data: ob }, { data: controls }, { data: evidence }] =
		await Promise.all([
			supabase.from("compliance_obligations").select("*").eq("id", id).single(),
			supabase
				.from("controls")
				.select(
					"id, identifier, title, control_type, status, last_test_result, last_tested_at",
				)
				.eq("obligation_id", id)
				.order("identifier"),
			supabase
				.from("evidence_records")
				.select("id, title, document_type, evidence_date, verified_at")
				.eq("linked_obligation_id", id)
				.order("evidence_date", { ascending: false }),
		]);

	if (!ob) notFound();

	const today = new Date();
	const isOverdue =
		ob.due_date &&
		new Date(ob.due_date) < today &&
		ob.status !== "compliant" &&
		ob.status !== "not-applicable";

	const controlRows = controls ?? [];
	const evidenceRows = evidence ?? [];

	return (
		<div className="space-y-6">
			<PageHeader
				title={`${ob.identifier} — ${ob.title}`}
				description={ob.source}
				actions={
					<div className="flex items-center gap-2">
						<Button asChild size="sm">
							<Link href={`/controls/new?obligation_id=${id}`}>
								Add control
							</Link>
						</Button>
						<Button asChild size="sm" variant="outline">
							<Link href={`/evidence/new?linked_obligation_id=${id}`}>
								Add evidence
							</Link>
						</Button>
						<Button variant="outline" asChild>
							<Link href="/compliance">Back</Link>
						</Button>
					</div>
				}
			/>

			<div className="max-w-3xl space-y-6">
				<div className="grid grid-cols-2 gap-4">
					<Card>
						<CardContent className="pt-6 space-y-2 text-sm">
							<p>
								<span className="text-muted-foreground">Responsible:</span>{" "}
								{ob.responsible_party}
							</p>
							{ob.due_date && (
								<p>
									<span className="text-muted-foreground">Due:</span>{" "}
									{new Date(ob.due_date).toLocaleDateString()}
								</p>
							)}
							{ob.recurrence && (
								<p>
									<span className="text-muted-foreground">Recurrence:</span>{" "}
									{ob.recurrence}
								</p>
							)}
							{ob.assessed_by && (
								<p>
									<span className="text-muted-foreground">Assessed by:</span>{" "}
									{ob.assessed_by}
								</p>
							)}
						</CardContent>
					</Card>
					<Card>
						<CardContent className="pt-6 flex flex-col items-center justify-center gap-2">
							<span
								className={`text-sm px-3 py-1 rounded-full font-medium ${statusColour[ob.status] ?? ""}`}
							>
								{ob.status}
							</span>
							{isOverdue && (
								<span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-200 text-red-900">
									Overdue
								</span>
							)}
						</CardContent>
					</Card>
				</div>

				{ob.description && (
					<Card>
						<CardContent className="pt-6 text-sm">{ob.description}</CardContent>
					</Card>
				)}

				<Card>
					<CardHeader>
						<div className="flex items-center justify-between">
							<CardTitle>Controls</CardTitle>
							<Button asChild size="sm" variant="outline">
								<Link href={`/controls/new?obligation_id=${id}`}>
									Add control
								</Link>
							</Button>
						</div>
					</CardHeader>
					<CardContent className="p-0">
						{controlRows.length === 0 ? (
							<p className="px-6 py-4 text-sm text-muted-foreground">
								No controls linked to this obligation.
							</p>
						) : (
							<div className="divide-y">
								{controlRows.map((c) => (
									<div
										key={c.id}
										className="relative px-6 py-3 hover:bg-muted/30"
									>
										<Link
											href={`/controls/${c.id}`}
											className="absolute inset-0"
											aria-label={c.title}
										/>
										<div className="flex items-center justify-between gap-4">
											<div className="min-w-0">
												<p className="text-sm font-medium">
													{c.identifier} — {c.title}
												</p>
												<p className="text-xs text-muted-foreground capitalize">
													{c.control_type} · {c.status}
												</p>
											</div>
											{c.last_test_result && (
												<span
													className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${testResultColour[c.last_test_result] ?? ""}`}
												>
													{c.last_test_result}
												</span>
											)}
										</div>
									</div>
								))}
							</div>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<div className="flex items-center justify-between">
							<CardTitle>Evidence</CardTitle>
							<Button asChild size="sm" variant="outline">
								<Link href={`/evidence/new?linked_obligation_id=${id}`}>
									Add evidence
								</Link>
							</Button>
						</div>
					</CardHeader>
					<CardContent className="p-0">
						{evidenceRows.length === 0 ? (
							<p className="px-6 py-4 text-sm text-muted-foreground">
								No evidence linked to this obligation.
							</p>
						) : (
							<div className="divide-y">
								{evidenceRows.map((e) => (
									<div
										key={e.id}
										className="relative px-6 py-3 hover:bg-muted/30"
									>
										<Link
											href={`/evidence/${e.id}`}
											className="absolute inset-0"
											aria-label={e.title}
										/>
										<div className="flex items-center justify-between gap-4">
											<p className="text-sm font-medium">{e.title}</p>
											<div className="flex items-center gap-2 shrink-0">
												<span className="text-xs text-muted-foreground">
													{e.document_type}
												</span>
												{e.verified_at && (
													<span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-800">
														verified
													</span>
												)}
											</div>
										</div>
									</div>
								))}
							</div>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Edit Obligation</CardTitle>
					</CardHeader>
					<CardContent>
						<ObligationForm obligation={ob} />
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
