import { redirect } from "next/navigation";
import {
  getFinalProductsFromMongo,
  getPOSFinalProducts,
} from "@/actions/mongo-products";
import ErrorComponent from "@/components/global-error";
import { PendingOrdersList } from "@/components/pending-orders-list";
import { POSPageContainer } from "@/components/pos-page-container";

export const dynamic = "force-dynamic";

export default async function POSPage() {
  try {
    const initialProducts = await getPOSFinalProducts();
    return (
      <div className="p-4 flex flex-col gap-8">
        <PendingOrdersList />
        <POSPageContainer initialProducts={initialProducts} />
      </div>
    );
  } catch (error) {
    console.log(error);
    return (
      <ErrorComponent error={error as Error} reset={() => redirect("/")} />
    );
  }
}
