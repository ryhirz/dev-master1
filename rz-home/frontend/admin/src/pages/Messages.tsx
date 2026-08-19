import { useState } from "react";
import { Button, Drawer, Form, Input, Select, Space, Table, Tag, Typography, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { messageApi } from "../api";
import { errMsg } from "../api/client";
import { DeleteButton, PageHeader, StatusTag } from "../components/common";
import { useDelete, usePagedList } from "../hooks/useCrud";
import type { MessageItem } from "../types";

const { Paragraph, Text } = Typography;

const TYPE_LABEL: Record<string, string> = {
  contact: "在线留言",
  job_application: "求职意向",
};

// 留言管理：留言/求职意向列表 + 回复/状态变更 + 删除（对齐 prototype_admin.html）
export default function Messages() {
  const [type, setType] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const { data, loading, page, setPage, pageSize, setPageSize, reload } = usePagedList(
    (p) => messageApi.list({ ...p, type, status: statusFilter }),
    [type, statusFilter],
  );
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<MessageItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const del = useDelete((id) => messageApi.remove(id), reload);

  const openReply = (r: MessageItem) => {
    setCurrent(r);
    form.setFieldsValue({ status: r.status, reply: r.reply ?? "" });
    setOpen(true);
  };

  const submit = async () => {
    if (!current) return;
    const v = await form.validateFields();
    setSaving(true);
    try {
      await messageApi.update(current.id, v);
      message.success("已保存");
      setOpen(false);
      reload();
    } catch (e) {
      message.error(errMsg(e, "保存失败"));
    } finally {
      setSaving(false);
    }
  };

  const columns: ColumnsType<MessageItem> = [
    { title: "ID", dataIndex: "id", width: 60 },
    { title: "类型", dataIndex: "type", width: 100, render: (v: string) => <Tag color={v === "job_application" ? "purple" : "blue"}>{TYPE_LABEL[v] ?? v}</Tag> },
    { title: "姓名", dataIndex: "name", width: 90 },
    { title: "电话", dataIndex: "phone", width: 130 },
    { title: "关联职位", dataIndex: "job_title", width: 120, render: (v: string | null) => v ?? "—" },
    {
      title: "内容",
      dataIndex: "content",
      ellipsis: true,
      render: (v: string) => <Text style={{ maxWidth: 260 }} ellipsis={{ tooltip: v }}>{v}</Text>,
    },
    { title: "状态", dataIndex: "status", width: 90, render: (s: string) => <StatusTag status={s} /> },
    {
      title: "时间",
      dataIndex: "created_at",
      width: 140,
      render: (v: string) => (v ? dayjs(v).format("MM-DD HH:mm") : "—"),
    },
    {
      title: "操作",
      width: 140,
      render: (_, r) => (
        <Space>
          <Button type="link" size="small" onClick={() => openReply(r)}>
            处理/回复
          </Button>
          <DeleteButton onConfirm={() => del(r.id)} />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="留言管理" subtitle="留言/求职意向 回复 · 状态 · 删除" />
      <Space style={{ marginBottom: 16 }}>
        <Select
          allowClear
          placeholder="按类型筛选"
          style={{ width: 150 }}
          options={[
            { value: "contact", label: "在线留言" },
            { value: "job_application", label: "求职意向" },
          ]}
          value={type}
          onChange={(v) => {
            setType(v);
            setPage(1);
          }}
        />
        <Select
          allowClear
          placeholder="按状态筛选"
          style={{ width: 150 }}
          options={[
            { value: "new", label: "新留言" },
            { value: "handled", label: "已处理" },
            { value: "ignored", label: "已忽略" },
          ]}
          value={statusFilter}
          onChange={(v) => {
            setStatusFilter(v);
            setPage(1);
          }}
        />
      </Space>
      <Table<MessageItem>
        rowKey="id"
        columns={columns}
        dataSource={data.items}
        loading={loading}
        pagination={{
          current: page,
          pageSize,
          total: data.total,
          showSizeChanger: true,
          onChange: (p, ps) => {
            setPage(p);
            setPageSize(ps);
          },
        }}
      />
      <Drawer
        title={`处理留言 #${current?.id ?? ""}`}
        width={520}
        open={open}
        onClose={() => setOpen(false)}
        extra={
          <Space>
            <Button onClick={() => setOpen(false)}>取消</Button>
            <Button type="primary" loading={saving} onClick={submit}>
              保存
            </Button>
          </Space>
        }
      >
        {current && (
          <div style={{ marginBottom: 16, padding: 12, background: "#FAF7F2", borderRadius: 8 }}>
            <Paragraph style={{ margin: 0 }}>
              <b>{current.name}</b>（{current.phone}）
              {current.email ? ` · ${current.email}` : ""}
              <Tag style={{ marginLeft: 8 }}>{TYPE_LABEL[current.type] ?? current.type}</Tag>
            </Paragraph>
            {current.job_title && <Text type="secondary">意向职位：{current.job_title}</Text>}
            <Paragraph style={{ marginTop: 8, marginBottom: 0 }}>{current.content}</Paragraph>
          </div>
        )}
        <Form form={form} layout="vertical" requiredMark={false}>
          <Form.Item name="status" label="处理状态">
            <Select
              options={[
                { value: "new", label: "新留言" },
                { value: "handled", label: "已处理" },
                { value: "ignored", label: "已忽略" },
              ]}
            />
          </Form.Item>
          <Form.Item name="reply" label="回复内容">
            <Input.TextArea rows={4} placeholder="输入回复内容…" />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}
