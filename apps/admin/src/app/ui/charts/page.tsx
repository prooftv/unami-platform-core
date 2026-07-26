import {
  ContentLayout,
  PageHeader,
  SectionTitle,
  AnalyticsCard,
  LineChart,
  BarChart,
  AreaChart,
  PieChart,
  ChartContainer,
} from "@moments/ui";

export default function ChartsShowcase() {
  return (
    <ContentLayout>
      <div className="space-y-8">
        <PageHeader
          title="Chart Components"
          description="Chart wrappers ready for a charting library. Connect Recharts, Victory, or Chart.js."
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="space-y-4">
            <SectionTitle title="LineChart" />
            <AnalyticsCard title="Trend Over Time">
              <ChartContainer><LineChart /></ChartContainer>
            </AnalyticsCard>
          </section>
          <section className="space-y-4">
            <SectionTitle title="BarChart" />
            <AnalyticsCard title="Comparison">
              <ChartContainer><BarChart /></ChartContainer>
            </AnalyticsCard>
          </section>
          <section className="space-y-4">
            <SectionTitle title="AreaChart" />
            <AnalyticsCard title="Cumulative">
              <ChartContainer><AreaChart /></ChartContainer>
            </AnalyticsCard>
          </section>
          <section className="space-y-4">
            <SectionTitle title="PieChart" />
            <AnalyticsCard title="Distribution">
              <ChartContainer><PieChart /></ChartContainer>
            </AnalyticsCard>
          </section>
        </div>
      </div>
    </ContentLayout>
  );
}
