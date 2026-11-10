import { PageHeader } from "@unami/ui";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createServiceClient } from "@/lib/supabase/server";
import { EvidenceForm } from "../_components/EvidenceForm";
import { VerifyEvidenceButton } from "../_components/VerifyEvidenceButton";

export const dynamic = "force-dynamic";

interface Props {
	params: Promise<{ id: string }>;
}

export default async function EvidenceDetailPage({ params }: Props) {
	const { id } = await params;
	const supabase = createServiceClient();

	const { data: evidence } = await supabase
		.from("evidence_records")
		.select(`
			*,
			risks(identifier, title),
			compliance_obligations(identifier, title),
			controls(identifier, title),
			findings(title, severity)
		`)
		.eq("id", id)
		.single();

	if (!evidence) notFound();

	const risk = evidence.risks as { identifier: string; title: string } | null;
	const obligation = evidence.compliance_obligations as {
		identifier: string;
		title: string;
	} | null;
	const control = evidence.controls as {
		identifier: string;
		title: string;
	} | null;
	const finding = evidence.findings as {
		title: string;
		severity: string;
	} | null;

	return (
		<div className="space-y-6">
			<PageHeader
				title={evidence.title}
				description={`${evidence.document_type} · ${evidence.source_type}`}
				actions={
					<div className="flex items-center gap-2">
						{!evidence.verified_at && <VerifyEvidenceButton id={evidence.id} />}
						<Button variant="outline" asChild>
							<Link href="/evidence">Back</Link>
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
								{evidence.document_type}
							</p>
							<p>
								<span className="text-muted-foreground">Source: </span>
								{evidence.source_type}
							</p>
							<p>
								<span className="text-muted-foreground">Provided by: </span>
								{evidence.provided_by ?? "—"}
							</p>
							{evidence.evidence_date && (
								<p>
									<span className="text-muted-foreground">Date: </span>
									{evidence.evidence_date}
								</p>
							)}
							<p>
								<span className="text-muted-foreground">Retention: </span>
								{evidence.retention_status}
							</p>
						</CardContent>
					</Card>
					<Card>
						<CardContent className="pt-6 space-y-2 text-sm">
							{evidence.verified_at ? (
								<>
									<p className="text-green-700 font-medium">✓ Verified</p>
									<p className="text-xs text-muted-foreground">
										By: {evidence.verified_by}
									</p>
									<p className="text-xs text-muted-foreground">
										On: {evidence.verified_at}
									</p>
								</>
							) : (
								<p className="text-amber-600 text-sm">Awaiting verification</p>
							)}
							{evidence.file_url && (
								<p className="pt-2">
									<a
										href={evidence.file_url}
										target="_blank"
										rel="noopener noreferrer"
										className="text-xs underline underline-offset-2"
									>
										View file ↗
									</a>
								</p>
							)}
						</CardContent>
					</Card>
				</div>

				{evidence.description && (
					<Card>
						<CardContent className="pt-6 text-sm">
							{evidence.description}
						</CardContent>
					</Card>
				)}

				{(risk || obligation || control || finding) && (
					<Card>
						<CardHeader>
							<CardTitle>Linked Records</CardTitle>
						</CardHeader>
						<CardContent className="space-y-2 text-sm">
							{risk && (
								<p>
									<span className="text-muted-foreground">Risk: </span>
									<Link
										href={`/risk/${evidence.linked_risk_id}`}
										className="underline underline-offset-2"
									>
										{risk.identifier} — {risk.title}
									</Link>
								</p>
							)}
							{obligation && (
								<p>
									<span className="text-muted-foreground">Obligation: </span>
									<Link
										href={`/compliance/${evidence.linked_obligation_id}`}
										className="underline underline-offset-2"
									>
										{obligation.identifier} — {obligation.title}
									</Link>
								</p>
							)}
							{control && (
								<p>
									<span className="text-muted-foreground">Control: </span>
									<Link
										href={`/controls/${evidence.linked_control_id}`}
										className="underline underline-offset-2"
									>
										{control.identifier} — {control.title}
									</Link>
								</p>
							)}
							{finding && (
								<p>
									<span className="text-muted-foreground">Finding: </span>
									<Link
										href={`/findings/${evidence.linked_finding_id}`}
										className="underline underline-offset-2"
									>
										{finding.title}
									</Link>
									<span className="ml-2 text-xs text-muted-foreground">
										{finding.severity}
									</span>
								</p>
							)}
							{evidence.notice_id && (
								<p>
									<span className="text-muted-foreground">Notice: </span>
									<Link
										href={`/notices/${evidence.notice_id}`}
										className="underline underline-offset-2"
									>
										View notice
									</Link>
								</p>
							)}
						</CardContent>
					</Card>
				)}

				<Card>
					<CardHeader>
						<CardTitle>Edit Evidence</CardTitle>
					</CardHeader>
					<CardContent>
						<EvidenceForm evidence={evidence} />
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
