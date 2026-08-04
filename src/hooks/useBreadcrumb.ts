import { useEffect } from "react";
import { useBreadcrumbStore } from "@/store/breadcrumb-store";
import type { BreadcrumbItem } from "@/store/breadcrumb-store";

export function useBreadcrumb(items: BreadcrumbItem[]) {
  const setBreadcrumb = useBreadcrumbStore((state) => state.setBreadcrumb);
  const key = JSON.stringify(items);

  useEffect(() => {
    setBreadcrumb(items);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, setBreadcrumb]);
}
