import { StatCard } from "@/components/shared/stat-card";

type MetricCardProps = {
  label: string;
  value: string;
  detail: string;
  delta?: string;
  deltaTone?: "success" | "warning" | "danger" | "secondary";
};

export function MetricCard({ label, value, detail, delta, deltaTone }: MetricCardProps) {
  return <StatCard label={label} value={value} detail={detail} delta={delta} deltaTone={deltaTone} />;
}
