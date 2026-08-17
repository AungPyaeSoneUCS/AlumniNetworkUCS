// file: components/admin/auto-submit-select.tsx

"use client";

import type React from "react";

import { useTransition } from "react";

type AutoSubmitSelectProps = {
  name: string;
  defaultValue?: string;
  className?: string;
  children: React.ReactNode;
};

export default function AutoSubmitSelect({
  name,
  defaultValue = "",
  className = "",
  children,
}: AutoSubmitSelectProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <select
      name={name}
      defaultValue={defaultValue}
      disabled={isPending}
      onChange={(event) => {
        const form = event.currentTarget.form;

        if (!form) return;

        startTransition(() => {
          form.requestSubmit();
        });
      }}
      className={`${className} ${isPending ? "cursor-wait opacity-70" : ""}`}
    >
      {children}
    </select>
  );
}
