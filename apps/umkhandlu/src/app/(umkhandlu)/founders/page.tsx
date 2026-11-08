import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export const metadata = { title: 'Founders Briefing — Unami Control Centre' };

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="space-y-4">
    <h2 className="text-xl font-semibold tracking-tight border-b pb-2">{title}</h2>
    {children}
  </div>
);

const Pill = ({ label, colour }: { label: string; colour: string }) => (
  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${colour}`}>{label}</span>
);

export default function FoundersPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-12 py-8 px-4">

      {/* Hero */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Pill label="Founders Briefing" colour="bg-primary/10 text-primary" />
          <Pill label="Confidential" colour="bg-amber-100 text-amber-800" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight">Unami Foundation</h1>
        <p className="text-xl text-muted-foreground max-w-2xl">
          A digital infrastructure organisation built on the principle of community self-determination.
          We build the technology that lets communities govern themselves — without depending on anyone else to do it for them.
        </p>
      </div>

      {/* What we are */}
      <Section title="What Unami Foundation Is">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle className="text-base">NPO — Non-Profit Organisation</CardTitle></CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>Unami Foundation operates as a registered NPO. This means our primary mandate is public benefit — not shareholder return.</p>
              <p>We build digital infrastructure for communities, traditional authorities, municipalities, and institutions that cannot afford commercial enterprise software.</p>
              <p>Surplus revenue is reinvested into platform development, community capacity building, and expanding access to governance tools.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">NPC — Non-Profit Company</CardTitle></CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>The NPC structure gives us legal standing to enter contracts, employ staff, and operate commercially — while remaining bound by a non-profit constitution.</p>
              <p>This is the social enterprise model: we charge for services, but the mission governs how revenue is used.</p>
              <p>Clients pay for implementation, support, and platform access. That revenue funds the public-benefit work.</p>
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground space-y-2">
            <p className="font-medium text-foreground">The social enterprise distinction matters:</p>
            <p>A commercial company optimises for profit. A pure charity depends on donations. A social enterprise like Unami Foundation does neither — it generates sustainable revenue from clients who can pay, and uses that revenue to serve communities who cannot.</p>
            <p>This is not charity. It is a different economic model for public infrastructure.</p>
          </CardContent>
        </Card>
      </Section>

      {/* Philosophy */}
      <Section title="The Self-Determination Philosophy">
        <Card>
          <CardContent className="pt-6 space-y-4 text-sm">
            <p className="text-base font-medium">Communities should not need permission to govern themselves.</p>
            <p className="text-muted-foreground">
              The dominant model of digital governance tools is extractive: a vendor builds a platform, communities pay forever, the vendor owns the data, and the community is dependent on the vendor&apos;s continued existence and goodwill.
            </p>
            <p className="text-muted-foreground">
              Unami Foundation rejects this model. Every platform we build is designed so that the community or institution operating it owns their data, controls their workflows, and can function independently of us.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {[
                { title: 'Data Sovereignty', body: 'Every institution owns its own data. We never aggregate, sell, or retain data beyond what is needed to operate the platform.' },
                { title: 'Operational Independence', body: 'Platforms are built so institutions can operate them without ongoing vendor dependency. We train, we document, we hand over.' },
                { title: 'Community Governance', body: 'The platform serves the governance structure of the community — it does not impose a governance structure on them.' },
              ].map((item) => (
                <div key={item.title} className="rounded-lg border p-4 space-y-1">
                  <p className="font-medium text-sm">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.body}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </Section>

      {/* Products */}
      <Section title="The Product Ecosystem">
        <p className="text-sm text-muted-foreground">Each product serves a distinct community need. All are built on the same platform foundation — Unami Platform Core.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              name: 'Umkhandlu',
              tag: 'Live',
              tagColour: 'bg-green-100 text-green-800',
              desc: 'Traditional authority and community governance operating platform. Governance records, community notices, public participation, evidence management, development notice tracking.',
              customers: 'Traditional councils, amakhosi, ward committees, community development workers.',
              url: 'umkhandlu.unamifoundation.org',
            },
            {
              name: 'Moments',
              tag: 'Live',
              tagColour: 'bg-green-100 text-green-800',
              desc: 'Community communication and digital notice board. Broadcasts, community feeds, WhatsApp delivery, subscriber management.',
              customers: 'Community organisations, ward councillors, local government communication offices.',
              url: 'moments.unamifoundation.org',
            },
            {
              name: 'UNCIP v2',
              tag: 'Live',
              tagColour: 'bg-green-100 text-green-800',
              desc: 'Child safety platform for South African townships. Connects parents, schools, SAPS, and community safety structures.',
              customers: 'Schools, SAPS community service centres, CPFs, parents.',
              url: 'uncip.unamifoundation.org',
            },
            {
              name: 'ITPMS',
              tag: 'Planned',
              tagColour: 'bg-gray-100 text-gray-700',
              desc: 'Municipal ICT project management platform. Project tracking, resource management, reporting for local government ICT departments.',
              customers: 'Municipal ICT departments, district municipalities.',
              url: null,
            },
            {
              name: 'Schools Portal',
              tag: 'Planned',
              tagColour: 'bg-gray-100 text-gray-700',
              desc: 'Digital infrastructure for educational institutions. Administration, communication, and operational tooling.',
              customers: 'School governing bodies, principals, district education offices.',
              url: null,
            },
            {
              name: 'BeatsChain',
              tag: 'In Development',
              tagColour: 'bg-blue-100 text-blue-800',
              desc: 'Music creator ecosystem. Creator profiles, ISRC registration, rights management, marketplace.',
              customers: 'Independent musicians, record labels, radio stations, music distributors.',
              url: null,
            },
          ].map((p) => (
            <Card key={p.name}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{p.name}</CardTitle>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.tagColour}`}>{p.tag}</span>
                </div>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <p className="text-muted-foreground">{p.desc}</p>
                <p><span className="font-medium">Customers: </span><span className="text-muted-foreground">{p.customers}</span></p>
                {p.url && (
                  <p className="text-xs text-primary">{p.url}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>

      {/* Customers and buyers */}
      <Section title="Who Are Our Customers and Buyers?">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              segment: 'Traditional Authorities',
              buyer: 'Inkosi / Traditional Council Secretary',
              need: 'Governance records, community notices, public participation, development oversight.',
              willingness: 'Moderate — budget constrained. Often funded via COGTA or district municipality.',
              colour: 'border-l-4 border-l-amber-400',
            },
            {
              segment: 'Local Government',
              buyer: 'Municipal Manager, ICT Director, Communications Manager',
              need: 'Project tracking, community communication, compliance reporting, spatial data management.',
              willingness: 'High — procurement budget exists. Requires formal tender or quotation process.',
              colour: 'border-l-4 border-l-blue-400',
            },
            {
              segment: 'Schools & Education',
              buyer: 'School Principal, SGB Chairperson, District Education Office',
              need: 'Communication, administration, safety, parent engagement.',
              willingness: 'Low direct — typically funded via NSFAS, DBE grants, or corporate CSR.',
              colour: 'border-l-4 border-l-green-400',
            },
            {
              segment: 'Community Safety',
              buyer: 'CPF Chairperson, SAPS Station Commander, Ward Councillor',
              need: 'Child safety coordination, incident tracking, community alerts.',
              willingness: 'Low direct — funded via SAPS community budget or municipal safety programmes.',
              colour: 'border-l-4 border-l-red-400',
            },
            {
              segment: 'Music & Creative Industry',
              buyer: 'Independent artist, label manager, music distributor',
              need: 'ISRC registration, rights management, distribution, marketplace.',
              willingness: 'Moderate — subscription model. Revenue share on marketplace transactions.',
              colour: 'border-l-4 border-l-purple-400',
            },
            {
              segment: 'Corporate CSR / Sponsors',
              buyer: 'CSR Manager, Foundation Director',
              need: 'Verified community impact reporting, certified deliverables, beneficiary tracking.',
              willingness: 'High — CSR budget is allocated. Needs audit trail and impact evidence.',
              colour: 'border-l-4 border-l-teal-400',
            },
          ].map((seg) => (
            <Card key={seg.segment} className={seg.colour}>
              <CardHeader><CardTitle className="text-sm">{seg.segment}</CardTitle></CardHeader>
              <CardContent className="text-xs space-y-2 text-muted-foreground">
                <p><span className="font-medium text-foreground">Buyer: </span>{seg.buyer}</p>
                <p><span className="font-medium text-foreground">Need: </span>{seg.need}</p>
                <p><span className="font-medium text-foreground">Willingness to pay: </span>{seg.willingness}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>

      {/* Revenue model */}
      <Section title="Revenue Model">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Platform Access (SaaS)</CardTitle></CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-1">
              <p>Monthly or annual subscription per institution. Tiered by user count and feature set.</p>
              <p>Umkhandlu: R800–R3,500/month per traditional council or municipality.</p>
              <p>Moments: R400–R1,200/month per organisation.</p>
              <p>UNCIP: R600–R2,000/month per school cluster or SAPS station.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Implementation & Onboarding</CardTitle></CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-1">
              <p>Once-off setup, data migration, training, and configuration fee.</p>
              <p>R5,000–R25,000 depending on complexity and number of users.</p>
              <p>Includes governance node deployment, Sanity Studio setup, and operator training.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">CSR Campaign Management</CardTitle></CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-1">
              <p>Corporates pay to run verified community impact campaigns through the platform.</p>
              <p>Certified deliverables, beneficiary tracking, and audit-ready impact reports.</p>
              <p>R15,000–R80,000 per campaign depending on scope and duration.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Government Contracts</CardTitle></CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-1">
              <p>District municipality or provincial department contracts for platform deployment across multiple nodes.</p>
              <p>Amajuba District: potential contract covering all 3 local municipalities + traditional councils.</p>
              <p>R200,000–R1,200,000 per annum for district-wide deployment.</p>
            </CardContent>
          </Card>
        </div>
      </Section>

      {/* Unami Foundation reference */}
      <Section title="unamifoundation.org — The Public Face">
        <Card>
          <CardContent className="pt-6 text-sm space-y-3">
            <p className="text-muted-foreground">
              <Link href="https://unamifoundation.org" target="_blank" className="text-primary underline">unamifoundation.org</Link> is the public-facing website for the Unami Foundation. It communicates our mission, our products, our team, and our impact to the public, to potential clients, and to funders.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {[
                { title: 'For Communities', body: 'Explains what each platform does in plain language. Entry point for traditional councils and community organisations discovering us.' },
                { title: 'For Government', body: 'Demonstrates compliance, governance, and audit capability. Entry point for municipal procurement conversations.' },
                { title: 'For Corporates', body: 'Showcases CSR campaign capability and certified impact reporting. Entry point for sponsorship and campaign conversations.' },
                { title: 'For Funders', body: 'Documents our NPO mandate, public benefit work, and social impact. Entry point for grant applications and donor relationships.' },
              ].map((item) => (
                <div key={item.title} className="rounded-lg border p-4 space-y-1">
                  <p className="font-medium text-sm">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.body}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </Section>

      {/* GIS and Risk system */}
      <Section title="GIS, Spatial Intelligence & Risk — What We Built">
        <Card>
          <CardContent className="pt-6 text-sm space-y-3">
            <p className="text-muted-foreground">
              The Unami Control Centre now includes a full spatial intelligence, risk management, and compliance system. This is not a third-party tool — it is built into the platform and owned by us.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {[
                { title: 'Spatial Data Management', body: 'Register institutional GIS sources (Amajuba, COGTA, Stats SA). Track datasets, run health checks, stage and approve features before publication.' },
                { title: 'Risk Register', body: 'Formal risk assessment with likelihood × impact scoring, treatment plans, revision history, and automated deadline alerts.' },
                { title: 'Compliance Obligations', body: 'Track legislative and regulatory obligations. Automated findings when deadlines approach. Full audit trail.' },
                { title: 'Findings & Remediation', body: 'Gaps, exceptions, and incidents with remediation action tracking. System-generated findings from automated pipelines.' },
                { title: 'Immutable Audit Log', body: 'Every state change on every record is logged permanently. Actor, action, previous state, new state. Cannot be deleted.' },
                { title: 'Automated Monitoring', body: 'Daily GitHub Actions cron: source health checks, data freshness alerts, compliance deadline warnings, risk treatment reminders.' },
              ].map((item) => (
                <div key={item.title} className="rounded-lg border p-4 space-y-1">
                  <p className="font-medium text-sm">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.body}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </Section>

      {/* Pending ops */}
      <Section title="What Needs to Happen Next (Founder Actions)">
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="pt-6 space-y-3 text-sm">
            <p className="font-medium text-amber-900 dark:text-amber-200">The following require a fresh Supabase Management API token. Go to supabase.com → Account → Access Tokens → generate new token → update SUPABASE_ACCESS_TOKEN in .env.example.</p>
            <div className="space-y-2">
              {[
                { item: 'Apply migration 006_gis_datasets_pipelines.sql to project ufsmpqxniswdnsywjzje', detail: 'Creates spatial_datasets, spatial_pipeline_runs, spatial_staged_features tables.' },
                { item: 'Apply migration 007_risk_compliance.sql to project ufsmpqxniswdnsywjzje', detail: 'Creates risk_registers, risks, risk_revisions, compliance_obligations, controls, control_tests, evidence_records, findings, remediation_actions, gis_audit_log.' },
                { item: 'Deploy spatial-pipelines Edge Function', detail: 'supabase/functions/spatial-pipelines/index.ts → project ufsmpqxniswdnsywjzje' },
                { item: 'Deploy spatial-scheduler Edge Function', detail: 'supabase/functions/spatial-scheduler/index.ts → project ufsmpqxniswdnsywjzje' },
                { item: 'Set SPATIAL_SCHEDULER_SECRET in Vercel (apps/umkhandlu)', detail: 'Any random string. Also set as GitHub Actions secret SPATIAL_SCHEDULER_SECRET.' },
              ].map((a, i) => (
                <div key={i} className="flex gap-3 p-3 rounded-lg bg-white dark:bg-amber-950/40 border border-amber-200">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-amber-200 text-amber-900 text-xs font-bold flex items-center justify-center">{i + 1}</span>
                  <div>
                    <p className="font-medium text-amber-900 dark:text-amber-200">{a.item}</p>
                    <p className="text-xs text-amber-700 dark:text-amber-400">{a.detail}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-amber-700 dark:text-amber-400 pt-2">
              Once the token is refreshed, the agent can apply all migrations and deploy all Edge Functions automatically — no manual SQL editor steps needed.
            </p>
          </CardContent>
        </Card>
      </Section>

      {/* Platform architecture */}
      <Section title="Platform Architecture — Why Nothing Is Monolithic">
        <Card>
          <CardContent className="pt-6 text-sm space-y-4">
            <p className="text-muted-foreground">Every capability in the Unami ecosystem is built once and reused. No product rebuilds authentication, layouts, API patterns, or validation from scratch.</p>
            <div className="space-y-3">
              {[
                { layer: 'packages/ui — @unami/ui', desc: 'Design system, shell framework, structural components. Used by every application. No business logic, no Supabase, no domain knowledge.' },
                { layer: 'packages/shared — @unami/shared', desc: 'Enums, types, Zod validators, constants. No React, no Next.js, no Supabase.' },
                { layer: 'packages/api — @unami/api', desc: 'Typed HTTP clients. Applications never call endpoints directly. All data flows through typed clients.' },
                { layer: 'supabase/functions/', desc: 'The only layer that touches the database. Edge Functions are the API boundary. No direct DB calls from application code.' },
                { layer: 'apps/admin, apps/web, apps/umkhandlu, apps/uncip', desc: 'Individual products. Each owns its domain, routes, and UX. Each consumes platform packages. None modifies them.' },
              ].map((l) => (
                <div key={l.layer} className="flex gap-4 p-3 rounded-lg border">
                  <code className="text-xs font-mono text-primary shrink-0 w-48">{l.layer}</code>
                  <p className="text-xs text-muted-foreground">{l.desc}</p>
                </div>
              ))}
            </div>
            <p className="text-muted-foreground text-xs pt-2">
              The test: deleting any single application must leave packages/ compiling without modification. Every application is independently removable. The platform is not coupled to any product.
            </p>
          </CardContent>
        </Card>
      </Section>

    </div>
  );
}
