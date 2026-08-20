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
// 重要：fileList 交给 antd 内部以 uid 追踪上传态，组件只维护 URL 列表并 append，避免受控 fileList
// 与 antd 内部上传态互相覆盖导致"上传一下就卡死"的问题。
export default function ImageUpload({ value, onChange, multiple = true, max = 9, hint }: ImageUploadProps) {
  const urls: string[] = Array.isArray(value) ? value : value ? [value] : [];

  // 把已有 URL 转换为 antd Upload 的 fileList（仅用于初次/受控回显；后续上传态由 antd 自管）
  const initialFileList: UploadFile[] = urls.map((u, i) => ({
    uid: `seed-${i}-${u.slice(-8)}`,
    name: `img-${i}.png`,
    status: "done",
    url: u,
  }));

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
    defaultFileList: initialFileList,
    multiple,
    accept: "image/*",
    beforeUpload,
    customRequest: async ({ file, onSuccess, onError }) => {
      try {
        const r = await uploadApi.upload(file as File);
        onSuccess?.(r);
        const nextUrls = [...urls, r.url];
        if (multiple) onChange?.(nextUrls);
        else onChange?.(r.url);
        message.success("图片上传成功");
      } catch (e) {
        message.error(`上传失败：${errMsg(e, "请检查网络或文件大小")}`);
        onError?.(e as Error);
      }
    },
    onRemove: (f) => {
      // 取自 f.url（已上传）或 f.response.url（刚成功）
      const removedUrl =
        (f.response as UploadResult | undefined)?.url ?? (f.url as string) ?? "";
      if (!removedUrl) return true;
      const next = urls.filter((u) => u !== removedUrl);
      if (multiple) onChange?.(next);
      else onChange?.("");
      return true;
    },
  };

  // 外部 value 与 defaultFileList 解耦：当 urls 因外部变化（如表单重置）变化时，重置 defaultFileList
  // 简单做法：每次 value 引用变化就重置（key 强制重挂载）。Form 中同一 Drawer 生命周期内 value 通常稳定。
  const resetKey = Array.isArray(value) ? value.join("|") : value || "";

  return (
    <div>
      <Upload {...props} key={resetKey}>
        {/* 上传按钮：始终显示（antd 自管 fileList 后，maxCount 行为由我们控制显示） */}
        {urls.length < (multiple ? max : 1) && (
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
