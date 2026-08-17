// file: components/t.tsx
"use client";

import { useI18n } from "@/components/providers";

export default function T({ k }: { k: string }) {
  const { t } = useI18n();
  return <>{t(k)}</>;
}