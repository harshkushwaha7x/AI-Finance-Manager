export const defaultCategoryTemplates = [
  { name: "Salary", slug: "salary", kind: "income", icon: "wallet", color: "#155eef" },
  { name: "Retainers", slug: "retainers", kind: "income", icon: "briefcase", color: "#0f766e" },
  { name: "Investments", slug: "investments", kind: "income", icon: "line-chart", color: "#12b76a" },
  { name: "Housing", slug: "housing", kind: "expense", icon: "home", color: "#155eef" },
  { name: "Food", slug: "food", kind: "expense", icon: "utensils", color: "#f79009" },
  { name: "Software", slug: "software", kind: "expense", icon: "monitor", color: "#0f766e" },
  { name: "Tax", slug: "tax", kind: "expense", icon: "receipt", color: "#e5484d" },
  { name: "Travel", slug: "travel", kind: "expense", icon: "plane", color: "#667085" },
] as const;

export const accountantPackageSeeds = [
  {
    name: "Starter Finance Health Check",
    slug: "starter-finance-health-check",
    description: "Review spending posture, cash flow, and tax readiness with a clear action plan.",
    audience: "Individuals and freelancers",
    priceLabel: "INR 2,999",
    turnaroundText: "2 business days",
    isActive: true,
  },
  {
    name: "Freelancer Tax and Invoice Setup",
    slug: "freelancer-tax-and-invoice-setup",
    description: "Set up invoicing, collections hygiene, and a GST-aware workflow for solo operators.",
    audience: "Freelancers and creators",
    priceLabel: "INR 6,999",
    turnaroundText: "5 business days",
    isActive: true,
  },
  {
    name: "Monthly Bookkeeping and GST Support",
    slug: "monthly-bookkeeping-and-gst-support",
    description: "Recurring finance support for businesses that need reliability without a full-time team.",
    audience: "Small businesses",
    priceLabel: "Custom",
    turnaroundText: "Rolling monthly",
    isActive: true,
  },
  {
    name: "Custom Consultation",
    slug: "custom-consultation",
    description: "Bring a messy problem, upload your docs, and route it into the right accountant workflow.",
    audience: "Anyone with a complex case",
    priceLabel: "Custom",
    turnaroundText: "Depends on scope",
    isActive: true,
  },
] as const;
