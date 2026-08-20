import { Upload, message } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import type { UploadFile, UploadProps } from "antd";
import { uploadApi } from "../api";
import { errMsg } from "../api/client";
import type { UploadResult } from "../types";

interface ImageUploadProps {
  value?: string[] | string;
  onChange?: (v: string[] | string) => void;
  multiple?: boolean;
  max?: number;
  hint?: string;
}

const MAX_MB = 10; // 与后端 MAX_UPLOAD_MB 对齐

// 图片上传组件：POST /api/admin/upload → 保存 /static/uploads/ 地址（多图存 JSON 数组，单图存字符串）
export default function ImageUpload({ value, onChange, multiple = true, max = 9, hint }: ImageUploadProps) {
  const urls: string[] = Array.isArray(value) ? value : value ? [value] : [];

  const fileList: UploadFile[] = urls.map((u, i) => ({
    uid: `img-${i}`,
    name: `img-${i}`,
    status: "done",
    url: u,
  }));

  const emit = (list: UploadFile[]) => {
    const next = list
      .filter((f) => f.status === "done")
      .map((f) => (f.response as UploadResult | undefined)?.url ?? (f.url as string))
      .filter(Boolean);
    if (multiple) {
      onChange?.(next);
    } else {
      onChange?.(next[0] ?? "");
    }
  };

  const beforeUpload = (file: File) => {
    const isImage = file.type.startsWith("image/");
    if (!isImage) {
      message.error("仅支持图片文件（jpg/png/webp/gif）");
      return Upload.LIST_IGNORE;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      message.error(`图片不能超过 ${MAX_MB}MB`);
      return Upload.LIST_IGNORE;
    }
    return true;
  };

  const props: UploadProps = {
    listType: "picture-card",
    fileList,
    multiple,
    accept: "image/*",
    beforeUpload,
    customRequest: async ({ file, onSuccess, onError }) => {
      try {
        const r = await uploadApi.upload(file as File);
        onSuccess?.(r);
      } catch (e) {
        message.error(`上传失败：${errMsg(e, "请检查网络或文件大小")}`);
        onError?.(e as Error);
      }
    },
    onChange: ({ fileList: next }) => emit(next),
    onRemove: (f) => {
      const next = fileList.filter((x) => x.uid !== f.uid);
      emit(next);
    },
  };

  const showUpload = fileList.length < (multiple ? max : 1);

  return (
    <div>
      <Upload {...props}>
        {showUpload && (
          <div>
            <PlusOutlined />
            <div style={{ marginTop: 8 }}>上传</div>
          </div>
        )}
      </Upload>
      {hint && <div style={{ fontSize: 12, color: "#7A8CA3", marginTop: 4 }}>{hint}</div>}
    </div>
  );
}
