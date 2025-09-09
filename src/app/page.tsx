import { getProducts } from "@/app/actions/products";
import { POSPageContainer } from "@/app/pos/components/pos-page-container";

export default async function POSPage() {
  const initialProducts = await getProducts();

  return (
    <POSPageContainer initialProducts={initialProducts} />
  );
}