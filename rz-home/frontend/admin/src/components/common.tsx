import type { ReactNode } from "react";
import { Button, Popconfirm, Space, Tag, Typography } from "antd";
import { PlusOutlined } from "@ant-design/icons";

const { Title } = Typography;

// ===== 状态标签（对齐后端 status 枚举值） =====
export const STATUS_LABEL: Record<string, string> = {
  active: "启用",
  disabled: "禁用",
  draft: "草稿",
  published: "已发布",
  new: "新留言",
  handled: "已处理",
  ignored: "已忽略",
  social: "社会招聘",
  campus: "校园招聘",
  company: "企业新闻",
  industry: "行业资讯",
  residential: "住宅",
  engineering: "工程",
  commercial: "商业",
};

const STATUS_COLOR: Record<string, string> = {
  active: "green",
  disabled: "red",
  draft: "default",
  published: "blue",
  new: "orange",
  handled: "green",
  ignored: "default",
};

export function StatusTag({ status }: { status: string }) {
  const label = STATUS_LABEL[status] ?? status;
  return <Tag color={STATUS_COLOR[status]}>{label}</Tag>;
}

// ===== 页面头部：标题 + 右侧操作区（如"新增"） =====
export function PageHeader({
  title,
  subtitle,
  onAdd,
  addText = "新增",
  extra,
}: {
  title: string;
  subtitle?: string;
  onAdd?: () => void;
  addText?: string;
  extra?: ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
        flexWrap: "wrap",
        gap: 8,
      }}
    >
      <div>
        <Title level={4} style={{ margin: 0, color: "#0E2A4A" }}>
          {title}
        </Title>
        {subtitle && <span style={{ color: "#7A8CA3", fontSize: 13 }}>{subtitle}</span>}
      </div>
      <Space>
        {extra}
        {onAdd && (
          <Button type="primary" icon={<PlusOutlined />} onClick={onAdd}>
            {addText}
          </Button>
        )}
      </Space>
    </div>
  );
}

// ===== 删除按钮（Popconfirm 二次确认） =====
export function DeleteButton({
  onConfirm,
  title = "确定删除该记录吗？",
  okText = "删除",
}: {
  onConfirm: () => void;
  title?: string;
  okText?: string;
}) {
  return (
    <Popconfirm title={title} okText={okText} okButtonProps={{ danger: true }} cancelText="取消" onConfirm={onConfirm}>
      <Button type="link" danger size="small">
        删除
      </Button>
    </Popconfirm>
  );
}
