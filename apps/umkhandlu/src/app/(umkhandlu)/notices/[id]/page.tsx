import { PageHeader } from "@unami/ui";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createServiceClient } from "@/lib/supabase/server";
import { NoticeStatusActions } from "./_components/NoticeStatusActions";
import { NoticeSpatialContext, getNoticeSpatialGapSummary } from "./_components/NoticeSpatialContext";
import { PROXIMITY_RADIUS } from "./_components/notice-layer-config";

export const dynamic = "force-dynamic";

const statusColour: Record<string, string> = {
	draft: "bg-gray-100 text-gray-700",
	published: "bg-blue-100 text-blue-800",
	open: "bg-green-100 text-green-800",
	closed: "bg-gray-100 text-gray-700",
	approved: "bg-green-100 text-green-800",
	rejected: "bg-red-100 text-red-800",
	withdrawn: "bg-amber-100 text-amber-800",
	archived: "bg-gray-100 text-gray-600",
};

const exposureColour = (score: number) =>
	score >= 15
		? "text-destructive font-semibold"
		: score >= 8
			? "text-amber-600 font-semibold"
			: "text-green-600";

const riskStatusColour: Record<string, string> = {
	open: "bg-red-100 text-red-800",
	"under-treatment": "bg-amber-100 text-amber-800",
	closed: "bg-green-100 text-green-800",
	accepted: "bg-gray-100 text-gray-700",
};

const complianceStatusColour: Record<string, string> = {
	compliant: "bg-green-100 text-green-800",
	"non-compliant": "bg-red-100 text-red-800",
	"under-review": "bg-amber-100 text-amber-800",
	"not-applicable": "bg-gray-100 text-gray-700",
};

const findingSeverityColour: Record<string, string> = {
	critical: "bg-red-200 text-red-900",
	high: "bg-red-100 text-red-800",
	medium: "bg-amber-100 text-amber-800",
	low: "bg-gray-100 text-gray-700",
};

