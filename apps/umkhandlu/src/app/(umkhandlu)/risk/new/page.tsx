import { PageHeader } from "@unami/ui";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createServiceClient } from "@/lib/supabase/server";
import { RiskForm } from "../_components/RiskForm";

export const dynamic = "force-dynamic";

export default async function NewRiskPage({
	searchParams,
}: {
	searchParams: Promise<Record<string, string>>;
}) {
	const params = await searchParams;
	const supabase = createServiceClient();
	const { data: registers } = await supabase
		.from("risk_registers")
		.select("id, title")
		.eq("status", "active")
		.order("title");

	return (
		<div className="space-y-6">
			<PageHeader
				title="Add Risk"
				description="Record a new risk in the register."
				actions={
					<Button variant="outline" asChild>
						<Link
							href={params.notice_id ? `/notices/${params.notice_id}` : "/risk"}
						>
							Back
						</Link>
					</Button>
				}
			/>
			<RiskForm registers={registers ?? []} noticeId={params.notice_id} />
		</div>
	);
}
