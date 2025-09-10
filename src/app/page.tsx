import { getProducts } from "@/actions/products";
import { POSPageContainer } from "@/components/pos-page-container";

export const dynamic = "force-dynamic";

export default async function POSPage() {
  const initialProducts = await getProducts();

  return <POSPageContainer initialProducts={initialProducts} />;
}
