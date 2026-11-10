import { PageHeader } from "@unami/ui";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EvidenceForm } from "../_components/EvidenceForm";

interface Props {
	searchParams: Promise<{
		notice_id?: string;
		linked_risk_id?: string;
		linked_obligation_id?: string;
		linked_control_id?: string;
		linked_finding_id?: string;
		control_test_id?: string;
	}>;
}

export default async function NewEvidencePage({ searchParams }: Props) {
	const params = await searchParams;

	return (
		<div className="space-y-6">
			<PageHeader
				title="Add Evidence"
				description="Record evidence linked to a risk, obligation, control, finding or notice."
				actions={
					<Button variant="outline" asChild>
						<Link href="/evidence">Back</Link>
					</Button>
				}
			/>
			<EvidenceForm
				noticeId={params.notice_id}
				linkedRiskId={params.linked_risk_id}
				linkedObligationId={params.linked_obligation_id}
				linkedControlId={params.linked_control_id}
				linkedFindingId={params.linked_finding_id}
				controlTestId={params.control_test_id}
			/>
		</div>
	);
}
