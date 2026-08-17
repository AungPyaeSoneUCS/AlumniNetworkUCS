// file: components/admin/admin-jobs-auto-filter.tsx

"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search } from "lucide-react";

type Lang = "en" | "mm";

type Props = {
  lang: Lang;
  rawQ: string;
  selectedCompany: string;
  selectedLocation: string;
  selectedType: string;
  selectedStatus: string;
  companyOptions: string[];
  locationOptions: string[];
  typeOptions: string[];
  labels: {
    searchPlaceholder: string;
    allCompanies: string;
    allLocations: string;
    allTypes: string;
    allStatus: string;
    current: string;
    past: string;
    reset: string;
  };
};

export default function AdminJobsAutoFilter({
  lang,
  rawQ,
  selectedCompany,
  selectedLocation,
  selectedType,
  selectedStatus,
  companyOptions,
  locationOptions,
  typeOptions,
  labels,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const formRef = useRef<HTMLFormElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const submitFilter = () => {
    const form = formRef.current;
    if (!form) return;

    const params = new URLSearchParams(new FormData(form) as any);

    Array.from(params.keys()).forEach((key) => {
      if (!params.get(key)) params.delete(key);
    });

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  };

  const submitFilterDebounced = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(submitFilter, 450);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <form
      ref={formRef}
      className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-[1.5fr_1fr_1fr_1fr_1fr_auto]"
    >
      <input type="hidden" name="lang" value={lang} />

      <div className="relative sm:col-span-2 xl:col-span-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          name="q"
          defaultValue={rawQ}
          placeholder={labels.searchPlaceholder}
          onInput={submitFilterDebounced}
          className="h-10 w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm font-bold outline-none transition focus:border-[#00BFC4] focus:ring-2 focus:ring-[#00BFC4]/15"
        />
      </div>

      <SelectBox name="company" defaultValue={selectedCompany} onChange={submitFilter}>
        <option value="">{labels.allCompanies}</option>
        {companyOptions.map((company) => (
          <option key={company} value={company}>
            {company}
          </option>
        ))}
      </SelectBox>

      <SelectBox name="location" defaultValue={selectedLocation} onChange={submitFilter}>
        <option value="">{labels.allLocations}</option>
        {locationOptions.map((location) => (
          <option key={location} value={location}>
            {location}
          </option>
        ))}
      </SelectBox>

      <SelectBox name="type" defaultValue={selectedType} onChange={submitFilter}>
        <option value="">{labels.allTypes}</option>
        {typeOptions.map((type) => (
          <option key={type} value={type}>
            {type}
          </option>
        ))}
      </SelectBox>

      <SelectBox name="status" defaultValue={selectedStatus} onChange={submitFilter}>
        <option value="">{labels.allStatus}</option>
        <option value="current">{labels.current}</option>
        <option value="past">{labels.past}</option>
      </SelectBox>

      <Link
        href={`/admin/jobs?lang=${lang}`}
        className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-700 transition hover:border-[#00BFC4] hover:bg-cyan-50 sm:col-span-2 xl:col-span-1"
      >
        {labels.reset}
      </Link>
    </form>
  );
}

function SelectBox({
  name,
  defaultValue,
  onChange,
  children,
}: {
  name: string;
  defaultValue: string;
  onChange: () => void;
  children: React.ReactNode;
}) {
  return (
    <select
      name={name}
      defaultValue={defaultValue}
      onChange={onChange}
      className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none transition focus:border-[#00BFC4] focus:ring-2 focus:ring-[#00BFC4]/15"
    >
      {children}
    </select>
  );
}