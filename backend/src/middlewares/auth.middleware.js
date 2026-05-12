const { fail } = require("../views/apiResponse.view");

const roleAliases = {
  creator: ["creator", "admin", "lap_hop_dong"],
  accountant: ["accountant", "ke_toan"],
  supervisor: ["supervisor", "giamsat", "admin"],
  insured: ["insured"],
  admin: ["admin"],
  giamsat: ["giamsat"],
  ke_toan: ["ke_toan"],
  lap_hop_dong: ["lap_hop_dong"],
};

function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    const role = String(req.headers["x-role"] || "").toLowerCase();
    const userIdHeader = req.headers["x-user-id"];
    const parsedUserId = Number(userIdHeader);

    if (!role) {
      return fail(res, "Missing role header (x-role)", 401);
    }

    const normalizedAllowedRoles = allowedRoles.flatMap((allowedRole) => {
      const normalized = String(allowedRole || "").toLowerCase();
      return roleAliases[normalized] || [normalized];
    });

    if (allowedRoles.length > 0 && !normalizedAllowedRoles.includes(role)) {
      return fail(res, "Forbidden: insufficient role permission", 403);
    }

    req.user = {
      role,
      id:
        Number.isInteger(parsedUserId) && parsedUserId > 0
          ? parsedUserId
          : null,
    };
    return next();
  };
}

module.exports = {
  requireRole,
};
