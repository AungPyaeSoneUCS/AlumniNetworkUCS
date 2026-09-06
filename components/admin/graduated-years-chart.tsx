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

const MAX_BAR_HEIGHT = 190;

export default function GraduatedYearsChart({
  items,
}: {
  items: ChartItem[];
}) {
  const maxValue = Math.max(...items.map((item) => item.value), 1);

  return (
    <div className="w-full">
      <div className="overflow-x-auto p-1 sm:p-2">
        <div className="relative min-w-[560px] rounded-[28px] bg-slate-50 p-5 dark:bg-slate-950 sm:p-6">
          <div className="flex min-w-max items-end justify-center gap-6 sm:gap-8">
            {items.map((item, index) => {
              const height = item.value <= 0 ? 4 : Math.max((item.value / maxValue) * MAX_BAR_HEIGHT, 6);
              const color = PALETTE[index % PALETTE.length];

              return (
                <div key={item.label} className="flex w-8 flex-col items-center sm:w-10">
                  <div className="group/bar relative flex flex-col items-center">
                    <div className="pointer-events-none absolute -top-9 z-20 hidden whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-[10px] font-black text-white shadow-lg group-hover/bar:block dark:bg-white dark:text-slate-900">
                      {item.value.toLocaleString()}
                    </div>

                    <p className="mb-1 text-[10px] font-black leading-3 text-slate-600 dark:text-slate-300">
                      {item.value.toLocaleString()}
                    </p>

                    <div
                      title={`${item.label}: ${item.value.toLocaleString()}`}
                      className="w-8 rounded-t-md transition-transform duration-300 group-hover/bar:-translate-y-0.5 sm:w-10"
                      style={{
                        height: `${height}px`,
                        background: `linear-gradient(180deg, ${color} 0%, ${color}88 100%)`,
                        boxShadow: `0 8px 16px -8px ${color}aa`,
                      }}
                    />
                  </div>

                  <p
                    title={item.label}
                    className="mt-2 text-center text-[10px] font-black leading-3 text-slate-500 dark:text-slate-400"
                  >
                    {item.label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}