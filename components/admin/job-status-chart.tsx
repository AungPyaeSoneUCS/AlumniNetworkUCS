// file: components/admin/job-status-chart.tsx

"use client";

type ChartItem = {
  year: string;
  employedCount: number;
  unemployedCount: number;
  employedPercent: number;
  unemployedPercent: number;
};

const EMPLOYED_COLOR = "#008B8B";
const UNEMPLOYED_COLOR = "#00BFC4";

const MAX_BAR_HEIGHT = 190;

function Bar({
  count,
  percent,
  color,
}: {
  count: number;
  percent: number;
  color: string;
}) {
  const height = percent <= 0 ? 4 : Math.max((percent / 100) * MAX_BAR_HEIGHT, 6);

  return (
    <div className="group/bar relative flex flex-col items-center justify-end">
      <div className="pointer-events-none absolute -top-9 z-20 hidden whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-[10px] font-black text-white shadow-lg group-hover/bar:block dark:bg-white dark:text-slate-900">
        {percent}%
      </div>

      <p className="mb-1 text-[10px] font-black leading-3 text-slate-600 dark:text-slate-300">
        {count}
      </p>

      <div
        className="w-8 rounded-t-md transition-transform duration-300 group-hover/bar:-translate-y-0.5 sm:w-10"
        style={{
          height: `${height}px`,
          background: `linear-gradient(180deg, ${color} 0%, ${color}88 100%)`,
          boxShadow: `0 8px 16px -8px ${color}aa`,
        }}
      />
    </div>
  );
}

export default function JobStatusChart({
  items,
  legendEmployed,
  legendUnemployed,
}: {
  items: ChartItem[];
  legendEmployed: string;
  legendUnemployed: string;
}) {
  return (
    <div className="w-full">
      <div className="overflow-x-auto p-1 sm:p-2">
        <div className="relative min-w-[560px] rounded-[28px] bg-slate-50 p-5 dark:bg-slate-950 sm:p-6">
          <div className="mb-4 flex flex-wrap justify-center gap-x-6 gap-y-2 text-[11px] font-black text-slate-600 dark:text-slate-300">
            <span className="inline-flex items-center gap-2">
              <span
                className="h-3 w-3 rounded-full shadow-sm"
                style={{ backgroundColor: EMPLOYED_COLOR }}
              />
              {legendEmployed}
            </span>
            <span className="inline-flex items-center gap-2">
              <span
                className="h-3 w-3 rounded-full shadow-sm"
                style={{ backgroundColor: UNEMPLOYED_COLOR }}
              />
              {legendUnemployed}
            </span>
          </div>

          <div className="flex items-end gap-2 sm:gap-4">
            {items.map((item) => (
              <div key={item.year} className="flex flex-1 flex-col">
                <div className="flex flex-1 items-end justify-center gap-2 sm:gap-3">
                  <Bar
                    count={item.employedCount}
                    percent={item.employedPercent}
                    color={EMPLOYED_COLOR}
                  />
                  <Bar
                    count={item.unemployedCount}
                    percent={item.unemployedPercent}
                    color={UNEMPLOYED_COLOR}
                  />
                </div>
                <p className="mt-2 text-center text-[10px] font-black text-slate-500 dark:text-slate-400">
                  {item.year}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}