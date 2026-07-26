import {
  ContentLayout,
  PageHeader,
  SectionTitle,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  THEME_PRESET_OPTIONS,
  THEME_MODE_OPTIONS,
} from "@moments/ui";

export default function ThemeShowcase() {
  return (
    <ContentLayout>
      <div className="space-y-8">
        <PageHeader
          title="Theme System"
          description="Theme presets, mode options, and CSS variable foundation from packages/ui/theme."
        />

        <section className="space-y-4">
          <SectionTitle title="Theme Presets" description="Defined in packages/ui/src/theme/theme.ts" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {THEME_PRESET_OPTIONS.map((preset) => (
              <Card key={preset.value}>
                <CardHeader>
                  <CardTitle>{preset.label}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-5 rounded-full border" style={{ background: preset.primary.light }} />
                    <span className="text-xs text-muted-foreground">Light</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-5 rounded-full border" style={{ background: preset.primary.dark }} />
                    <span className="text-xs text-muted-foreground">Dark</span>
                  </div>
                  <Badge variant="outline" className="mt-1">{preset.value}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <SectionTitle title="Theme Modes" />
          <Card>
            <CardContent className="pt-6 flex gap-3">
              {THEME_MODE_OPTIONS.map((mode) => (
                <Badge key={mode.value} variant="secondary">{mode.label}</Badge>
              ))}
            </CardContent>
          </Card>
        </section>

        <section className="space-y-4">
          <SectionTitle title="CSS Variables" description="Semantic tokens available across all applications" />
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {[
                  { name: "background", var: "--background" },
                  { name: "foreground", var: "--foreground" },
                  { name: "primary", var: "--primary" },
                  { name: "secondary", var: "--secondary" },
                  { name: "muted", var: "--muted" },
                  { name: "accent", var: "--accent" },
                  { name: "destructive", var: "--destructive" },
                  { name: "border", var: "--border" },
                  { name: "sidebar", var: "--sidebar" },
                  { name: "card", var: "--card" },
                ].map((token) => (
                  <div key={token.var} className="flex items-center gap-2">
                    <div
                      className="h-6 w-6 rounded border shrink-0"
                      style={{ background: `var(${token.var})` }}
                    />
                    <span className="text-xs text-muted-foreground truncate">{token.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </ContentLayout>
  );
}
