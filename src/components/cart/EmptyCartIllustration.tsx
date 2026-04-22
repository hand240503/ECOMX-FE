/** Minh họa giỏ hàng trống — phong cách gọn, màu gần mẫu Tiki (xanh + vàng). */
export default function EmptyCartIllustration({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 160 130"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M42 38h88l-8 52H50L38 28H22"
        stroke="#2563eb"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M38 28h-12l-4 10h16"
        stroke="#4b5563"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="48" y="48" width="76" height="36" rx="4" fill="#dbeafe" stroke="#2563eb" strokeWidth="3" />
      <circle cx="58" cy="98" r="10" fill="#fbbf24" stroke="#d97706" strokeWidth="2" />
      <circle cx="102" cy="98" r="10" fill="#fbbf24" stroke="#d97706" strokeWidth="2" />
      <circle cx="58" cy="98" r="4" fill="#fef3c7" />
      <circle cx="102" cy="98" r="4" fill="#fef3c7" />
    </svg>
  );
}
