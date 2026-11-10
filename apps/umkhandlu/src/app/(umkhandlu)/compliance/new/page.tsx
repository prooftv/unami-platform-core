import { PageHeader } from "@unami/ui";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ObligationForm } from "../_components/ObligationForm";

interface Props {
	searchParams: Promise<Record<string, string>>;
}

export default async function NewObligationPage({ searchParams }: Props) {
	const params = await searchParams;
	const prefill = {
		identifier: params.identifier,
		title: params.title,
		source: params.source,
		responsible_party: params.responsible_party,
		due_date: params.due_date,
	};

	return (
		<div className="space-y-6">
			<PageHeader
				title="Add Obligation"
				description="Record a new compliance obligation."
				actions={
					<Button variant="outline" asChild>
						<Link
							href={
								params.notice_id
									? `/notices/${params.notice_id}`
									: "/compliance"
							}
						>
							Back
						</Link>
					</Button>
				}
			/>
			<ObligationForm prefill={prefill} noticeId={params.notice_id} />
		</div>
	);
}
