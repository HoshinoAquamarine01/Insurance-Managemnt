import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Search, Filter, Edit, Eye, FileText } from "lucide-react";
import { motion } from "motion/react";
import {
  Link,
  useLocation,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  getContracts,
  getCustomerPayments,
  getExpiredContracts,
} from "../../services/api";

const CONTRACT_OVERRIDES_KEY = "insurance_contract_overrides";

type ContractOverride = {
  fullName?: string;
  insuranceType?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
};

function readContractOverrides() {
  try {
    const raw = window.localStorage.getItem(CONTRACT_OVERRIDES_KEY);
    return raw ? (JSON.parse(raw) as Record<string, ContractOverride>) : {};
  } catch {
    return {};
  }
}

function mergeContract(
  contract: any,
  overrides: Record<string, ContractOverride>,
) {
  const override = overrides[String(contract.IDHOPDONG || "")];
  if (!override) return contract;

  const merged = { ...contract };

  if (override.fullName) merged.TENKHACHHANG = override.fullName;
  if (override.insuranceType) {
    merged.TENLOAI =
      insuranceTypeById[String(override.insuranceType)] ||
      override.insuranceType;
    merged.IDLOAI = override.insuranceType;
  }
  if (override.startDate) merged.NGAYBATDAU = override.startDate;
  if (override.endDate) merged.NGAYKETTHUC = override.endDate;
  if (override.status) merged.TRANGTHAI = override.status;

  return merged;
}

const statusColors: Record<string, string> = {
  active: "bg-status-active/10 text-status-active",
  pending: "bg-status-pending/10 text-status-pending",
  draft: "bg-status-draft/10 text-status-draft",
  expired: "bg-status-expired/10 text-status-expired",
  "còn thời hạn": "bg-status-active/10 text-status-active",
  "đang hiệu lực": "bg-status-active/10 text-status-active",
  "đã hết hạn": "bg-status-expired/10 text-status-expired",
  "hết hạn": "bg-status-expired/10 text-status-expired",
};

const insuranceTypeById: Record<string, string> = {
  "1": "Bảo hiểm sức khỏe",
  "2": "Bảo hiểm nhân thọ",
  "3": "Bảo hiểm xe cơ giới",
  "4": "Bảo hiểm tài sản",
};

function normalizeText(value: unknown) {
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

function getContractEndDate(value: unknown) {
  if (!value) return null;

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }

  const raw = normalizeText(value).trim();
  if (!raw) return null;

  const dateOnlyMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;

  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
}

function normalizeStatus(value: unknown, endDate?: string) {
  let text = normalizeText(value).toLowerCase().trim();

  // Check if contract has passed end date - should be expired
  const endLocalDate = getContractEndDate(endDate);
  if (endLocalDate) {
    const todayLocalDate = new Date();
    todayLocalDate.setHours(0, 0, 0, 0);

    if (endLocalDate < todayLocalDate) {
      return "Đã hết hạn";
    }
  }

  // Replace corrupted patterns with clean text
  text = text
    .replace(/th\?i h\?n|thời hạn/, "thời hạn")
    .replace(/hiệu lực|hi\?u l\?c/, "hiệu lực")
    .replace(/hết hạn|h\?t h\?n/, "hết hạn")
    .replace(/đã|da/, "đã")
    .replace(/còn|c\?n/, "còn");

  if (
    (text.includes("còn") && text.includes("thời hạn")) ||
    text.includes("đang hiệu lực")
  ) {
    return "Còn thời hạn";
  }
  if (text.includes("đã") && text.includes("hết hạn")) {
    return "Đã hết hạn";
  }

  return normalizeText(value) || "Chưa cập nhật";
}

function getInstallmentStatusLabel(value: unknown) {
  const text = normalizeText(value).toLowerCase().trim();

  if (text.includes("đã") || text.includes("da")) {
    return "Đã thanh toán";
  }

  if (
    text.includes("chưa") ||
    text.includes("chua") ||
    text.includes("pending")
  ) {
    return "Chưa đóng";
  }

  return "Chưa đóng";
}

function getInstallmentStatusTone(value: unknown) {
  const label = getInstallmentStatusLabel(value);
  return label === "Đã thanh toán"
    ? "bg-status-active/10 text-status-active"
    : "bg-status-pending/10 text-status-pending";
}

