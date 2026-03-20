import { CashRegisterSession } from "@/types/cash-register";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

interface PosSessionsSummaryProps {
  sessions: CashRegisterSession[];
  rangeLabel: string;
}

/**
 * Componente de servidor que muestra un resumen de las sesiones de caja.
 * Calcula el total de ventas, cantidad de sesiones, promedio y diferencia acumulada.
 */
export function PosSessionsSummary({
  sessions,
  rangeLabel,
}: PosSessionsSummaryProps) {
  const totalSales = sessions.reduce(
    (acc, session) => acc + session.calculatedSales,
    0,
  );
  const sessionCount = sessions.length;
  const averageSales = sessionCount > 0 ? totalSales / sessionCount : 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total de Ventas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalSales)}</div>
          <p className="text-xs text-muted-foreground">{rangeLabel}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Sesiones de Caja
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{sessionCount}</div>
          <p className="text-xs text-muted-foreground">Abiertas y cerradas</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Promedio por Sesión
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(averageSales)}
          </div>
          <p className="text-xs text-muted-foreground">Ventas / Sesiones</p>
        </CardContent>
      </Card>
    </div>
  );
}
