import { getProducts } from "@/actions/products";
import Error from "@/components/global-error";
import { CashRegisterManager } from "@/components/cash-register-manager";
import { POSPageContainer } from "@/components/pos-page-container";

export const dynamic = "force-dynamic";

export default async function POSPage() {
  try {
    const initialProducts = await getProducts();
    return (
      <div className="p-4">
        <POSPageContainer initialProducts={initialProducts} />
      </div>
    );
  } catch (error) {
    console.log(error);
    return Error;
  }
}