export function ContractsListPage() {
  const location = useLocation();
  const { id: contractId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const [contracts, setContracts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState(
    () => searchParams.get("q") || "",
  );
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [installments, setInstallments] = useState<any[]>([]);
  const [installmentsLoading, setInstallmentsLoading] = useState(false);
  const [installmentsError, setInstallmentsError] = useState("");
  const isCreator = user?.role === "creator";
  const showPaymentColumn = user?.role !== "supervisor";
  const isHistoryPage = location.pathname === "/contracts/history";
  const detailReturnPath =
    (location.state as { from?: string } | null | undefined)?.from ||
    (isHistoryPage ? "/contracts/history" : "/contracts");

  useEffect(() => {
    const query = searchParams.get("q") || "";
    setSearchTerm((prev) => (prev === query ? prev : query));
  }, [searchParams]);

  useEffect(() => {
    let isMounted = true;

    async function loadContracts() {
      if (!user) return;

      try {
        const data = isHistoryPage
          ? await getExpiredContracts(user.role)
          : await getContracts(user.role);
        if (isMounted) {
          setContracts(data);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadContracts();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const filteredContracts = useMemo(() => {
    const overrides = readContractOverrides();
    const scopedContracts = isCreator
      ? contracts.filter(
          (contract) =>
            String(contract.IDNGUOIDUNG || "") === String(user?.id || ""),
        )
      : contracts;

    const todayLocalDate = new Date();
    todayLocalDate.setHours(0, 0, 0, 0);
    const mergedSourceContracts = scopedContracts.map((contract) =>
      mergeContract(contract, overrides),
    );

    const sourceContracts = isHistoryPage
      ? mergedSourceContracts.filter((contract) => {
          const normalizedStatus = normalizeStatus(
            contract.TRANGTHAI,
            contract.NGAYKETTHUC,
          )
            .toLowerCase()
            .trim();

          if (
            normalizedStatus === "đã hết hạn" ||
            normalizedStatus === "hết hạn"
          ) {
            return true;
          }

          const endLocalDate = getContractEndDate(contract.NGAYKETTHUC);
          return Boolean(endLocalDate && endLocalDate < todayLocalDate);
        })
      : mergedSourceContracts;

    return sourceContracts.filter((contract) => {
      const id = String(contract.IDHOPDONG || "").toLowerCase();
      const client = normalizeText(contract.TENKHACHHANG).toLowerCase();
      const type = (
        insuranceTypeById[String(contract.IDLOAI || "")] ||
        normalizeText(contract.TENLOAI)
      ).toLowerCase();
      const status = normalizeStatus(
        contract.TRANGTHAI,
        contract.NGAYKETTHUC,
      ).toLowerCase();
      const matchesSearch =
        client.includes(searchTerm.toLowerCase()) ||
        id.includes(searchTerm.toLowerCase()) ||
        type.includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [contracts, searchTerm, statusFilter, isHistoryPage, user?.id, isCreator]);

  const selectedContract = useMemo(() => {
    if (!contractId) return null;

    const overrides = readContractOverrides();

    const scopedContracts = isCreator
      ? contracts.filter(
          (contract) =>
            String(contract.IDNGUOIDUNG || "") === String(user?.id || ""),
        )
      : contracts;

    const contract =
      scopedContracts.find(
        (contract) => String(contract.IDHOPDONG || "") === String(contractId),
      ) || null;

    return contract ? mergeContract(contract, overrides) : null;
  }, [contractId, contracts, user?.id, isCreator]);

  useEffect(() => {
    let isMounted = true;

    async function loadInstallments() {
      if (!selectedContract || !user) {
        setInstallments([]);
        setInstallmentsError("");
        setInstallmentsLoading(false);
        return;
      }

      const insuredUserId = String(
        selectedContract.IDNGUOIDUNG_BAOHIEM ||
          selectedContract.IDNGUOIDUNG ||
          "",
      );

      if (!insuredUserId) {
        setInstallments([]);
        setInstallmentsError(
          "Không tìm thấy người được bảo hiểm của hợp đồng này.",
        );
        setInstallmentsLoading(false);
        return;
      }

      try {
        setInstallmentsLoading(true);
        setInstallmentsError("");
        const data = await getCustomerPayments(insuredUserId, user.role);
        if (isMounted) {
          const filtered = data.filter(
            (item) =>
              String(item.IDHOPDONG || "") ===
              String(selectedContract.IDHOPDONG || ""),
          );
          setInstallments(filtered);
        }
      } catch (error) {
        if (isMounted) {
          setInstallments([]);
          setInstallmentsError(
            error instanceof Error
              ? error.message
              : "Không tải được kỳ phí của hợp đồng.",
          );
        }
      } finally {
        if (isMounted) {
          setInstallmentsLoading(false);
        }
      }
    }

    loadInstallments();

    return () => {
      isMounted = false;
    };
  }, [selectedContract, user]);

  const backLink = detailReturnPath;

  return (
    <div className="w-full space-y-8 pb-4">
      <div className="flex w-full flex-col gap-4 rounded-3xl border border-border/60 bg-card/90 p-6 shadow-sm lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl space-y-2">
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display"
            style={{ fontSize: "2.25rem", fontWeight: 600 }}
          >
            {isHistoryPage
              ? "Lịch sử hợp đồng của tôi"
              : isCreator
                ? "Hợp đồng của tôi"
                : "Danh sách hợp đồng"}
          </motion.h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            {isHistoryPage
              ? "Lịch sử các hợp đồng của bạn đã kết thúc."
              : isCreator
                ? "Danh sách hợp đồng do bạn tạo."
                : "Danh sách hợp đồng trong phạm vi được phân công."}
          </p>
        </div>
        {!isHistoryPage && isCreator && (
          <Button asChild className="w-full lg:w-auto">
            <Link to="/contracts/create">Tạo Hợp Đồng Mới</Link>
          </Button>
        )}
      </div>

      {contractId && (
        <Card className="w-full overflow-hidden rounded-3xl border-border/70 shadow-sm">
          <CardHeader className="flex flex-col items-start justify-between gap-4 border-b border-border/60 bg-muted/20 p-6 sm:flex-row sm:items-center">
            <div className="space-y-1">
              <CardTitle>Chi tiết hợp đồng</CardTitle>
              <CardDescription>
                {selectedContract
                  ? `Đang xem hợp đồng ${selectedContract.IDHOPDONG}`
                  : "Hợp đồng đã chọn không tồn tại trong danh sách hợp đồng của bạn."}
              </CardDescription>
            </div>
            <Button variant="outline" asChild>
              <Link to={backLink}>Quay lại danh sách</Link>
            </Button>
          </CardHeader>
          {selectedContract && (
            <CardContent className="grid gap-5 p-6 md:grid-cols-2 xl:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">Contract ID</p>
                <p className="font-medium">{selectedContract.IDHOPDONG}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Client Name</p>
                <p className="font-medium">
                  {normalizeText(selectedContract.TENKHACHHANG)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Insurance Type</p>
                <p className="font-medium">
                  {insuranceTypeById[String(selectedContract.IDLOAI || "")] ||
                    normalizeText(selectedContract.TENLOAI)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Creator</p>
                <p className="font-medium">
                  {normalizeText(selectedContract.TENNHANVIEN)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Start Date</p>
                <p className="font-medium">
                  {String(selectedContract.NGAYBATDAU).slice(0, 10)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">End Date</p>
                <p className="font-medium">
                  {String(selectedContract.NGAYKETTHUC).slice(0, 10)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge
                  variant="secondary"
                  className={`${
                    statusColors[
                      normalizeStatus(
                        selectedContract.TRANGTHAI,
                        selectedContract.NGAYKETTHUC,
                      ).toLowerCase()
                    ] || ""
                  } text-base font-semibold`}
                >
                  {normalizeStatus(
                    selectedContract.TRANGTHAI,
                    selectedContract.NGAYKETTHUC,
                  )}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Contract Value</p>
                <p className="font-medium">
                  {Number(selectedContract.GIATRI || 0).toLocaleString("vi-VN")}
                </p>
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {contractId && selectedContract && (
        <Card className="w-full overflow-hidden rounded-3xl border-border/70 shadow-sm">
          <CardHeader className="border-b border-border/60 bg-muted/20 p-6">
            <CardTitle>Kỳ phí bảo hiểm</CardTitle>
            <CardDescription>
              Danh sách các kỳ phí của hợp đồng này để theo dõi hoặc đóng.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {installmentsLoading ? (
              <p className="text-sm text-muted-foreground">
                Đang tải kỳ phí...
              </p>
            ) : installmentsError ? (
              <p className="text-sm text-destructive">{installmentsError}</p>
            ) : installments.length > 0 ? (
              <div className="overflow-x-auto rounded-2xl border border-border/60 bg-card">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kỳ</TableHead>
                      <TableHead>Ngày đến hạn</TableHead>
                      <TableHead>Số tiền</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      {showPaymentColumn && (
                        <TableHead className="text-right">Thanh toán</TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {installments.map((item) => (
                      <TableRow key={item.IDKY}>
                        <TableCell className="font-medium">
                          Kỳ {item.SOKY}
                        </TableCell>
                        <TableCell>
                          {String(item.NGAYDENHAN || "").slice(0, 10)}
                        </TableCell>
                        <TableCell>
                          {Number(item.SOTIENPHAIDONG || 0).toLocaleString(
                            "vi-VN",
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={getInstallmentStatusTone(item.TRANGTHAI)}
                          >
                            {getInstallmentStatusLabel(item.TRANGTHAI)}
                          </Badge>
                        </TableCell>
                        {showPaymentColumn && (
                          <TableCell className="text-right">
                            <Button variant="outline" size="sm" asChild>
                              <Link to={`/payments?installment=${item.IDKY}`}>
                                Xem thanh toán
                              </Link>
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Hợp đồng này chưa có kỳ phí nào.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="w-full overflow-hidden rounded-3xl border-border/70 shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm theo tên khách hàng, ID hợp đồng hoặc loại bảo hiểm..."
                value={searchTerm}
                onChange={(e) => {
                  const value = e.target.value;
                  setSearchTerm(value);

                  const nextParams = new URLSearchParams(searchParams);
                  if (value.trim()) {
                    nextParams.set("q", value.trim());
                  } else {
                    nextParams.delete("q");
                  }
                  setSearchParams(nextParams, { replace: true });
                }}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[220px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Lọc theo trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="còn thời hạn">Hiệu lực</SelectItem>
                <SelectItem value="đã hết hạn">Hết hạn</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="w-full overflow-hidden rounded-3xl border-border/70 shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Id hợp đồng</TableHead>
                  <TableHead>Tên khách hàng</TableHead>
                  <TableHead>Loại bảo hiểm</TableHead>
                  <TableHead>Người tạo</TableHead>
                  <TableHead>Ngày bắt đầu</TableHead>
                  <TableHead>Ngày kết thúc</TableHead>
                  <TableHead>Tình trạng</TableHead>
                  <TableHead className="text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="py-10 text-center text-muted-foreground"
                    >
                      Đang tải hợp đồng...
                    </TableCell>
                  </TableRow>
                ) : filteredContracts.length > 0 ? (
                  filteredContracts.map((contract, idx) => (
                    <motion.tr
                      key={contract.IDHOPDONG}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className={`group ${String(contract.IDHOPDONG) === contractId ? "bg-muted/40" : ""}`}
                    >
                      <TableCell className="font-medium">
                        {contract.IDHOPDONG}
                      </TableCell>
                      <TableCell>
                        {normalizeText(contract.TENKHACHHANG)}
                      </TableCell>
                      <TableCell>
                        {insuranceTypeById[String(contract.IDLOAI || "")] ||
                          normalizeText(contract.TENLOAI)}
                      </TableCell>
                      <TableCell>
                        {normalizeText(contract.TENNHANVIEN)}
                      </TableCell>
                      <TableCell>
                        {String(contract.NGAYBATDAU).slice(0, 10)}
                      </TableCell>
                      <TableCell>
                        {String(contract.NGAYKETTHUC).slice(0, 10)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={
                            statusColors[
                              normalizeStatus(
                                contract.TRANGTHAI,
                                contract.NGAYKETTHUC,
                              ).toLowerCase()
                            ] || ""
                          }
                        >
                          {normalizeStatus(
                            contract.TRANGTHAI,
                            contract.NGAYKETTHUC,
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" asChild>
                            <Link
                              to={`/contracts/${contract.IDHOPDONG}`}
                              state={{
                                from: isHistoryPage
                                  ? "/contracts/history"
                                  : "/contracts",
                              }}
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                          </Button>
                          {!isHistoryPage && isCreator && (
                            <Button variant="ghost" size="icon" asChild>
                              <Link
                                to={`/contracts/${contract.IDHOPDONG}/edit`}
                                state={{ from: "/contracts" }}
                              >
                                <Edit className="w-4 h-4" />
                              </Link>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </motion.tr>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="py-10 text-center text-muted-foreground"
                    >
                      Không tìm thấy hợp đồng nào phù hợp với bộ lọc hiện tại.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {!loading &&
            filteredContracts.length === 0 &&
            contracts.length > 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <FileText className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3
                  className="font-display mb-2"
                  style={{ fontSize: "1.25rem", fontWeight: 600 }}
                >
                  Không có hợp đồng phù hợp
                </h3>
                <p className="text-muted-foreground mb-4">
                  Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc trạng thái.
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("all");
                    const nextParams = new URLSearchParams(searchParams);
                    nextParams.delete("q");
                    setSearchParams(nextParams, { replace: true });
                  }}
                >
                  Xóa bộ lọc
                </Button>
              </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
