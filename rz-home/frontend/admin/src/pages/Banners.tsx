import { useState } from "react";
import { Button, Modal, Form, Input, InputNumber, Select, Space, Table, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { bannerApi } from "../api";
import { errMsg } from "../api/client";
import { DeleteButton, PageHeader, StatusTag } from "../components/common";
import ImageUpload from "../components/ImageUpload";
import { useDelete, usePagedList } from "../hooks/useCrud";
import type { BannerItem } from "../types";

// 轮播管理：首页轮播 CRUD（启用/排序），对齐 prototype_admin.html
export default function Banners() {
  const { data, loading, page, setPage, pageSize, setPageSize, reload } = usePagedList((p) =>
    bannerApi.list(p),
  );
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<BannerItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const del = useDelete((id) => bannerApi.remove(id), reload);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ sort_order: 0, status: "active" });
    setOpen(true);
  };
  const openEdit = (r: BannerItem) => {
    setEditing(r);
    form.setFieldsValue(r);
    setOpen(true);
  };

  const submit = async () => {
    const v = await form.validateFields();
    setSaving(true);
    try {
      if (editing) {
        await bannerApi.update(editing.id, v);
      } else {
        await bannerApi.create(v);
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

  const columns: ColumnsType<BannerItem> = [
    { title: "ID", dataIndex: "id", width: 60 },
    {
      title: "图片",
      dataIndex: "image",
      width: 140,
      render: (v: string) =>
        v ? <img src={v} alt="" style={{ width: 96, height: 48, objectFit: "cover", borderRadius: 6 }} /> : "—",
    },
    { title: "标题", dataIndex: "title" },
    { title: "链接", dataIndex: "link_url", ellipsis: true, render: (v: string | null) => v ?? "—" },
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
      <PageHeader title="轮播管理" subtitle="首页 Hero 轮播（启用/排序）" onAdd={openCreate} />
      <Table<BannerItem>
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
        title={editing ? "编辑轮播" : "新增轮播"}
        
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
          <Form.Item name="title" label="标题" rules={[{ required: true, message: "请输入标题" }]}>
            <Input maxLength={200} />
          </Form.Item>
          <Form.Item name="image" label="轮播图" rules={[{ required: true, message: "请上传轮播图" }]}>
            <ImageUpload multiple={false} hint="建议 1920×720 宽幅图" />
          </Form.Item>
          <Form.Item name="link_url" label="跳转链接">
            <Input maxLength={512} placeholder="如：/products/1 或 https://…" />
          </Form.Item>
          <Space size="large" style={{ display: "flex" }}>
            <Form.Item name="sort_order" label="排序" style={{ flex: 1 }}>
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item name="status" label="状态" style={{ flex: 1 }}>
              <Select
                options={[
                  { value: "active", label: "启用" },
                  { value: "disabled", label: "停用" },
                ]}
              />
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </div>
  );
}
