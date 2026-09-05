// file: components/admin/graduated-years-chart.tsx

"use client";

type ChartItem = {
  label: string;
  value: number;
};

const PALETTE = [
  "#06b6d4",
  "#0ea5e9",
  "#6366f1",
  "#8b5cf6",
  "#a855f7",
  "#ec4899",
  "#f43f5e",
  "#f59e0b",
  "#f97316",
  "#10b981",
  "#14b8a6",
  "#3b82f6",
];

const PLOT_HEIGHT = 240;

export default function GraduatedYearsChart({
  items,
}: {
  items: ChartItem[];
}) {
  const maxValue = Math.max(...items.map((item) => item.value), 1);

  const barHeight = (value: number) => {
    if (value <= 0) return 0;
    return Math.max((value / maxValue) * PLOT_HEIGHT, 6);
  };

  return (
    <div className="w-full">
      <div className="overflow-x-auto overflow-y-hidden p-1 sm:p-2">
        <div className="relative min-w-[560px] rounded-[28px] bg-slate-50 p-5 dark:bg-slate-950 sm:p-6">
          <p className="pointer-events-none absolute left-2 top-28 -rotate-90 whitespace-nowrap text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
            Graduated Count
          </p>

          <div
            className="relative ml-8 border-b-4 border-l-4 border-slate-900 dark:border-slate-300"
            style={{ height: `${PLOT_HEIGHT + 100}px` }}
          >
            <div className="absolute inset-0 flex items-end gap-2 pl-4 pr-3 pb-8 sm:gap-3">
              {items.map((item, index) => {
                const height = barHeight(item.value);
                const color = PALETTE[index % PALETTE.length];

                return (
                  <div
                    key={item.label}
                    className="group flex min-w-[54px] flex-1 flex-col items-center justify-end"
                  >
                    <p className="mb-2 rounded-full bg-white px-2 py-1 text-[10px] font-black text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white">
                      {item.value.toLocaleString()}
                    </p>

                    <div
                      title={`${item.label}: ${item.value.toLocaleString()}`}
                      className="w-full max-w-[58px] shadow-xl transition-all duration-300 group-hover:scale-105"
                      style={{
                        height: `${height}px`,
                        background: `linear-gradient(180deg, ${color} 0%, ${color}88 100%)`,
                        boxShadow: `0 8px 18px -8px ${color}aa`,
                      }}
                    />

                    <p
                      title={item.label}
                      className="mt-3 line-clamp-2 max-w-[78px] text-center text-[10px] font-black leading-3 text-slate-600 dark:text-slate-300"
                    >
                      {item.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <p className="mt-3 text-center text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
            Academic Year
          </p>
        </div>
      </div>
    </div>
  );
}
