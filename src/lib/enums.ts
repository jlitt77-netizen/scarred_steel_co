// Central catalog of enumerated values. SQLite has no native enums, so allowed
// values are validated in the app layer against these constants. Keeping them in
// one place lets the DB schema, seed data, validation, and UI stay in agreement.

export const VEHICLE_STATUSES = [
  "Potential Purchase",
  "Under Evaluation",
  "Acquired",
  "Planned Build",
  "Active Build",
  "On Hold",
  "Awaiting Parts",
  "Completed",
  "Content Asset",
  "For Sale",
  "Sold",
  "Long-Term Shop Vehicle",
  "Event Vehicle",
  "Giveaway Candidate",
] as const;
export type VehicleStatus = (typeof VEHICLE_STATUSES)[number];

export const FLEET_CLASSIFICATIONS = [
  "Inventory",
  "Content Asset",
  "Shop Vehicle",
  "Show Vehicle",
  "Event Vehicle",
  "Giveaway Candidate",
] as const;
export type FleetClassification = (typeof FLEET_CLASSIFICATIONS)[number];

export const PROJECT_STATUSES = [
  "Planned",
  "Active",
  "On Hold",
  "Behind Schedule",
  "Over Budget",
  "Completed",
  "Cancelled",
] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

// Ordered standard build phases (Section 11).
export const BUILD_PHASE_NAMES = [
  "Acquisition",
  "Inspection",
  "Teardown",
  "Chassis",
  "Suspension",
  "Lowering / Lifting",
  "Fabrication",
  "Drivetrain",
  "Brakes",
  "Wheels / Tires",
  "Electrical",
  "Body",
  "Paint",
  "Patina",
  "Interior",
  "Final Assembly",
  "Testing",
  "Alignment",
  "Road Test",
  "Reveal",
  "Sale",
] as const;
export type BuildPhaseName = (typeof BUILD_PHASE_NAMES)[number];

export const PHASE_STATUSES = [
  "Not Started",
  "In Progress",
  "Blocked",
  "Complete",
] as const;
export type PhaseStatus = (typeof PHASE_STATUSES)[number];

export const TASK_STATUSES = [
  "Not Started",
  "In Progress",
  "Blocked",
  "Waiting on Parts",
  "In Review",
  "Complete",
  "Cancelled",
] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

// Event type spans operational, financial, and content timing.
export const EVENT_TYPES = [
  "work",
  "cash_outflow",
  "cash_inflow",
  "content",
  "revenue",
  "milestone",
  "camera",
  "editing",
  "social",
  "sponsor_deliverable",
  "vehicle_sale",
  "giveaway",
  "event",
] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export const EVENT_STATUSES = [
  "Tentative",
  "Scheduled",
  "In Progress",
  "Complete",
  "Cancelled",
] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];

export const DEPENDENCY_TYPES = [
  "finish_to_start",
  "start_to_start",
  "finish_to_finish",
  "start_to_finish",
] as const;
export type DependencyType = (typeof DEPENDENCY_TYPES)[number];

// Risk taxonomy (Section 6).
export const RISK_CATEGORIES = [
  "Parts Delay",
  "Vendor Delay",
  "Partner Shop Delay",
  "Labor Shortage",
  "Capacity Overload",
  "Camera Conflict",
  "Editing Delay",
  "Sponsor Approval Delay",
  "Social Delay",
  "Cash Shortage",
  "Cost Overrun",
  "Vehicle Sale Delay",
  "Giveaway Legal Hold",
  "Merch Inventory Issue",
] as const;
export type RiskCategory = (typeof RISK_CATEGORIES)[number];

export const RISK_RESPONSES = [
  "Accept Delay",
  "Expedite Shipping",
  "Change Vendor",
  "Alternate Part",
  "Add Labor",
  "Shift Shop Priority",
  "Move Camera",
  "Publish Alternate Content",
  "Delay Purchase",
  "Delay Another Project",
  "Protect Sale Date",
] as const;
export type RiskResponse = (typeof RISK_RESPONSES)[number];

export const RISK_SEVERITIES = ["low", "medium", "high", "critical"] as const;
export const RISK_LIKELIHOODS = ["low", "medium", "high"] as const;
export const RISK_STATUSES = ["open", "mitigating", "accepted", "resolved"] as const;

