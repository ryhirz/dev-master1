import type {
  InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes, ReactNode,
} from "react";

function ErrorText({ msg, id }: { msg?: string; id?: string }) {
  if (!msg) return null;
  return (
    <p id={id} className="mt-1 text-sm text-danger" role="alert">
      {msg}
    </p>
  );
}

export function Field({
  label, required, error, htmlFor, children,
}: { label: string; required?: boolean; error?: string; htmlFor?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-ink">
        {label}
        {required && <span className="text-danger ml-0.5">*</span>}
      </label>
      {children}
      <ErrorText msg={error} id={htmlFor ? `err-${htmlFor}` : undefined} />
    </div>
  );
}

const inputCls =
  "h-11 w-full rounded-btn border border-line bg-white px-3.5 text-[15px] outline-none focus:border-walnut focus:ring-2 focus:ring-walnut/30 text-ink";

export function TextInput(props: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  const { invalid, className, ...rest } = props;
  return (
    <input
      className={`${inputCls} ${invalid ? "border-danger" : ""} ${className || ""}`}
      aria-invalid={invalid || undefined}
      aria-describedby={invalid ? `err-${props.id}` : undefined}
      {...rest}
    />
  );
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }) {
  const { invalid, className, ...rest } = props;
  return (
    <textarea
      className={`w-full rounded-btn border border-line bg-white px-3.5 py-3 text-[15px] outline-none focus:border-walnut focus:ring-2 focus:ring-walnut/30 min-h-[110px] resize-y text-ink ${invalid ? "border-danger" : ""} ${className || ""}`}
      aria-invalid={invalid || undefined}
      aria-describedby={invalid ? `err-${props.id}` : undefined}
      {...rest}
    />
  );
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  const { className, ...rest } = props;
  return <select className={`${inputCls} ${className || ""}`} {...rest} />;
}
