import { PageHeader } from "@unami/ui";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const sourceColour: Record<string, string> = {
	"operator-uploaded": "bg-blue-100 text-blue-800",
	"system-generated": "bg-purple-100 text-purple-800",
	external: "bg-gray-100 text-gray-700",
};

const retentionColour: Record<string, string> = {
	active: "bg-green-100 text-green-800",
	archived: "bg-amber-100 text-amber-800",
	disposed: "bg-gray-100 text-gray-500",
};

export default async function EvidencePage() {
	const supabase = createServiceClient();

	const { data: records } = await supabase
		.from("evidence_records")
		.select("*")
		.order("created_at", { ascending: false });

	const rows = records ?? [];
	const verified = rows.filter((e) => !!e.verified_at).length;
	const unverified = rows.filter(
		(e) => !e.verified_at && e.retention_status === "active",
	).length;
	const archived = rows.filter((e) => e.retention_status === "archived").length;

	return (
		<div className="space-y-6">
			<PageHeader
				title="Evidence Register"
				description="Evidence records linked to risks, obligations, controls, findings and notices."
				actions={
					<Button asChild>
						<Link href="/evidence/new">Add evidence</Link>
					</Button>
				}
			/>

			<div className="grid grid-cols-3 gap-4">
				<Card>
					<CardContent className="pt-6">
						<p className="text-2xl font-semibold text-green-600">{verified}</p>
						<p className="text-sm text-muted-foreground">Verified</p>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-6">
						<p className="text-2xl font-semibold text-amber-600">
							{unverified}
						</p>
						<p className="text-sm text-muted-foreground">
							Awaiting verification
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-6">
						<p className="text-2xl font-semibold text-muted-foreground">
							{archived}
						</p>
						<p className="text-sm text-muted-foreground">Archived</p>
					</CardContent>
				</Card>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>All Evidence</CardTitle>
				</CardHeader>
				<CardContent className="p-0">
					{rows.length === 0 ? (
						<div className="px-6 py-12 text-center text-sm text-muted-foreground">
							No evidence records. Add evidence to begin the register.
						</div>
					) : (
						<div className="divide-y">
							{rows.map((e) => (
								<div
									key={e.id}
									className="relative px-6 py-4 space-y-1 hover:bg-muted/30"
								>
									<Link
										href={`/evidence/${e.id}`}
										className="absolute inset-0"
										aria-label={e.title}
									/>
									<div className="flex items-start justify-between gap-4">
										<div className="min-w-0">
											<p className="font-medium text-sm">{e.title}</p>
											<p className="text-xs text-muted-foreground">
												{e.document_type}
												{e.provided_by ? ` · ${e.provided_by}` : ""}
												{e.evidence_date ? ` · ${e.evidence_date}` : ""}
											</p>
										</div>
										<div className="flex items-center gap-2 shrink-0">
											<span
												className={`text-xs px-2 py-0.5 rounded-full font-medium ${sourceColour[e.source_type] ?? ""}`}
											>
												{e.source_type}
											</span>
											{e.verified_at && (
												<span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-800">
													verified
												</span>
											)}
											<span
												className={`text-xs px-2 py-0.5 rounded-full font-medium ${retentionColour[e.retention_status] ?? ""}`}
											>
												{e.retention_status}
											</span>
										</div>
									</div>
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
