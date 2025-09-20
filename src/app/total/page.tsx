import { TotalSalesList } from "@/components/total-sales-list";
import { TotalSalesFilter } from "@/components/total-sales-filter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAllSales } from "@/actions/sales";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface TotalSalesPageProps {
  searchParams: Promise<{
    range?: string;
    from?: string;
    to?: string;
  }>;
}

export default async function TotalSalesPage({
  searchParams,
}: TotalSalesPageProps) {
  const params = await searchParams;
  const sales = await getAllSales(params);

  const totalRevenue = sales.reduce((acc, sale) => acc + sale.total, 0);
  const totalSalesCount = sales.length;

  return (
    <div className="container mx-auto py-8 px-6">
      <h1 className="text-3xl font-bold mb-6">
        Ventas Totales (Todos los POS)
      </h1>

      <div className="grid gap-4 md:grid-cols-2 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ingresos Totales
            </CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              Ingresos acumulados de todas las ventas
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Número de Ventas
            </CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{totalSalesCount}</div>
            <p className="text-xs text-muted-foreground">
              Total de transacciones completadas
            </p>
          </CardContent>
        </Card>
      </div>

      <TotalSalesFilter />

      <Card>
        <CardHeader>
          <CardTitle>Historial de Ventas</CardTitle>
        </CardHeader>
        <CardContent>
          <TotalSalesList sales={sales} />
        </CardContent>
      </Card>
    </div>
  );
}
