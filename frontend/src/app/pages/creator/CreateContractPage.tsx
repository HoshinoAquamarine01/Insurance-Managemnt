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
import { Label } from "../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Textarea } from "../../components/ui/textarea";
import { Calendar } from "../../components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../components/ui/popover";
import { CalendarIcon, Send } from "lucide-react";
import { format } from "date-fns";
import { motion } from "motion/react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  getContracts,
  getInsuredAccounts,
  quickCreateContract,
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

function writeContractOverrides(overrides: Record<string, ContractOverride>) {
  window.localStorage.setItem(
    CONTRACT_OVERRIDES_KEY,
    JSON.stringify(overrides),
  );
}

function formatLocalDateOnly(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function CreateContractPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id: contractId } = useParams();
  const isEditMode = Boolean(contractId);
  const [loadingContract, setLoadingContract] = useState(isEditMode);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [insuredAccounts, setInsuredAccounts] = useState<any[]>([]);
  const [accountLoadMessage, setAccountLoadMessage] = useState("");
  const [formData, setFormData] = useState({
    accountId: "",
    fullName: "",
    gender: "",
    dateOfBirth: undefined as Date | undefined,
    workplace: "",
    permanentAddress: "",
    temporaryAddress: "",
    contactAddress: "",
    insuranceType: "",
    contractValue: "",
    periodAmount: "",
    medicalHistory: "",
  });

  const applyAccountSelection = (accountId: string) => {
    const selectedAccount = insuredAccounts.find(
      (account) => String(account.IDNGUOIDUNG) === String(accountId),
    );

    if (!selectedAccount) {
      return;
    }

    setFormData((prev) => ({
      ...prev,
      fullName: String(selectedAccount.HOTEN || prev.fullName || ""),
      gender: String(selectedAccount.GIOITINH || prev.gender || ""),
      dateOfBirth: selectedAccount.NGAYSINH
        ? new Date(String(selectedAccount.NGAYSINH))
        : prev.dateOfBirth,
      workplace: String(selectedAccount.COQUAN || prev.workplace || ""),
      permanentAddress: String(
        selectedAccount.DIACHILIENLAC || prev.permanentAddress || "",
      ),
      contactAddress: String(
        selectedAccount.EMAIL || prev.contactAddress || "",
      ),
    }));
  };

  const handleAccountChange = (accountId: string) => {
    setFormData((prev) => ({ ...prev, accountId }));
  };

  useEffect(() => {
    if (!formData.accountId || insuredAccounts.length === 0) {
      return;
    }

    applyAccountSelection(formData.accountId);
  }, [formData.accountId, insuredAccounts]);

  useEffect(() => {
    let isMounted = true;

    async function loadContractForEdit() {
      if (!isEditMode || !user || !contractId) return;

      try {
        const contracts = await getContracts(user.role);
        const selectedContract = contracts.find(
          (contract) => String(contract.IDHOPDONG || "") === String(contractId),
        );

        const overrides = readContractOverrides();
        const merged = {
          ...selectedContract,
          ...(overrides[String(contractId)] || {}),
        };

        if (isMounted && merged) {
          setFormData({
            accountId: String(merged.IDNGUOIDUOCBH || ""),
            fullName: String(merged.TENKHACHHANG || merged.fullName || ""),
            gender: String(merged.gender || ""),
            dateOfBirth: undefined,
            workplace: String(merged.workplace || ""),
            permanentAddress: String(merged.permanentAddress || ""),
            temporaryAddress: String(merged.temporaryAddress || ""),
            contactAddress: String(merged.contactAddress || ""),
            insuranceType: String(merged.insuranceType || merged.IDLOAI || ""),
            contractValue: String(merged.contractValue || merged.GIATRI || ""),
            periodAmount: String(merged.periodAmount || ""),
            medicalHistory: String(merged.medicalHistory || ""),
          });

          if (merged.NGAYBATDAU) {
            setStartDate(new Date(String(merged.NGAYBATDAU)));
          }
          if (merged.NGAYKETTHUC) {
            setEndDate(new Date(String(merged.NGAYKETTHUC)));
          }
        }
      } finally {
        if (isMounted) {
          setLoadingContract(false);
        }
      }
    }

    loadContractForEdit();

    return () => {
      isMounted = false;
    };
  }, [contractId, isEditMode, user]);

  useEffect(() => {
    let isMounted = true;

    async function loadInsuredAccounts() {
      if (!user) return;

      try {
        setAccountLoadMessage("");
        const accounts = await getInsuredAccounts(user.role);
        if (isMounted) {
          setInsuredAccounts(accounts);
          if (!Array.isArray(accounts) || accounts.length === 0) {
            setAccountLoadMessage(
              "Chưa có tài khoản người được bảo hiểm nào trong hệ thống.",
            );
          }
        }
      } catch (error) {
        if (isMounted) {
          setInsuredAccounts([]);
          setAccountLoadMessage(
            error instanceof Error
              ? `Không tải được danh sách tài khoản: ${error.message}`
              : "Không tải được danh sách tài khoản.",
          );
        }
      }
    }

    loadInsuredAccounts();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleSubmit = async (e: React.FormEvent, action: "submit") => {
    e.preventDefault();

    if (isEditMode) {
      if (!contractId) return;

      const overrides = readContractOverrides();
      overrides[String(contractId)] = {
        fullName: formData.fullName,
        insuranceType: formData.insuranceType,
        startDate: startDate ? formatLocalDateOnly(startDate) : undefined,
        endDate: endDate ? formatLocalDateOnly(endDate) : undefined,
        status: "Còn thời hạn",
      };
      writeContractOverrides(overrides);

      setSubmitStatus("success");
      setSubmitMessage(`Cập nhật hợp đồng ${contractId} thành công.`);
      navigate(`/contracts/${contractId}`);
      return;
    }

    if (!user) {
      setSubmitStatus("error");
      setSubmitMessage("Vui lòng đăng nhập lại.");
      return;
    }

    if (
      !formData.accountId ||
      !formData.fullName ||
      !formData.insuranceType ||
      !formData.contractValue ||
      !formData.periodAmount ||
      !formData.dateOfBirth ||
      !startDate ||
      !endDate
    ) {
      setSubmitStatus("error");
      setSubmitMessage(
        "Vui lòng điền đầy đủ các trường bắt buộc và ngày tháng.",
      );
      return;
    }

    if (
      Number(formData.contractValue) <= 0 ||
      Number(formData.periodAmount) <= 0
    ) {
      setSubmitStatus("error");
      setSubmitMessage("Giá hợp đồng và số tiền mỗi kỳ phải lớn hơn 0.");
      return;
    }

    if (Number(formData.periodAmount) > Number(formData.contractValue)) {
      setSubmitStatus("error");
      setSubmitMessage("Số tiền mỗi kỳ không được lớn hơn giá hợp đồng.");
      return;
    }

    const supportedInsuranceTypes = new Set([
      "Bảo hiểm sức khỏe",
      "Bảo hiểm nhân thọ",
      "Bảo hiểm xe cơ giới",
      "Bảo hiểm tài sản",
    ]);
    if (!supportedInsuranceTypes.has(formData.insuranceType)) {
      setSubmitStatus("error");
      setSubmitMessage("Loại bảo hiểm chưa được hỗ trợ.");
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitStatus("idle");
      setSubmitMessage("");

      const result = await quickCreateContract(
        {
          creatorId: Number(user.id),
          accountId: Number(formData.accountId),
          fullName: formData.fullName,
          gender: formData.gender,
          dateOfBirth: formatLocalDateOnly(formData.dateOfBirth),
          workplace: formData.workplace,
          permanentAddress: formData.permanentAddress,
          temporaryAddress: formData.temporaryAddress,
          contactAddress: formData.contactAddress,
          insuranceType: formData.insuranceType,
          contractValue: Number(formData.contractValue),
          periodAmount: Number(formData.periodAmount),
          medicalHistory: formData.medicalHistory,
          startDate: formatLocalDateOnly(startDate),
          endDate: formatLocalDateOnly(endDate),
        },
        user.role,
      );

      setSubmitMessage(`Tạo hợp đồng ${result.soHopDong} thành công.`);
      setSubmitStatus("success");
      setFormData({
        accountId: "",
        fullName: "",
        gender: "",
        dateOfBirth: undefined,
        workplace: "",
        permanentAddress: "",
        temporaryAddress: "",
        contactAddress: "",
        insuranceType: "",
        contractValue: "",
        periodAmount: "",
        medicalHistory: "",
      });
      setStartDate(undefined);
      setEndDate(undefined);
    } catch (error) {
      setSubmitStatus("error");
      setSubmitMessage(
        error instanceof Error ? error.message : "Tạo hợp đồng thất bại",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(16,185,129,0.10),transparent_26%),radial-gradient(circle_at_85%_10%,rgba(14,165,233,0.10),transparent_22%),linear-gradient(180deg,rgba(250,247,242,0.88)_0%,rgba(255,255,255,0.96)_45%,rgba(243,246,249,0.98)_100%)]" />
      <div className="relative mx-auto w-full max-w-[96rem] space-y-6 lg:space-y-7">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display mb-2"
            style={{ fontSize: "2.25rem", fontWeight: 600, lineHeight: 1.1 }}
          >
            {isEditMode ? "Chỉnh sửa hợp đồng" : "Tạo hợp đồng mới"}
          </motion.h1>
          <p className="max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
            {isEditMode
              ? "Điều chỉnh thông tin hợp đồng và lưu thay đổi."
              : "Điền thông tin để tạo hợp đồng bảo hiểm mới."}
          </p>
          {isEditMode && (
            <p className="mt-3 text-sm text-muted-foreground md:text-base">
              Đang chỉnh sửa hợp đồng {contractId}. Thay đổi đang được lưu tạm ở
              front-end cho đến khi backend có API cập nhật.
            </p>
          )}
        </div>

        {loadingContract && isEditMode ? (
          <Card className="border-border/70 bg-white/85 shadow-lg backdrop-blur">
            <CardContent className="py-12 text-center text-base text-muted-foreground">
              Đang tải dữ liệu hợp đồng...
            </CardContent>
          </Card>
        ) : null}

        <form className="space-y-8">
          {/* Personal Information */}
          <Card className="border-border/70 bg-white/88 shadow-lg backdrop-blur">
            <CardHeader className="space-y-2 border-b border-border/60 pb-6">
              <CardTitle className="text-xl md:text-2xl">
                Thông tin cá nhân
              </CardTitle>
              <CardDescription className="text-sm md:text-base">
                Thông tin cơ bản của người được bảo hiểm
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 pt-6">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="accountId" className="text-sm md:text-base">
                    Tài khoản *
                  </Label>
                  <select
                    id="accountId"
                    className="border-input bg-background h-11 w-full rounded-md border px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                    value={formData.accountId}
                    onChange={(e) => handleAccountChange(e.target.value)}
                  >
                    <option value="">Chọn tài khoản người được bảo hiểm</option>
                    {insuredAccounts.map((account) => (
                      <option
                        key={String(account.IDNGUOIDUNG)}
                        value={String(account.IDNGUOIDUNG)}
                      >
                        {String(
                          account.HOTEN || account.TENDANGNHAP || "Chưa rõ",
                        )}
                        {account.TENDANGNHAP
                          ? ` (${String(account.TENDANGNHAP)})`
                          : ""}
                      </option>
                    ))}
                  </select>
                  {accountLoadMessage ? (
                    <p className="text-xs text-muted-foreground">
                      {accountLoadMessage}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-sm md:text-base">
                    Họ và tên *
                  </Label>
                  <Input
                    id="fullName"
                    placeholder="Nguyễn Văn An"
                    className="h-11"
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender" className="text-sm md:text-base">
                    Giới tính *
                  </Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) =>
                      setFormData({ ...formData, gender: value })
                    }
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Chọn giới tính" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Nam</SelectItem>
                      <SelectItem value="female">Nữ</SelectItem>
                      <SelectItem value="other">Khác</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm md:text-base">Ngày sinh *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="h-11 w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.dateOfBirth
                          ? format(formData.dateOfBirth, "PPP")
                          : "Chọn ngày"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.dateOfBirth}
                        onSelect={(date) =>
                          setFormData({ ...formData, dateOfBirth: date })
                        }
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="workplace" className="text-sm md:text-base">
                    Nơi công tác *
                  </Label>
                  <Input
                    id="workplace"
                    placeholder="Tên công ty"
                    className="h-11"
                    value={formData.workplace}
                    onChange={(e) =>
                      setFormData({ ...formData, workplace: e.target.value })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Address Information */}
          <Card className="border-border/70 bg-white/88 shadow-lg backdrop-blur">
            <CardHeader className="space-y-2 border-b border-border/60 pb-6">
              <CardTitle className="text-xl md:text-2xl">
                Thông tin địa chỉ
              </CardTitle>
              <CardDescription className="text-sm md:text-base">
                Địa chỉ thường trú và liên hệ
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 pt-6">
              <div className="space-y-2">
                <Label
                  htmlFor="permanentAddress"
                  className="text-sm md:text-base"
                >
                  Địa chỉ thường trú *
                </Label>
                <Input
                  id="permanentAddress"
                  placeholder="Số nhà, đường, quận/huyện, tỉnh/thành"
                  className="h-11"
                  value={formData.permanentAddress}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      permanentAddress: e.target.value,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="temporaryAddress"
                  className="text-sm md:text-base"
                >
                  Địa chỉ tạm trú
                </Label>
                <Input
                  id="temporaryAddress"
                  placeholder="Số nhà, đường, quận/huyện, tỉnh/thành"
                  className="h-11"
                  value={formData.temporaryAddress}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      temporaryAddress: e.target.value,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="contactAddress"
                  className="text-sm md:text-base"
                >
                  Thông tin liên hệ *
                </Label>
                <Input
                  id="contactAddress"
                  placeholder="Email hoặc số điện thoại"
                  className="h-11"
                  value={formData.contactAddress}
                  onChange={(e) =>
                    setFormData({ ...formData, contactAddress: e.target.value })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Insurance Details */}
          <Card className="border-border/70 bg-white/88 shadow-lg backdrop-blur">
            <CardHeader className="space-y-2 border-b border-border/60 pb-6">
              <CardTitle className="text-xl md:text-2xl">
                Thông tin bảo hiểm
              </CardTitle>
              <CardDescription className="text-sm md:text-base">
                Điều khoản hợp đồng và quyền lợi bảo hiểm
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 pt-6">
              <div className="space-y-2">
                <Label htmlFor="insuranceType" className="text-sm md:text-base">
                  Loại bảo hiểm *
                </Label>
                <Select
                  value={formData.insuranceType}
                  onValueChange={(value) =>
                    setFormData({ ...formData, insuranceType: value })
                  }
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Chọn loại bảo hiểm" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Bảo hiểm sức khỏe">
                      Bảo hiểm sức khỏe
                    </SelectItem>
                    <SelectItem value="Bảo hiểm nhân thọ">
                      Bảo hiểm nhân thọ
                    </SelectItem>
                    <SelectItem value="Bảo hiểm xe cơ giới">
                      Bảo hiểm xe cơ giới
                    </SelectItem>
                    <SelectItem value="Bảo hiểm tài sản">
                      Bảo hiểm tài sản
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label
                    htmlFor="contractValue"
                    className="text-sm md:text-base"
                  >
                    Giá trị hợp đồng *
                  </Label>
                  <Input
                    id="contractValue"
                    type="number"
                    min={1}
                    step="0.01"
                    placeholder="10000000"
                    className="h-11"
                    value={formData.contractValue}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        contractValue: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="periodAmount"
                    className="text-sm md:text-base"
                  >
                    Số tiền mỗi kỳ *
                  </Label>
                  <Input
                    id="periodAmount"
                    type="number"
                    min={1}
                    step="0.01"
                    placeholder="1000000"
                    className="h-11"
                    value={formData.periodAmount}
                    onChange={(e) =>
                      setFormData({ ...formData, periodAmount: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm md:text-base">
                    Ngày bắt đầu bảo hiểm *
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="h-11 w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate
                          ? format(startDate, "PPP")
                          : "Chọn ngày bắt đầu"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm md:text-base">
                    Ngày kết thúc bảo hiểm *
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="h-11 w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate
                          ? format(endDate, "PPP")
                          : "Chọn ngày kết thúc"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="medicalHistory"
                  className="text-sm md:text-base"
                >
                  Lịch sử bệnh
                </Label>
                <Textarea
                  id="medicalHistory"
                  placeholder="Liệt kê bệnh nền, dị ứng hoặc thông tin y tế liên quan..."
                  rows={6}
                  className="min-h-[160px]"
                  value={formData.medicalHistory}
                  onChange={(e) =>
                    setFormData({ ...formData, medicalHistory: e.target.value })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-col-reverse items-stretch gap-3 justify-end md:flex-row md:items-center">
            <Button variant="outline" type="button" asChild>
              <Link to={isEditMode ? `/contracts/${contractId}` : "/contracts"}>
                Hủy
              </Link>
            </Button>
            <Button
              type="submit"
              className="gap-2"
              disabled={isSubmitting}
              onClick={(e) => handleSubmit(e, "submit")}
            >
              <Send className="w-4 h-4" />
              {isSubmitting
                ? isEditMode
                  ? "Đang lưu..."
                  : "Đang gửi..."
                : isEditMode
                  ? "Lưu thay đổi"
                  : "Gửi hợp đồng"}
            </Button>
          </div>
          {submitMessage && (
            <p
              className={`text-sm ${submitStatus === "success" ? "text-green-600" : "text-red-600"}`}
            >
              {submitStatus === "success"
                ? `✓ ${submitMessage}`
                : `✗ ${submitMessage}`}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
