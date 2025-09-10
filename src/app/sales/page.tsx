"use client";

import { useEffect, useState } from "react";
import { SalesList } from "@/components/sales-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSalesByPosName } from "@/actions/sales";
import type { Sale } from "@/types/sale";

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [posName, setPosName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const name = localStorage.getItem("pos_name");
    setPosName(name);

    if (name) {
      getSalesByPosName(name)
        .then(setSales)
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">
        Historial de Ventas {posName ? `- ${posName}` : ""}
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>Ventas Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center py-8">Cargando ventas...</p>
          ) : (
            <SalesList sales={sales} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
