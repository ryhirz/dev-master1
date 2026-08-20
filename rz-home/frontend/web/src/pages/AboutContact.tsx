import { useState } from "react";
import { api } from "../api";
import { useApi } from "../hooks/useApi";
import { Breadcrumb, PageContainer } from "../components/ui";
import { Button } from "../components/ui";
import { Field, TextInput, TextArea } from "../components/Field";
import { toast } from "../components/Toast";
import { PhoneIcon, MailIcon, MapPin } from "../components/Icons";
import type { InquiryPayload } from "../types";

export default function AboutContact() {
  const { data } = useApi(() => api.contactInfo(), []);
  const [form, setForm] = useState({ name: "", phone: "", email: "", content: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "请填写姓名";
    if (!/^1[3-9]\d{9}$/.test(form.phone.trim())) e.phone = "请填写有效的 11 位手机号";
    if (form.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) e.email = "邮箱格式不正确";
    if (!form.content.trim()) e.content = "请填写留言内容";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast("请检查表单填写", "error");
      return;
    }
    setSubmitting(true);
    try {
      const payload: InquiryPayload = {
        type: "contact",
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email || undefined,
        content: form.content.trim(),
      };
      await api.inquiry(payload);
      toast("留言已提交，我们会尽快与您联系");
      setForm({ name: "", phone: "", email: "", content: "" });
    } catch {
      toast("提交失败，请稍后再试", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageContainer>
      <Breadcrumb items={[{ label: "首页", to: "/" }, { label: "关于我们", to: "/about" }, { label: "联系我们" }]} />
      <div className="mb-8">
        <p className="text-walnut tracking-[0.3em] uppercase text-xs mb-2">关于我们</p>
        <h1 className="font-serif text-[32px] text-ink">联系我们</h1>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div>
          <h3 className="text-xl font-semibold text-ink mb-4">公司信息</h3>
          <div className="space-y-3 text-muted">
            {data?.address && <p className="flex items-center gap-2"><MapPin className="w-5 h-5 text-walnut shrink-0" />{data.address}</p>}
            {data?.phone && <p className="flex items-center gap-2"><PhoneIcon className="w-5 h-5 text-walnut shrink-0" />{data.phone}</p>}
            {data?.email && <p className="flex items-center gap-2"><MailIcon className="w-5 h-5 text-walnut shrink-0" />{data.email}</p>}
            {data?.wechat && <p className="flex items-center gap-2"><MapPin className="w-5 h-5 text-walnut shrink-0" />微信：{data.wechat}</p>}
          </div>
          <div className="mt-6">
            <iframe
              title="公司位置地图"
              src="https://m.amap.com/marker?position=113.3258,23.1193&name=Rz%E6%99%BA%E8%83%BD%E5%AE%B6%E5%B1%85%EF%BC%88%E7%8F%A0%E6%B1%9F%E6%96%B0%E5%9F%8EIFC%EF%BC%89"
              className="w-full h-[300px] rounded-card border border-line bg-white"
              loading="lazy"
              allow="geolocation"
            />
            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <a
                href="https://www.amap.com/search?query=%E5%B9%BF%E5%B7%9EIFC"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-walnut hover:opacity-80"
              >
                <MapPin className="w-4 h-4" /> 在高德地图中查看
              </a>
              <a
                href="https://map.baidu.com/search/%E5%B9%BF%E5%B7%9EIFC"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-walnut hover:opacity-80"
              >
                <MapPin className="w-4 h-4" /> 在百度地图中查看
              </a>
            </div>
          </div>
        </div>
        <div>
          <h3 className="text-xl font-semibold text-ink mb-4">在线留言</h3>
          <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
            <Field label="姓名" required error={errors.name} htmlFor="c-name">
              <TextInput id="c-name" value={form.name} invalid={!!errors.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="请输入姓名" />
            </Field>
            <Field label="电话" required error={errors.phone} htmlFor="c-phone">
              <TextInput id="c-phone" value={form.phone} invalid={!!errors.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="11 位手机号" />
            </Field>
            <Field label="邮箱" error={errors.email} htmlFor="c-email">
              <TextInput id="c-email" value={form.email} invalid={!!errors.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="选填" />
            </Field>
            <Field label="内容" required error={errors.content} htmlFor="c-content">
              <TextArea id="c-content" value={form.content} invalid={!!errors.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="请描述您的需求" />
            </Field>
            <Button type="submit" loading={submitting} className="self-start">提交留言</Button>
          </form>
        </div>
      </div>
    </PageContainer>
  );
}
