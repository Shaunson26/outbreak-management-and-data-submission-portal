import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { AdminUsersTable } from "./table";

export default async function AdminUsersPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.role !== "ADMIN") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-slate-600">
          You must be signed in as an admin user to view this page.
        </p>
      </div>
    );
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      facility: true,
      phu: true,
    },
  });

  const facilities = await prisma.facility.findMany({
    orderBy: { name: "asc" },
  });

  const phus = await prisma.publicHealthUnit.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-slate-900">
          Users (PHU, facility, admin)
        </h2>
        <p className="text-xs text-slate-600">
          View and manage all user accounts across regions.
        </p>
      </div>
      <AdminUsersTable
        users={users}
        facilities={facilities}
        phus={phus}
      />
    </div>
  );
}

