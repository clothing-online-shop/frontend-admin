import { useState } from "react";
import { Button, Space, Upload, message } from "antd";
import type { UploadProps } from "antd";
import {
  DeleteOutlined,
  LeftOutlined,
  PlusOutlined,
  RightOutlined,
} from "@ant-design/icons";
import { deleteImage, uploadImage } from "@/lib/upload-api";

interface ImageUploaderProps {
  value: string[];
  onChange: (urls: string[]) => void;
  max?: number;
  label?: string;
}

export function ImageUploader({ value, onChange, max = 8, label }: ImageUploaderProps) {
  const [publicIds, setPublicIds] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);

  const customRequest: UploadProps["customRequest"] = async (options) => {
    const { file, onSuccess, onError } = options;
    setUploading(true);
    try {
      const result = await uploadImage(file as File);
      setPublicIds((prev) => ({ ...prev, [result.url]: result.publicId }));
      onChange([...value, result.url]);
      onSuccess?.(result);
    } catch (error) {
      message.error("Upload ảnh thất bại");
      onError?.(error as Error);
    } finally {
      setUploading(false);
    }
  };

  function handleRemove(url: string) {
    onChange(value.filter((v) => v !== url));
    const publicId = publicIds[url];
    if (publicId) {
      deleteImage(publicId).catch(() => undefined);
    }
  }

  function moveImage(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <div>
      {label ? <div style={{ marginBottom: 8, fontWeight: 500 }}>{label}</div> : null}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
        {value.map((url, index) => (
          <div
            key={url}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}
          >
            <div
              style={{
                width: 96,
                height: 96,
                borderRadius: 8,
                overflow: "hidden",
                border: "1px solid #e5e3dd",
              }}
            >
              <img
                src={url}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
            <Space size={4}>
              <Button
                size="small"
                icon={<LeftOutlined />}
                disabled={index === 0}
                onClick={() => moveImage(index, -1)}
              />
              <Button
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleRemove(url)}
              />
              <Button
                size="small"
                icon={<RightOutlined />}
                disabled={index === value.length - 1}
                onClick={() => moveImage(index, 1)}
              />
            </Space>
          </div>
        ))}
        {value.length < max ? (
          <Upload
            accept="image/png,image/jpeg,image/webp,image/jpg"
            showUploadList={false}
            customRequest={customRequest}
            multiple={max > 1}
          >
            <Button icon={<PlusOutlined />} loading={uploading} style={{ width: 96, height: 96 }}>
              Tải ảnh
            </Button>
          </Upload>
        ) : null}
      </div>
    </div>
  );
}