export default async function NoticeDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const supabase = createServiceClient();

	const [
		{ data: notice },
		{ data: risks },
		{ data: obligations },
		{ data: findings },
		{ data: controls },
	] = await Promise.all([
		// notice fetched first so we can use its type for spatial gap check below
		supabase.from("notices").select("*").eq("id", id).single(),
		supabase
			.from("risks")
			.select(
				"id, identifier, title, exposure, status, category, likelihood, impact",
			)
			.eq("notice_id", id)
			.order("exposure", { ascending: false }),
		supabase
			.from("compliance_obligations")
			.select("id, identifier, title, status, due_date, source")
			.eq("notice_id", id)
			.order("due_date", { ascending: true, nullsFirst: false }),
		supabase
			.from("findings")
			.select("id, title, finding_type, severity, status, identified_at")
			.eq("notice_id", id)
			.order("identified_at", { ascending: false }),
		supabase
			.from("controls")
			.select(
				"id, identifier, title, control_type, status, last_test_result, last_tested_at",
			)
			.eq("notice_id", id)
			.order("identifier"),
	]);

	if (!notice) notFound();

	const spatialGaps = notice.is_statutory
		? await getNoticeSpatialGapSummary(notice.type)
		: null;
	const proximityRadius = PROXIMITY_RADIUS[notice.type] ?? null;

	const canPublish = notice.status === "draft";
	const canClose = notice.status === "open" || notice.status === "published";

	const riskRows = risks ?? [];
	const obligationRows = obligations ?? [];
	const findingRows = findings ?? [];
	const controlRows = controls ?? [];

	const openFindings = findingRows.filter(
		(f) => f.status === "open" || f.status === "in-progress",
	).length;
	const criticalRisks = riskRows.filter((r) => r.exposure >= 15).length;
	const nonCompliant = obligationRows.filter(
		(o) => o.status === "non-compliant",
	).length;
	const spatialGapCount = spatialGaps
		? spatialGaps.pending + spatialGaps.unavailable
		: 0;

	// URL params for creating linked records
	const riskParams = new URLSearchParams({ notice_id: id }).toString();
	const obligationParams = new URLSearchParams({
		notice_id: id,
		identifier: `C-${id.slice(0, 6).toUpperCase()}`,
		title: notice.is_statutory
			? `${notice.title} — Comment Period`
			: notice.title,
		source: notice.type.replace(/-/g, " "),
		responsible_party: "",
		due_date: notice.comment_deadline ?? "",
	}).toString();
	const findingParams = new URLSearchParams({ notice_id: id }).toString();
	const controlParams = new URLSearchParams({ notice_id: id }).toString();

	return (
		<div className="space-y-6">
			<PageHeader
				title={notice.title}
				description={`${notice.type.replace(/-/g, " ")} · ${notice.is_statutory ? "Statutory notice" : "Governance notice"}`}
				actions={
					<div className="flex gap-2">
						<Button asChild variant="outline">
							<Link href="/notices">Back</Link>
						</Button>
						<Button asChild variant="outline">
							<Link href={`/notices/${id}/edit`}>Edit</Link>
						</Button>
					</div>
				}
			/>

			<div className="max-w-3xl space-y-6">
				{/* Status + geographic context */}
				<div className="grid grid-cols-2 gap-4">
					<Card>
						<CardHeader>
							<CardTitle className="text-sm">Status</CardTitle>
						</CardHeader>
						<CardContent className="space-y-3">
							<div className="flex flex-wrap gap-2">
								<span
									className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColour[notice.status] ?? ""}`}
								>
									{notice.status}
								</span>
								{notice.is_statutory && (
									<span className="text-xs px-2 py-0.5 rounded-full font-medium bg-purple-100 text-purple-800">
										Statutory
									</span>
								)}
							</div>
							<NoticeStatusActions
								id={id}
								canPublish={canPublish}
								canClose={canClose}
								isStatutory={notice.is_statutory}
								hasDeadline={!!notice.comment_deadline}
							/>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className="text-sm">Geographic Context</CardTitle>
						</CardHeader>
						<CardContent className="space-y-2 text-sm">
							{notice.ward_ref ? (
								<p>
									<span className="text-muted-foreground">Ward:</span>{" "}
									{notice.ward_ref}
								</p>
							) : (
								<p className="text-muted-foreground text-xs">
									No ward reference set.
								</p>
							)}
							{notice.latitude && notice.longitude ? (
								<>
									<p className="text-xs text-muted-foreground">
										{notice.latitude.toFixed(5)}, {notice.longitude.toFixed(5)}
									</p>
									<Button asChild variant="outline" size="sm" className="mt-1">
										<Link href="/spatial/map">View on map</Link>
									</Button>
								</>
							) : (
								<p className="text-xs text-muted-foreground">
									No coordinates set. Edit this notice to add geographic
									context.
								</p>
							)}
							{notice.node_notice_ref && (
								<p className="text-xs text-muted-foreground truncate">
									Node ref: {notice.node_notice_ref}
								</p>
							)}
						</CardContent>
					</Card>
				</div>

				{/* Intelligence summary — always shown for statutory notices, otherwise only when records exist */}
				{(riskRows.length > 0 ||
					obligationRows.length > 0 ||
					findingRows.length > 0 ||
					spatialGapCount > 0) && (
					<Card>
						<CardHeader>
							<div className="flex items-center justify-between">
								<CardTitle className="text-sm">
									Risk &amp; Compliance Summary
								</CardTitle>
								<div className="flex gap-2 flex-wrap">
									{criticalRisks > 0 && (
										<span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-800 font-medium">
											{criticalRisks} critical risk{criticalRisks > 1 ? "s" : ""}
										</span>
									)}
									{nonCompliant > 0 && (
										<span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-800 font-medium">
											{nonCompliant} non-compliant
										</span>
									)}
									{openFindings > 0 && (
										<span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-medium">
											{openFindings} open finding{openFindings > 1 ? "s" : ""}
										</span>
									)}
									{spatialGapCount > 0 && (
										<span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-medium">
											{spatialGapCount} spatial layer{spatialGapCount > 1 ? "s" : ""} pending
										</span>
									)}
									{proximityRadius && (
										<span className="text-xs px-2 py-0.5 rounded-full bg-violet-100 text-violet-800 font-medium">
											{proximityRadius.metres}m proximity zone
										</span>
									)}
								</div>
							</div>
						</CardHeader>
						<CardContent className="space-y-1 text-xs text-muted-foreground">
							<p>
								{riskRows.length} risk{riskRows.length !== 1 ? "s" : ""} ·{" "}
								{obligationRows.length} obligation{obligationRows.length !== 1 ? "s" : ""} ·{" "}
								{findingRows.length} finding{findingRows.length !== 1 ? "s" : ""}
								{spatialGaps && (
									<> · {spatialGaps.available}/{spatialGaps.total} spatial layers available</>
								)}
							</p>
						</CardContent>
					</Card>
				)}

				{/* Spatial dataset requirements — bottom of page, collapsed by default */}
				{notice.is_statutory && (
					<NoticeSpatialContext noticeType={notice.type} noticeId={id} />
				)}

				{/* Risks */}
				<Card>
					<CardHeader>
						<div className="flex items-center justify-between">
							<CardTitle>Risks</CardTitle>
							<Button asChild size="sm" variant="outline">
								<Link href={`/risk/new?${riskParams}`}>Add risk</Link>
							</Button>
						</div>
					</CardHeader>
					<CardContent className="p-0">
						{riskRows.length === 0 ? (
							<p className="px-6 py-4 text-sm text-muted-foreground">
								No risks linked to this notice.
							</p>
						) : (
							<div className="divide-y">
								{riskRows.map((r) => (
									<div
										key={r.id}
										className="relative px-6 py-3 hover:bg-muted/30"
									>
										<Link
											href={`/risk/${r.id}`}
											className="absolute inset-0"
											aria-label={r.title}
										/>
										<div className="flex items-center justify-between gap-4">
											<div className="min-w-0">
												<p className="text-sm font-medium">
													{r.identifier} — {r.title}
												</p>
												<p className="text-xs text-muted-foreground">
													{r.category} · L:{r.likelihood} × I:{r.impact}
												</p>
											</div>
											<div className="flex items-center gap-2 shrink-0">
												<span
													className={`text-sm ${exposureColour(r.exposure)}`}
												>
													{r.exposure}
												</span>
												<span
													className={`text-xs px-2 py-0.5 rounded-full font-medium ${riskStatusColour[r.status] ?? ""}`}
												>
													{r.status}
												</span>
											</div>
										</div>
									</div>
								))}
							</div>
						)}
					</CardContent>
				</Card>

				{/* Compliance obligations */}
				<Card>
					<CardHeader>
						<div className="flex items-center justify-between">
							<CardTitle>Compliance Obligations</CardTitle>
							<Button asChild size="sm" variant="outline">
								<Link href={`/compliance/new?${obligationParams}`}>
									Add obligation
								</Link>
							</Button>
						</div>
					</CardHeader>
					<CardContent className="p-0">
						{obligationRows.length === 0 ? (
							<p className="px-6 py-4 text-sm text-muted-foreground">
								No obligations linked to this notice.
							</p>
						) : (
							<div className="divide-y">
								{obligationRows.map((o) => (
									<div
										key={o.id}
										className="relative px-6 py-3 hover:bg-muted/30"
									>
										<Link
											href={`/compliance/${o.id}`}
											className="absolute inset-0"
											aria-label={o.title}
										/>
										<div className="flex items-center justify-between gap-4">
											<div className="min-w-0">
												<p className="text-sm font-medium">
													{o.identifier} — {o.title}
												</p>
												<p className="text-xs text-muted-foreground">
													{o.source}
												</p>
											</div>
											<div className="flex items-center gap-2 shrink-0">
												{o.due_date && (
													<span className="text-xs text-muted-foreground">
														Due {new Date(o.due_date).toLocaleDateString()}
													</span>
												)}
												<span
													className={`text-xs px-2 py-0.5 rounded-full font-medium ${complianceStatusColour[o.status] ?? ""}`}
												>
													{o.status}
												</span>
											</div>
										</div>
									</div>
								))}
							</div>
						)}
					</CardContent>
				</Card>

				{/* Findings */}
				<Card>
					<CardHeader>
						<div className="flex items-center justify-between">
							<CardTitle>Findings</CardTitle>
							<Button asChild size="sm" variant="outline">
								<Link href={`/findings/new?${findingParams}`}>Add finding</Link>
							</Button>
						</div>
					</CardHeader>
					<CardContent className="p-0">
						{findingRows.length === 0 ? (
							<p className="px-6 py-4 text-sm text-muted-foreground">
								No findings linked to this notice.
							</p>
						) : (
							<div className="divide-y">
								{findingRows.map((f) => (
									<div
										key={f.id}
										className="relative px-6 py-3 hover:bg-muted/30"
									>
										<Link
											href={`/findings/${f.id}`}
											className="absolute inset-0"
											aria-label={f.title}
										/>
										<div className="flex items-center justify-between gap-4">
											<div className="min-w-0">
												<p className="text-sm font-medium">{f.title}</p>
												<p className="text-xs text-muted-foreground capitalize">
													{f.finding_type}
												</p>
											</div>
											<div className="flex items-center gap-2 shrink-0">
												<span
													className={`text-xs px-2 py-0.5 rounded-full font-medium ${findingSeverityColour[f.severity] ?? ""}`}
												>
													{f.severity}
												</span>
												<span className="text-xs text-muted-foreground">
													{f.status}
												</span>
											</div>
										</div>
									</div>
								))}
							</div>
						)}
					</CardContent>
				</Card>

				{/* Controls */}
				<Card>
					<CardHeader>
						<div className="flex items-center justify-between">
							<CardTitle>Controls</CardTitle>
							<Button asChild size="sm" variant="outline">
								<Link href={`/controls/new?${controlParams}`}>Add control</Link>
							</Button>
						</div>
					</CardHeader>
					<CardContent className="p-0">
						{controlRows.length === 0 ? (
							<p className="px-6 py-4 text-sm text-muted-foreground">
								No controls linked to this notice.
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
											<p className="text-sm font-medium">
												{c.identifier} — {c.title}
											</p>
											<div className="flex items-center gap-2 shrink-0">
												<span className="text-xs text-muted-foreground capitalize">
													{c.control_type}
												</span>
												{c.last_test_result && (
													<span
														className={`text-xs px-2 py-0.5 rounded-full font-medium ${
															c.last_test_result === "pass"
																? "bg-green-100 text-green-800"
																: c.last_test_result === "fail"
																	? "bg-red-100 text-red-800"
																	: "bg-amber-100 text-amber-800"
														}`}
													>
														{c.last_test_result}
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

				{/* Content */}
				<Card>
					<CardHeader>
						<CardTitle>Content</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-sm whitespace-pre-wrap">{notice.content}</p>
					</CardContent>
				</Card>

				{notice.comment_deadline && (
					<Card>
						<CardHeader>
							<CardTitle>Comment Period</CardTitle>
						</CardHeader>
						<CardContent className="space-y-2 text-sm">
							<p>
								<span className="text-muted-foreground">Deadline:</span>{" "}
								<span className="font-medium">
									{new Date(notice.comment_deadline).toLocaleDateString(
										"en-ZA",
										{ dateStyle: "long" },
									)}
								</span>
							</p>
							<p>
								<span className="text-muted-foreground">
									Comments received:
								</span>{" "}
								{notice.comments_received ?? 0}
							</p>
						</CardContent>
					</Card>
				)}

				<Card>
					<CardHeader>
						<CardTitle className="text-sm">Metadata</CardTitle>
					</CardHeader>
					<CardContent className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
						<span>Created by: {notice.created_by}</span>
						<span>
							Created: {new Date(notice.created_at).toLocaleDateString()}
						</span>
						<span>
							Updated: {new Date(notice.updated_at).toLocaleDateString()}
						</span>
						<span>ID: {notice.id}</span>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
