import { getCashRegisterSessionsByPosName } from "@/actions/cash-register";
import { CashRegisterList } from "@/components/cash-register-list";
import { PosSessionsSummary } from "@/components/pos-sessions-summary";
import { TotalSalesFilter } from "@/components/total-sales-filter";
import { CashRegisterSession } from "@/types/cash-register";

interface PosCajasPageProps {
  params: Promise<{
    posId: string;
  }>;
  searchParams: Promise<{
    range?: string;
    from?: string;
    to?: string;
  }>;
}

const RANGE_LABELS: Record<string, string> = {
  today: "Hoy",
  week: "Esta Semana",
  last3months: "Últimos 3 Meses",
  lastYear: "Último Año",
};

/**
 * Calcula el `from` y `to` del mes actual como fallback cuando no hay parámetros en la URL.
 * Esto mantiene consistencia con los selectores de mes/año del cliente.
 */
function getDefaultMonthRange(): { from: string; to: string } {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { from: from.toISOString(), to: to.toISOString() };
}

export default async function PosCajasPage({
  params,
  searchParams,
}: PosCajasPageProps) {
  const { posId } = await params;
  const searchPrms = await searchParams;
  const strPosId = decodeURIComponent(posId);

  // Si no hay ningún parámetro, usa el mes actual como default (igual que los selects)
  const hasParams = searchPrms.range || searchPrms.from || searchPrms.to;
  const effectiveSearchParams = hasParams
    ? searchPrms
    : { ...getDefaultMonthRange() };

  const sessions: CashRegisterSession[] =
    await getCashRegisterSessionsByPosName(strPosId, effectiveSearchParams);

  // Determina la etiqueta del período mostrado
  let rangeLabel = "Período seleccionado";
  if (searchPrms.range) {
    rangeLabel = RANGE_LABELS[searchPrms.range] ?? "Período seleccionado";
  } else if (effectiveSearchParams.from) {
    const fromDate = new Date(effectiveSearchParams.from);
    const mesNombre = fromDate.toLocaleDateString("es-CL", { month: "long" });
    const año = fromDate.getFullYear();
    rangeLabel = `${mesNombre.charAt(0).toUpperCase()}${mesNombre.slice(1)} ${año}`;
  }

  return (
    <div className="container mx-auto py-10 px-8">
      <h1 className="text-3xl font-bold mb-6">Cajas del POS: {strPosId}</h1>
      <TotalSalesFilter />
      <PosSessionsSummary sessions={sessions} rangeLabel={rangeLabel} />
      <CashRegisterList sessions={sessions} />
    </div>
  );
}
