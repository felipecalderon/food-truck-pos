import { getProducts } from "@/actions/products";
import ErrorComponent from "@/components/global-error";
import { PendingOrdersList } from "@/components/pending-orders-list";
import { POSPageContainer } from "@/components/pos-page-container";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function POSPage() {
  try {
    const initialProducts = await getProducts();
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
