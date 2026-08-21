import { useState } from "react";
import { Button, DatePicker, Modal, Form, Input, InputNumber, Select, Space, Table, Tag, Tabs, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { jobApi } from "../api";
import { errMsg } from "../api/client";
import { DeleteButton, PageHeader, StatusTag } from "../components/common";
import { useDelete, usePagedList } from "../hooks/useCrud";
import type { JobItem } from "../types";

const TYPE_LABEL: Record<string, string> = { social: "社会招聘", campus: "校园招聘" };

// 招聘管理：社会/校园 Tab + CRUD
export default function Jobs() {
  const [type, setType] = useState<string | undefined>();
  const { data, loading, page, setPage, pageSize, setPageSize, reload } = usePagedList(
    (p) => jobApi.list({ ...p, type }),
    [type],
  );
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<JobItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const del = useDelete((id) => jobApi.remove(id), reload);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ type: type ?? "social", status: "active", headcount: 1 });
    setOpen(true);
  };
  const openEdit = (r: JobItem) => {
    setEditing(r);
    form.setFieldsValue({ ...r, publish_at: r.publish_at ? dayjs(r.publish_at) : null });
    setOpen(true);
  };

  const submit = async () => {
    const v = await form.validateFields();
    const payload = {
      ...v,
      publish_at: v.publish_at ? (v.publish_at as dayjs.Dayjs).toISOString() : null,
      headcount: v.headcount ?? null,
    };
    setSaving(true);
    try {
      if (editing) {
        await jobApi.update(editing.id, payload);
      } else {
        await jobApi.create(payload);
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

  const columns: ColumnsType<JobItem> = [
    { title: "ID", dataIndex: "id", width: 60 },
    {
      title: "职位",
      dataIndex: "title",
      render: (v: string, r) => (
        <Space direction="vertical" size={0}>
          <span>{v}</span>
          <span style={{ color: "#7A8CA3", fontSize: 12 }}>
            {r.department ?? "—"} · {r.city ?? "—"} · {r.salary ?? "面议"}
          </span>
        </Space>
      ),
    },
    { title: "类型", dataIndex: "type", width: 100, render: (v: string) => <Tag color={v === "campus" ? "purple" : "blue"}>{TYPE_LABEL[v] ?? v}</Tag> },
    { title: "人数", dataIndex: "headcount", width: 70, render: (v: number | null) => v ?? "—" },
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
      <PageHeader title="招聘管理" subtitle="职位 CRUD（社会/校园）" onAdd={openCreate} />
      <Tabs
        style={{ marginBottom: 8 }}
        activeKey={type ?? "all"}
        onChange={(k) => {
          setType(k === "all" ? undefined : k);
          setPage(1);
        }}
        items={[
          { key: "all", label: "全部" },
          { key: "social", label: "社会招聘" },
          { key: "campus", label: "校园招聘" },
        ]}
      />
      <Table<JobItem>
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
      <Modal centered
        title={editing ? "编辑职位" : "新增职位"}
        
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
          <Space size="large" style={{ display: "flex" }}>
            <Form.Item name="type" label="类型" style={{ flex: 1 }}>
              <Select
                options={[
                  { value: "social", label: "社会招聘" },
                  { value: "campus", label: "校园招聘" },
                ]}
              />
            </Form.Item>
            <Form.Item name="status" label="状态" style={{ flex: 1 }}>
              <Select
                options={[
                  { value: "active", label: "发布中" },
                  { value: "disabled", label: "已下架" },
                ]}
              />
            </Form.Item>
          </Space>
          <Form.Item name="title" label="职位名称" rules={[{ required: true, message: "请输入职位名称" }]}>
            <Input maxLength={200} />
          </Form.Item>
          <Space size="large" style={{ display: "flex" }}>
            <Form.Item name="department" label="部门" style={{ flex: 1 }}>
              <Input maxLength={80} />
            </Form.Item>
            <Form.Item name="city" label="工作城市" style={{ flex: 1 }}>
              <Input maxLength={80} />
            </Form.Item>
          </Space>
          <Space size="large" style={{ display: "flex" }}>
            <Form.Item name="salary" label="薪资范围" style={{ flex: 1 }}>
              <Input maxLength={80} placeholder="如：15-25K·14薪" />
            </Form.Item>
            <Form.Item name="headcount" label="招聘人数" style={{ flex: 1 }}>
              <InputNumber min={1} style={{ width: "100%" }} />
            </Form.Item>
          </Space>
          <Form.Item name="publish_at" label="发布时间">
            <DatePicker showTime style={{ width: "100%" }} placeholder="选择发布时间" />
          </Form.Item>
          <Form.Item name="description" label="职位描述">
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item name="requirements" label="任职要求">
            <Input.TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
