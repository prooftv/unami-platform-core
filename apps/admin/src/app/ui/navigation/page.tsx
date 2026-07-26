import {
  ContentLayout,
  PageHeader,
  SectionTitle,
  Breadcrumbs,
  Card,
  CardContent,
  Button,
} from "@moments/ui";

export default function NavigationShowcase() {
  return (
    <ContentLayout>
      <div className="space-y-8">
        <PageHeader title="Navigation Components" description="Breadcrumbs, PageHeader, SectionTitle" />

        <section className="space-y-4">
          <SectionTitle title="Breadcrumbs" />
          <Card>
            <CardContent className="pt-6 space-y-4">
              <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Settings", href: "/settings" }, { label: "Profile" }]} />
              <Breadcrumbs items={[{ label: "Dashboard", href: "/ui" }, { label: "Navigation" }]} />
              <Breadcrumbs items={[{ label: "Single item" }]} />
            </CardContent>
          </Card>
        </section>

        <section className="space-y-4">
          <SectionTitle title="PageHeader" description="Title + description + actions slot" />
          <Card>
            <CardContent className="pt-6 space-y-6">
              <PageHeader title="Page Title" description="Optional description text below the title." />
              <PageHeader
                title="With Actions"
                description="Actions slot accepts any ReactNode."
                actions={<><Button variant="outline" size="sm">Secondary</Button><Button size="sm">Primary</Button></>}
              />
              <PageHeader title="Title Only" />
            </CardContent>
          </Card>
        </section>

        <section className="space-y-4">
          <SectionTitle title="SectionTitle" description="Section heading with optional description" />
          <Card>
            <CardContent className="pt-6 space-y-6">
              <SectionTitle title="Section Heading" description="Optional supporting text for this section." />
              <SectionTitle title="Without Description" />
            </CardContent>
          </Card>
        </section>
      </div>
    </ContentLayout>
  );
}
