"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useT } from "@/i18n/client";

export function ApprovalToggle({
  id,
  kind,
  approved,
}: {
  id: string;
  kind: "restaurant" | "courier";
  approved: boolean;
}) {
  const router = useRouter();
  const t = useT();
  const [busy, setBusy] = useState(false);
  async function toggle() {
    setBusy(true);
    await fetch(`/api/admin/${kind}/${id}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approved: !approved }),
    });
    setBusy(false);
    router.refresh();
  }
  return (
    <button className="btn-outline px-3 py-1 text-xs" onClick={toggle} disabled={busy}>
      {approved ? t("admin.revoke_approval") : t("admin.approve")}
    </button>
  );
}
