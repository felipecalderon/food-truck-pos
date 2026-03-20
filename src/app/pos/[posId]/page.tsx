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
  month: "Este Mes",
};

export default async function PosCajasPage({
  params,
  searchParams,
}: PosCajasPageProps) {
  const { posId } = await params;
  const searchPrms = await searchParams;
  const strPosId = decodeURIComponent(posId);

  // Default to 'month' if no range is specified
  const range = searchPrms.range || "month";
  const effectiveSearchParams = { ...searchPrms, range };

  const sessions: CashRegisterSession[] =
    await getCashRegisterSessionsByPosName(strPosId, effectiveSearchParams);

  const rangeLabel = RANGE_LABELS[range] || "Período seleccionado";

  return (
    <div className="container mx-auto py-10 px-8">
      <h1 className="text-3xl font-bold mb-6">Cajas del POS: {strPosId}</h1>
      <TotalSalesFilter />
      <PosSessionsSummary sessions={sessions} rangeLabel={rangeLabel} />
      <CashRegisterList sessions={sessions} />
    </div>
  );
}
