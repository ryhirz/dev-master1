// 轻量 Toast（函数式，避免 Context  plumbing；行为对齐 prototype 与 UI/UX §2.8）
type ToastType = "success" | "error" | "warning";

let container: HTMLDivElement | null = null;
function getContainer(): HTMLDivElement {
  if (!container) {
    container = document.createElement("div");
    container.className =
      "fixed top-6 left-1/2 -translate-x-1/2 z-[1200] flex flex-col items-center gap-2.5";
    document.body.appendChild(container);
  }
  return container;
}

const styles: Record<ToastType, string> = {
  success: "border-l-success text-success",
  error: "border-l-danger text-danger",
  warning: "border-l-warning text-warning",
};

export function toast(message: string, type: ToastType = "success") {
  const c = getContainer();
  const el = document.createElement("div");
  el.className = `flex items-center gap-2 bg-white rounded-btn shadow-lg pl-4 pr-5 py-3 text-sm min-w-[240px] border-l-4 ${styles[type]}`;
  el.textContent = message;
  c.appendChild(el);
  setTimeout(() => {
    el.style.opacity = "0";
    el.style.transform = "translateY(-10px)";
    el.style.transition = "all .25s";
    setTimeout(() => el.remove(), 250);
  }, 2600);
}
