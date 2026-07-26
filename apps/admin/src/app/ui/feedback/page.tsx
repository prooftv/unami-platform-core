import { Inbox, AlertCircle } from "lucide-react";
import {
  ContentLayout,
  PageHeader,
  SectionTitle,
  EmptyState,
  ErrorState,
  LoadingCard,
  LoadingTable,
  StatusBadge,
  Skeleton,
  Badge,
  Card,
  CardContent,
  KPIGrid,
} from "@moments/ui";

export default function FeedbackShowcase() {
  return (
    <ContentLayout>
      <div className="space-y-8">
        <PageHeader title="Feedback Components" description="EmptyState, ErrorState, LoadingCard, StatusBadge, Skeleton, Badge" />

        <section className="space-y-4">
          <SectionTitle title="StatusBadge" />
          <Card>
            <CardContent className="pt-6 flex flex-wrap gap-3">
              <StatusBadge status="active" />
              <StatusBadge status="inactive" />
              <StatusBadge status="pending" />
              <StatusBadge status="error" />
              <StatusBadge status="info" />
              <StatusBadge status="draft" />
            </CardContent>
          </Card>
        </section>

        <section className="space-y-4">
          <SectionTitle title="Badge Variants" />
          <Card>
            <CardContent className="pt-6 flex flex-wrap gap-3">
              <Badge variant="default">Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="outline">Outline</Badge>
              <Badge variant="destructive">Destructive</Badge>
              <Badge variant="success">Success</Badge>
              <Badge variant="warning">Warning</Badge>
              <Badge variant="info">Info</Badge>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-4">
          <SectionTitle title="Skeleton" />
          <Card>
            <CardContent className="pt-6 space-y-3">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-32 w-full mt-2" />
            </CardContent>
          </Card>
        </section>

        <section className="space-y-4">
          <SectionTitle title="LoadingCard + LoadingTable" />
          <KPIGrid columns={3}>
            <LoadingCard />
            <LoadingCard />
            <LoadingCard />
          </KPIGrid>
          <LoadingTable rows={4} />
        </section>

        <section className="space-y-4">
          <SectionTitle title="EmptyState" />
          <Card>
            <CardContent>
              <EmptyState
                icon={Inbox}
                title="No items found"
                description="There are no items matching your current filters. Try adjusting your search."
              />
            </CardContent>
          </Card>
        </section>

        <section className="space-y-4">
          <SectionTitle title="ErrorState" />
          <Card>
            <CardContent>
              <ErrorState
                title="Failed to load data"
                description="There was a problem fetching this information. Please try again."
              />
            </CardContent>
          </Card>
        </section>
      </div>
    </ContentLayout>
  );
}
