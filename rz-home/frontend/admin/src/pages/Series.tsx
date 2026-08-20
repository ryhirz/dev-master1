import { useState } from "react";
import { Button, Modal, Form, Input, InputNumber, Select, Space, Table, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { seriesApi } from "../api";
import { errMsg } from "../api/client";
import { DeleteButton, PageHeader, StatusTag } from "../components/common";
import ImageUpload from "../components/ImageUpload";
import { useDelete, usePagedList } from "../hooks/useCrud";
import type { SeriesItem } from "../types";

// 产品系列管理：通用 CRUD（Table + 分页 + Modal 表单），对齐 prototype_admin.html 通用 CRUD 结构
export default function Series() {
  const { data, loading, page, setPage, pageSize, setPageSize, reload } = usePagedList((p) =>
    seriesApi.list(p),
  );
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<SeriesItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const del = useDelete((id) => seriesApi.remove(id), reload);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ sort_order: 0, status: "active" });
    setOpen(true);
  };
  const openEdit = (r: SeriesItem) => {
    setEditing(r);
    form.setFieldsValue(r);
    setOpen(true);
  };

  const submit = async () => {
    const v = await form.validateFields();
    setSaving(true);
    try {
      if (editing) {
        await seriesApi.update(editing.id, v);
      } else {
        await seriesApi.create(v);
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

  const columns: ColumnsType<SeriesItem> = [
    { title: "ID", dataIndex: "id", width: 60 },
    { title: "系列名称", dataIndex: "name" },
    { title: "Slug", dataIndex: "slug" },
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
      <PageHeader title="产品系列" subtitle="产品系列维护（前台产品分组）" onAdd={openCreate} />
      <Table<SeriesItem>
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
        title={editing ? "编辑系列" : "新增系列"}
        
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
          <Form.Item name="name" label="系列名称" rules={[{ required: true, message: "请输入系列名称" }]}>
            <Input maxLength={120} placeholder="如：原木客厅系列" />
          </Form.Item>
          <Form.Item name="slug" label="Slug" rules={[{ required: true, message: "请输入 slug" }]}>
            <Input maxLength={160} placeholder="如：oak-living" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} maxLength={500} />
          </Form.Item>
          <Form.Item name="cover_image" label="封面图">
            <ImageUpload multiple={false} hint="建议 16:9，上传后自动存入静态目录" />
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
      </Modal>
    </div>
  );
}
