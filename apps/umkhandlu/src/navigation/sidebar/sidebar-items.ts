import type { NavGroup } from "@unami/ui";
import {
	Activity,
	BarChart3,
	BookOpen,
	Briefcase,
	CheckSquare,
	Database,
	FileText,
	FolderOpen,
	GitBranch,
	Globe,
	Inbox,
	Layers,
	LayoutDashboard,
	Lock,
	Map as MapIcon,
	Network,
	Palette,
	Settings,
	ShieldAlert,
	ShieldCheck,
	Users,
	Zap,
} from "lucide-react";

export type {
	NavBadge,
	NavGroup,
	NavMainItem,
	NavMainLinkItem,
	NavMainParentItem,
	NavSubItem,
} from "@unami/ui";

export const sidebarItems: NavGroup[] = [
	{
		id: 1,
		items: [
			{
				id: "overview",
				title: "Dashboard",
				url: "/dashboard",
				icon: LayoutDashboard,
			},
		],
	},
	{
		id: 2,
		label: "Spatial Data",
		items: [
			{
				id: "spatial-sources",
				title: "Data Sources",
				url: "/spatial/sources",
				icon: Database,
			},
			{
				id: "spatial-datasets",
				title: "Datasets",
				url: "/spatial/datasets",
				icon: Layers,
			},
			{
				id: "spatial-layers",
				title: "Layer Configuration",
				url: "/spatial/layers",
				icon: Palette,
			},
			{
				id: "spatial-staging",
				title: "Staging Review",
				url: "/spatial/staging",
				icon: Inbox,
			},
			{
				id: "field-submissions",
				title: "Field Submissions",
				url: "/spatial/field-submissions",
				icon: FolderOpen,
			},
		],
	},
	{
		id: 3,
		label: "Map",
		items: [
			{
				id: "spatial-map",
				title: "Geographic View",
				url: "/spatial/map",
				icon: MapIcon,
			},
			{
				id: "spatial-report",
				title: "Spatial Report",
				url: "/spatial/report",
				icon: BarChart3,
			},
		],
	},
	{
		id: 4,
		label: "Intelligence",
		items: [
			{
				id: "intel-governance",
				title: "Governance",
				url: "/intelligence/governance",
				icon: ShieldAlert,
			},
			{
				id: "intel-commercial",
				title: "Commercial",
				url: "/intelligence/commercial",
				icon: Briefcase,
			},
			{
				id: "intel-audit",
				title: "Audit & Memory",
				url: "/intelligence/audit",
				icon: GitBranch,
			},
		],
	},
	{
		id: 5,
		label: "Governance",
		items: [
			{ id: "notices", title: "Notices", url: "/notices", icon: FileText },
			{
				id: "nodes",
				title: "Nodes",
				icon: Network,
				subItems: [
					{
						id: "nodes-list",
						title: "Registered Nodes",
						url: "/nodes",
					},
					{
						id: "node-health",
						title: "Node Health",
						url: "/nodes/health",
					},
				],
			},
		],
	},
	{
		id: 6,
		label: "Risk & Compliance",
		items: [
			{ id: "risk", title: "Risk Register", url: "/risk", icon: ShieldAlert },
			{
				id: "compliance",
				title: "Compliance",
				url: "/compliance",
				icon: ShieldCheck,
			},
			{ id: "controls", title: "Controls", url: "/controls", icon: Lock },
			{
				id: "findings",
				title: "Findings",
				url: "/findings",
				icon: CheckSquare,
			},
			{
				id: "evidence",
				title: "Evidence",
				url: "/evidence",
				icon: FolderOpen,
			},
		],
	},
	{
		id: 7,
		label: "Organisation",
		items: [
			{
				id: "settings",
				title: "Settings",
				url: "/settings",
				icon: Settings,
			},
			{
				id: "operators",
				title: "Operators",
				url: "/settings/operators",
				icon: Users,
			},
		],
	},
	{
		id: 8,
		label: "System",
		items: [
			{
				id: "audit-log",
				title: "Audit Log",
				url: "/audit-log",
				icon: GitBranch,
			},
			{
				id: "spatial-ops",
				title: "Spatial Operations",
				icon: Activity,
				subItems: [
					{
						id: "spatial-pipelines",
						title: "Pipeline Runs",
						url: "/spatial/pipelines",
					},
					{
						id: "spatial-monitoring",
						title: "Monitoring",
						url: "/spatial/monitoring",
					},
					{
						id: "spatial-gratisgis",
						title: "GratisGIS",
						url: "/spatial/gratisgis",
					},
					{
						id: "spatial-cogta",
						title: "COGTA Catalogue",
						url: "/spatial/cogta",
					},
				],
			},
			{
				id: "founders",
				title: "Founders Briefing",
				url: "/founders",
				icon: BookOpen,
			},
		],
	},
];
