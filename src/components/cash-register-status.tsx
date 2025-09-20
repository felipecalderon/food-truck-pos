import { getCurrentSession } from "@/actions/cash-register";
import { Badge } from "./ui/badge";

export async function CashRegisterStatus() {
  const session = await getCurrentSession();

  if (!session || session.status === "CLOSED") {
    return <Badge variant="destructive">Caja Cerrada</Badge>;
  }

  const formattedBalance = new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
  }).format(session.openingBalance);

  return (
    <Badge variant="secondary">
      Caja Abierta | Saldo Inicial: {formattedBalance}
    </Badge>
  );
}
