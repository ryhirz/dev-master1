import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Drawer,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Switch,
  Table,
  message,
  Tag,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { PlusOutlined, MinusCircleOutlined } from "@ant-design/icons";
import { categoryApi, productApi, seriesApi } from "../api";
import { errMsg } from "../api/client";
import { DeleteButton, PageHeader, StatusTag } from "../components/common";
import ImageUpload from "../components/ImageUpload";
import { useDelete, usePagedList } from "../hooks/useCrud";
import type { CategoryItem, ProductItem, SeriesItem } from "../types";

// 产品管理：CRUD + 多图上传(JSON 数组) + 规格动态表单 + 系列/分类筛选
export default function Products() {
  const [keyword, setKeyword] = useState("");
  const [seriesFilter, setSeriesFilter] = useState<number | undefined>();
  const [categoryFilter, setCategoryFilter] = useState<number | undefined>();
  const [filters, setFilters] = useState<{ keyword?: string; series_id?: number; category_id?: number }>({});

  const { data, loading, page, setPage, pageSize, setPageSize, reload } = usePagedList(
    (p) => productApi.list({ ...p, ...filters }),
    [filters],
  );

  const { data: seriesData } = usePagedList((p) => seriesApi.list({ ...p, page_size: 100 }), []);
  const { data: catData } = usePagedList((p) => categoryApi.list({ ...p, page_size: 100 }), []);

  const seriesOptions = useMemo(
    () => (seriesData.items || []).map((s: SeriesItem) => ({ value: s.id, label: s.name })),
    [seriesData],
  );
  const catOptions = useMemo(
    () =>
      (catData.items || []).map((c: CategoryItem) => ({
        value: c.id,
        label: c.parent_id ? `${c.parent_name ?? ""} / ${c.name}` : c.name,
      })),
    [catData],
  );

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ProductItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const del = useDelete((id) => productApi.remove(id), reload);

  // specs 动态表单初始化为键值对数组
  const specListToObj = (arr?: { key?: string; value?: string }[]) => {
    const obj: Record<string, unknown> = {};
    (arr || []).forEach((s) => {
      if (s.key) obj[s.key] = s.value ?? "";
    });
    return obj;
  };
  const specObjToList = (obj?: Record<string, unknown>) =>
    Object.entries(obj ?? {}).map(([key, value]) => ({ key, value: String(value) }));

  useEffect(() => {
    if (open && editing) {
      form.setFieldsValue({
        ...editing,
        specsList: specObjToList(editing.specs),
      });
    }
    if (open && !editing) {
      form.setFieldsValue({ specsList: [], images: [], status: "active", is_recommended: false });
    }
  }, [open, editing, form]);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    setOpen(true);
  };
  const openEdit = (r: ProductItem) => {
    setEditing(r);
    setOpen(true);
  };

  const submit = async () => {
    const v = await form.validateFields();
    const payload = {
      ...v,
      specs: specListToObj(v.specsList),
      specsList: undefined,
      price: v.price ?? null,
    };
    setSaving(true);
    try {
      if (editing) {
        await productApi.update(editing.id, payload);
      } else {
        await productApi.create(payload);
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

  const columns: ColumnsType<ProductItem> = [
    { title: "ID", dataIndex: "id", width: 60 },
    {
      title: "产品",
      dataIndex: "name",
      render: (v: string, r) => (
        <Space direction="vertical" size={0}>
          <span>{v}</span>
          {r.model_no && <span style={{ color: "#7A8CA3", fontSize: 12 }}>{r.model_no}</span>}
        </Space>
      ),
    },
    {
      title: "系列/分类",
      render: (_, r) => (
        <Space size={4} wrap>
          {r.series_name && <Tag>{r.series_name}</Tag>}
          {r.category_name && <Tag color="geekblue">{r.category_name}</Tag>}
        </Space>
      ),
    },
    {
      title: "价格(¥)",
      dataIndex: "price",
      width: 100,
      render: (v: number | null) => (v == null ? "—" : v),
    },
    { title: "推荐", dataIndex: "is_recommended", width: 80, render: (v: boolean) => (v ? "✓" : "") },
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
      <PageHeader title="产品" subtitle="产品 CRUD + 多图上传(JSON 数组) + 规格" onAdd={openCreate} />
      <Space style={{ marginBottom: 16 }} wrap>
        <Input.Search
          placeholder="关键词（名称/型号）"
          allowClear
          style={{ width: 220 }}
          onSearch={(v) => {
            setKeyword(v);
            setFilters((f) => ({ ...f, keyword: v || undefined }));
            setPage(1);
          }}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        <Select
          allowClear
          placeholder="按系列筛选"
          style={{ width: 180 }}
          options={seriesOptions}
          value={seriesFilter}
          onChange={(v) => {
            setSeriesFilter(v);
            setFilters((f) => ({ ...f, series_id: v }));
            setPage(1);
          }}
        />
        <Select
          allowClear
          placeholder="按分类筛选"
          style={{ width: 180 }}
          options={catOptions}
          value={categoryFilter}
          onChange={(v) => {
            setCategoryFilter(v);
            setFilters((f) => ({ ...f, category_id: v }));
            setPage(1);
          }}
        />
        <Button onClick={reload}>刷新</Button>
      </Space>
      <Table<ProductItem>
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
        title={editing ? "编辑产品" : "新增产品"}
        width={640}
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
          <Form.Item name="name" label="产品名称" rules={[{ required: true, message: "请输入产品名称" }]}>
            <Input maxLength={200} />
          </Form.Item>
          <Space size="large" style={{ display: "flex" }}>
            <Form.Item name="series_id" label="所属系列" style={{ flex: 1 }}>
              <Select allowClear options={seriesOptions} placeholder="选择系列" />
            </Form.Item>
            <Form.Item name="category_id" label="所属分类" style={{ flex: 1 }}>
              <Select allowClear options={catOptions} placeholder="选择分类" />
            </Form.Item>
          </Space>
          <Space size="large" style={{ display: "flex" }}>
            <Form.Item name="model_no" label="型号" style={{ flex: 1 }}>
              <Input maxLength={80} placeholder="如：RZ-2001" />
            </Form.Item>
            <Form.Item name="price" label="价格(¥)" style={{ flex: 1 }}>
              <InputNumber min={0} precision={2} style={{ width: "100%" }} placeholder="可留空" />
            </Form.Item>
          </Space>
          <Form.Item name="summary" label="摘要">
            <Input.TextArea rows={2} maxLength={300} />
          </Form.Item>
          <Form.Item name="description" label="详细描述">
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item name="images" label="产品图片（多图，保存为 JSON 数组）">
            <ImageUpload multiple max={9} hint="可上传多张，第一张作为封面" />
          </Form.Item>
          <Form.Item label="规格参数">
            <Form.List name="specsList">
              {(fields, { add, remove }) => (
                <div>
                  {fields.map(({ key, name, ...rest }) => (
                    <Space key={key} align="baseline" style={{ display: "flex", marginBottom: 8 }}>
                      <Form.Item
                        {...rest}
                        name={[name, "key"]}
                        rules={[{ required: true, message: "规格名" }]}
                        style={{ width: 180 }}
                      >
                        <Input placeholder="规格名，如：材质" />
                      </Form.Item>
                      <Form.Item {...rest} name={[name, "value"]} style={{ width: 220 }}>
                        <Input placeholder="规格值，如：北美胡桃木" />
                      </Form.Item>
                      <MinusCircleOutlined onClick={() => remove(name)} style={{ color: "#999" }} />
                    </Space>
                  ))}
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                    添加规格
                  </Button>
                </div>
              )}
            </Form.List>
          </Form.Item>
          <Space size="large">
            <Form.Item name="is_recommended" label="首页推荐" valuePropName="checked">
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
      </Drawer>
    </div>
  );
}
