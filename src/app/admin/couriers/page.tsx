import { prisma } from "@/lib/prisma";
import { ApprovalToggle } from "@/components/admin/ApprovalToggle";
import { getT } from "@/i18n/server";

export const dynamic = "force-dynamic";

export default async function AdminCouriers() {
  const { t } = getT();
  const couriers = await prisma.courierProfile.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: true },
  });
  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">{t("admin.couriers_title")}</h1>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-brand-50 text-right">
            <tr>
              <th className="p-3">{t("common.name")}</th>
              <th className="p-3">{t("common.email")}</th>
              <th className="p-3">{t("admin.col_online")}</th>
              <th className="p-3">{t("admin.col_last_position")}</th>
              <th className="p-3">{t("admin.col_ip")}</th>
              <th className="p-3">{t("common.status")}</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {couriers.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="p-3">{c.user.name}</td>
                <td className="p-3 text-xs">{c.user.email}</td>
                <td className="p-3">{c.isOnline ? "🟢" : "⚫"}</td>
                <td className="p-3 text-xs">
                  {c.lastLat != null && c.lastLng != null
                    ? `${c.lastLat.toFixed(4)}, ${c.lastLng.toFixed(4)}`
                    : "-"}
                </td>
                <td className="p-3 text-xs">{c.lastIp || "-"}</td>
                <td className="p-3">
                  {c.isApproved ? (
                    <span className="badge bg-green-100 text-green-700">{t("admin.approved")}</span>
                  ) : (
                    <span className="badge bg-yellow-100 text-yellow-700">{t("admin.pending")}</span>
                  )}
                </td>
                <td className="p-3 text-left">
                  <ApprovalToggle id={c.id} kind="courier" approved={c.isApproved} />
                </td>
              </tr>
            ))}
            {couriers.length === 0 && (
              <tr><td className="p-4 text-gray-500" colSpan={7}>{t("admin.no_couriers")}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
