const InsuranceType = require("../models/InsuranceType");
const AccountingAssignment = require("../models/AccountingAssignment");
const SupervisorAssignment = require("../models/SupervisorAssignment");
const AccessLog = require("../models/AccessLog");

async function createInsuranceType(req, res) {
  const doc = await InsuranceType.create(req.body);
  return res.status(201).json(doc);
}

async function createAccountingAssignment(req, res) {
  const doc = await AccountingAssignment.create(req.body);
  return res.status(201).json(doc);
}

async function createSupervisorAssignment(req, res) {
  const doc = await SupervisorAssignment.create(req.body);
  return res.status(201).json(doc);
}

async function getAuditLogs(req, res) {
  const logs = await AccessLog.find().sort({ thoiGian: -1 }).limit(200).lean();
  return res.json(logs);
}

module.exports = {
  createInsuranceType,
  createAccountingAssignment,
  createSupervisorAssignment,
  getAuditLogs,
};
