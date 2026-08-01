import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import RequestDetailSheet from "@/components/admin/RequestDetailSheet";
import { SOURCE_LABELS, SOURCE_ORDER, STATUS_LABELS, STATUS_ORDER } from "@/components/admin/requestLabels";
import RequestStatusSelect from "@/components/admin/RequestStatusSelect";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc, type RouterOutputs } from "@/lib/trpc";

type RequestRow = RouterOutputs["requests"]["list"]["rows"][number];

const PAGE_SIZE = 25;

function excerpt(message: string, max = 90): string {
  const clean = message.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max)}…` : clean;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString("es-AR", { dateStyle: "medium", timeStyle: "short" });
}

function csvEscape(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function toCsv(rows: RequestRow[]): string {
  const headers = ["Fecha", "Nombre", "Correo", "Origen", "Estado", "Objetivo", "Mensaje", "Notas"];
  const lines = [headers.map(csvEscape).join(",")];
  for (const row of rows) {
    lines.push(
      [
        formatDate(row.createdAt as unknown as string),
        row.name,
        row.email,
        SOURCE_LABELS[row.source] ?? row.source,
        STATUS_LABELS[row.status] ?? row.status,
        row.goal ?? "",
        row.message,
        row.notes ?? "",
      ]
        .map((v) => csvEscape(String(v)))
        .join(",")
    );
  }
  return lines.join("\r\n");
}

function downloadCsv(csv: string, filename: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function AdminRequestsPage() {
  const utils = trpc.useUtils();

  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput.trim()), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, sourceFilter, debouncedSearch]);

  const filters = {
    status: statusFilter === "all" ? undefined : (statusFilter as (typeof STATUS_ORDER)[number]),
    source: sourceFilter === "all" ? undefined : (sourceFilter as (typeof SOURCE_ORDER)[number]),
    search: debouncedSearch || undefined,
  };

  const { data, isLoading, isError, refetch } = trpc.requests.list.useQuery({
    ...filters,
    page,
    pageSize: PAGE_SIZE,
  });

  const hasActiveFilters = statusFilter !== "all" || sourceFilter !== "all" || debouncedSearch !== "";
  const selectedRow = data?.rows.find((r) => r.id === selectedId) ?? null;
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  const handleExport = async () => {
    setExporting(true);
    try {
      const rows = await utils.requests.export.fetch(filters);
      downloadCsv(toCsv(rows), `solicitudes-${new Date().toISOString().slice(0, 10)}.csv`);
    } catch {
      alert("No pudimos generar el CSV. Probá de nuevo en un momento.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Solicitudes</h1>
        <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting}>
          {exporting ? "Exportando…" : "Exportar CSV"}
        </Button>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            {STATUS_ORDER.map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los orígenes</SelectItem>
            {Object.entries(SOURCE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Buscar por nombre o correo…"
            className="pl-9 rounded-lg border-border/60 focus:border-accent/50"
          />
        </div>
      </div>

      <Card className="overflow-hidden py-0">
        {isLoading ? (
          <div className="py-16 text-center text-sm text-muted-foreground">Cargando solicitudes…</div>
        ) : isError ? (
          <div className="py-16 text-center space-y-3">
            <p className="text-sm text-foreground">No pudimos cargar las solicitudes.</p>
            <p className="text-sm text-muted-foreground">Revisá tu conexión e intentá de nuevo.</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Reintentar
            </Button>
          </div>
        ) : !data || data.rows.length === 0 ? (
          <div className="py-16 text-center max-w-sm mx-auto">
            <p className="text-sm text-foreground">
              {hasActiveFilters
                ? "No encontramos solicitudes con estos filtros."
                : "Todavía no llegó ninguna solicitud."}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {hasActiveFilters
                ? "Probá cambiar el estado, el origen o la búsqueda."
                : "En cuanto alguien escriba desde el formulario de contacto del sitio, va a aparecer acá."}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Correo</TableHead>
                <TableHead>Origen</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Mensaje</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.rows.map((row) => (
                <TableRow
                  key={row.id}
                  onClick={() => setSelectedId(row.id)}
                  className="cursor-pointer"
                >
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {formatDate(row.createdAt as unknown as string)}
                  </TableCell>
                  <TableCell className="font-medium text-foreground">{row.name}</TableCell>
                  <TableCell className="text-muted-foreground">{row.email}</TableCell>
                  <TableCell className="text-muted-foreground">{SOURCE_LABELS[row.source] ?? row.source}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <RequestStatusSelect id={row.id} status={row.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-xs">{excerpt(row.message)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {data && data.rows.length > 0 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">
            Página {data.page} de {totalPages} · {data.total} en total
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}

      <RequestDetailSheet request={selectedRow} onOpenChange={(open) => !open && setSelectedId(null)} />
    </div>
  );
}
