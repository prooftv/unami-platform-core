"use client";

import { useState } from "react";
import {
  ContentLayout,
  PageHeader,
  SectionTitle,
  DataTable,
  TableToolbar,
  TablePagination,
  EmptyTable,
  TableContainer,
  TableHead,
  TableRow,
  TableHeaderCell,
  StatusBadge,
  Badge,
} from "@moments/ui";
import type { ColumnDef } from "@moments/ui";

type Row = { id: string; name: string; status: "active" | "inactive" | "pending"; role: string; joined: string };

const DATA: Row[] = [
  { id: "1", name: "Alex Morgan", status: "active", role: "Admin", joined: "Jan 2024" },
  { id: "2", name: "Sam Rivera", status: "pending", role: "Editor", joined: "Feb 2024" },
  { id: "3", name: "Jordan Lee", status: "inactive", role: "Viewer", joined: "Mar 2024" },
  { id: "4", name: "Casey Kim", status: "active", role: "Editor", joined: "Apr 2024" },
  { id: "5", name: "Riley Chen", status: "active", role: "Admin", joined: "May 2024" },
];

const COLUMNS: ColumnDef<Row>[] = [
  { key: "name", header: "Name", cell: (r) => <span className="font-medium">{r.name}</span> },
  { key: "role", header: "Role", cell: (r) => <Badge variant="outline">{r.role}</Badge> },
  { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
  { key: "joined", header: "Joined", cell: (r) => <span className="text-muted-foreground">{r.joined}</span> },
];

export default function TablesShowcase() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = DATA.filter((r) => r.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <ContentLayout>
      <div className="space-y-8">
        <PageHeader title="Table Components" description="DataTable, TableToolbar, TablePagination, EmptyTable" />

        <section className="space-y-4">
          <SectionTitle title="DataTable with Toolbar + Pagination" />
          <TableToolbar search={search} onSearchChange={setSearch} searchPlaceholder="Search users..." />
          <DataTable columns={COLUMNS} data={filtered} getRowKey={(r) => r.id} />
          <TablePagination page={page} pageSize={3} total={filtered.length} onPageChange={setPage} />
        </section>

        <section className="space-y-4">
          <SectionTitle title="EmptyTable" description="Zero-result state inside a table" />
          <TableContainer>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Name</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
              </TableRow>
            </TableHead>
            <EmptyTable colSpan={2} message="No records match your search." />
          </TableContainer>
        </section>
      </div>
    </ContentLayout>
  );
}
