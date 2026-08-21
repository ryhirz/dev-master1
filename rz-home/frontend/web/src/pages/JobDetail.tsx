import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api";
import { useApi } from "../hooks/useApi";
import { Breadcrumb, PageContainer, Empty, Tag } from "../components/ui";
import { Button } from "../components/ui";
import Modal from "../components/Modal";
import { Field, TextInput, TextArea } from "../components/Field";
import { toast } from "../components/Toast";
import { ArrowRight } from "../components/Icons";
import type { InquiryPayload } from "../types";

export default function JobDetail() {
  const { id } = useParams();
  const { data, loading } = useApi(() => api.job(id!), [id]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", content: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "请填写姓名";
    if (!/^1[3-9]\d{9}$/.test(form.phone.trim())) e.phone = "请填写有效的 11 位手机号";
    if (form.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) e.email = "邮箱格式不正确";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (!validate() || !data) return;
    setSubmitting(true);
    try {
      const payload: InquiryPayload = {
        type: "job_application",
        job_id: data.id,
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email || undefined,
        content: form.content.trim(),
      };
      await api.inquiry(payload);
      toast("投递意向已提交，HR 将尽快与您联系");
      setOpen(false);
      setForm({ name: "", phone: "", email: "", content: "" });
    } catch {
      toast("提交失败，请稍后再试", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <PageContainer><div className="py-20 text-center text-muted">加载中…</div></PageContainer>;
  if (!data) return <PageContainer><Empty title="职位不存在或已关闭" /></PageContainer>;

  return (
    <PageContainer className="max-w-[860px]">
      <Breadcrumb items={[{ label: "首页", to: "/" }, { label: "招聘", to: "/jobs" }, { label: data.title }]} />
      <div className="mt-2"><Tag variant="brand">{data.type === "social" ? "社会招聘" : "校园招聘"}</Tag></div>
      <h1 className="font-serif text-[32px] text-ink mt-3">{data.title}</h1>
      <div className="flex flex-wrap gap-3 mt-3 text-sm text-muted">
        {data.department && <span>{data.department}</span>}
        {data.city && <span>{data.city}</span>}
        {data.salary && <span>{data.salary}</span>}
        {data.headcount != null && <span>招聘 {data.headcount} 人</span>}
      </div>
      <div className="prose-rz mt-6">
        <h3 className="text-[20px] text-ink font-semibold mb-2 mt-4">岗位职责</h3>
        <div dangerouslySetInnerHTML={{ __html: data.description || "负责相关业务的推进与落地，协同跨部门团队达成目标，并持续优化工作方法与产出质量。" }} />
        <h3 className="text-[20px] text-ink font-semibold mb-2 mt-4">任职要求</h3>
        <div dangerouslySetInnerHTML={{ __html: data.requirements || "具备对应岗位的专业能力与经验，良好的沟通协作与学习能力，认同 Rz智能“全屋智能”的品牌理念。" }} />
      </div>
      <div className="flex gap-3 mt-8">
        <Button onClick={() => setOpen(true)}>投递意向 <ArrowRight className="w-4 h-4" /></Button>
        <Link
          to="/jobs"
          className="inline-flex items-center gap-2 h-11 px-6 rounded-btn border border-walnut text-walnut hover:bg-line/60 transition-colors text-[15px]"
        >
          返回职位列表
        </Link>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={`投递意向 · ${data.title}`}>
        <p className="text-sm text-muted mb-5">{data.department} · {data.city} · {data.salary}</p>
        <div className="flex flex-col gap-4">
          <Field label="姓名" required error={errors.name} htmlFor="a-name">
            <TextInput id="a-name" value={form.name} invalid={!!errors.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="请输入姓名" />
          </Field>
          <Field label="电话" required error={errors.phone} htmlFor="a-phone">
            <TextInput id="a-phone" value={form.phone} invalid={!!errors.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="11 位手机号" />
          </Field>
          <Field label="邮箱" error={errors.email} htmlFor="a-email">
            <TextInput id="a-email" value={form.email} invalid={!!errors.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="选填" />
          </Field>
          <Field label="内容（选填）" htmlFor="a-content">
            <TextArea id="a-content" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="简单介绍一下你自己" />
          </Field>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="secondary" onClick={() => setOpen(false)}>取消</Button>
          <Button onClick={submit} loading={submitting}>提交投递</Button>
        </div>
      </Modal>
    </PageContainer>
  );
}
