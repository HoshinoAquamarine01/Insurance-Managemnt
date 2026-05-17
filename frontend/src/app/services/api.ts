const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api";

export type ApiUser = {
  id: string;
  name: string;
  email: string;
  role: "creator" | "insured" | "accountant" | "supervisor";
  accountType?: "employee" | "customer";
};

export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
  errors?: unknown;
};

function getStoredUserId() {
  try {
    const raw = window.localStorage.getItem("insurance_user");
    if (!raw) return null;

    const parsed = JSON.parse(raw) as { id?: string | number };
    const userId = Number(parsed?.id);

    return Number.isInteger(userId) && userId > 0 ? String(userId) : null;
  } catch {
    return null;
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit & { role?: string } = {},
): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");

  if (options.role) {
    headers.set("x-role", options.role);
  }

  const userId = getStoredUserId();
  if (userId) {
    headers.set("x-user-id", userId);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    cache: options.cache ?? "no-store",
    headers,
  });

  const payload = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !payload.success) {
    throw new Error(payload.message || "Request failed");
  }

  return payload.data;
}

export async function loginRequest(tenDangNhap: string, matKhau: string) {
  return apiRequest<ApiUser>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ tenDangNhap, matKhau }),
  });
}

export async function getDashboardSummary(role: string) {
  return apiRequest<any>("/dashboard/summary", { role });
}

export async function getContracts(role: string) {
  return apiRequest<any[]>("/contracts", { role });
}

export async function getPayments(role: string) {
  return apiRequest<any[]>("/payments", { role });
}

export async function getPaymentSummary(role: string) {
  return apiRequest<any>("/payments/summary", { role });
}

export async function getCustomerContracts(customerId: string, role: string) {
  return apiRequest<any[]>(`/customers/${customerId}/contracts`, { role });
}

export async function getCustomerPayments(customerId: string, role: string) {
  return apiRequest<any[]>(`/customers/${customerId}/payments`, { role });
}

export async function getExpiredContracts(role: string) {
  return apiRequest<any[]>("/contracts/history", { role });
}

export async function getInsuredAccounts(role: string) {
  return apiRequest<any[]>("/contracts/insured-accounts", { role });
}

export async function getMedicalHistory(
  insuredId: string | number,
  role: string,
) {
  return apiRequest<any>(`/customers/${insuredId}/medical-history`, { role });
}

export async function quickCreateContract(payload: any, role: string) {
  return apiRequest<any>("/contracts/quick-create", {
    method: "POST",
    body: JSON.stringify(payload),
    role,
  });
}

export async function createInsuredCustomer(payload: any, role: string) {
  return apiRequest<any>("/customers", {
    method: "POST",
    body: JSON.stringify(payload),
    role,
  });
}

export async function updateProfileRequest(payload: any, role: string) {
  return apiRequest<any>("/auth/profile", {
    method: "PUT",
    body: JSON.stringify(payload),
    role,
  });
}

export async function updatePasswordRequest(payload: any, role: string) {
  return apiRequest<any>("/auth/password", {
    method: "PUT",
    body: JSON.stringify(payload),
    role,
  });
}

export async function confirmAccountingPayment(
  paymentId: string | number,
  role: string,
) {
  return apiRequest<any>(`/payments/${paymentId}/confirm`, {
    method: "PUT",
    role,
  });
}

export async function cancelAccountingPayment(
  paymentId: string | number,
  role: string,
) {
  return apiRequest<any>(`/payments/${paymentId}/cancel`, {
    method: "PUT",
    role,
  });
}

export type VietQrCheckoutSessionResponse = {
  sessionId?: string;
  qrUrl?: string;
  qrImageUrl?: string;
  accountNumber?: string;
  accountNo?: string;
  bankCode?: string;
  accountName?: string;
  amount: number;
  description?: string;
  transferContent?: string;
  paymentUrl?: string;
  payUrl?: string;
  deeplink?: string;
  checkoutActionUrl?: string;
  checkoutFields?: Record<string, string>;
  orderRef?: string;
  requestId?: string;
};

