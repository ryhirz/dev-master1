export default function Login() {
  return (
    <div>
      <h2 style={{ marginBottom: 16, color: "#6B4F3A" }}>登录</h2>
      <p style={{ color: "#8A7E72" }}>
        （M4 实现：JWT 登录表单，成功后写入 rz_access_token / rz_refresh_token；按角色跳控制台）
      </p>
      <div style={{ marginTop: 16, padding: 24, border: "1px solid #E5DDD2", borderRadius: 8, color: "#8A7E72" }}>
        占位登录区 — 提交至 POST /api/admin/login
      </div>
    </div>
  );
}
