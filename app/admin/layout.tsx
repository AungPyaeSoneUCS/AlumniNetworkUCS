// file: app/admin/layout.tsx

import type React from "react";
import "./admin.css";

/**
 * Opts all routes within the /admin/* directory out of Static Site Generation (SSG).
 * Since administrative dashboards require live database queries and real-time authentication
 * on every request, forcing dynamic rendering improves reliability and prevents build
 * crashes caused by client-side hooks like useSearchParams() during static prerendering.
 */
export const dynamic = "force-dynamic";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}