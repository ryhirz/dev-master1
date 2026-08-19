import { useMemo, useState } from "react";
import { Button, Drawer, Form, Input, InputNumber, Select, Space, Table, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { categoryApi } from "../api";
import { errMsg } from "../api/client";
import { DeleteButton, PageHeader, StatusTag } from "../components/common";
import { useDelete, usePagedList } from "../hooks/useCrud";
import type { CategoryItem } from "../types";

// 产品分类管理：自引用 parent_id 树形分类（列表平铺展示父级名，表单可选择上级）
export default function Categories() {
  const { data, loading, page, setPage, pageSize, setPageSize, reload } = usePagedList((p) =>
    categoryApi.list(p),
  );
  // 全量分类（用于上级下拉）：拉大分页
  const { data: allData } = usePagedList((p) => categoryApi.list({ ...p, page_size: 100 }), []);

  const parentOptions = useMemo(
    () =>
      (allData.items || []).map((c) => ({
        value: c.id,
        label: c.parent_id ? `${c.parent_name ?? ""} / ${c.name}` : c.name,
      })),
    [allData],
  );

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const del = useDelete((id) => categoryApi.remove(id), reload);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ sort_order: 0, status: "active", parent_id: undefined });
    setOpen(true);
  };
  const openEdit = (r: CategoryItem) => {
    setEditing(r);
    form.setFieldsValue(r);
    setOpen(true);
  };

  const submit = async () => {
    const v = await form.validateFields();
    setSaving(true);
    try {
      if (editing) {
        await categoryApi.update(editing.id, v);
      } else {
        await categoryApi.create(v);
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

  const columns: ColumnsType<CategoryItem> = [
    { title: "ID", dataIndex: "id", width: 60 },
    { title: "分类名称", dataIndex: "name" },
    { title: "上级分类", dataIndex: "parent_name", render: (v: string | null) => v ?? "—" },
    { title: "Slug", dataIndex: "slug" },
    { title: "排序", dataIndex: "sort_order", width: 80 },
    { title: "状态", dataIndex: "status", width: 100, render: (s: string) => <StatusTag status={s} /> },
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
      <PageHeader title="产品分类" subtitle="自引用 parent_id 树形分类" onAdd={openCreate} />
      <Table<CategoryItem>
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
        title={editing ? "编辑分类" : "新增分类"}
        width={480}
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
        <Form form={form} layout="vertical" requiredMark={false}>
          <Form.Item name="name" label="分类名称" rules={[{ required: true, message: "请输入分类名称" }]}>
            <Input maxLength={120} placeholder="如：客厅家具" />
          </Form.Item>
          <Form.Item name="slug" label="Slug" rules={[{ required: true, message: "请输入 slug" }]}>
            <Input maxLength={160} placeholder="如：living-room" />
          </Form.Item>
          <Form.Item name="parent_id" label="上级分类">
            <Select
              allowClear
              placeholder="无（顶级分类）"
              options={parentOptions.filter((o) => o.value !== editing?.id)}
            />
          </Form.Item>
          <Form.Item name="sort_order" label="排序（越小越靠前）">
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select
              options={[
                { value: "active", label: "启用" },
                { value: "disabled", label: "禁用" },
              ]}
            />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}
