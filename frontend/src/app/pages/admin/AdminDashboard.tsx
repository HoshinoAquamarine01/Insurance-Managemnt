import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  createAdminAssignment,
  createAdminContract,
  createAdminUser,
  createInsuranceTypeAdmin,
  updateAdminContract,
  updateAdminUser,
  updateInsuranceTypeAdmin,
  deleteAdminAssignment,
  deleteAdminContract,
  deleteAdminUser,
  deleteInsuranceTypeAdmin,
  getAdminActivity,
  getAdminAssignments,
  getAdminUsers,
  getContracts,
  getDashboardSummary,
  getInsuredAccounts,
  getInsuranceTypes,
} from "../../services/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "../../components/ui/tabs";
import {
  ArrowRight,
  Database,
  Users,
  FileText,
  Shield,
  Wallet,
  Activity as ActivityIcon,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";

type UserFormState = {
  mode: "create" | "edit";
  id?: number;
  username: string;
  password: string;
  fullName: string;
  email: string;
  role: string;
  status: string;
};

type InsuranceTypeFormState = {
  mode: "create" | "edit";
  id?: number;
  tenLoai: string;
  moTa: string;
};

type ContractFormState = {
  mode: "create" | "edit";
  id?: number;
  soHopDong: string;
  idNguoiduocBH: string;
  idLoai: string;
  idNguoiTao: string;
  ngayBatDau: string;
  ngayKetThuc: string;
  giaTri: string;
  periodAmount: string;
  trangThai: string;
};

type AssignmentFormState = {
  idNguoiDung: string;
  tenNguoiDung: string;
  loaiPhanCong: "ACCOUNTANT" | "SUPERVISOR";
  idLoai: string;
  ngayBatDau: string;
  ngayKetThuc: string;
};

function formatDate(value: unknown) {
  if (!value) return "-";
  const date = new Date(value as string | number | Date);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getEventAt(entry: any) {
  return entry?.EVENT_AT_LOCAL || entry?.EVENT_AT_UTC || entry?.EVENT_AT || "";
}

function formatCurrency(value: unknown) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function normalizeText(value: unknown): string {
  const raw = String(value ?? "");
  if (!raw) return raw;

  // First, do direct replacements of known corrupted patterns
  let cleaned = raw
    .replace(/th\?i h\?n/gi, "thời hạn")
    .replace(/hi\?u l\?c/gi, "hiệu lực")
    .replace(/h\?t h\?n/gi, "hết hạn")
    .replace(/\?/g, ""); // Remove any remaining ?

  try {
    // If still has corruption markers, try UTF-8 decode
    if (/Ã|Â|Æ|Ä|áº|á»|á°|á¿/.test(cleaned)) {
      const bytes = Uint8Array.from(
        cleaned,
        (char) => char.charCodeAt(0) & 0xff,
      );
      cleaned = new TextDecoder("utf-8").decode(bytes);
    }
  } catch {
    // Decode failed, keep cleaned version
  }

  return cleaned;
}

function getStatusTone(status: string) {
  const normalized = String(status || "").toLowerCase();

  if (normalized.includes("hoạt động") || normalized.includes("active")) {
    return "bg-emerald-100 text-emerald-700 border-emerald-200";
  }

  if (normalized.includes("chờ") || normalized.includes("pending")) {
    return "bg-amber-100 text-amber-700 border-amber-200";
  }

  if (normalized.includes("đã") || normalized.includes("paid")) {
    return "bg-sky-100 text-sky-700 border-sky-200";
  }

  return "bg-slate-100 text-slate-700 border-slate-200";
}

function getActivityLabel(entry: any) {
  if (entry.ENTITY_TYPE === "contract") {
    return entry.EVENT_KIND === "updated"
      ? "Cập nhật hợp đồng"
      : "Tạo hợp đồng";
  }

  if (entry.ENTITY_TYPE === "payment") {
    return "Thanh toán";
  }

  return "Tạo người dùng";
}

function getActivityDescription(entry: any) {
  if (entry.ENTITY_TYPE === "contract") {
    return `${entry.ACTOR_NAME || "-"} xử lý hợp đồng ${entry.ENTITY_NAME || "-"} cho ${entry.TARGET_NAME || "-"} (${entry.DETAIL || "-"})`;
  }

  if (entry.ENTITY_TYPE === "payment") {
    return `${entry.ACTOR_NAME || "-"} đã thanh toán cho hợp đồng ${entry.TARGET_NAME || "-"} (${entry.DETAIL || "-"})`;
  }

  return `${entry.TARGET_NAME || "-"} được tạo với vai trò ${entry.DETAIL || "-"}`;
}

function toDateInputValue(value: unknown) {
  if (!value) return "";
  const date = new Date(value as string | number | Date);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toDateOnly(value: unknown) {
  if (!value) return "-";
  const date = new Date(value as string | number | Date);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
  }).format(date);
}

export function AdminDashboard() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [summary, setSummary] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [insuredAccounts, setInsuredAccounts] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [insuranceTypes, setInsuranceTypes] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [activityPage, setActivityPage] = useState(1);
  const ACTIVITY_PAGE_SIZE = 10;
  const [usersPage, setUsersPage] = useState(1);
  const USERS_PAGE_SIZE = 10;
  const [assignmentsPage, setAssignmentsPage] = useState(1);
  const ASSIGNMENTS_PAGE_SIZE = 10;
  const [contractsPage, setContractsPage] = useState(1);
  const CONTRACTS_PAGE_SIZE = 10;
  const [loading, setLoading] = useState(true);
  const [userFormOpen, setUserFormOpen] = useState(false);
  const [insuranceTypeFormOpen, setInsuranceTypeFormOpen] = useState(false);
  const [contractFormOpen, setContractFormOpen] = useState(false);
  const [assignmentFormOpen, setAssignmentFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [medicalHistoryOpen, setMedicalHistoryOpen] = useState(false);
  const [selectedMedicalHistory, setSelectedMedicalHistory] =
    useState<string>("");
  const [userForm, setUserForm] = useState<UserFormState>({
    mode: "create",
    username: "",
    password: "",
    fullName: "",
    email: "",
    role: "INSURED",
    status: "Đang hoạt động",
  });
  const [insuranceTypeForm, setInsuranceTypeForm] =
    useState<InsuranceTypeFormState>({
      mode: "create",
      tenLoai: "",
      moTa: "",
    });
  const [contractForm, setContractForm] = useState<ContractFormState>({
    mode: "create",
    soHopDong: "",
    idNguoiduocBH: "",
    idLoai: "",
    idNguoiTao: "",
    ngayBatDau: "",
    ngayKetThuc: "",
    giaTri: "0",
    periodAmount: "0",
    trangThai: "Còn thời hạn",
  });
  const [assignmentForm, setAssignmentForm] = useState<AssignmentFormState>({
    idNguoiDung: "",
    tenNguoiDung: "",
    loaiPhanCong: "ACCOUNTANT",
    idLoai: "",
    ngayBatDau: "",
    ngayKetThuc: "",
  });

  const activeTab = (searchParams.get("tab") || "overview") as string;
  const contractSearchKeyword = String(searchParams.get("q") || "")
    .toLowerCase()
    .trim();

  const filteredContracts = useMemo(() => {
    if (!contractSearchKeyword) return contracts;

    return contracts.filter((entry) => {
      const searchable = [
        entry.SOHOPDONG,
        entry.TENKHACHHANG,
        entry.TENNHANVIEN,
        entry.TENLOAI,
        entry.TRANGTHAI,
        entry.NGAYBATDAU,
        entry.NGAYKETTHUC,
        entry.GIATRI,
      ]
        .map((value) => String(value || "").toLowerCase())
        .join(" ");

      return searchable.includes(contractSearchKeyword);
    });
  }, [contractSearchKeyword, contracts]);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      if (!user) return;

      try {
        const [
          summaryData,
          usersData,
          insuredAccountsData,
          contractsData,
          insuranceTypesData,
          assignmentsData,
          activityData,
        ] = await Promise.all([
          getDashboardSummary(user.role),
          getAdminUsers(user.role),
          getInsuredAccounts(user.role),
          getContracts(user.role),
          getInsuranceTypes(user.role),
          getAdminAssignments(user.role),
          getAdminActivity(user.role),
        ]);

        if (isMounted) {
          console.debug("loadData: activityData (from API)", activityData);
          setSummary(summaryData);
          setUsers(usersData);
          setInsuredAccounts(insuredAccountsData);
          setContracts(contractsData);
          setInsuranceTypes(insuranceTypesData);
          setAssignments(assignmentsData);
          setActivity(activityData);
          setActivityPage(1);
          setUsersPage(1);
          setAssignmentsPage(1);
          setContractsPage(1);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [user]);

  async function reloadAdminData() {
    if (!user) return;
    const [
      summaryData,
      usersData,
      contractsData,
      insuranceTypesData,
      assignmentsData,
      activityData,
    ] = await Promise.all([
      getDashboardSummary(user.role),
      getAdminUsers(user.role),
      getContracts(user.role),
      getInsuranceTypes(user.role),
      getAdminAssignments(user.role),
      getAdminActivity(user.role),
    ]);

    console.debug("reloadAdminData: activityData (from API)", activityData);
    setSummary(summaryData);
    setUsers(usersData);
    setContracts(contractsData);
    setInsuranceTypes(insuranceTypesData);
    setAssignments(assignmentsData);
    setActivity(activityData);
    setActivityPage(1);
    setUsersPage(1);
    setAssignmentsPage(1);
    setContractsPage(1);
  }

  function openAssignForm(entry: any) {
    const roleCode = String(entry.MAVAITRO || "").toUpperCase();
    if (!["ACCOUNTANT", "SUPERVISOR"].includes(roleCode)) {
      window.alert("Chỉ phân công cho tài khoản kế toán hoặc giám sát.");
      return;
    }

    setAssignmentForm({
      idNguoiDung: String(entry.IDNGUOIDUNG),
      tenNguoiDung: String(entry.HOTEN || entry.TENDANGNHAP || ""),
      loaiPhanCong: roleCode as "ACCOUNTANT" | "SUPERVISOR",
      idLoai: "",
      ngayBatDau: "",
      ngayKetThuc: "",
    });
    setAssignmentFormOpen(true);
  }

  function openMedicalHistoryFor(entry: any) {
    // Try to find the insured account record for this user
    const insured = insuredAccounts.find(
      (a) => String(a.IDNGUOIDUNG) === String(entry.IDNGUOIDUNG),
    );

    // If backend doesn't expose decrypted history yet, show placeholder
    const history =
      insured && (insured.LICHSUBENH || insured.LICHSUBENH_Decrypted)
        ? String(insured.LICHSUBENH || insured.LICHSUBENH_Decrypted)
        : "Chưa có dữ liệu lịch sử bệnh hoặc dữ liệu cần giải mã";

    setSelectedMedicalHistory(history);
    setMedicalHistoryOpen(true);
  }

  async function handleSubmitAssignmentForm(
    e: React.FormEvent<HTMLFormElement>,
  ) {
    e.preventDefault();
    if (!user) return;

    try {
      setSubmitting(true);
      if (!assignmentForm.idNguoiDung || !assignmentForm.idLoai) {
        throw new Error("Vui lòng chọn loại bảo hiểm để phân công");
      }

      await createAdminAssignment(
        {
          idNguoiDung: Number(assignmentForm.idNguoiDung),
          idLoai: Number(assignmentForm.idLoai),
          loaiPhanCong: assignmentForm.loaiPhanCong,
          ngayBatDau: assignmentForm.ngayBatDau || null,
          ngayKetThuc: assignmentForm.ngayKetThuc || null,
        },
        user.role,
      );

      setAssignmentFormOpen(false);
      await reloadAdminData();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Có lỗi xảy ra");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteAssignment(entry: any) {
    if (!user) return;
    const confirmed = window.confirm(
      `Gỡ phân công ${entry.TENLOAI} của ${entry.TENNGUOIDUNG}?`,
    );
    if (!confirmed) return;

    await deleteAdminAssignment(String(entry.IDPHANCONG), user.role);
    await reloadAdminData();
  }

  function openCreateAssignmentForm() {
    setAssignmentForm({
      idNguoiDung: "",
      tenNguoiDung: "",
      loaiPhanCong: "ACCOUNTANT",
      idLoai: "",
      ngayBatDau: "",
      ngayKetThuc: "",
    });
    setAssignmentFormOpen(true);
  }

  const assignmentCandidates = useMemo(
    () =>
      users.filter((entry) =>
        ["ACCOUNTANT", "SUPERVISOR"].includes(
          String(entry.MAVAITRO || "").toUpperCase(),
        ),
      ),
    [users],
  );

  function openCreateUserForm() {
    setUserForm({
      mode: "create",
      username: "",
      password: "",
      fullName: "",
      email: "",
      role: "INSURED",
      status: "Đang hoạt động",
    });
    setUserFormOpen(true);
  }

  function openEditUserForm(entry: any) {
    setUserForm({
      mode: "edit",
      id: Number(entry.IDNGUOIDUNG),
      username: String(entry.TENDANGNHAP || ""),
      password: "",
      fullName: String(entry.HOTEN || ""),
      email: String(entry.EMAIL || ""),
      role: String(entry.MAVAITRO || "INSURED").toUpperCase(),
      status: String(entry.TRANGTHAI || "Đang hoạt động"),
    });
    setUserFormOpen(true);
  }

  async function handleSubmitUserForm(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user) return;

    try {
      setSubmitting(true);

      if (!userForm.fullName.trim()) {
        throw new Error("Vui lòng nhập họ tên");
      }

      if (!userForm.email.trim()) {
        throw new Error("Vui lòng nhập email");
      }

      if (userForm.mode === "create") {
        if (!userForm.username.trim()) {
          throw new Error("Vui lòng nhập username");
        }

        if (!userForm.password.trim()) {
          throw new Error("Vui lòng nhập mật khẩu");
        }

        // Client-side pre-check to avoid server 409 on duplicate username
        try {
          const existing = await getAdminUsers(user.role);
          const normalized = userForm.username.trim().toLowerCase();
          if (
            existing.some(
              (u: any) =>
                String(u.TENDANGNHAP || "").toLowerCase() === normalized,
            )
          ) {
            throw new Error("Username already exists");
          }
        } catch (err) {
          // If fetching users failed, continue and let server validate
          console.warn("Pre-check for existing username failed:", err);
        }

        await createAdminUser(
          {
            username: userForm.username.trim(),
            password: userForm.password,
            fullName: userForm.fullName.trim(),
            email: userForm.email.trim(),
            role: userForm.role.toUpperCase(),
            status: userForm.status,
          },
          user.role,
        );
      } else {
        await updateAdminUser(
          String(userForm.id),
          {
            fullName: userForm.fullName.trim(),
            email: userForm.email.trim(),
            role: userForm.role.toUpperCase(),
            status: userForm.status,
          },
          user.role,
        );
      }

      setUserFormOpen(false);
      await reloadAdminData();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Có lỗi xảy ra");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteUser(entry: any) {
    if (!user) return;
    const confirmed = window.confirm(
      `Xóa người dùng ${entry.TENDANGNHAP}? Nếu có dữ liệu liên quan thì hệ thống sẽ chuyển sang ngưng hoạt động.`,
    );
    if (!confirmed) return;

    await deleteAdminUser(entry.IDNGUOIDUNG, user.role);
    await reloadAdminData();
  }

  function openCreateInsuranceTypeForm() {
    setInsuranceTypeForm({ mode: "create", tenLoai: "", moTa: "" });
    setInsuranceTypeFormOpen(true);
  }

  function openEditInsuranceTypeForm(entry: any) {
    setInsuranceTypeForm({
      mode: "edit",
      id: Number(entry.IDLOAI),
      tenLoai: String(entry.TENLOAI || ""),
      moTa: String(entry.MOTA || ""),
    });
    setInsuranceTypeFormOpen(true);
  }

  async function handleSubmitInsuranceTypeForm(
    e: React.FormEvent<HTMLFormElement>,
  ) {
    e.preventDefault();
    if (!user) return;

    try {
      setSubmitting(true);
      if (!insuranceTypeForm.tenLoai.trim()) {
        throw new Error("Vui lòng nhập tên loại bảo hiểm");
      }

      if (insuranceTypeForm.mode === "create") {
        await createInsuranceTypeAdmin(
          {
            tenLoai: insuranceTypeForm.tenLoai.trim(),
            moTa: insuranceTypeForm.moTa.trim(),
          },
          user.role,
        );
      } else {
        await updateInsuranceTypeAdmin(
          String(insuranceTypeForm.id),
          {
            tenLoai: insuranceTypeForm.tenLoai.trim(),
            moTa: insuranceTypeForm.moTa.trim(),
          },
          user.role,
        );
      }

      setInsuranceTypeFormOpen(false);
      await reloadAdminData();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Có lỗi xảy ra");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteInsuranceType(entry: any) {
    if (!user) return;
    const confirmed = window.confirm(`Xóa loại bảo hiểm ${entry.TENLOAI}?`);
    if (!confirmed) return;

    await deleteInsuranceTypeAdmin(entry.IDLOAI, user.role);
    await reloadAdminData();
  }

  function openCreateContractForm() {
    setContractForm({
      mode: "create",
      soHopDong: "",
      idNguoiduocBH: "",
      idLoai: "",
      idNguoiTao: "",
      ngayBatDau: "",
      ngayKetThuc: "",
      giaTri: "0",
      periodAmount: "0",
      trangThai: "Còn thời hạn",
    });
    setContractFormOpen(true);
  }

  function openEditContractForm(entry: any) {
    setContractForm({
      mode: "edit",
      id: Number(entry.IDHOPDONG),
      soHopDong: String(entry.SOHOPDONG || ""),
      idNguoiduocBH: String(entry.IDNGUOIDUOCBH || ""),
      idLoai: String(entry.IDLOAI || ""),
      idNguoiTao: String(entry.IDNGUOITAO || ""),
      ngayBatDau: toDateInputValue(entry.NGAYBATDAU),
      ngayKetThuc: toDateInputValue(entry.NGAYKETTHUC),
      giaTri: String(entry.GIATRI || 0),
      periodAmount: String(entry.PERIOD_AMOUNT || entry.SOTIENMOIKY || "0"),
      trangThai: String(entry.TRANGTHAI || "Còn thời hạn"),
    });
    setContractFormOpen(true);
  }

  async function handleSubmitContractForm(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user) return;

    try {
      setSubmitting(true);

      if (!contractForm.soHopDong.trim()) {
        throw new Error("Vui lòng nhập số hợp đồng");
      }

      if (
        !contractForm.idNguoiduocBH ||
        !contractForm.idLoai ||
        !contractForm.idNguoiTao ||
        !contractForm.ngayBatDau ||
        !contractForm.ngayKetThuc ||
        !contractForm.periodAmount
      ) {
        throw new Error("Vui lòng nhập đầy đủ thông tin bắt buộc của hợp đồng");
      }

      if (Number(contractForm.periodAmount) <= 0) {
        throw new Error("Số tiền mỗi kỳ phải lớn hơn 0");
      }

      if (
        Number(contractForm.periodAmount) > Number(contractForm.giaTri || 0)
      ) {
        throw new Error("Số tiền mỗi kỳ không được lớn hơn giá trị hợp đồng");
      }

      const payload = {
        soHopDong: contractForm.soHopDong.trim(),
        idNguoiduocBH: Number(contractForm.idNguoiduocBH),
        idLoai: Number(contractForm.idLoai),
        idNguoiTao: Number(contractForm.idNguoiTao),
        ngayBatDau: contractForm.ngayBatDau,
        ngayKetThuc: contractForm.ngayKetThuc,
        giaTri: Number(contractForm.giaTri || 0),
        periodAmount: Number(contractForm.periodAmount || 0),
        trangThai: contractForm.trangThai,
      };

      if (contractForm.mode === "create") {
        await createAdminContract(payload, user.role);
      } else {
        await updateAdminContract(String(contractForm.id), payload, user.role);
      }

      setContractFormOpen(false);
      await reloadAdminData();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Có lỗi xảy ra");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteContract(entry: any) {
    if (!user) return;
    const confirmed = window.confirm(`Xóa hợp đồng ${entry.SOHOPDONG}?`);
    if (!confirmed) return;

    await deleteAdminContract(entry.IDHOPDONG, user.role);
    await reloadAdminData();
  }

  const stats = useMemo(() => {
    const contractSummary = summary?.contracts || {};
    const paymentSummary = summary?.payments || {};

    return [
      {
        label: "Người dùng",
        value: users.length,
        detail: `${users.filter((entry) => entry.LOAI_TAI_KHOAN === "employee").length} nhân sự`,
        icon: Users,
        className: "bg-slate-100 text-slate-700",
      },
      {
        label: "Hợp đồng",
        value: contractSummary.TONGHOPDONG ?? contracts.length,
        detail: `${contractSummary.DANGHOATDONG ?? 0} hợp đồng hiệu lực`,
        icon: FileText,
        className: "bg-emerald-100 text-emerald-700",
      },
      {
        label: "Loại bảo hiểm",
        value: insuranceTypes.length,
        detail: "Danh mục quyền lợi bảo hiểm",
        icon: Shield,
        className: "bg-amber-100 text-amber-700",
      },
      {
        label: "Doanh thu",
        value: formatCurrency(paymentSummary.TONGTIEN ?? 0),
        detail: `${paymentSummary.DATHU ?? 0} đã thu`,
        icon: Wallet,
        className: "bg-sky-100 text-sky-700",
      },
    ];
  }, [contracts.length, insuranceTypes.length, summary, users]);

  const overviewActivity = activity.slice(0, 5);

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"
      >
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
            <Database className="h-3.5 w-3.5" />
            Trung tâm quản trị
          </div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            Bảng điều khiển quản trị
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Theo dõi người dùng, quản lý danh mục bảo hiểm, rà soát hợp đồng và
            kiểm tra hoạt động hệ thống tại một nơi.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button asChild variant="secondary">
            <Link to="/contracts">
              Mở danh sách hợp đồng
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild>
            <Link to="/dashboard">Quay lại bảng điều khiển</Link>
          </Button>
        </div>
      </motion.div>

      <Tabs
        value={activeTab}
        onValueChange={(value) => {
          const nextParams = new URLSearchParams(searchParams);
          if (value === "overview") {
            nextParams.delete("tab");
          } else {
            nextParams.set("tab", value);
          }
          setSearchParams(nextParams);
        }}
        className="space-y-6"
      >
        <TabsList className="grid h-auto w-full grid-cols-2 gap-2 rounded-2xl border border-border bg-muted/40 p-2 md:grid-cols-6">
          <TabsTrigger value="overview" className="w-full">
            Tổng quan
          </TabsTrigger>
          <TabsTrigger value="users" className="w-full">
            Người dùng
          </TabsTrigger>
          <TabsTrigger value="insurance-types" className="w-full">
            Loại bảo hiểm
          </TabsTrigger>
          <TabsTrigger value="contracts" className="w-full">
            Hợp đồng
          </TabsTrigger>
          <TabsTrigger value="assignments" className="w-full">
            Phân công
          </TabsTrigger>
          <TabsTrigger value="activity" className="w-full">
            Hoạt động
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon;

              return (
                <Card
                  key={stat.label}
                  className="overflow-hidden border-border/70"
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          {stat.label}
                        </p>
                        <div className="text-3xl font-semibold tracking-tight">
                          {stat.value}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {stat.detail}
                        </p>
                      </div>
                      <div className={`rounded-2xl p-3 ${stat.className}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
            <Card className="border-border/70">
              <CardHeader>
                <CardTitle>Hoạt động gần đây</CardTitle>
                <CardDescription>
                  Cập nhật mới nhất về hợp đồng, người dùng và thanh toán.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {overviewActivity.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
                    Chưa có hoạt động.
                  </div>
                ) : (
                  overviewActivity.map((entry) => (
                    <div
                      key={
                        entry.IDNHATKY ||
                        `${entry.ENTITY_TYPE}-${entry.ENTITY_ID}-${String(getEventAt(entry))}`
                      }
                      className="flex items-start gap-3 rounded-xl border border-border/70 p-4"
                    >
                      <div className="mt-1 rounded-full bg-muted p-2 text-muted-foreground">
                        <ActivityIcon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className="rounded-full">
                            {entry.ACTION_LABEL || getActivityLabel(entry)}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(getEventAt(entry))}
                          </span>
                        </div>
                        <p className="text-sm font-medium">
                          {getActivityDescription(entry)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Người thực hiện: {entry.ACTOR_NAME || "-"} · Trạng
                          thái: {entry.STATUS || "-"}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="border-border/70">
              <CardHeader>
                <CardTitle>Tổng quan hệ thống</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="rounded-2xl border border-border/70 bg-white px-4 py-3 shadow-sm">
                  <div className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Người dùng hiện tại
                  </div>
                  <div className="mt-1 text-base font-semibold text-foreground">
                    {user?.name}
                  </div>
                </div>
                <div className="rounded-2xl border border-border/70 bg-white px-4 py-3 shadow-sm">
                  <div className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Vai trò
                  </div>
                  <div className="mt-1 text-base font-semibold capitalize text-[#7c3aed]">
                    {user?.role}
                  </div>
                </div>
                <div className="rounded-2xl border border-border/70 bg-white px-4 py-3 shadow-sm">
                  <div className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Tổng người dùng
                  </div>
                  <div className="mt-1 text-2xl font-semibold text-[#0284c7]">
                    {users.length}
                  </div>
                </div>
                <div className="rounded-2xl border border-border/70 bg-white px-4 py-3 shadow-sm">
                  <div className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Hợp đồng
                  </div>
                  <div className="mt-1 text-2xl font-semibold text-[#059669]">
                    {contracts.length}
                  </div>
                </div>
                <div className="rounded-2xl border border-border/70 bg-white px-4 py-3 shadow-sm">
                  <div className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Loại bảo hiểm
                  </div>
                  <div className="mt-1 text-2xl font-semibold text-[#d97706]">
                    {insuranceTypes.length}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users">
          <Card className="border-border/70">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle>Người dùng</CardTitle>
                  <CardDescription>
                    Danh sách nhân sự và khách hàng được bảo hiểm.
                  </CardDescription>
                </div>
                <Button onClick={openCreateUserForm}>Thêm người dùng</Button>
              </div>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="pb-3 font-medium">Họ tên</th>
                    <th className="pb-3 font-medium">Tên đăng nhập</th>
                    <th className="pb-3 font-medium">Email</th>
                    <th className="pb-3 font-medium">Vai trò</th>
                    <th className="pb-3 font-medium">Loại tài khoản</th>
                    <th className="pb-3 font-medium">Trạng thái</th>
                    <th className="pb-3 font-medium">Loại được phân công</th>
                    <th className="pb-3 font-medium">Lịch sử bệnh</th>
                    <th className="pb-3 font-medium">Ngày tạo</th>
                    <th className="pb-3 font-medium">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length > 0
                    ? users
                        .slice(
                          (usersPage - 1) * USERS_PAGE_SIZE,
                          usersPage * USERS_PAGE_SIZE,
                        )
                        .map((entry) => {
                          const assignmentByUser = assignments.filter(
                            (item) =>
                              String(item.IDNGUOIDUNG) ===
                              String(entry.IDNGUOIDUNG),
                          );

                          return (
                            <tr
                              key={entry.IDNGUOIDUNG}
                              className="border-b border-border/60 last:border-0"
                            >
                              <td className="py-4 font-medium">
                                {entry.HOTEN || "-"}
                              </td>
                              <td className="py-4 text-muted-foreground">
                                {entry.TENDANGNHAP || "-"}
                              </td>
                              <td className="py-4 text-muted-foreground">
                                {entry.EMAIL || "-"}
                              </td>
                              <td className="py-4">
                                <Badge
                                  variant="outline"
                                  className="rounded-full capitalize"
                                >
                                  {String(entry.MAVAITRO || "-").toLowerCase()}
                                </Badge>
                              </td>
                              <td className="py-4 text-muted-foreground capitalize">
                                {entry.LOAI_TAI_KHOAN || "-"}
                              </td>
                              <td className="py-4">
                                <Badge
                                  variant="outline"
                                  className={`rounded-full ${getStatusTone(entry.TRANGTHAI)}`}
                                >
                                  {normalizeText(entry.TRANGTHAI) || "-"}
                                </Badge>
                              </td>
                              <td className="py-4">
                                {assignmentByUser.length === 0 ? (
                                  <span className="text-muted-foreground">
                                    -
                                  </span>
                                ) : (
                                  <div className="flex flex-wrap gap-2">
                                    {assignmentByUser.map((assignment) => (
                                      <div
                                        key={assignment.IDPHANCONG}
                                        className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-1 text-xs"
                                      >
                                        <span>{assignment.TENLOAI}</span>
                                        <button
                                          type="button"
                                          className="text-muted-foreground hover:text-foreground"
                                          onClick={() =>
                                            void handleDeleteAssignment(
                                              assignment,
                                            )
                                          }
                                        >
                                          x
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </td>
                              <td className="py-4">
                                {assignmentByUser.some((a) =>
                                  String(a.TENLOAI || "")
                                    .toLowerCase()
                                    .includes("sức khỏe"),
                                ) &&
                                insuredAccounts.some(
                                  (a) =>
                                    String(a.IDNGUOIDUNG) ===
                                    String(entry.IDNGUOIDUNG),
                                ) ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openMedicalHistoryFor(entry)}
                                  >
                                    Xem
                                  </Button>
                                ) : (
                                  <span className="text-muted-foreground">
                                    -
                                  </span>
                                )}
                              </td>
                              <td className="py-4 text-muted-foreground">
                                {formatDate(entry.NGAYTAO)}
                              </td>
                              <td className="py-4">
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openEditUserForm(entry)}
                                  >
                                    Sửa
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => void handleDeleteUser(entry)}
                                  >
                                    Xóa
                                  </Button>
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => openAssignForm(entry)}
                                  >
                                    Phân công
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                    : null}
                </tbody>
              </table>
              <Dialog
                open={medicalHistoryOpen}
                onOpenChange={setMedicalHistoryOpen}
              >
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Lịch sử bệnh</DialogTitle>
                    <DialogDescription>
                      Nội dung lịch sử bệnh (nếu có). Dữ liệu nhạy cảm có thể
                      cần được giải mã ở phía server trước khi hiển thị.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="mt-2 max-h-56 overflow-auto text-sm text-muted-foreground">
                    {selectedMedicalHistory}
                  </div>
                  <DialogFooter>
                    <Button onClick={() => setMedicalHistoryOpen(false)}>
                      Đóng
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              {/* Users pagination controls */}
              {users.length > USERS_PAGE_SIZE && (
                <div className="flex items-center justify-end gap-2 mt-3">
                  <button
                    className="px-2 py-1 rounded border"
                    onClick={() => setUsersPage((p) => Math.max(1, p - 1))}
                    disabled={usersPage === 1}
                  >
                    Prev
                  </button>
                  <span className="text-sm text-muted-foreground">
                    Trang {usersPage} /{" "}
                    {Math.ceil(users.length / USERS_PAGE_SIZE)}
                  </span>
                  <button
                    className="px-2 py-1 rounded border"
                    onClick={() =>
                      setUsersPage((p) =>
                        Math.min(
                          Math.ceil(users.length / USERS_PAGE_SIZE),
                          p + 1,
                        ),
                      )
                    }
                    disabled={
                      usersPage >= Math.ceil(users.length / USERS_PAGE_SIZE)
                    }
                  >
                    Next
                  </button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insurance-types">
          <Card className="border-border/70">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle>Loại bảo hiểm</CardTitle>
                  <CardDescription>
                    Danh mục và số lượng sử dụng của từng loại trong hệ thống.
                  </CardDescription>
                </div>
                <Button onClick={openCreateInsuranceTypeForm}>
                  Thêm loại bảo hiểm
                </Button>
              </div>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="pb-3 font-medium">ID</th>
                    <th className="pb-3 font-medium">Loại</th>
                    <th className="pb-3 font-medium">Mô tả</th>
                    <th className="pb-3 font-medium">Hợp đồng</th>
                    <th className="pb-3 font-medium">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {insuranceTypes.map((entry) => (
                    <tr
                      key={entry.IDLOAI}
                      className="border-b border-border/60 last:border-0"
                    >
                      <td className="py-4 font-medium">{entry.IDLOAI}</td>
                      <td className="py-4">{entry.TENLOAI}</td>
                      <td className="py-4 text-muted-foreground">
                        {entry.MOTA || "-"}
                      </td>
                      <td className="py-4 text-muted-foreground">
                        {entry.SOLUONG_HOPDONG ?? 0}
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditInsuranceTypeForm(entry)}
                          >
                            Sửa
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() =>
                              void handleDeleteInsuranceType(entry)
                            }
                          >
                            Xóa
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contracts">
          <Card className="border-border/70">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle>Hợp đồng</CardTitle>
                  <CardDescription>
                    Danh sách hợp đồng đầy đủ theo người tạo và trạng thái.
                  </CardDescription>
                  {contractSearchKeyword ? (
                    <p className="text-xs text-muted-foreground">
                      Đang lọc theo từ khóa: "{contractSearchKeyword}"
                    </p>
                  ) : null}
                </div>
                <Button onClick={openCreateContractForm}>Thêm hợp đồng</Button>
              </div>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full min-w-[1000px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="pb-3 font-medium">Số hợp đồng</th>
                    <th className="pb-3 font-medium">Khách hàng</th>
                    <th className="pb-3 font-medium">Người tạo</th>
                    <th className="pb-3 font-medium">Loại bảo hiểm</th>
                    <th className="pb-3 font-medium">Giá trị</th>
                    <th className="pb-3 font-medium">Trạng thái</th>
                    <th className="pb-3 font-medium">Ngày bắt đầu</th>
                    <th className="pb-3 font-medium">Ngày kết thúc</th>
                    <th className="pb-3 font-medium">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredContracts.length > 0
                    ? filteredContracts
                        .slice(
                          (contractsPage - 1) * CONTRACTS_PAGE_SIZE,
                          contractsPage * CONTRACTS_PAGE_SIZE,
                        )
                        .map((entry) => (
                          <tr
                            key={entry.IDHOPDONG}
                            className="border-b border-border/60 last:border-0"
                          >
                            <td className="py-4 font-medium">
                              {entry.SOHOPDONG}
                            </td>
                            <td className="py-4 text-muted-foreground">
                              {normalizeText(entry.TENKHACHHANG)}
                            </td>
                            <td className="py-4 text-muted-foreground">
                              {normalizeText(entry.TENNHANVIEN)}
                            </td>
                            <td className="py-4 text-muted-foreground">
                              {normalizeText(entry.TENLOAI)}
                            </td>
                            <td className="py-4 text-muted-foreground">
                              {formatCurrency(entry.GIATRI)}
                            </td>
                            <td className="py-4">
                              <Badge
                                variant="outline"
                                className={`rounded-full ${getStatusTone(entry.TRANGTHAI)}`}
                              >
                                {normalizeText(entry.TRANGTHAI) || "-"}
                              </Badge>
                            </td>
                            <td className="py-4 text-muted-foreground">
                              {formatDate(entry.NGAYBATDAU)}
                            </td>
                            <td className="py-4 text-muted-foreground">
                              {formatDate(entry.NGAYKETTHUC)}
                            </td>
                            <td className="py-4">
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openEditContractForm(entry)}
                                >
                                  Sửa
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() =>
                                    void handleDeleteContract(entry)
                                  }
                                >
                                  Xóa
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                    : null}
                  {filteredContracts.length === 0 ? (
                    <tr>
                      <td
                        colSpan={9}
                        className="py-8 text-center text-muted-foreground"
                      >
                        Không có hợp đồng phù hợp với bộ lọc hiện tại.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assignments">
          <Card className="border-border/70">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle>Phân công nhiệm vụ</CardTitle>
                  <CardDescription>
                    Giao loại bảo hiểm cho kế toán và giám sát.
                  </CardDescription>
                </div>
                <Button onClick={openCreateAssignmentForm}>
                  Phân công mới
                </Button>
              </div>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full min-w-[1000px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="pb-3 font-medium">Người dùng</th>
                    <th className="pb-3 font-medium">Tên đăng nhập</th>
                    <th className="pb-3 font-medium">Vai trò</th>
                    <th className="pb-3 font-medium">Loại bảo hiểm</th>
                    <th className="pb-3 font-medium">Ngày bắt đầu</th>
                    <th className="pb-3 font-medium">Ngày kết thúc</th>
                    <th className="pb-3 font-medium">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.length > 0 ? (
                    assignments
                      .slice(
                        (assignmentsPage - 1) * ASSIGNMENTS_PAGE_SIZE,
                        assignmentsPage * ASSIGNMENTS_PAGE_SIZE,
                      )
                      .map((entry) => (
                        <tr
                          key={entry.IDPHANCONG}
                          className="border-b border-border/60 last:border-0"
                        >
                          <td className="py-4 font-medium">
                            {entry.TENNGUOIDUNG || "-"}
                          </td>
                          <td className="py-4 text-muted-foreground">
                            {entry.TENDANGNHAP || "-"}
                          </td>
                          <td className="py-4">
                            <Badge variant="outline" className="rounded-full">
                              {entry.MAVAITRO || "-"}
                            </Badge>
                          </td>
                          <td className="py-4 text-muted-foreground">
                            {entry.TENLOAI || "-"}
                          </td>
                          <td className="py-4 text-muted-foreground">
                            {toDateOnly(entry.NGAYBATDAU)}
                          </td>
                          <td className="py-4 text-muted-foreground">
                            {toDateOnly(entry.NGAYKETTHUC)}
                          </td>
                          <td className="py-4">
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => void handleDeleteAssignment(entry)}
                            >
                              Xóa
                            </Button>
                          </td>
                        </tr>
                      ))
                  ) : (
                    <tr>
                      <td
                        colSpan={7}
                        className="py-10 text-center text-muted-foreground"
                      >
                        Chưa có phân công.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              {assignments.length > ASSIGNMENTS_PAGE_SIZE && (
                <div className="flex items-center justify-end gap-2 mt-3">
                  <button
                    className="px-2 py-1 rounded border"
                    onClick={() =>
                      setAssignmentsPage((p) => Math.max(1, p - 1))
                    }
                    disabled={assignmentsPage === 1}
                  >
                    Prev
                  </button>
                  <span className="text-sm text-muted-foreground">
                    Trang {assignmentsPage} /{" "}
                    {Math.ceil(assignments.length / ASSIGNMENTS_PAGE_SIZE)}
                  </span>
                  <button
                    className="px-2 py-1 rounded border"
                    onClick={() =>
                      setAssignmentsPage((p) =>
                        Math.min(
                          Math.ceil(assignments.length / ASSIGNMENTS_PAGE_SIZE),
                          p + 1,
                        ),
                      )
                    }
                    disabled={
                      assignmentsPage >=
                      Math.ceil(assignments.length / ASSIGNMENTS_PAGE_SIZE)
                    }
                  >
                    Next
                  </button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card className="border-border/70">
            <CardHeader>
              <CardTitle>Nhật ký hoạt động</CardTitle>
              <CardDescription>
                Ai đã làm gì và vào thời điểm nào trên toàn hệ thống.
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full min-w-[1100px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="pb-3 font-medium">Thời gian</th>
                    <th className="pb-3 font-medium">Hành động</th>
                    <th className="pb-3 font-medium">Đối tượng</th>
                    <th className="pb-3 font-medium">Người thực hiện</th>
                    <th className="pb-3 font-medium">Mục tiêu</th>
                    <th className="pb-3 font-medium">Chi tiết</th>
                    <th className="pb-3 font-medium">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {activity.length > 0 ? (
                    activity
                      .slice(
                        (activityPage - 1) * ACTIVITY_PAGE_SIZE,
                        activityPage * ACTIVITY_PAGE_SIZE,
                      )
                      .map((entry) => (
                        <tr
                          key={
                            entry.IDNHATKY ||
                            `${entry.ENTITY_TYPE}-${entry.ENTITY_ID}-${String(getEventAt(entry))}`
                          }
                          className="border-b border-border/60 last:border-0"
                        >
                          <td className="py-4 text-muted-foreground">
                            {formatDate(getEventAt(entry))}
                          </td>
                          <td className="py-4">
                            <Badge variant="outline" className="rounded-full">
                              {entry.ACTION_LABEL || getActivityLabel(entry)}
                            </Badge>
                          </td>
                          <td className="py-4 text-muted-foreground">
                            {entry.ENTITY_NAME || "-"}
                          </td>
                          <td className="py-4 text-muted-foreground">
                            {entry.ACTOR_NAME || "-"}
                          </td>
                          <td className="py-4 text-muted-foreground">
                            {entry.TARGET_NAME || "-"}
                          </td>
                          <td className="py-4 text-muted-foreground">
                            {entry.DETAIL || "-"}
                          </td>
                          <td className="py-4">
                            <Badge
                              variant="outline"
                              className={`rounded-full ${getStatusTone(entry.STATUS)}`}
                            >
                              {entry.STATUS || "-"}
                            </Badge>
                          </td>
                        </tr>
                      ))
                  ) : (
                    <tr>
                      <td
                        colSpan={7}
                        className="py-10 text-center text-muted-foreground"
                      >
                        Chưa có hoạt động nào.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              {activity.length > ACTIVITY_PAGE_SIZE && (
                <div className="flex items-center justify-end gap-2 mt-3">
                  <button
                    className="px-2 py-1 rounded border"
                    onClick={() => setActivityPage((p) => Math.max(1, p - 1))}
                    disabled={activityPage === 1}
                  >
                    Prev
                  </button>
                  <span className="text-sm text-muted-foreground">
                    Trang {activityPage} /{" "}
                    {Math.ceil(activity.length / ACTIVITY_PAGE_SIZE)}
                  </span>
                  <button
                    className="px-2 py-1 rounded border"
                    onClick={() =>
                      setActivityPage((p) =>
                        Math.min(
                          Math.ceil(activity.length / ACTIVITY_PAGE_SIZE),
                          p + 1,
                        ),
                      )
                    }
                    disabled={
                      activityPage >=
                      Math.ceil(activity.length / ACTIVITY_PAGE_SIZE)
                    }
                  >
                    Next
                  </button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={userFormOpen} onOpenChange={setUserFormOpen}>
        <DialogContent className="z-50">
          <DialogHeader>
            <DialogTitle>
              {userForm.mode === "create"
                ? "Thêm người dùng"
                : "Sửa người dùng"}
            </DialogTitle>
            <DialogDescription>
              {userForm.mode === "create"
                ? "Nhập thông tin để tạo tài khoản mới."
                : "Cập nhật thông tin người dùng."}
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleSubmitUserForm}>
            <div className="grid gap-2">
              <Label htmlFor="user-fullName">Họ tên</Label>
              <Input
                id="user-fullName"
                value={userForm.fullName}
                onChange={(e) =>
                  setUserForm((prev) => ({ ...prev, fullName: e.target.value }))
                }
                required
              />
            </div>

            {userForm.mode === "create" ? (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="user-username">Username</Label>
                  <Input
                    id="user-username"
                    value={userForm.username}
                    onChange={(e) =>
                      setUserForm((prev) => ({
                        ...prev,
                        username: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="user-password">Mật khẩu</Label>
                  <Input
                    id="user-password"
                    type="password"
                    value={userForm.password}
                    onChange={(e) =>
                      setUserForm((prev) => ({
                        ...prev,
                        password: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="user-email">Email</Label>
                <Input
                  id="user-email"
                  type="email"
                  value={userForm.email}
                  onChange={(e) =>
                    setUserForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="user-role">Role</Label>
                <select
                  id="user-role"
                  className="border-input bg-input-background h-9 rounded-md border px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                  value={userForm.role}
                  onChange={(e) =>
                    setUserForm((prev) => ({ ...prev, role: e.target.value }))
                  }
                >
                  <option value="ADMIN">ADMIN</option>
                  <option value="CREATOR">CREATOR</option>
                  <option value="ACCOUNTANT">ACCOUNTANT</option>
                  <option value="SUPERVISOR">SUPERVISOR</option>
                  <option value="INSURED">INSURED</option>
                </select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="user-status">Trạng thái</Label>
              <select
                id="user-status"
                className="border-input bg-input-background h-9 rounded-md border px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                value={userForm.status}
                onChange={(e) =>
                  setUserForm((prev) => ({ ...prev, status: e.target.value }))
                }
              >
                <option value="Đang hoạt động">Đang hoạt động</option>
                <option value="Ngưng hoạt động">Ngưng hoạt động</option>
              </select>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setUserFormOpen(false)}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting
                  ? "Đang lưu..."
                  : userForm.mode === "create"
                    ? "Tạo user"
                    : "Lưu thay đổi"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={insuranceTypeFormOpen}
        onOpenChange={setInsuranceTypeFormOpen}
      >
        <DialogContent className="z-50">
          <DialogHeader>
            <DialogTitle>
              {insuranceTypeForm.mode === "create"
                ? "Thêm loại bảo hiểm"
                : "Sửa loại bảo hiểm"}
            </DialogTitle>
            <DialogDescription>
              Quản lý danh mục loại bảo hiểm.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleSubmitInsuranceTypeForm}>
            <div className="grid gap-2">
              <Label htmlFor="type-name">Tên loại bảo hiểm</Label>
              <Input
                id="type-name"
                value={insuranceTypeForm.tenLoai}
                onChange={(e) =>
                  setInsuranceTypeForm((prev) => ({
                    ...prev,
                    tenLoai: e.target.value,
                  }))
                }
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="type-description">Mô tả</Label>
              <Textarea
                id="type-description"
                value={insuranceTypeForm.moTa}
                onChange={(e) =>
                  setInsuranceTypeForm((prev) => ({
                    ...prev,
                    moTa: e.target.value,
                  }))
                }
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setInsuranceTypeFormOpen(false)}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting
                  ? "Đang lưu..."
                  : insuranceTypeForm.mode === "create"
                    ? "Tạo loại bảo hiểm"
                    : "Lưu thay đổi"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={contractFormOpen} onOpenChange={setContractFormOpen}>
        <DialogContent className="sm:max-w-2xl z-50">
          <DialogHeader>
            <DialogTitle>
              {contractForm.mode === "create"
                ? "Thêm hợp đồng"
                : "Sửa hợp đồng"}
            </DialogTitle>
            <DialogDescription>
              Nhập thông tin hợp đồng để tạo mới hoặc cập nhật.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleSubmitContractForm}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="contract-number">Số hợp đồng</Label>
                <Input
                  id="contract-number"
                  value={contractForm.soHopDong}
                  onChange={(e) =>
                    setContractForm((prev) => ({
                      ...prev,
                      soHopDong: e.target.value,
                    }))
                  }
                  disabled={contractForm.mode === "edit"}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="contract-value">Giá trị</Label>
                <Input
                  id="contract-value"
                  type="number"
                  value={contractForm.giaTri}
                  onChange={(e) =>
                    setContractForm((prev) => ({
                      ...prev,
                      giaTri: e.target.value,
                    }))
                  }
                  min={0}
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="grid gap-2">
                <Label htmlFor="contract-insured">ID người được BH</Label>
                <select
                  id="contract-insured"
                  className="border-input bg-background h-11 w-full rounded-md border px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                  value={contractForm.idNguoiduocBH}
                  onChange={(e) =>
                    setContractForm((prev) => ({
                      ...prev,
                      idNguoiduocBH: e.target.value,
                    }))
                  }
                  required
                >
                  <option value="">Chọn người được bảo hiểm</option>
                  {insuredAccounts.map((a) => (
                    <option
                      key={String(a.IDNGUOIDUOCBH)}
                      value={String(a.IDNGUOIDUOCBH)}
                    >
                      {String(
                        a.HOTEN ||
                          a.TENDANGNHAP ||
                          `Insured ${a.IDNGUOIDUOCBH}`,
                      )}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="contract-period-amount">Số tiền mỗi kỳ</Label>
                <Input
                  id="contract-period-amount"
                  type="number"
                  value={contractForm.periodAmount}
                  onChange={(e) =>
                    setContractForm((prev) => ({
                      ...prev,
                      periodAmount: e.target.value,
                    }))
                  }
                  min={1}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="contract-type-id">ID loại BH</Label>
                <select
                  id="contract-type-id"
                  className="border-input bg-background h-11 w-full rounded-md border px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                  value={contractForm.idLoai}
                  onChange={(e) =>
                    setContractForm((prev) => ({
                      ...prev,
                      idLoai: e.target.value,
                    }))
                  }
                  required
                >
                  <option value="">Chọn loại bảo hiểm</option>
                  {insuranceTypes.map((t) => (
                    <option key={String(t.IDLOAI)} value={String(t.IDLOAI)}>
                      {String(t.TENLOAI || `Loại ${t.IDLOAI}`)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="contract-creator-id">ID người tạo</Label>
                <select
                  id="contract-creator-id"
                  className="border-input bg-background h-11 w-full rounded-md border px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                  value={contractForm.idNguoiTao}
                  onChange={(e) =>
                    setContractForm((prev) => ({
                      ...prev,
                      idNguoiTao: e.target.value,
                    }))
                  }
                  required
                >
                  <option value="">Chọn người tạo</option>
                  {users.map((u) => (
                    <option
                      key={String(u.IDNGUOIDUNG)}
                      value={String(u.IDNGUOIDUNG)}
                    >
                      {String(
                        u.HOTEN || u.TENDANGNHAP || `User ${u.IDNGUOIDUNG}`,
                      )}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="contract-start">Ngày bắt đầu</Label>
                <Input
                  id="contract-start"
                  type="date"
                  value={contractForm.ngayBatDau}
                  onChange={(e) =>
                    setContractForm((prev) => ({
                      ...prev,
                      ngayBatDau: e.target.value,
                    }))
                  }
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="contract-end">Ngày kết thúc</Label>
                <Input
                  id="contract-end"
                  type="date"
                  value={contractForm.ngayKetThuc}
                  onChange={(e) =>
                    setContractForm((prev) => ({
                      ...prev,
                      ngayKetThuc: e.target.value,
                    }))
                  }
                  required
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="contract-status">Trạng thái</Label>
              <Input
                id="contract-status"
                value={contractForm.trangThai}
                onChange={(e) =>
                  setContractForm((prev) => ({
                    ...prev,
                    trangThai: e.target.value,
                  }))
                }
                required
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setContractFormOpen(false)}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting
                  ? "Đang lưu..."
                  : contractForm.mode === "create"
                    ? "Tạo hợp đồng"
                    : "Lưu thay đổi"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={assignmentFormOpen} onOpenChange={setAssignmentFormOpen}>
        <DialogContent className="z-50">
          <DialogHeader>
            <DialogTitle>Phân công loại bảo hiểm</DialogTitle>
            <DialogDescription>
              Giao loại bảo hiểm cho kế toán hoặc giám sát theo nhân sự.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleSubmitAssignmentForm}>
            <div className="grid gap-2">
              <Label>Nhân sự</Label>
              <select
                className="border-input bg-input-background h-9 rounded-md border px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                value={assignmentForm.idNguoiDung}
                onChange={(e) => {
                  const selected = assignmentCandidates.find(
                    (candidate) =>
                      String(candidate.IDNGUOIDUNG) === String(e.target.value),
                  );
                  setAssignmentForm((prev) => ({
                    ...prev,
                    idNguoiDung: e.target.value,
                    tenNguoiDung: String(
                      selected?.HOTEN || selected?.TENDANGNHAP || "",
                    ),
                    loaiPhanCong: String(
                      selected?.MAVAITRO || "ACCOUNTANT",
                    ).toUpperCase() as "ACCOUNTANT" | "SUPERVISOR",
                  }));
                }}
                required
              >
                <option value="">Chọn nhân sự</option>
                {assignmentCandidates.map((candidate) => (
                  <option
                    key={candidate.IDNGUOIDUNG}
                    value={String(candidate.IDNGUOIDUNG)}
                  >
                    {candidate.HOTEN || candidate.TENDANGNHAP} (
                    {candidate.MAVAITRO})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="assignment-role">Loại phân công</Label>
              <Input
                id="assignment-role"
                value={assignmentForm.loaiPhanCong}
                disabled
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="assignment-insurance-type">Loại bảo hiểm</Label>
              <select
                id="assignment-insurance-type"
                className="border-input bg-input-background h-9 rounded-md border px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                value={assignmentForm.idLoai}
                onChange={(e) =>
                  setAssignmentForm((prev) => ({
                    ...prev,
                    idLoai: e.target.value,
                  }))
                }
                required
              >
                <option value="">Chọn loại bảo hiểm</option>
                {insuranceTypes.map((item) => (
                  <option key={item.IDLOAI} value={String(item.IDLOAI)}>
                    {item.TENLOAI}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="assignment-start">Ngày bắt đầu</Label>
                <Input
                  id="assignment-start"
                  type="date"
                  value={assignmentForm.ngayBatDau}
                  onChange={(e) =>
                    setAssignmentForm((prev) => ({
                      ...prev,
                      ngayBatDau: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="assignment-end">Ngày kết thúc</Label>
                <Input
                  id="assignment-end"
                  type="date"
                  value={assignmentForm.ngayKetThuc}
                  onChange={(e) =>
                    setAssignmentForm((prev) => ({
                      ...prev,
                      ngayKetThuc: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAssignmentFormOpen(false)}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Đang lưu..." : "Lưu phân công"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {loading ? (
        <div className="text-sm text-muted-foreground">
          Loading admin data...
        </div>
      ) : null}
    </div>
  );
}
