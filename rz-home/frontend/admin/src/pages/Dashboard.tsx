export default function Dashboard() {
  return (
    <div>
      <h2 style={{ marginBottom: 16, color: "#6B4F3A" }}>控制台</h2>
      <p style={{ color: "#8A7E72" }}>
        （M4 实现：数据统计概览卡片，调用 GET /api/admin/stats/overview，P1）
      </p>
      <div style={{ marginTop: 16, padding: 24, border: "1px solid #E5DDD2", borderRadius: 8, color: "#8A7E72" }}>
        占位概览区
      </div>
    </div>
  );
}
