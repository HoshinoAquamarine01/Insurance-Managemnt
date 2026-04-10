export const loginHighlights = [
  {
    title: "Quản lý hợp đồng",
    description: "Tạo và quản lý hợp đồng bảo hiểm dễ dàng",
    accent: "blue",
    icon: "document",
  },
  {
    title: "Phân quyền rõ ràng",
    description: "Mỗi vai trò có quyền truy cập riêng biệt",
    accent: "green",
    icon: "users",
  },
];

export const demoAccounts = [
  {
    role: "Người lập HĐ",
    username: "creator1",
    roleKey: "LAP_HOP_DONG",
    tone: "blue",
  },
  {
    role: "Người được BH",
    username: "insured1",
    roleKey: "NGUOI_DUOC_BAO_HIEM",
    tone: "green",
  },
  {
    role: "Kế toán",
    username: "accounting1",
    roleKey: "KE_TOAN",
    tone: "violet",
  },
  {
    role: "Giám sát",
    username: "supervisor1",
    roleKey: "GIAM_SAT",
    tone: "orange",
  },
  { role: "Admin", username: "admin1", roleKey: "ADMIN", tone: "slate" },
];

export const roleProfiles = {
  LAP_HOP_DONG: {
    title: "Người lập hợp đồng",
    subtitle: "Tạo và quản lý hợp đồng",
    theme: "creator",
    accent: "#2563eb",
    nav: [
      { label: "Tổng quan", path: "/dashboard/creator", icon: "grid" },
      { label: "Hợp đồng của tôi", path: "/dashboard/creator", icon: "file" },
      { label: "Tạo hợp đồng mới", path: "/dashboard/creator", icon: "plus" },
      {
        label: "Lịch sử thao tác",
        path: "/dashboard/creator",
        icon: "history",
      },
    ],
  },
  NGUOI_DUOC_BAO_HIEM: {
    title: "Người được bảo hiểm",
    subtitle: "Xem thông tin bảo hiểm cá nhân",
    theme: "insured",
    accent: "#16a34a",
    nav: [
      { label: "Tổng quan", path: "/dashboard/insured", icon: "grid" },
      { label: "Hợp đồng của tôi", path: "/dashboard/insured", icon: "file" },
      {
        label: "Lịch sử thanh toán",
        path: "/dashboard/insured",
        icon: "history",
      },
      {
        label: "Thông tin cá nhân",
        path: "/dashboard/insured",
        icon: "shield",
      },
    ],
  },
  KE_TOAN: {
    title: "Bộ phận kế toán",
    subtitle: "Quản lý tài chính",
    theme: "accounting",
    accent: "#7c3aed",
    nav: [
      { label: "Tổng quan", path: "/dashboard/accounting", icon: "grid" },
      {
        label: "Danh sách hợp đồng",
        path: "/dashboard/accounting",
        icon: "file",
      },
      {
        label: "Báo cáo kế toán",
        path: "/dashboard/accounting",
        icon: "report",
      },
      { label: "Thống kê", path: "/dashboard/accounting", icon: "chart" },
    ],
  },
  GIAM_SAT: {
    title: "Bộ phận giám sát",
    subtitle: "Giám sát hoạt động",
    theme: "supervisor",
    accent: "#ea580c",
    nav: [
      { label: "Tổng quan", path: "/dashboard/supervisor", icon: "grid" },
      {
        label: "Giám sát hợp đồng",
        path: "/dashboard/supervisor",
        icon: "eye",
      },
      {
        label: "Báo cáo tổng hợp",
        path: "/dashboard/supervisor",
        icon: "report",
      },
      {
        label: "Thống kê & Phân tích",
        path: "/dashboard/supervisor",
        icon: "chart",
      },
    ],
  },
  ADMIN: {
    title: "Quản trị hệ thống",
    subtitle: "Thiết lập và kiểm soát toàn hệ thống",
    theme: "admin",
    accent: "#0f172a",
    nav: [
      { label: "Tổng quan", path: "/admin", icon: "grid" },
      { label: "Loại bảo hiểm", path: "/admin", icon: "document" },
      { label: "Phân công nhân sự", path: "/admin", icon: "users" },
      { label: "Lịch sử truy cập", path: "/admin", icon: "history" },
    ],
  },
};

