import { PageHeader } from "@unami/ui";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ControlForm } from "../_components/ControlForm";

interface Props {
	searchParams: Promise<{
		notice_id?: string;
		obligation_id?: string;
		risk_id?: string;
	}>;
}

export default async function NewControlPage({ searchParams }: Props) {
	const params = await searchParams;

	return (
		<div className="space-y-6">
			<PageHeader
				title="Add Control"
				description="Define a new preventive, detective or corrective control."
				actions={
					<Button variant="outline" asChild>
						<Link href="/controls">Back</Link>
					</Button>
				}
			/>
			<ControlForm
				noticeId={params.notice_id}
				obligationId={params.obligation_id}
				riskId={params.risk_id}
			/>
		</div>
	);
}
