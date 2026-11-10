"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { verifyEvidenceAction } from "../_actions";

export function VerifyEvidenceButton({ id }: { id: string }) {
	const [pending, startTransition] = useTransition();

	return (
		<Button
			size="sm"
			variant="outline"
			disabled={pending}
			onClick={() =>
				startTransition(async () => {
					await verifyEvidenceAction(id);
				})
			}
		>
			{pending ? "Verifying…" : "Mark verified"}
		</Button>
	);
}