// Detailed build cost categories (Section 9 — Cash Flow Management).
export const COST_CATEGORIES = [
  "Vehicle acquisition",
  "Transportation",
  "Title",
  "Tax",
  "Engine",
  "Transmission",
  "Rear end",
  "Suspension",
  "Lowering",
  "Lifting",
  "Coilovers",
  "Springs",
  "Shocks",
  "Four-link",
  "Airbags",
  "Sway bars",
  "Steering",
  "Wheels",
  "Tires",
  "Brakes",
  "Exhaust",
  "Electrical",
  "Gauges",
  "Wiring",
  "Glass",
  "Weatherstrip",
  "Trim",
  "Interior",
  "Paint",
  "Body",
  "Patina sauce",
  "Detailing",
  "Partner-shop labor",
  "Outside fabrication",
  "Business insurance",
  "Vehicle insurance",
  "Workers compensation",
  "Tools",
  "Equipment",
  "Camera",
  "Editing",
  "Travel",
  "Shows",
  "Marketing",
  "Software",
  "Legal",
  "Accounting",
  "Merchandise inventory",
] as const;
export type CostCategory = (typeof COST_CATEGORIES)[number];

// Budget → committed → actual → paid lifecycle for a cost line item.
export const COST_STATUSES = ["planned", "committed", "actual", "paid"] as const;
export type CostStatus = (typeof COST_STATUSES)[number];

export const PARTS_STATUSES = [
  "needed",
  "quoted",
  "ordered",
  "shipped",
  "received",
  "installed",
  "returned",
  "cancelled",
] as const;
export type PartsStatus = (typeof PARTS_STATUSES)[number];

export const DOCUMENT_CATEGORIES = [
  "Title",
  "Registration",
  "Inspection",
  "Invoice",
  "Receipt",
  "Contract",
  "Insurance",
  "Build Sheet",
  "Other",
] as const;
export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number];

export const ISSUE_SEVERITIES = ["low", "medium", "high"] as const;
export const ISSUE_STATUSES = ["open", "in_progress", "resolved"] as const;

export const CHANGE_ORDER_STATUSES = ["proposed", "approved", "declined"] as const;

// ---- Phase 4: Financial Command Center (Section 8) -------------------------

// Cash accounts. "Available operating cash" is DERIVED (bank − protected −
// restricted reserves), not stored as an account.
export const ACCOUNT_TYPES = [
  "Bank Cash",
  "Protected Household Reserve",
  "Business Reserve",
  "Restricted Cash",
  "Giveaway Reserve",
  "Acquisition Reserve",
] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];

// Reserve types excluded from available operating cash.
export const RESERVE_ACCOUNT_TYPES: AccountType[] = [
  "Protected Household Reserve",
  "Business Reserve",
  "Restricted Cash",
  "Giveaway Reserve",
  "Acquisition Reserve",
];

// P&L / revenue segments.
export const SEGMENTS = [
  "Automotive",
  "Media",
  "Sponsorship",
  "Affiliate",
  "Merchandise",
  "Digital Products",
  "Events",
  "Licensing",
  "Other",
] as const;
export type Segment = (typeof SEGMENTS)[number];

// Accounts receivable types (Section 8).
export const RECEIVABLE_TYPES = [
  "Sponsor Invoice",
  "Customer Build Invoice",
  "Vehicle Deposit",
  "Affiliate Receivable",
  "Platform Revenue",
  "Merch Receivable",
  "Social Media Revenue",
] as const;
export type ReceivableType = (typeof RECEIVABLE_TYPES)[number];

// Accounts payable categories (Section 8).
export const PAYABLE_CATEGORIES = [
  "Partner Shop",
  "Parts Vendor",
  "Camera Crew",
  "Editor",
  "Legal",
  "Insurance",
  "Sales Tax",
  "Software",
  "Marketing",
  "Contractor",
  "Other",
] as const;
export type PayableCategory = (typeof PAYABLE_CATEGORIES)[number];

export const RECEIVABLE_STATUSES = ["open", "received", "written_off"] as const;
export const PAYABLE_STATUSES = ["open", "scheduled", "paid"] as const;
export const TRANSACTION_DIRECTIONS = ["income", "expense"] as const;

export const NOTIFICATION_TYPES = [
  "task_due",
  "dependency_risk",
  "schedule_change",
  "cash_due",
  "payment_overdue",
  "sponsor_deliverable",
  "sponsor_approval",
  "customer_approval",
  "camera_conflict",
  "editing_conflict",
  "merch_launch",
  "giveaway_compliance_hold",
  "low_inventory",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];
