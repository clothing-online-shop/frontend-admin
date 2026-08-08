import { Controller, useFormContext } from "react-hook-form";
import type { ProductFormValues } from "@/schemas/product.schema";
import ComponentCard from "@/components/common/ComponentCard";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import FieldLabel from "@/components/form/FieldLabel";

export function ProductSeoStep() {
  const { register, control } = useFormContext<ProductFormValues>();

  return (
    <ComponentCard
      title="SEO"
      desc="Thông tin hiển thị trên kết quả tìm kiếm và khi chia sẻ link sản phẩm"
    >
      <div>
        <Input
          label="Meta title"
          placeholder="Bỏ trống để dùng tên sản phẩm"
          {...register("metaTitle")}
        />
      </div>
      <div>
        <FieldLabel label="Meta description" />
        <Controller
          name="metaDescription"
          control={control}
          render={({ field }) => (
            <TextArea
              rows={4}
              placeholder="Mô tả ngắn gọn hiển thị trên kết quả tìm kiếm"
              value={field.value ?? ""}
              onChange={field.onChange}
            />
          )}
        />
      </div>
    </ComponentCard>
  );
}
