"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "./ui/button";

const MESES = [
  { value: "0", label: "Enero" },
  { value: "1", label: "Febrero" },
  { value: "2", label: "Marzo" },
  { value: "3", label: "Abril" },
  { value: "4", label: "Mayo" },
  { value: "5", label: "Junio" },
  { value: "6", label: "Julio" },
  { value: "7", label: "Agosto" },
  { value: "8", label: "Septiembre" },
  { value: "9", label: "Octubre" },
  { value: "10", label: "Noviembre" },
  { value: "11", label: "Diciembre" },
];

/** Genera un arreglo de años desde `desde` hasta el año actual, en orden descendente. */
function getAnios(desde = 2023): number[] {
  const actual = new Date().getFullYear();
  const anios: number[] = [];
  for (let y = actual; y >= desde; y--) {
    anios.push(y);
  }
  return anios;
}

/**
 * Componente de cliente para filtrar las ventas y sesiones por rango de tiempo.
 * Los selectores de mes/año tienen prioridad: por defecto muestran el mes y año actual.
 * Los botones de rango rápido limpian la selección de los selectores al activarse.
 */
export function TotalSalesFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const now = new Date();

  const currentRange = searchParams.get("range") ?? "";
  const currentFrom = searchParams.get("from") ?? "";

  // Si hay un `from` en la URL, lo usamos; si no, defaulteamos al mes/año actual
  const fromDate = currentFrom ? new Date(currentFrom) : now;
  const selectedMonth = String(fromDate.getMonth());
  const selectedYear = String(fromDate.getFullYear());

  /**
   * Navega al rango from/to del mes y año dados.
   * Día 1 00:00:00 → último día del mes 23:59:59.
   */
  const navigateToMonth = (month: string, year: string) => {
    const m = Number(month);
    const y = Number(year);

    const from = new Date(y, m, 1, 0, 0, 0, 0);
    // new Date(y, m+1, 0) = último día del mes m (28/29/30/31 según corresponda)
    const to = new Date(y, m + 1, 0, 23, 59, 59, 999);

    const params = new URLSearchParams(searchParams);
    params.delete("range");
    params.set("from", from.toISOString());
    params.set("to", to.toISOString());
    router.replace(`${pathname}?${params.toString()}`);
  };

  /** Activa un filtro de rango rápido, limpiando from/to. */
  const handleFilterChange = (range: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("range", range);
    params.delete("from");
    params.delete("to");
    router.replace(`${pathname}?${params.toString()}`);
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    navigateToMonth(e.target.value, selectedYear);
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    navigateToMonth(selectedMonth, e.target.value);
  };

  // Los selects están activos cuando no hay un `range` rápido activado
  const isMonthPickerActive = !currentRange;

  const selectClass = [
    "h-9 rounded-md border bg-background px-3 py-1 text-sm shadow-sm",
    "focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer transition-colors",
    isMonthPickerActive
      ? "border-primary ring-1 ring-primary"
      : "border-input",
  ].join(" ");

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <Button
        variant={currentRange === "today" ? "secondary" : "outline"}
        onClick={() => handleFilterChange("today")}
      >
        Hoy
      </Button>
      <Button
        variant={currentRange === "week" ? "secondary" : "outline"}
        onClick={() => handleFilterChange("week")}
      >
        Esta Semana
      </Button>
      <Button
        variant={currentRange === "last3months" ? "secondary" : "outline"}
        onClick={() => handleFilterChange("last3months")}
      >
        Últimos 3 Meses
      </Button>
      <Button
        variant={currentRange === "lastYear" ? "secondary" : "outline"}
        onClick={() => handleFilterChange("lastYear")}
      >
        Último Año
      </Button>

      {/* Separador visual */}
      <span className="text-muted-foreground text-sm select-none px-1">|</span>

      {/* Selector de mes */}
      <select
        className={selectClass}
        value={selectedMonth}
        onChange={handleMonthChange}
        aria-label="Filtrar por mes"
      >
        {MESES.map((mes) => (
          <option key={mes.value} value={mes.value}>
            {mes.label}
          </option>
        ))}
      </select>

      {/* Selector de año */}
      <select
        className={selectClass}
        value={selectedYear}
        onChange={handleYearChange}
        aria-label="Filtrar por año"
      >
        {getAnios().map((y) => (
          <option key={y} value={String(y)}>
            {y}
          </option>
        ))}
      </select>
    </div>
  );
}
