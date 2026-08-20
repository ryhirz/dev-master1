import { useState } from "react";
import { Button, DatePicker, Modal, Form, Input, Select, Space, Switch, Table, Tag, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { newsApi } from "../api";
import { errMsg } from "../api/client";
import { DeleteButton, PageHeader, StatusTag } from "../components/common";
import ImageUpload from "../components/ImageUpload";
import RichTextEditor from "../components/RichTextEditor";
import { useDelete, usePagedList } from "../hooks/useCrud";
import type { NewsItem } from "../types";

const CATEGORY_OPTIONS = [
  { value: "company", label: "企业新闻" },
  { value: "industry", label: "行业资讯" },
];

// 新闻管理：CRUD + Tiptap 富文本（入库后端 bleach 净化）
export default function News() {
  const [category, setCategory] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const { data, loading, page, setPage, pageSize, setPageSize, reload } = usePagedList(
    (p) => newsApi.list({ ...p, category, status: statusFilter }),
    [category, statusFilter],
  );
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<NewsItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const del = useDelete((id) => newsApi.remove(id), reload);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ category: "company", status: "draft", is_top: false });
    setOpen(true);
  };
  const openEdit = (r: NewsItem) => {
    setEditing(r);
    form.setFieldsValue({
      ...r,
      published_at: r.published_at ? dayjs(r.published_at) : null,
    });
    setOpen(true);
  };

  const submit = async () => {
    const v = await form.validateFields();
    const payload = {
      ...v,
      published_at: v.published_at ? (v.published_at as dayjs.Dayjs).toISOString() : null,
    };
    setSaving(true);
    try {
      if (editing) {
        await newsApi.update(editing.id, payload);
      } else {
        await newsApi.create(payload);
      }
      message.success("保存成功");
      setOpen(false);
      reload();
    } catch (e) {
      message.error(errMsg(e, "保存失败"));
    } finally {
      setSaving(false);
    }
  };

  const columns: ColumnsType<NewsItem> = [
    { title: "ID", dataIndex: "id", width: 60 },
    {
      title: "标题",
      dataIndex: "title",
      render: (v: string, r) => (
        <Space direction="vertical" size={0}>
          <span>{v}</span>
          {r.is_top && <Tag color="gold">置顶</Tag>}
        </Space>
      ),
    },
    { title: "分类", dataIndex: "category", width: 100, render: (v: string) => <Tag>{CATEGORY_OPTIONS.find((c) => c.value === v)?.label ?? v}</Tag> },
    { title: "作者", dataIndex: "author", width: 100, render: (v: string | null) => v ?? "—" },
    { title: "发布状态", dataIndex: "status", width: 100, render: (s: string) => <StatusTag status={s} /> },
    {
      title: "发布时间",
      dataIndex: "published_at",
      width: 160,
      render: (v: string | null) => (v ? dayjs(v).format("YYYY-MM-DD HH:mm") : "—"),
    },
    {
      title: "修改时间",
      dataIndex: "updated_at",
      width: 170,
      render: (v: string | undefined) => (v ? v.slice(0, 16).replace("T", " ") : "—"),
    },
    {
      title: "操作",
      width: 140,
      render: (_, r) => (
        <Space>
          <Button type="link" size="small" onClick={() => openEdit(r)}>
            编辑
          </Button>
          <DeleteButton onConfirm={() => del(r.id)} />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="新闻" subtitle="新闻 CRUD + Tiptap 富文本（入库净化）" onAdd={openCreate} />
      <Space style={{ marginBottom: 16 }}>
        <Select
          allowClear
          placeholder="按分类筛选"
          style={{ width: 150 }}
          options={CATEGORY_OPTIONS}
          value={category}
          onChange={(v) => {
            setCategory(v);
            setPage(1);
          }}
        />
        <Select
          allowClear
          placeholder="按状态筛选"
          style={{ width: 150 }}
          options={[
            { value: "draft", label: "草稿" },
            { value: "published", label: "已发布" },
          ]}
          value={statusFilter}
          onChange={(v) => {
            setStatusFilter(v);
            setPage(1);
          }}
        />
      </Space>
      <Table<NewsItem>
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
      <Modal
        title={editing ? "编辑新闻" : "新增新闻"}
        
        open={open}
        onCancel={() => setOpen(false)}
        footer={
          <Space>
            <Button onClick={() => setOpen(false)}>取消</Button>
            <Button type="primary" loading={saving} onClick={submit}>
              保存
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical" requiredMark={false}>
          <Form.Item name="title" label="新闻标题" rules={[{ required: true, message: "请输入新闻标题" }]}>
            <Input maxLength={200} />
          </Form.Item>
          <Space size="large" style={{ display: "flex" }}>
            <Form.Item name="category" label="分类" style={{ flex: 1 }}>
              <Select options={CATEGORY_OPTIONS} />
            </Form.Item>
            <Form.Item name="author" label="作者" style={{ flex: 1 }}>
              <Input maxLength={80} />
            </Form.Item>
          </Space>
          <Space size="large" style={{ display: "flex" }}>
            <Form.Item name="status" label="状态" style={{ flex: 1 }}>
              <Select
                options={[
                  { value: "draft", label: "草稿" },
                  { value: "published", label: "已发布" },
                ]}
              />
            </Form.Item>
            <Form.Item name="published_at" label="发布时间" style={{ flex: 1 }}>
              <DatePicker showTime style={{ width: "100%" }} placeholder="选择发布时间" />
            </Form.Item>
          </Space>
          <Form.Item name="cover_image" label="封面图">
            <ImageUpload multiple={false} hint="建议 16:9" />
          </Form.Item>
          <Form.Item name="summary" label="摘要">
            <Input.TextArea rows={2} maxLength={300} />
          </Form.Item>
          <Form.Item name="content" label="正文（富文本）">
            <RichTextEditor />
          </Form.Item>
          <Form.Item name="is_top" label="置顶" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
