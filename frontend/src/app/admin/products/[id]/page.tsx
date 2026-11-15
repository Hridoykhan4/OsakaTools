"use client";

import { use } from "react";
import ProductEditor from "@/components/admin/ProductEditor";
import { StateView, useLoad } from "@/components/admin/kit";
import { admin } from "@/lib/adminApi";
import type { Product } from "@/lib/types";

export default function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, error, loading } = useLoad(() => admin.get<{ product: Product }>(`/products/id/${id}`), [id]);
  return <StateView loading={loading} error={error}>{data && <ProductEditor key={data.product._id} product={data.product} />}</StateView>;
}
