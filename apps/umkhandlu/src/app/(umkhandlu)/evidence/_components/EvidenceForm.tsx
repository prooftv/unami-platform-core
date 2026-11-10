"use client";

import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createEvidenceAction, updateEvidenceAction } from "../_actions";

const SOURCE_TYPES = [
	{ value: "operator-uploaded", label: "Operator uploaded" },
	{ value: "system-generated", label: "System generated" },
	{ value: "external", label: "External" },
];

const RETENTION = [
	{ value: "active", label: "Active" },
	{ value: "archived", label: "Archived" },
	{ value: "disposed", label: "Disposed" },
];

interface Evidence {
	id: string;
	title: string;
	document_type: string;
	source_type: string;
	description: string | null;
	provided_by: string | null;
	evidence_date: string | null;
	file_url: string | null;
	retention_status: string;
}

interface Props {
	evidence?: Evidence;
	noticeId?: string;
	linkedRiskId?: string;
	linkedObligationId?: string;
	linkedControlId?: string;
	linkedFindingId?: string;
	controlTestId?: string;
}

export function EvidenceForm({
	evidence,
	noticeId,
	linkedRiskId,
	linkedObligationId,
	linkedControlId,
	linkedFindingId,
	controlTestId,
}: Props) {
	const router = useRouter();
	const isEdit = !!evidence;

	const [state, action, pending] = useActionState(
		async (_prev: unknown, formData: FormData) => {
			const result = isEdit
				? await updateEvidenceAction(evidence.id, formData)
				: await createEvidenceAction(formData);
			if (result.success)
				router.push(isEdit ? `/evidence/${evidence.id}` : "/evidence");
			return result;
		},
		null,
	);

	return (
		<form
			action={action}
			className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]"
		>
			{noticeId && <input type="hidden" name="notice_id" value={noticeId} />}
			{linkedRiskId && (
				<input type="hidden" name="linked_risk_id" value={linkedRiskId} />
			)}
			{linkedObligationId && (
				<input
					type="hidden"
					name="linked_obligation_id"
					value={linkedObligationId}
				/>
			)}
			{linkedControlId && (
				<input type="hidden" name="linked_control_id" value={linkedControlId} />
			)}
			{linkedFindingId && (
				<input type="hidden" name="linked_finding_id" value={linkedFindingId} />
			)}
			{controlTestId && (
				<input type="hidden" name="control_test_id" value={controlTestId} />
			)}

			<div className="space-y-6">
				<Card>
					<CardHeader>
						<CardTitle>Evidence Identity</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-1.5">
							<Label htmlFor="title">Title *</Label>
							<Input
								id="title"
								name="title"
								required
								defaultValue={evidence?.title}
							/>
						</div>
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-1.5">
								<Label htmlFor="document_type">Document type *</Label>
								<Input
									id="document_type"
									name="document_type"
									required
									defaultValue={evidence?.document_type}
									placeholder="e.g. Report, Certificate, Screenshot"
								/>
							</div>
							<div className="space-y-1.5">
								<Label htmlFor="source_type">Source *</Label>
								<Select
									name="source_type"
									defaultValue={evidence?.source_type ?? "operator-uploaded"}
								>
									<SelectTrigger id="source_type">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{SOURCE_TYPES.map((s) => (
											<SelectItem key={s.value} value={s.value}>
												{s.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="description">Description</Label>
							<Textarea
								id="description"
								name="description"
								rows={3}
								defaultValue={evidence?.description ?? ""}
							/>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Provenance</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-1.5">
								<Label htmlFor="provided_by">Provided by</Label>
								<Input
									id="provided_by"
									name="provided_by"
									defaultValue={evidence?.provided_by ?? ""}
								/>
							</div>
							<div className="space-y-1.5">
								<Label htmlFor="evidence_date">Evidence date</Label>
								<Input
									id="evidence_date"
									name="evidence_date"
									type="date"
									defaultValue={evidence?.evidence_date ?? ""}
								/>
							</div>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="file_url">File URL</Label>
							<Input
								id="file_url"
								name="file_url"
								type="url"
								defaultValue={evidence?.file_url ?? ""}
								placeholder="https://…"
							/>
						</div>
						{isEdit && (
							<div className="space-y-1.5">
								<Label htmlFor="retention_status">Retention status</Label>
								<Select
									name="retention_status"
									defaultValue={evidence.retention_status}
								>
									<SelectTrigger id="retention_status">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{RETENTION.map((r) => (
											<SelectItem key={r.value} value={r.value}>
												{r.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						)}
					</CardContent>
				</Card>

				{state?.error && (
					<p className="text-sm text-destructive">{state.error}</p>
				)}

				<div className="flex justify-end gap-2">
					<Button type="button" variant="outline" onClick={() => router.back()}>
						Cancel
					</Button>
					<Button type="submit" disabled={pending}>
						{pending ? "Saving…" : isEdit ? "Save changes" : "Add evidence"}
					</Button>
				</div>
			</div>

			<div className="hidden lg:block">
				<div className="sticky top-20">
					<Card>
						<CardContent className="pt-6 space-y-2 text-xs text-muted-foreground">
							<p className="font-medium text-foreground text-sm">
								Evidence integrity
							</p>
							<p>
								Evidence records are immutable once verified. Verification
								requires a second operator.
							</p>
							<p>
								File URLs must point to a stable, access-controlled location.
							</p>
							<p>Retention status changes are audit-logged.</p>
						</CardContent>
					</Card>
				</div>
			</div>
		</form>
	);
}
