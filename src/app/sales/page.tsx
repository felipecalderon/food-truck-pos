import { SalesList } from './components/sales-list';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function SalesPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Historial de Ventas</h1>
      <Card>
        <CardHeader>
          <CardTitle>Ventas Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <SalesList />
        </CardContent>
      </Card>
    </div>
  );
}
