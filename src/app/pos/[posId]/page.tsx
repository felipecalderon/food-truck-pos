import { getCashRegisterSessionsByPosName } from "@/actions/cash-register";
import { CashRegisterList } from "@/components/cash-register-list";
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

export default async function PosCajasPage({
  params,
  searchParams,
}: PosCajasPageProps) {
  const { posId } = await params;
  const searchPrms = await searchParams;
  const strPosId = decodeURIComponent(posId);
  const sessions: CashRegisterSession[] =
    await getCashRegisterSessionsByPosName(strPosId, searchPrms);
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Cajas del POS: {strPosId}</h1>
      <TotalSalesFilter />
      <CashRegisterList sessions={sessions} />
    </div>
  );
}
