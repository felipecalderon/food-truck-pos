import redis from '@/lib/redis';
import type { Sale } from '@/types/sale';
import { TotalSalesList } from '@/components/total-sales-list';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

async function getAllSales(): Promise<Sale[]> {
  try {
    const saleKeys = await redis.keys('sale:*');
    if (saleKeys.length === 0) {
      return [];
    }

    const salesJson = await redis.mget(saleKeys);
    const sales = salesJson
      .map((saleJson) => {
        try {
          return saleJson ? (JSON.parse(saleJson) as Sale) : null;
        } catch (e) {
          console.error('Failed to parse sale JSON:', e);
          return null;
        }
      })
      .filter((sale): sale is Sale => sale !== null)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Ordenar por fecha descendente

    return sales;
  } catch (error) {
    console.error("Error fetching sales from Redis:", error);
    // En caso de error (ej. Redis no disponible), devolver un array vacío
    // para no romper la renderización de la página.
    return [];
  }
}

export default async function TotalSalesPage() {
  const sales = await getAllSales();

  const totalRevenue = sales.reduce((acc, sale) => acc + sale.total, 0);
  const totalSalesCount = sales.length;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
    }).format(amount);
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Ventas Totales (Todos los POS)</h1>
      
      <div className="grid gap-4 md:grid-cols-2 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="h-4 w-4 text-muted-foreground"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">Ingresos acumulados de todas las ventas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Número de Ventas</CardTitle>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="h-4 w-4 text-muted-foreground"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{totalSalesCount}</div>
            <p className="text-xs text-muted-foreground">Total de transacciones completadas</p>
          </CardContent>
        </Card>
      </div>

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
