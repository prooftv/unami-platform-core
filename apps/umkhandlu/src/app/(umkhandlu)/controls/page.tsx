import { PageHeader } from "@unami/ui";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const typeColour: Record<string, string> = {
	preventive: "bg-blue-100 text-blue-800",
	detective: "bg-purple-100 text-purple-800",
	corrective: "bg-amber-100 text-amber-800",
};

const resultColour: Record<string, string> = {
	pass: "bg-green-100 text-green-800",
	fail: "bg-red-100 text-red-800",
	partial: "bg-amber-100 text-amber-800",
};

const statusColour: Record<string, string> = {
	active: "bg-green-100 text-green-800",
	inactive: "bg-gray-100 text-gray-700",
	retired: "bg-gray-100 text-gray-500",
};

export default async function ControlsPage() {
	const supabase = createServiceClient();

	const { data: controls } = await supabase
		.from("controls")
		.select("*")
		.order("identifier");

	const rows = controls ?? [];
	const active = rows.filter((c) => c.status === "active").length;
	const failing = rows.filter((c) => c.last_test_result === "fail").length;
	const untested = rows.filter(
		(c) => !c.last_tested_at && c.status === "active",
	).length;

	return (
		<div className="space-y-6">
			<PageHeader
				title="Controls"
				description="Preventive, detective and corrective controls linked to obligations and risks."
				actions={
					<Button asChild>
						<Link href="/controls/new">Add control</Link>
					</Button>
				}
			/>

			<div className="grid grid-cols-3 gap-4">
				<Card>
					<CardContent className="pt-6">
						<p className="text-2xl font-semibold">{active}</p>
						<p className="text-sm text-muted-foreground">Active controls</p>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-6">
						<p className="text-2xl font-semibold text-destructive">{failing}</p>
						<p className="text-sm text-muted-foreground">Last test failed</p>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="pt-6">
						<p className="text-2xl font-semibold text-amber-600">{untested}</p>
						<p className="text-sm text-muted-foreground">
							Active, never tested
						</p>
					</CardContent>
				</Card>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>All Controls</CardTitle>
				</CardHeader>
				<CardContent className="p-0">
					{rows.length === 0 ? (
						<div className="px-6 py-12 text-center text-sm text-muted-foreground">
							No controls recorded. Add a control to begin the register.
						</div>
					) : (
						<div className="divide-y">
							{rows.map((c) => (
								<div
									key={c.id}
									className="relative px-6 py-4 space-y-1 hover:bg-muted/30"
								>
									<Link
										href={`/controls/${c.id}`}
										className="absolute inset-0"
										aria-label={c.title}
									/>
									<div className="flex items-start justify-between gap-4">
										<div className="min-w-0">
											<p className="font-medium text-sm">
												{c.identifier} — {c.title}
											</p>
											<p className="text-xs text-muted-foreground">
												Owner: {c.owner}
												{c.test_frequency ? ` · ${c.test_frequency}` : ""}
											</p>
										</div>
										<div className="flex items-center gap-2 shrink-0">
											<span
												className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeColour[c.control_type] ?? ""}`}
											>
												{c.control_type}
											</span>
											{c.last_test_result && (
												<span
													className={`text-xs px-2 py-0.5 rounded-full font-medium ${resultColour[c.last_test_result] ?? ""}`}
												>
													{c.last_test_result}
												</span>
											)}
											<span
												className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColour[c.status] ?? ""}`}
											>
												{c.status}
											</span>
										</div>
									</div>
									{c.last_tested_at && (
										<p className="text-xs text-muted-foreground">
											Last tested: {c.last_tested_at}
										</p>
									)}
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
