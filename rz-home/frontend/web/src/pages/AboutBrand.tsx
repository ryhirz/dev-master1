import { api } from "../api";
import { useApi } from "../hooks/useApi";
import { Breadcrumb, PageContainer, Empty } from "../components/ui";

const FEATURES = [
  ["人体工程学", "贴合身形与使用习惯，久坐不累。"],
  ["原创设计", "独立设计中心，持续输出新品。"],
  ["智能生产线", "数字化品控，稳定交付。"],
  ["售后服务", "五年质保，贴心陪伴。"],
];

export default function AboutBrand() {
  const { data, loading } = useApi(() => api.brand(), []);
  const content =
    data?.content ||
    "我们相信，好的智能不是堆砌设备，而是让家更懂你。以设计为骨、以科技为翼，Rz智能在每一个环节都倾注匠心——从灯光到安防，从影音到睡眠，让家拥有从容、安静、有温度的高级感。";

  return (
    <PageContainer>
      <Breadcrumb items={[{ label: "首页", to: "/" }, { label: "关于我们", to: "/about" }, { label: "品牌介绍" }]} />
      <div className="mb-8">
        <p className="text-walnut tracking-[0.3em] uppercase text-xs mb-2">关于我们</p>
        <h1 className="font-serif text-[32px] text-ink">品牌介绍</h1>
      </div>
      {loading ? (
        <p className="text-muted">加载中…</p>
      ) : (
        <>
          <p className="prose-rz max-w-3xl">{content}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-10">
            {FEATURES.map(([t, d]) => (
              <div key={t} className="bg-white rounded-card border border-line p-6 shadow-sm">
                <div className="text-lg font-semibold text-ink">{t}</div>
                <p className="text-muted text-[15px] mt-1">{d}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </PageContainer>
  );
}
