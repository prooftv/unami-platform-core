import Link from "next/link";
import { LayoutDashboard, Table2, FormInput, BarChart2, AlertCircle, Compass, Palette } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@moments/ui";
import { ContentLayout } from "@moments/ui";
import { PageHeader } from "@moments/ui";

const SECTIONS = [
  { href: "/ui/dashboard", label: "Dashboard", description: "MetricCard, KPIGrid, ActivityFeed, QuickActions", icon: LayoutDashboard },
  { href: "/ui/tables", label: "Tables", description: "DataTable, TableToolbar, TablePagination, EmptyTable", icon: Table2 },
  { href: "/ui/forms", label: "Forms", description: "FormSection, FieldGroup, SubmitBar, FormActions", icon: FormInput },
  { href: "/ui/charts", label: "Charts", description: "LineChart, BarChart, AreaChart, PieChart", icon: BarChart2 },
  { href: "/ui/feedback", label: "Feedback", description: "EmptyState, ErrorState, LoadingCard, StatusBadge, Skeleton", icon: AlertCircle },
  { href: "/ui/navigation", label: "Navigation", description: "Breadcrumbs, PageHeader, SectionTitle", icon: Compass },
  { href: "/ui/theme", label: "Theme", description: "Theme presets, mode switching, font system", icon: Palette },
];

export default function UIShowcaseIndex() {
  return (
    <ContentLayout>
      <div className="space-y-8">
        <PageHeader
          title="UI Component Library"
          description="Reusable components from packages/ui — domain-agnostic, consumed by all Unami applications."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {SECTIONS.map((section) => {
            const Icon = section.icon;
            return (
              <Link key={section.href} href={section.href}>
                <Card className="h-full transition-colors hover:bg-accent/50 cursor-pointer">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="rounded-md bg-muted p-2">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <CardTitle>{section.label}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{section.description}</CardDescription>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </ContentLayout>
  );
}
