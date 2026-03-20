import { Card } from "@/components/ui/Card";

type StatItem = {
  label: string;
  value: string | number;
  color: string;
};

export function StatsGrid({ stats }: { stats: StatItem[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label} className={stat.color}>
          <p className="text-xs font-black uppercase tracking-[0.2em]">{stat.label}</p>
          <p className="mt-4 text-4xl font-black uppercase">{stat.value}</p>
        </Card>
      ))}
    </div>
  );
}
