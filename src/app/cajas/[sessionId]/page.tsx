import React from "react";
import { getSessionDetails } from "@/actions/cash-register";
import { SalesList } from "@/components/sales-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { notFound } from "next/navigation";
import { formatCurrency, formatDate } from "@/lib/utils";
import { TopProductsCard } from "@/components/top-products-card";
import {
  calculateSalesByPaymentMethod,
  getTopSoldProducts,
} from "@/lib/caja-utils";

export default async function SessionDetailsPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId: encodedSessionId } = await params;
  const sessionId = decodeURIComponent(encodedSessionId);
  const { session, sales } = await getSessionDetails(sessionId);

  if (!session) {
    notFound();
  }

  const salesByPaymentMethod = calculateSalesByPaymentMethod(sales);
  const totalSales = sales.reduce((acc, sale) => acc + sale.total, 0);
  const topProducts = getTopSoldProducts(sales);

  const saleDiff = () => {
    const totalCounted = session.closingBalance ?? 0;
    const totalCash = session.openingBalance + salesByPaymentMethod.cash;
    const diff = totalCounted - totalCash;
    return diff;
  };

  return (
    <div className="container mx-auto py-10 px-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">
          Detalle de Caja: {session.posName}
        </h1>
        <p className="text-gray-500">ID de Sesión: {session.id}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Columna 1: Apertura y Cierre */}
        <div className="space-y-6">
          <Card className="bg-amber-50">
            <CardHeader>
              <CardTitle>Apertura de Caja</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-500">Fecha</p>
                <p className="font-semibold">
                  {formatDate(new Date(session.openedAt).toISOString())}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Saldo Inicial
                </p>
                <p className="font-semibold text-lg">
                  {formatCurrency(session.openingBalance)}
                </p>
              </div>
            </CardContent>
          </Card>

          {session.status === "CLOSED" && (
            <Card className="bg-orange-50">
              <CardHeader>
                <CardTitle>Cierre de Caja</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-500">Fecha</p>
                  <p className="font-semibold">
                    {session.closedAt
                      ? formatDate(new Date(session.closedAt).toISOString())
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Saldo Final Contado
                  </p>
                  <p className="font-semibold text-lg">
                    {session.closingBalance
                      ? formatCurrency(session.closingBalance)
                      : "N/A"}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Columna 2: Resumen de Ventas */}
        <div className="space-y-6">
          <Card className="bg-fuchsia-50">
            <CardHeader>
              <CardTitle>Resumen de Ventas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="font-medium">Ventas en Efectivo</p>
                <p className="font-semibold">
                  {formatCurrency(salesByPaymentMethod.cash)}
                </p>
              </div>
              <div className="flex justify-between items-center">
                <p className="font-medium">Ventas con Débito</p>
                <p className="font-semibold">
                  {formatCurrency(salesByPaymentMethod.debit)}
                </p>
              </div>
              <div className="flex justify-between items-center">
                <p className="font-medium">Ventas con Crédito</p>
                <p className="font-semibold">
                  {formatCurrency(salesByPaymentMethod.credit)}
                </p>
              </div>
              <hr className="my-2" />
              <div className="flex justify-between items-center text-lg">
                <p className="font-bold">Total de Ventas</p>
                <p className="font-bold">{formatCurrency(totalSales)}</p>
              </div>
            </CardContent>
          </Card>
          <TopProductsCard products={topProducts} />
        </div>

        {/* Columna 3: Balance Final */}
        {session.status === "CLOSED" ? (
          <Card className="bg-green-50">
            <CardHeader>
              <CardTitle>Balance Final</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <p>Saldo Inicial</p>
                <p>{formatCurrency(session.openingBalance)}</p>
              </div>
              <div className="flex justify-between">
                <p>+ Ventas en Efectivo</p>
                <p>{formatCurrency(salesByPaymentMethod.cash)}</p>
              </div>
              <hr />
              <div className="flex justify-between font-semibold">
                <p>Total Esperado en Caja</p>
                <p>
                  {formatCurrency(
                    session.openingBalance + salesByPaymentMethod.cash
                  )}
                </p>
              </div>
              <div className="flex justify-between">
                <p>Saldo Final Contado</p>
                <p>{formatCurrency(session.closingBalance ?? 0)}</p>
              </div>
              <hr />
              <div className="flex justify-between font-bold text-xl">
                <p>Diferencia</p>
                <p
                  className={
                    saleDiff() < 0 ? "text-red-500" : "text-green-700"
                  }
                >
                  {formatCurrency(saleDiff())}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-red-100">
            <CardHeader>
              <CardTitle>Balance Final</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between font-semibold">
                <p>Información importante</p>
              </div>
              <hr />
              <div className="flex justify-between font-bold text-xl">
                <p>
                  Esta caja aún esta abierta, si olvidó cerrarla avise al
                  encargado de inmediato.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="px-6">
        <h2 className="text-2xl font-bold">Lista de productos vendidos:</h2>
        <SalesList sales={sales} />
      </div>
    </div>
  );
}