export const dashboardStats = {
  creator: [
    { label: "Tổng hợp đồng", value: "2", meta: "hợp đồng", accent: "blue" },
    { label: "Đang hoạt động", value: "2", meta: "hợp đồng", accent: "green" },
    { label: "Hết hạn", value: "0", meta: "hợp đồng", accent: "orange" },
    { label: "Đã hủy", value: "0", meta: "hợp đồng", accent: "red" },
  ],
  insured: [
    {
      label: "Số hợp đồng đang hoạt động",
      value: "2",
      meta: "hợp đồng",
      accent: "blue",
    },
    {
      label: "Tổng giá trị bảo hiểm",
      value: "400M",
      meta: "VND",
      accent: "green",
    },
    {
      label: "Tổng phí bảo hiểm",
      value: "13.0M",
      meta: "VND",
      accent: "violet",
    },
  ],
  accounting: [
    {
      label: "Tổng số hợp đồng",
      value: "2",
      meta: "1 đang hoạt động",
      accent: "blue",
    },
    { label: "Tổng doanh thu", value: "9.5M", meta: "VND", accent: "green" },
    {
      label: "Tổng giá trị bảo hiểm",
      value: "100M",
      meta: "VND",
      accent: "orange",
    },
  ],
  supervisor: [
    {
      label: "Tổng số hợp đồng",
      value: "2",
      meta: "1 đang hoạt động",
      accent: "orange",
    },
    {
      label: "Số người được bảo hiểm",
      value: "2",
      meta: "Người",
      accent: "blue",
    },
    {
      label: "Tỷ lệ hợp đồng hoạt động",
      value: "50%",
      meta: "1 / 2",
      accent: "green",
    },
  ],
};

export const dashboardContracts = {
  creator: [
    {
      code: "BH-2026-001",
      title: "Bảo hiểm sức khỏe",
      insured: "Lê Văn C",
      creator: "Nguyễn Văn A",
      status: "Đang hoạt động",
      term: "1/1/2026 - 31/12/2026",
      value: "100.000.000 VNĐ",
      variant: "green",
    },
    {
      code: "BH-2026-002",
      title: "Bảo hiểm nhân thọ",
      insured: "Phạm Thị D",
      creator: "Nguyễn Văn A",
      status: "Đang hoạt động",
      term: "1/3/2026 - 28/2/2027",
      value: "300.000.000 VNĐ",
      variant: "green",
    },
  ],
  insured: [
    {
      code: "BH-2026-001",
      title: "Bảo hiểm sức khỏe",
      insured: "Lê Văn C",
      creator: "Nguyễn Văn A",
      status: "Đang hoạt động",
      term: "1/1/2026 - 31/12/2026",
      value: "100.000.000 VNĐ",
      variant: "green",
    },
    {
      code: "BH-2026-003",
      title: "Bảo hiểm ô tô",
      insured: "Lê Văn C",
      creator: "Trần Thị B",
      status: "Đang hoạt động",
      term: "1/3/2026 - 28/2/2027",
      value: "300.000.000 VNĐ",
      variant: "violet",
    },
  ],
  accounting: [
    {
      code: "BH-2026-001",
      title: "Bảo hiểm sức khỏe",
      insured: "Lê Văn C",
      creator: "Nguyễn Văn A",
      status: "Đang hoạt động",
      term: "1/1/2026 - 31/12/2026",
      value: "100.000.000 VNĐ",
      variant: "green",
    },
    {
      code: "BH-2026-004",
      title: "Bảo hiểm sức khỏe",
      insured: "Phạm Thị D",
      creator: "Trần Thị B",
      status: "Hết hạn",
      term: "1/6/2025 - 31/12/2025",
      value: "80.000.000 VNĐ",
      variant: "orange",
    },
  ],
  supervisor: [
    {
      code: "BH-2026-001",
      title: "Bảo hiểm sức khỏe",
      insured: "Lê Văn C",
      creator: "Nguyễn Văn A",
      status: "Đang hoạt động",
      term: "1/1/2026 - 31/12/2026",
      value: "100.000.000 VNĐ",
      variant: "green",
    },
    {
      code: "BH-2026-004",
      title: "Bảo hiểm sức khỏe",
      insured: "Phạm Thị D",
      creator: "Trần Thị B",
      status: "Hết hạn",
      term: "1/6/2025 - 31/12/2025",
      value: "80.000.000 VNĐ",
      variant: "orange",
    },
  ],
};

export const auditLogs = [
  {
    action: "SELECT",
    entity: "Contract",
    detail: "Xem danh sách hợp đồng",
    time: "09:12",
  },
  {
    action: "UPDATE",
    entity: "Contract",
    detail: "Cập nhật hợp đồng BH-2026-001",
    time: "09:40",
  },
  {
    action: "EXPORT",
    entity: "PremiumPayment",
    detail: "Xuất báo cáo thanh toán",
    time: "10:05",
  },
];

export const adminMetrics = [
  { label: "Loại bảo hiểm", value: "4", meta: "đã cấu hình", accent: "blue" },
  {
    label: "Phân công kế toán",
    value: "6",
    meta: "đang hoạt động",
    accent: "green",
  },
  {
    label: "Phân công giám sát",
    value: "5",
    meta: "đang hoạt động",
    accent: "orange",
  },
  {
    label: "Log truy cập",
    value: "200",
    meta: "bản ghi gần nhất",
    accent: "violet",
  },
];

export const insuranceTypes = [
  { code: "BH-SK", name: "Bảo hiểm sức khỏe", status: "ACTIVE" },
  { code: "BH-NT", name: "Bảo hiểm nhân thọ", status: "ACTIVE" },
  { code: "BH-XE", name: "Bảo hiểm xe cơ giới", status: "ACTIVE" },
  { code: "BH-NN", name: "Bảo hiểm tai nạn", status: "PAUSED" },
];
