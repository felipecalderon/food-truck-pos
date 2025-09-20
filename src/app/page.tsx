import { getProducts } from "@/actions/products";
import Error from "@/components/global-error";
import { POSPageContainer } from "@/components/pos-page-container";

export const dynamic = "force-dynamic";

export default async function POSPage() {
  try {
    const initialProducts = await getProducts();
    return <POSPageContainer initialProducts={initialProducts} />;
  } catch (error) {
    console.log(error);
    return Error;
  }
}
