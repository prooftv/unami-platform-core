import { PageHeader } from "@unami/ui";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createServiceClient } from "@/lib/supabase/server";
import { ControlForm } from "../_components/ControlForm";
import { ControlTestPanel } from "../_components/ControlTestPanel";

export const dynamic = "force-dynamic";

const typeColour: Record<string, string> = {
	preventive: "bg-blue-100 text-blue-800",
	detective: "bg-purple-100 text-purple-800",
	corrective: "bg-amber-100 text-amber-800",
};

const resultColour: Record<string, string> = {
	pass: "text-green-700",
	fail: "text-destructive",
	partial: "text-amber-600",
};

interface Props {
	params: Promise<{ id: string }>;
}

export default async function ControlDetailPage({ params }: Props) {
	const { id } = await params;
	const supabase = createServiceClient();

	const [{ data: control }, { data: tests }, { data: evidence }] =
		await Promise.all([
			supabase
				.from("controls")
				.select(
					"*, compliance_obligations(identifier,title), risks(identifier,title)",
				)
				.eq("id", id)
				.single(),
			supabase
				.from("control_tests")
				.select("*")
				.eq("control_id", id)
				.order("tested_at", { ascending: false }),
			supabase
				.from("evidence_records")
				.select("id,title,document_type,evidence_date,verified_at")
				.eq("linked_control_id", id)
				.order("evidence_date", { ascending: false }),
		]);

	if (!control) notFound();

	const obligation = control.compliance_obligations as {
		identifier: string;
		title: string;
	} | null;
	const risk = control.risks as { identifier: string; title: string } | null;

	return (
		<div className="space-y-6">
			<PageHeader
				title={`${control.identifier} — ${control.title}`}
				description={control.control_type}
				actions={
					<div className="flex items-center gap-2">
						<Button asChild size="sm">
							<Link href={`/evidence/new?control_id=${control.id}`}>
								Add evidence
							</Link>
						</Button>
						<Button variant="outline" asChild>
							<Link href="/controls">Back</Link>
						</Button>
					</div>
				}
			/>

			<div className="max-w-3xl space-y-6">
				<div className="grid grid-cols-2 gap-4">
					<Card>
						<CardContent className="pt-6 space-y-2 text-sm">
							<p>
								<span className="text-muted-foreground">Type: </span>
								<span
									className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeColour[control.control_type] ?? ""}`}
								>
									{control.control_type}
								</span>
							</p>
							<p>
								<span className="text-muted-foreground">Owner: </span>
								{control.owner}
							</p>
							<p>
								<span className="text-muted-foreground">Status: </span>
								{control.status}
							</p>
							{control.test_frequency && (
								<p>
									<span className="text-muted-foreground">Frequency: </span>
									{control.test_frequency}
								</p>
							)}
						</CardContent>
					</Card>
					<Card>
						<CardContent className="pt-6 space-y-2 text-sm">
							{control.last_tested_at ? (
								<>
									<p className="text-muted-foreground text-xs">Last test</p>
									<p
										className={`text-2xl font-bold ${resultColour[control.last_test_result ?? ""] ?? ""}`}
									>
										{control.last_test_result}
									</p>
									<p className="text-xs text-muted-foreground">
										{control.last_tested_at}
									</p>
								</>
							) : (
								<p className="text-sm text-muted-foreground">Never tested</p>
							)}
							{obligation && (
								<p className="text-xs pt-2">
									<span className="text-muted-foreground">Obligation: </span>
									<Link
										href={`/compliance/${control.obligation_id}`}
										className="underline underline-offset-2"
									>
										{obligation.identifier}
									</Link>
								</p>
							)}
							{risk && (
								<p className="text-xs">
									<span className="text-muted-foreground">Risk: </span>
									<Link
										href={`/risk/${control.risk_id}`}
										className="underline underline-offset-2"
									>
										{risk.identifier}
									</Link>
								</p>
							)}
						</CardContent>
					</Card>
				</div>

				{control.description && (
					<Card>
						<CardContent className="pt-6 text-sm">
							{control.description}
						</CardContent>
					</Card>
				)}

				<Card>
					<CardHeader>
						<CardTitle>Test Execution</CardTitle>
					</CardHeader>
					<CardContent>
						<ControlTestPanel controlId={control.id} tests={tests ?? []} />
					</CardContent>
				</Card>

				{evidence && evidence.length > 0 && (
					<Card>
						<CardHeader>
							<CardTitle>Linked Evidence</CardTitle>
						</CardHeader>
						<CardContent className="p-0">
							<div className="divide-y">
								{evidence.map((e) => (
									<div
										key={e.id}
										className="relative px-6 py-3 hover:bg-muted/30"
									>
										<Link
											href={`/evidence/${e.id}`}
											className="absolute inset-0"
											aria-label={e.title}
										/>
										<p className="text-sm font-medium">{e.title}</p>
										<p className="text-xs text-muted-foreground">
											{e.document_type}
											{e.evidence_date ? ` · ${e.evidence_date}` : ""}
											{e.verified_at ? " · ✓ verified" : ""}
										</p>
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				)}

				<Card>
					<CardHeader>
						<CardTitle>Edit Control</CardTitle>
					</CardHeader>
					<CardContent>
						<ControlForm control={control} />
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
