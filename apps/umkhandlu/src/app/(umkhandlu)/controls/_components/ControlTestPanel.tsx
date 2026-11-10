"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
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
import { createControlTestAction } from "../_actions";

const resultColour: Record<string, string> = {
	pass: "bg-green-100 text-green-800",
	fail: "bg-red-100 text-red-800",
	partial: "bg-amber-100 text-amber-800",
};

interface Test {
	id: string;
	tested_by: string;
	tested_at: string;
	result: string;
	notes: string | null;
	created_at: string;
}

interface Props {
	controlId: string;
	tests: Test[];
}

export function ControlTestPanel({ controlId, tests }: Props) {
	const [state, action, pending] = useActionState(
		async (_prev: unknown, formData: FormData) => {
			return createControlTestAction(controlId, formData);
		},
		null,
	);

	const today = new Date().toISOString().split("T")[0];

	return (
		<div className="space-y-6">
			<form action={action} className="space-y-4">
				<div className="grid grid-cols-2 gap-4">
					<div className="space-y-1.5">
						<Label htmlFor="result">Result *</Label>
						<Select name="result" defaultValue="pass">
							<SelectTrigger id="result">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="pass">Pass</SelectItem>
								<SelectItem value="fail">Fail</SelectItem>
								<SelectItem value="partial">Partial</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="tested_at">Test date *</Label>
						<Input
							id="tested_at"
							name="tested_at"
							type="date"
							required
							defaultValue={today}
						/>
					</div>
				</div>
				<div className="space-y-1.5">
					<Label htmlFor="notes">Notes / criteria</Label>
					<Textarea
						id="notes"
						name="notes"
						rows={2}
						placeholder="Describe what was tested and how."
					/>
				</div>
				{state?.error && (
					<p className="text-sm text-destructive">{state.error}</p>
				)}
				<div className="flex justify-end">
					<Button type="submit" disabled={pending} size="sm">
						{pending ? "Recording…" : "Record test"}
					</Button>
				</div>
			</form>

			{tests.length > 0 && (
				<div className="divide-y border rounded-md">
					{tests.map((t) => (
						<div key={t.id} className="px-4 py-3 text-sm">
							<div className="flex items-center justify-between gap-4">
								<div>
									<span
										className={`text-xs px-2 py-0.5 rounded-full font-medium ${resultColour[t.result] ?? ""}`}
									>
										{t.result}
									</span>
									<span className="ml-3 text-muted-foreground">
										{t.tested_by}
									</span>
								</div>
								<span className="text-xs text-muted-foreground shrink-0">
									{t.tested_at}
								</span>
							</div>
							{t.notes && (
								<p className="text-xs text-muted-foreground mt-1">{t.notes}</p>
							)}
						</div>
					))}
				</div>
			)}
		</div>
	);
}
