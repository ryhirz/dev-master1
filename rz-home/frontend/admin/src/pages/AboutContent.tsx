import { useEffect, useState } from "react";
import {
  Button,
  Card,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Spin,
  Table,
  Tabs,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { aboutApi } from "../api";
import { errMsg } from "../api/client";
import { DeleteButton, PageHeader, StatusTag } from "../components/common";
import ImageUpload from "../components/ImageUpload";
import RichTextEditor from "../components/RichTextEditor";
import { useDelete, usePagedList } from "../hooks/useCrud";
import type { AboutSectionItem, CompanyInfo, MilestoneItem } from "../types";

// 关于我们配置：公司信息（单行）+ 关于区块（overview/brand）+ 里程碑
export default function AboutContent() {
  return (
    <Tabs
      items={[
        { key: "company", label: "公司信息", children: <CompanyForm /> },
        { key: "sections", label: "关于区块", children: <SectionsPanel /> },
        { key: "milestones", label: "发展历程（里程碑）", children: <MilestonesPanel /> },
      ]}
    />
  );
}

// ================= 公司信息 =================
function CompanyForm() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    aboutApi
      .company()
      .then((c: CompanyInfo) => form.setFieldsValue(c))
      .catch((e) => message.error(errMsg(e, "公司信息加载失败")))
      .finally(() => setLoading(false));
  }, [form]);

  const submit = async () => {
    const v = await form.validateFields();
    setSaving(true);
    try {
      await aboutApi.updateCompany(v);
      message.success("公司信息已保存，前台同步生效");
    } catch (e) {
      message.error(errMsg(e, "保存失败"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spin />;
  return (
    <div style={{ maxWidth: 720 }}>
      <Form form={form} layout="vertical" requiredMark={false}>
        <Space size="large" style={{ display: "flex" }}>
          <Form.Item name="name" label="公司名称" style={{ flex: 1 }} rules={[{ required: true }]}>
            <Input maxLength={200} />
          </Form.Item>
          <Form.Item name="logo_url" label="Logo">
            <ImageUpload multiple={false} />
          </Form.Item>
        </Space>
        <Space size="large" style={{ display: "flex" }}>
          <Form.Item name="founded_year" label="成立年份" style={{ flex: 1 }}>
            <InputNumber min={1900} max={2100} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="honor_count" label="荣誉数量" style={{ flex: 1 }}>
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="production_line_count" label="生产线数量" style={{ flex: 1 }}>
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
        </Space>
        <Form.Item name="address" label="地址">
          <Input maxLength={300} />
        </Form.Item>
        <Space size="large" style={{ display: "flex" }}>
          <Form.Item name="phone" label="电话" style={{ flex: 1 }}>
            <Input maxLength={40} />
          </Form.Item>
          <Form.Item name="email" label="邮箱" style={{ flex: 1 }}>
            <Input maxLength={160} />
          </Form.Item>
        </Space>
        <Space size="large" style={{ display: "flex" }}>
          <Form.Item name="wechat" label="微信号" style={{ flex: 1 }}>
            <Input maxLength={80} />
          </Form.Item>
          <Form.Item name="icp_no" label="ICP 备案号" style={{ flex: 1 }}>
            <Input maxLength={40} />
          </Form.Item>
        </Space>
        <Form.Item name="intro" label="公司简介">
          <Input.TextArea rows={4} />
        </Form.Item>
        <Button type="primary" loading={saving} onClick={submit}>
          保存公司信息
        </Button>
      </Form>
    </div>
  );
}

// ================= 关于区块 =================
function SectionsPanel() {
  const [sections, setSections] = useState<AboutSectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AboutSectionItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const load = () => {
    setLoading(true);
    aboutApi
      .sections()
      .then(setSections)
      .catch((e) => message.error(errMsg(e, "板块加载失败")))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const openEdit = (s: AboutSectionItem) => {
    setEditing(s);
    form.setFieldsValue(s);
    setOpen(true);
  };

  const submit = async () => {
    if (!editing) return;
    const v = await form.validateFields();
    setSaving(true);
    try {
      await aboutApi.updateSection(editing.code, v);
      message.success("板块已保存，前台同步生效");
      setOpen(false);
      load();
    } catch (e) {
      message.error(errMsg(e, "保存失败"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spin />;
  return (
    <div>
      <Space direction="vertical" style={{ width: "100%" }} size={12}>
        {sections.map((s) => (
          <Card key={s.code} size="small" title={`${s.title}（code: ${s.code}）`} extra={<Button type="link" size="small" onClick={() => openEdit(s)}>编辑</Button>}>
            <div style={{ color: "#5E7390" }}>
              <div style={{ marginBottom: 8, whiteSpace: "pre-wrap", maxHeight: 120, overflow: "hidden" }}>
                {s.content || "（暂无内容）"}
              </div>
              <StatusTag status={s.status} />
            </div>
          </Card>
        ))}
      </Space>
      <Modal
        title={`编辑板块：${editing?.code ?? ""}`}
        
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
          <Form.Item name="title" label="标题" rules={[{ required: true }]}>
            <Input maxLength={200} />
          </Form.Item>
          <Form.Item name="cover_image" label="封面图">
            <ImageUpload multiple={false} />
          </Form.Item>
          <Form.Item name="content" label="内容（富文本）">
            <RichTextEditor />
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

// ================= 里程碑 =================
function MilestonesPanel() {
  const { data, loading, page, setPage, pageSize, setPageSize, reload } = usePagedList((p) =>
    aboutApi.milestones(p),
  );
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<MilestoneItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const del = useDelete((id) => aboutApi.removeMilestone(id), reload);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ sort_order: 0, status: "active" });
    setOpen(true);
  };
  const openEdit = (r: MilestoneItem) => {
    setEditing(r);
    form.setFieldsValue(r);
    setOpen(true);
  };

  const submit = async () => {
    const v = await form.validateFields();
    setSaving(true);
    try {
      if (editing) {
        await aboutApi.updateMilestone(editing.id, v);
      } else {
        await aboutApi.createMilestone(v);
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

  const columns: ColumnsType<MilestoneItem> = [
    { title: "ID", dataIndex: "id", width: 60 },
    { title: "年份", dataIndex: "year", width: 100 },
    { title: "标题", dataIndex: "title" },
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
      <PageHeader title="发展历程" subtitle="前台「关于我们-历程」页时间轴数据" onAdd={openCreate} />
      <Table<MilestoneItem>
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
        title={editing ? "编辑里程碑" : "新增里程碑"}
        
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
            <Form.Item name="year" label="年份" style={{ flex: 1 }} rules={[{ required: true, message: "请输入年份" }]}>
              <Input maxLength={20} placeholder="如：2015" />
            </Form.Item>
            <Form.Item name="sort_order" label="排序" style={{ flex: 1 }}>
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
          </Space>
          <Form.Item name="title" label="标题" rules={[{ required: true, message: "请输入标题" }]}>
            <Input maxLength={200} />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="image" label="配图">
            <ImageUpload multiple={false} />
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
