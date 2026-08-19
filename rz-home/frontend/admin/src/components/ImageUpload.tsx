import { Upload } from "antd";
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

// 图片上传组件：POST /api/admin/upload → 保存 /static/uploads/ 地址（多图存 JSON 数组，单图存字符串）
export default function ImageUpload({ value, onChange, multiple = true, max = 9, hint }: ImageUploadProps) {
  const urls: string[] = Array.isArray(value) ? value : value ? [value] : [];

  const fileList: UploadFile[] = urls.map((u, i) => ({
    uid: `-${i}`,
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

  const props: UploadProps = {
    listType: "picture-card",
    fileList,
    multiple,
    accept: "image/*",
    customRequest: async ({ file, onSuccess, onError }) => {
      try {
        const r = await uploadApi.upload(file as File);
        onSuccess?.(r);
      } catch (e) {
        onError?.(e as Error);
        // 上传失败提示
        // eslint-disable-next-line no-console
        console.error("upload failed", errMsg(e));
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
      {hint && <div style={{ fontSize: 12, color: "#8A7E72", marginTop: 4 }}>{hint}</div>}
    </div>
  );
}
