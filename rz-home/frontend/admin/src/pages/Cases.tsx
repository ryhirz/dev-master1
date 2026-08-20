import { useState } from "react";
import { Button, Modal, Form, Input, InputNumber, Select, Space, Switch, Table, Tag, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { caseApi } from "../api";
import { errMsg } from "../api/client";
import { DeleteButton, PageHeader, StatusTag } from "../components/common";
import ImageUpload from "../components/ImageUpload";
import { useDelete, usePagedList } from "../hooks/useCrud";
import type { CaseItem } from "../types";

const CATEGORY_OPTIONS = [
  { value: "住宅", label: "住宅" },
  { value: "工程", label: "工程" },
  { value: "商业", label: "商业" },
];

// 案例管理：CRUD（住宅/工程/商业分类）+ 多图上传 + is_new 标记
export default function Cases() {
  const [category, setCategory] = useState<string | undefined>();
  const { data, loading, page, setPage, pageSize, setPageSize, reload } = usePagedList(
    (p) => caseApi.list({ ...p, category }),
    [category],
  );
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CaseItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const del = useDelete((id) => caseApi.remove(id), reload);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ category: "住宅", sort_order: 0, status: "active", is_new: false });
    setOpen(true);
  };
  const openEdit = (r: CaseItem) => {
    setEditing(r);
    form.setFieldsValue(r);
    setOpen(true);
  };

  const submit = async () => {
    const v = await form.validateFields();
    setSaving(true);
    try {
      if (editing) {
        await caseApi.update(editing.id, v);
      } else {
        await caseApi.create(v);
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

  const columns: ColumnsType<CaseItem> = [
    { title: "ID", dataIndex: "id", width: 60 },
    {
      title: "案例",
      dataIndex: "title",
      render: (v: string, r) => (
        <Space direction="vertical" size={0}>
          <span>{v}</span>
          {r.is_new && <Tag color="volcano">NEW</Tag>}
        </Space>
      ),
    },
    { title: "分类", dataIndex: "category", width: 100, render: (v: string) => <Tag>{v}</Tag> },
    { title: "排序", dataIndex: "sort_order", width: 80 },
    { title: "状态", dataIndex: "status", width: 100, render: (s: string) => <StatusTag status={s} /> },
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
      <PageHeader title="案例" subtitle="案例 CRUD（住宅/工程/商业）" onAdd={openCreate} />
      <Space style={{ marginBottom: 16 }}>
        <Select
          allowClear
          placeholder="按分类筛选"
          style={{ width: 160 }}
          options={CATEGORY_OPTIONS}
          value={category}
          onChange={(v) => {
            setCategory(v);
            setPage(1);
          }}
        />
      </Space>
      <Table<CaseItem>
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
        title={editing ? "编辑案例" : "新增案例"}
        
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
          <Form.Item name="title" label="案例标题" rules={[{ required: true, message: "请输入案例标题" }]}>
            <Input maxLength={200} />
          </Form.Item>
          <Space size="large" style={{ display: "flex" }}>
            <Form.Item name="category" label="分类" style={{ flex: 1 }}>
              <Select options={CATEGORY_OPTIONS} />
            </Form.Item>
            <Form.Item name="sort_order" label="排序" style={{ flex: 1 }}>
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
          </Space>
          <Form.Item name="cover_image" label="封面图">
            <ImageUpload multiple={false} hint="建议 16:9" />
          </Form.Item>
          <Form.Item name="images" label="案例图集（多图，JSON 数组）">
            <ImageUpload multiple max={12} />
          </Form.Item>
          <Form.Item name="summary" label="摘要">
            <Input.TextArea rows={2} maxLength={300} />
          </Form.Item>
          <Form.Item name="content" label="详细内容">
            <Input.TextArea rows={5} />
          </Form.Item>
          <Space size="large">
            <Form.Item name="is_new" label="标记为 NEW" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item name="status" label="状态">
              <Select
                style={{ width: 160 }}
                options={[
                  { value: "active", label: "启用" },
                  { value: "disabled", label: "禁用" },
                ]}
              />
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </div>
  );
}
