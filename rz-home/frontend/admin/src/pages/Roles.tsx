import { useState } from "react";
import { Button, Checkbox, Modal, Form, Input, Space, Table, Tag, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { roleApi } from "../api";
import { errMsg } from "../api/client";
import { DeleteButton, PageHeader } from "../components/common";
import { useDelete, usePagedList } from "../hooks/useCrud";
import type { RoleItem } from "../types";

// 权限模块清单（对齐后端 require_role 的模块名，《开发技术文档》§4.7.D）
const PERM_MODULES: { key: string; label: string }[] = [
  { key: "product_series", label: "产品系列" },
  { key: "category", label: "产品分类" },
  { key: "product", label: "产品" },
  { key: "cases", label: "案例" },
  { key: "news", label: "新闻" },
  { key: "job", label: "招聘" },
  { key: "message", label: "留言" },
  { key: "banner", label: "轮播" },
  { key: "about_section", label: "关于区块" },
  { key: "company_info", label: "公司信息" },
  { key: "milestone", label: "里程碑" },
  { key: "admin_user", label: "管理员" },
  { key: "role", label: "角色权限" },
];

const ACTIONS = [
  { key: "read", label: "查看" },
  { key: "write", label: "编辑" },
];

// 角色权限管理：角色列表 + 模块×动作权限矩阵维护（super_admin 可见）
export default function Roles() {
  const { data, loading, page, setPage, pageSize, setPageSize, reload } = usePagedList((p) =>
    roleApi.list(p),
  );
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<RoleItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const del = useDelete((id) => roleApi.remove(id), reload, "删除成功（角色下存在管理员时将无法删除）");

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ permissions: {} });
    setOpen(true);
  };
  const openEdit = (r: RoleItem) => {
    setEditing(r);
    form.setFieldsValue({ name: r.name, permissions: r.permissions });
    setOpen(true);
  };

  const submit = async () => {
    const v = await form.validateFields();
    setSaving(true);
    try {
      if (editing) {
        await roleApi.update(editing.id, v);
      } else {
        await roleApi.create(v);
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

  const columns: ColumnsType<RoleItem> = [
    { title: "ID", dataIndex: "id", width: 60 },
    { title: "角色名", dataIndex: "name", render: (v: string) => <Tag color="geekblue">{v}</Tag> },
    {
      title: "模块权限数",
      width: 120,
      render: (_, r) => Object.keys(r.permissions || {}).length,
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
            编辑权限
          </Button>
          <DeleteButton onConfirm={() => del(r.id)} />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="角色权限" subtitle="角色与模块权限矩阵（仅超级管理员）" onAdd={openCreate} addText="新增角色" />
      <Table<RoleItem>
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
        title={editing ? `编辑角色：${editing.name}` : "新增角色"}
        
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
          <Form.Item name="name" label="角色名" rules={[{ required: true, message: "请输入角色名" }]}>
            <Input maxLength={80} placeholder="如：editor" disabled={!!editing} />
          </Form.Item>
          <Form.Item
            name="permissions"
            label="模块权限矩阵（勾选该模块可执行的动作）"
            valuePropName="value"
          >
            <PermissionMatrix />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

// 权限矩阵：模块 × 动作 Checkbox 网格，值为 Record<module, string[]>
function PermissionMatrix({ value, onChange }: { value?: Record<string, string[]>; onChange?: (v: Record<string, string[]>) => void }) {
  const perms: Record<string, string[]> = value ?? {};

  const toggle = (module: string, action: string, checked: boolean) => {
    const cur = perms[module] ?? [];
    const next = checked ? [...new Set([...cur, action])] : cur.filter((a) => a !== action);
    const merged = { ...perms };
    if (next.length) {
      merged[module] = next;
    } else {
      delete merged[module];
    }
    onChange?.(merged);
  };

  const toggleAll = (module: string, checked: boolean) => {
    const merged = { ...perms };
    if (checked) {
      merged[module] = ACTIONS.map((a) => a.key);
    } else {
      delete merged[module];
    }
    onChange?.(merged);
  };

  return (
    <div style={{ border: "1px solid #f0f0f0", borderRadius: 8, overflow: "hidden" }}>
      <div
        style={{
          display: "flex",
          padding: "6px 12px",
          background: "#FAFAFA",
          fontWeight: 600,
          borderBottom: "1px solid #f0f0f0",
        }}
      >
        <span style={{ flex: 1 }}>模块</span>
        <span style={{ width: 64, textAlign: "center" }}>查看</span>
        <span style={{ width: 64, textAlign: "center" }}>编辑</span>
      </div>
      {PERM_MODULES.map((m) => {
        const cur = perms[m.key] ?? [];
        return (
          <div
            key={m.key}
            style={{ display: "flex", padding: "8px 12px", borderBottom: "1px solid #f5f5f5", alignItems: "center" }}
          >
            <span style={{ flex: 1 }}>
              <Checkbox
                checked={cur.length === ACTIONS.length}
                indeterminate={cur.length > 0 && cur.length < ACTIONS.length}
                onChange={(e) => toggleAll(m.key, e.target.checked)}
              >
                {m.label}
              </Checkbox>
            </span>
            {ACTIONS.map((a) => (
              <span key={a.key} style={{ width: 64, textAlign: "center" }}>
                <Checkbox checked={cur.includes(a.key)} onChange={(e) => toggle(m.key, a.key, e.target.checked)} />
              </span>
            ))}
          </div>
        );
      })}
    </div>
  );
}
