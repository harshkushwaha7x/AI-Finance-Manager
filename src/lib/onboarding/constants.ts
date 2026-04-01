import type { OnboardingCookiePayload } from "@/lib/validations/onboarding";

export const onboardingCookieName = "afm-onboarding";

export const onboardingProfileCards = [
  {
    value: "personal",
    title: "Personal finance",
    description: "Track income, expenses, savings goals, and budgets with a clean AI-assisted dashboard.",
    bullets: ["Monthly spending clarity", "Budget and goal tracking", "AI savings suggestions"],
  },
  {
    value: "freelancer",
    title: "Freelancer workspace",
    description: "Combine cash-flow visibility, invoices, taxes, and accountant support in one operating system.",
    bullets: ["Invoice-first cash flow", "GST-aware planning", "Client income tracking"],
  },
  {
    value: "business",
    title: "Small business ops",
    description: "Create an accountant-ready finance workspace for bookkeeping, reporting, and document review.",
    bullets: ["Team-ready reporting", "Service intake workflow", "Document and tax center"],
  },
] as const;

export const onboardingFocusAreas = [
  { value: "budgeting", label: "Budgeting", description: "Stay on top of monthly category spending." },
  { value: "savings", label: "Savings", description: "Set targets and create a more intentional cash plan." },
  { value: "invoicing", label: "Invoicing", description: "Manage invoice creation and follow-up cash flow." },
  { value: "taxes", label: "Taxes", description: "Track GST and tax prep work before filing time." },
  { value: "bookkeeping", label: "Bookkeeping", description: "Build a tidy operating rhythm for records and reports." },
  { value: "ai-insights", label: "AI insights", description: "Use AI summaries, categorization, and recommendations." },
] as const;

export const fiscalYearMonths = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
] as const;

export const onboardingDefaultValues = {
  profileType: "freelancer",
  fullName: "",
  email: "",
  workspaceName: "",
  legalName: "",
  gstin: "",
  currency: "INR",
  fiscalYearStartMonth: 4,
  monthlyIncomeTarget: 120000,
  monthlyBudgetTarget: 60000,
  focusAreas: ["budgeting", "invoicing", "ai-insights"],
} as const;

type DashboardDemoContent = {
  title: string;
  description: string;
  metricCards: {
    label: string;
    value: string;
    detail: string;
    delta: string;
    deltaTone: "success" | "warning" | "danger" | "secondary";
  }[];
  activities: string[];
  quickActions: string[];
  cashflowData: { label: string; inflow: number; outflow: number }[];
  spendDistribution: { name: string; value: number }[];
  modules: string[];
};

