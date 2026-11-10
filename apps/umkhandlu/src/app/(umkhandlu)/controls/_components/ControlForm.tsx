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
import { createControlAction, updateControlAction } from "../_actions";

const TYPES = [
	{ value: "preventive", label: "Preventive" },
	{ value: "detective", label: "Detective" },
	{ value: "corrective", label: "Corrective" },
];

const STATUSES = [
	{ value: "active", label: "Active" },
	{ value: "inactive", label: "Inactive" },
	{ value: "retired", label: "Retired" },
];

interface Control {
	id: string;
	identifier: string;
	title: string;
	description: string | null;
	control_type: string;
	owner: string;
	test_frequency: string | null;
	status: string;
	obligation_id: string | null;
	risk_id: string | null;
}

interface Props {
	control?: Control;
	noticeId?: string;
	obligationId?: string;
	riskId?: string;
}

export function ControlForm({
	control,
	noticeId,
	obligationId,
	riskId,
}: Props) {
	const router = useRouter();
	const isEdit = !!control;

	const [state, action, pending] = useActionState(
		async (_prev: unknown, formData: FormData) => {
			const result = isEdit
				? await updateControlAction(control.id, formData)
				: await createControlAction(formData);
			if (result.success) router.push("/controls");
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
			{obligationId && (
				<input type="hidden" name="obligation_id" value={obligationId} />
			)}
			{riskId && <input type="hidden" name="risk_id" value={riskId} />}

			<div className="space-y-6">
				<Card>
					<CardHeader>
						<CardTitle>Control Identity</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-1.5">
								<Label htmlFor="identifier">Identifier *</Label>
								<Input
									id="identifier"
									name="identifier"
									required
									defaultValue={control?.identifier}
									placeholder="e.g. CTL-001"
								/>
							</div>
							<div className="space-y-1.5">
								<Label htmlFor="control_type">Type *</Label>
								<Select
									name="control_type"
									defaultValue={control?.control_type ?? "preventive"}
								>
									<SelectTrigger id="control_type">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{TYPES.map((t) => (
											<SelectItem key={t.value} value={t.value}>
												{t.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="title">Title *</Label>
							<Input
								id="title"
								name="title"
								required
								defaultValue={control?.title}
							/>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="description">Description</Label>
							<Textarea
								id="description"
								name="description"
								rows={3}
								defaultValue={control?.description ?? ""}
							/>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Ownership and Testing</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-1.5">
								<Label htmlFor="owner">Owner *</Label>
								<Input
									id="owner"
									name="owner"
									required
									defaultValue={control?.owner}
								/>
							</div>
							<div className="space-y-1.5">
								<Label htmlFor="test_frequency">Test frequency</Label>
								<Input
									id="test_frequency"
									name="test_frequency"
									defaultValue={control?.test_frequency ?? ""}
									placeholder="e.g. Monthly, Quarterly"
								/>
							</div>
						</div>
						{isEdit && (
							<div className="space-y-1.5">
								<Label htmlFor="status">Status</Label>
								<Select name="status" defaultValue={control.status}>
									<SelectTrigger id="status">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{STATUSES.map((s) => (
											<SelectItem key={s.value} value={s.value}>
												{s.label}
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
						{pending ? "Saving…" : isEdit ? "Save changes" : "Add control"}
					</Button>
				</div>
			</div>

			<div className="hidden lg:block">
				<div className="sticky top-20">
					<Card>
						<CardContent className="pt-6 space-y-2 text-xs text-muted-foreground">
							<p className="font-medium text-foreground text-sm">
								Control types
							</p>
							<p>
								<span className="font-medium">Preventive</span> — stops the risk
								event occurring.
							</p>
							<p>
								<span className="font-medium">Detective</span> — identifies when
								a risk event has occurred.
							</p>
							<p>
								<span className="font-medium">Corrective</span> — reduces impact
								after an event.
							</p>
						</CardContent>
					</Card>
				</div>
			</div>
		</form>
	);
}
