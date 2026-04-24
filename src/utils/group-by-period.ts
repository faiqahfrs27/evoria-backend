import { StatsPeriod } from "../modules/dashboard/dto/dashboard.dto.js";

type Transaction = { finalPrice: number; quantity: number; createdAt: Date };

export const groupByPeriod = (transactions: Transaction[], period: StatsPeriod) => {
  const map = new Map<string, { revenue: number; tickets: number; count: number }>();

  for (const t of transactions) {
    let key: string;

    if (period === StatsPeriod.YEAR) {
      key = t.createdAt.toLocaleString("default", { month: "short" });
    } else if (period === StatsPeriod.MONTH) {
      key = t.createdAt.getDate().toString();
    } else {
      key = t.createdAt.toISOString().split("T")[0];
    }

    const existing = map.get(key) ?? { revenue: 0, tickets: 0, count: 0 };
    map.set(key, {
      revenue: existing.revenue + t.finalPrice,
      tickets: existing.tickets + t.quantity,
      count: existing.count + 1,
    });
  }

  return Array.from(map.entries()).map(([label, data]) => ({ label, ...data }));
};