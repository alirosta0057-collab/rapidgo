import { prisma } from "@/lib/prisma";
import { ApprovalToggle } from "@/components/admin/ApprovalToggle";

export const dynamic = "force-dynamic";

export default async function AdminRestaurants() {
  const restaurants = await prisma.restaurant.findMany({
    orderBy: { createdAt: "desc" },
    include: { owner: true },
  });
  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">رستوران‌ها</h1>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-brand-50 text-right">
            <tr>
              <th className="p-3">نام</th>
              <th className="p-3">مالک</th>
              <th className="p-3">وضعیت</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {restaurants.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-3">{r.name}</td>
                <td className="p-3">{r.owner?.name || "-"}</td>
                <td className="p-3">
                  {r.isApproved ? (
                    <span className="badge bg-green-100 text-green-700">تایید شده</span>
                  ) : (
                    <span className="badge bg-yellow-100 text-yellow-700">در انتظار</span>
                  )}
                </td>
                <td className="p-3 text-left">
                  <ApprovalToggle id={r.id} kind="restaurant" approved={r.isApproved} />
                </td>
              </tr>
            ))}
            {restaurants.length === 0 && (
              <tr><td className="p-4 text-gray-500" colSpan={4}>رستورانی ثبت نشده.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
