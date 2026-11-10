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
import { createRiskAction, updateRiskAction } from "../_actions";

const CATEGORIES = [
	"spatial",
	"governance",
	"data",
	"operational",
	"compliance",
	"external",
];
const TREATMENTS = [
	{ value: "mitigate", label: "Mitigate" },
	{ value: "accept", label: "Accept" },
	{ value: "transfer", label: "Transfer" },
	{ value: "avoid", label: "Avoid" },
];
const SCORES = ["1", "2", "3", "4", "5"];

interface Register {
	id: string;
	title: string;
}
interface Risk {
	id: string;
	register_id: string;
	identifier: string;
	title: string;
	description: string | null;
	category: string;
	likelihood: number;
	impact: number;
	owner: string;
	treatment: string;
	treatment_plan: string | null;
	treatment_deadline: string | null;
	methodology: string | null;
}
interface Props {
	registers: Register[];
	risk?: Risk;
	noticeId?: string;
}

export function RiskForm({ registers, risk, noticeId }: Props) {
	const router = useRouter();
	const isEdit = !!risk;

	const [state, action, pending] = useActionState(
		async (_prev: unknown, formData: FormData) => {
			const result = isEdit
				? await updateRiskAction(risk.id, formData)
				: await createRiskAction(formData);
			if (result.success) router.push("/risk");
			return result;
		},
		null,
	);

	return (
		<form
			action={action}
			className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]"
		>
			<div className="space-y-6">
				<Card>
					<CardHeader>
						<CardTitle>Risk Identity</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						{noticeId && (
							<input type="hidden" name="notice_id" value={noticeId} />
						)}
						{!isEdit && (
							<div className="space-y-1.5">
								<Label htmlFor="register_id">Register *</Label>
								<Select name="register_id" required defaultValue="">
									<SelectTrigger id="register_id">
										<SelectValue placeholder="Select register" />
									</SelectTrigger>
									<SelectContent>
										{registers.map((r) => (
											<SelectItem key={r.id} value={r.id}>
												{r.title}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						)}
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-1.5">
								<Label htmlFor="identifier">Identifier *</Label>
								<Input
									id="identifier"
									name="identifier"
									required
									defaultValue={risk?.identifier}
									placeholder="e.g. R-001"
								/>
							</div>
							<div className="space-y-1.5">
								<Label htmlFor="category">Category *</Label>
								<Select
									name="category"
									required
									defaultValue={risk?.category ?? ""}
								>
									<SelectTrigger id="category">
										<SelectValue placeholder="Select" />
									</SelectTrigger>
									<SelectContent>
										{CATEGORIES.map((c) => (
											<SelectItem key={c} value={c}>
												{c}
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
								defaultValue={risk?.title}
							/>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="description">Description</Label>
							<Textarea
								id="description"
								name="description"
								rows={3}
								defaultValue={risk?.description ?? ""}
							/>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="owner">Risk owner *</Label>
							<Input
								id="owner"
								name="owner"
								required
								defaultValue={risk?.owner}
							/>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Assessment</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-1.5">
								<Label htmlFor="likelihood">Likelihood (1–5) *</Label>
								<Select
									name="likelihood"
									required
									defaultValue={String(risk?.likelihood ?? "3")}
								>
									<SelectTrigger id="likelihood">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{SCORES.map((s) => (
											<SelectItem key={s} value={s}>
												{s}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-1.5">
								<Label htmlFor="impact">Impact (1–5) *</Label>
								<Select
									name="impact"
									required
									defaultValue={String(risk?.impact ?? "3")}
								>
									<SelectTrigger id="impact">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{SCORES.map((s) => (
											<SelectItem key={s} value={s}>
												{s}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="methodology">Assessment methodology</Label>
							<Input
								id="methodology"
								name="methodology"
								defaultValue={risk?.methodology ?? ""}
								placeholder="e.g. ISO 31000 qualitative matrix"
							/>
						</div>
						{isEdit && (
							<div className="space-y-1.5">
								<Label htmlFor="reason">Reason for reassessment</Label>
								<Input id="reason" name="reason" placeholder="What changed?" />
							</div>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Treatment</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-1.5">
							<Label htmlFor="treatment">Treatment *</Label>
							<Select
								name="treatment"
								required
								defaultValue={risk?.treatment ?? "mitigate"}
							>
								<SelectTrigger id="treatment">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{TREATMENTS.map((t) => (
										<SelectItem key={t.value} value={t.value}>
											{t.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="treatment_plan">Treatment plan</Label>
							<Textarea
								id="treatment_plan"
								name="treatment_plan"
								rows={3}
								defaultValue={risk?.treatment_plan ?? ""}
							/>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="treatment_deadline">Treatment deadline</Label>
							<Input
								id="treatment_deadline"
								name="treatment_deadline"
								type="date"
								defaultValue={risk?.treatment_deadline ?? ""}
							/>
						</div>
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
						{pending ? "Saving…" : isEdit ? "Save changes" : "Add risk"}
					</Button>
				</div>
			</div>

			<div className="hidden lg:block">
				<div className="sticky top-20">
					<Card>
						<CardContent className="pt-6 space-y-2 text-xs text-muted-foreground">
							<p className="font-medium text-foreground text-sm">
								Exposure score
							</p>
							<p>Exposure = Likelihood × Impact (max 25)</p>
							<p className="text-destructive">≥ 15 — Critical</p>
							<p className="text-amber-600">8–14 — High</p>
							<p className="text-green-600">1–7 — Moderate / Low</p>
							<p className="mt-2">
								Risk scores are transparent and explainable. Methodology, author
								and date are always recorded.
							</p>
						</CardContent>
					</Card>
				</div>
			</div>
		</form>
	);
}
