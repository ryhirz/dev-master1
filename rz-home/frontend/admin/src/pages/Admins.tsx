import { useMemo, useState } from "react";
import { Button, Modal, Form, Input, Select, Space, Table, Tag, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { adminApi, roleApi } from "../api";
import { errMsg } from "../api/client";
import { DeleteButton, PageHeader, StatusTag } from "../components/common";
import { useDelete, usePagedList } from "../hooks/useCrud";
import type { AdminListItem, RoleItem } from "../types";

// 管理员管理：CRUD + 改密 + 角色分配 + 启用/禁用（super_admin 可见）
export default function Admins() {
  const { data, loading, page, setPage, pageSize, setPageSize, reload } = usePagedList((p) =>
    adminApi.list(p),
  );
  const { data: roleData } = usePagedList((p) => roleApi.list({ ...p, page_size: 100 }), []);

  const roleOptions = useMemo(
    () => (roleData.items || []).map((r: RoleItem) => ({ value: r.id, label: r.name })),
    [roleData],
  );

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AdminListItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const del = useDelete((id) => adminApi.remove(id), reload);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ status: "active", role_id: undefined });
    setOpen(true);
  };
  const openEdit = (r: AdminListItem) => {
    setEditing(r);
    form.setFieldsValue({ username: r.username, display_name: r.display_name, role_id: r.role_id, status: r.status });
    setOpen(true);
  };

  const submit = async () => {
    const v = await form.validateFields();
    setSaving(true);
    try {
      if (editing) {
        await adminApi.update(editing.id, v);
      } else {
        await adminApi.create(v);
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

  const columns: ColumnsType<AdminListItem> = [
    { title: "ID", dataIndex: "id", width: 60 },
    { title: "账号", dataIndex: "username" },
    { title: "显示名", dataIndex: "display_name", render: (v: string | null) => v ?? "—" },
    { title: "角色", dataIndex: "role_name", render: (v: string | null) => (v ? <Tag color="geekblue">{v}</Tag> : "—") },
    { title: "状态", dataIndex: "status", width: 100, render: (s: string) => <StatusTag status={s} /> },
    {
      title: "最近登录",
      dataIndex: "last_login_at",
      width: 150,
      render: (v: string | null) => (v ? dayjs(v).format("MM-DD HH:mm") : "—"),
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
      <PageHeader title="管理员" subtitle="管理员 CRUD + 改密 + 角色分配（仅超级管理员）" onAdd={openCreate} />
      <Table<AdminListItem>
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
        title={editing ? "编辑管理员" : "新增管理员"}
        
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
          <Form.Item name="username" label="账号" rules={[{ required: true, message: "请输入账号" }]}>
            <Input maxLength={80} disabled={!!editing} />
          </Form.Item>
          <Form.Item
            name="password"
            label={editing ? "重置密码（留空则不修改）" : "初始密码"}
            rules={editing ? [] : [{ required: true, min: 6, message: "至少 6 位" }]}
          >
            <Input.Password placeholder={editing ? "留空不修改" : "至少 6 位"} autoComplete="new-password" />
          </Form.Item>
          <Form.Item name="display_name" label="显示名">
            <Input maxLength={120} />
          </Form.Item>
          <Form.Item name="role_id" label="角色" rules={[{ required: true, message: "请选择角色" }]}>
            <Select options={roleOptions} placeholder="选择角色" />
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