const dashboardDemoMap: Record<OnboardingCookiePayload["profileType"], DashboardDemoContent> = {
  personal: {
    title: "A calmer personal finance control tower",
    description: "Focus on monthly spending, savings momentum, and category pressure without drowning in bookkeeping overhead.",
    metricCards: [
      {
        label: "Income",
        value: "INR 92,000",
        detail: "Monthly cash in across salary and side-income channels.",
        delta: "+8.4%",
        deltaTone: "success",
      },
      {
        label: "Expenses",
        value: "INR 51,800",
        detail: "Household, subscriptions, and lifestyle spending this month.",
        delta: "-3.1%",
        deltaTone: "success",
      },
      {
        label: "Savings rate",
        value: "43%",
        detail: "Percentage of income preserved after current expenses.",
        delta: "+5 pts",
        deltaTone: "secondary",
      },
      {
        label: "Budget pressure",
        value: "2 categories",
        detail: "Spending lanes that are running close to their planned limits.",
        delta: "-1",
        deltaTone: "danger",
      },
    ],
    activities: [
      "Food spending is trending below last month after three weeks of tighter budget control.",
      "Your emergency fund goal moved 11% closer to completion.",
      "AI found one recurring tool subscription you may want to cancel.",
      "A tax-related expense was flagged for later report review.",
    ],
    quickActions: ["Add expense", "Refresh AI insights", "Update monthly budget", "Create savings goal"],
    cashflowData: [
      { label: "Jan", inflow: 74, outflow: 54 },
      { label: "Feb", inflow: 76, outflow: 52 },
      { label: "Mar", inflow: 81, outflow: 55 },
      { label: "Apr", inflow: 79, outflow: 51 },
      { label: "May", inflow: 85, outflow: 56 },
      { label: "Jun", inflow: 87, outflow: 53 },
    ],
    spendDistribution: [
      { name: "Housing", value: 36 },
      { name: "Food", value: 21 },
      { name: "Transport", value: 14 },
      { name: "Lifestyle", value: 17 },
      { name: "Other", value: 12 },
    ],
    modules: ["Expense tracker", "Savings goals", "Budget planner", "AI insights"],
  },
  freelancer: {
    title: "A polished operating system for freelance finance",
    description: "Track client payouts, invoice follow-ups, tax prep, and document review inside one dashboard that already feels production-ready.",
    metricCards: [
      {
        label: "Cash in",
        value: "INR 2.84L",
        detail: "Combined revenue and retained income snapshot for the month.",
        delta: "+12.4%",
        deltaTone: "success",
      },
      {
        label: "Cash out",
        value: "INR 1.67L",
        detail: "Expense volume across operations, subscriptions, and tax buckets.",
        delta: "+4.1%",
        deltaTone: "warning",
      },
      {
        label: "Runway",
        value: "7.4 months",
        detail: "A simple portfolio-friendly metric to show future planning intent.",
        delta: "+0.8 mo",
        deltaTone: "secondary",
      },
      {
        label: "Budget health",
        value: "86%",
        detail: "Early warning surface for overspend and category pressure.",
        delta: "-3 pts",
        deltaTone: "danger",
      },
    ],
    activities: [
      "AI categorized 14 transactions from your March uploads.",
      "GST summary is ready for review before monthly filing.",
      "Accountant consultation request moved to qualified status.",
      "One budget is 78% consumed with 9 days left in the cycle.",
    ],
    quickActions: [
      "Add a new transaction",
      "Upload a receipt or invoice",
      "Generate AI insights",
      "Request accountant support",
    ],
    cashflowData: [
      { label: "Jan", inflow: 78, outflow: 52 },
      { label: "Feb", inflow: 86, outflow: 58 },
      { label: "Mar", inflow: 94, outflow: 61 },
      { label: "Apr", inflow: 88, outflow: 57 },
      { label: "May", inflow: 101, outflow: 69 },
      { label: "Jun", inflow: 97, outflow: 63 },
    ],
    spendDistribution: [
      { name: "Operations", value: 34 },
      { name: "Tools", value: 21 },
      { name: "Tax", value: 18 },
      { name: "Travel", value: 15 },
      { name: "Other", value: 12 },
    ],
    modules: ["Transactions CRUD", "Budget planner", "Savings goals", "Document upload center"],
  },
  business: {
    title: "A finance and accountant workspace for growing teams",
    description: "Use one dashboard for reporting, document ops, accountant collaboration, and finance process visibility across the business.",
    metricCards: [
      {
        label: "Revenue",
        value: "INR 8.42L",
        detail: "Current month revenue across invoices and retained contracts.",
        delta: "+16.2%",
        deltaTone: "success",
      },
      {
        label: "Operating spend",
        value: "INR 4.96L",
        detail: "Payroll, vendor, software, and tax-linked operating outflow.",
        delta: "+6.4%",
        deltaTone: "warning",
      },
      {
        label: "Open requests",
        value: "12",
        detail: "Admin and accountant workflows that still need attention.",
        delta: "+3",
        deltaTone: "secondary",
      },
      {
        label: "Compliance risk",
        value: "Low",
        detail: "Current GST and document readiness signal for the month-end cycle.",
        delta: "Stable",
        deltaTone: "success",
      },
    ],
    activities: [
      "Three uploaded bills are ready for document review.",
      "The monthly report draft is prepared for stakeholder export.",
      "Two accountant service requests are waiting for scheduling.",
      "AI flagged a software category spike that may affect margin.",
    ],
    quickActions: ["Review admin queue", "Generate report", "Upload finance docs", "Book consultation"],
    cashflowData: [
      { label: "Jan", inflow: 82, outflow: 57 },
      { label: "Feb", inflow: 91, outflow: 64 },
      { label: "Mar", inflow: 103, outflow: 70 },
      { label: "Apr", inflow: 98, outflow: 68 },
      { label: "May", inflow: 114, outflow: 76 },
      { label: "Jun", inflow: 121, outflow: 81 },
    ],
    spendDistribution: [
      { name: "Payroll", value: 31 },
      { name: "Operations", value: 24 },
      { name: "Software", value: 17 },
      { name: "Tax", value: 16 },
      { name: "Other", value: 12 },
    ],
    modules: ["Admin operations", "Tax center", "Reports", "Accountant workflow"],
  },
};

export function getDashboardDemoContent(profileType: OnboardingCookiePayload["profileType"]) {
  return dashboardDemoMap[profileType];
}
