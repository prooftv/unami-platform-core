import { PageHeader } from "@unami/ui";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FindingForm } from "../_components/FindingForm";

interface Props {
	searchParams: Promise<Record<string, string>>;
}

export default async function NewFindingPage({ searchParams }: Props) {
	const params = await searchParams;
	return (
		<div className="space-y-6">
			<PageHeader
				title="Add Finding"
				description="Record a gap, exception or incident."
				actions={
					<Button variant="outline" asChild>
						<Link
							href={
								params.notice_id ? `/notices/${params.notice_id}` : "/findings"
							}
						>
							Back
						</Link>
					</Button>
				}
			/>
			<FindingForm noticeId={params.notice_id} />
		</div>
	);
}
