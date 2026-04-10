const icons = {
  shield: (
    <path
      d="M12 3l7 3v5c0 4.6-3 8.6-7 10-4-1.4-7-5.4-7-10V6l7-3z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
  ),
  document: (
    <path
      d="M7 3h6l4 4v14H7z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
  ),
  users: (
    <path
      d="M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8 0a2.4 2.4 0 1 0 0-4.8 2.4 2.4 0 0 0 0 4.8ZM3.5 20c.4-3 2.8-5 5.5-5s5.1 2 5.5 5m2.5 0c.3-2 1.8-3.6 3.8-4.1"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  calculator: (
    <path
      d="M6 4h12v16H6zM8 8h8M8 12h3m1 0h3m-8 4h3m1 0h3"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  ),
  eye: (
    <path
      d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
  ),
  grid: (
    <path
      d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
  ),
  file: (
    <path
      d="M7 3h6l4 4v14H7zM13 3v5h5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
  ),
  plus: (
    <path
      d="M12 5v14M5 12h14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  ),
  history: (
    <path
      d="M4 12a8 8 0 1 0 2.3-5.7M4 4v4h4m4 3v4l3 2"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  report: (
    <path
      d="M7 3h10l4 4v14H7zM13 3v5h5M10 12h6M10 16h6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
  ),
  chart: (
    <path
      d="M5 19V5m0 14h14M9 16v-5m4 5V8m4 8v-3"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  ),
  lock: (
    <path
      d="M7 11V8a5 5 0 0 1 10 0v3m-11 0h12v9H6z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
  ),
  arrow: (
    <path
      d="M10 17l5-5-5-5M15 12H3"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  logout: (
    <path
      d="M10 17l-1.5 1.5A5.5 5.5 0 0 1 9.4 11H3m7 0-2 2m2-2-2-2M14 7V5h5v14h-5v-2"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  login: (
    <path
      d="M10 7V5h9v14h-9v-2m4-5H3m4-3 3 3-3 3"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  close: (
    <path
      d="M6 6l12 12M18 6L6 18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  ),
  edit: (
    <path
      d="M4 16.5V20h3.5L19 8.5 15.5 5 4 16.5Zm11.5-11.5L18 7.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
      strokeLinecap="round"
    />
  ),
};

export default function Icon({ name, size = 20, className = "" }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      {icons[name] || icons.grid}
    </svg>
  );
}