export async function createPaymentCheckoutSession(payload: any, role: string) {
  return apiRequest<VietQrCheckoutSessionResponse>(
    "/payments/checkout-session",
    {
      method: "POST",
      body: JSON.stringify(payload),
      role,
    },
  );
}

export async function confirmPaymentCheckoutSession(
  params: {
    orderId: string;
    amount: string | number;
    resultCode: string | number;
  },
  role: string,
) {
  const searchParams = new URLSearchParams({
    orderId: String(params.orderId),
    amount: String(params.amount),
    resultCode: String(params.resultCode),
  });

  return apiRequest<any>(
    `/payments/checkout/confirm?${searchParams.toString()}`,
    {
      method: "GET",
      role,
    },
  );
}

export async function reportTransferredPayment(payload: any, role: string) {
  return apiRequest<any>("/payments/checkout/report-transferred", {
    method: "POST",
    body: JSON.stringify(payload),
    role,
  });
}

export async function updateAdminContract(
  contractId: string,
  payload: any,
  role: string,
) {
  return apiRequest<any>(`/admin/contracts/${contractId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
    role,
  });
}

export async function updateAdminUser(
  userId: string,
  payload: any,
  role: string,
) {
  return apiRequest<any>(`/admin/users/${userId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
    role,
  });
}

export async function updateInsuranceTypeAdmin(
  typeId: string,
  payload: any,
  role: string,
) {
  return apiRequest<any>(`/admin/insurance-types/${typeId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
    role,
  });
}

export async function getAdminUsers(role: string) {
  return apiRequest<any[]>("/admin/users", { role });
}

export async function getAdminActivity(role: string) {
  return apiRequest<any[]>("/admin/activity", { role });
}

export async function getAdminAssignments(role: string) {
  return apiRequest<any[]>("/admin/assignments", { role });
}

export async function getInsuranceTypes(role: string) {
  return apiRequest<any[]>("/admin/insurance-types", { role });
}

export async function deleteAdminUser(userId: string, role: string) {
  return apiRequest<any>(`/admin/users/${userId}`, {
    method: "DELETE",
    role,
  });
}

export async function deleteAdminContract(contractId: string, role: string) {
  return apiRequest<any>(`/admin/contracts/${contractId}`, {
    method: "DELETE",
    role,
  });
}

export async function deleteAdminAssignment(
  assignmentId: string,
  role: string,
) {
  return apiRequest<any>(`/admin/assignments/${assignmentId}`, {
    method: "DELETE",
    role,
  });
}

export async function deleteInsuranceTypeAdmin(typeId: string, role: string) {
  return apiRequest<any>(`/admin/insurance-types/${typeId}`, {
    method: "DELETE",
    role,
  });
}

export async function createAdminUser(payload: any, role: string) {
  return apiRequest<any>("/admin/users", {
    method: "POST",
    body: JSON.stringify(payload),
    role,
  });
}

export async function createAdminContract(payload: any, role: string) {
  return apiRequest<any>("/admin/contracts", {
    method: "POST",
    body: JSON.stringify(payload),
    role,
  });
}

export async function createAdminAssignment(payload: any, role: string) {
  return apiRequest<any>("/admin/assignments", {
    method: "POST",
    body: JSON.stringify(payload),
    role,
  });
}

// Settings & Notifications
export async function updateNotificationPreferences(
  payload: {
    userId: string;
    emailAlerts: boolean;
    paymentReminders: boolean;
    accountChanges: boolean;
  },
  role: string,
) {
  return apiRequest<any>("/settings/notifications", {
    method: "POST",
    body: JSON.stringify(payload),
    role,
  });
}

export async function getNotificationPreferences(userId: string, role: string) {
  return apiRequest<any>(`/settings/notifications?userId=${userId}`, {
    method: "GET",
    role,
  });
}

export async function createInsuranceTypeAdmin(payload: any, role: string) {
  return apiRequest<any>("/admin/insurance-types", {
    method: "POST",
    body: JSON.stringify(payload),
    role,
  });
}
