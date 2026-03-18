"use client";

import { useState, useTransition } from "react";
import type { User, Facility, PublicHealthUnit, UserRole } from "@prisma/client";

type UserWithRelations = User & {
  facility: Facility | null;
  phu: PublicHealthUnit | null;
};

export function AdminUsersTable({
  users,
  facilities,
  phus,
}: {
  users: UserWithRelations[];
  facilities: Facility[];
  phus: PublicHealthUnit[];
}) {
  const [optimisticUsers, setOptimisticUsers] =
    useState<UserWithRelations[]>(users);
  const [isPending, startTransition] = useTransition();

  async function updateUser(
    id: number,
    patch: Partial<Pick<User, "role" | "isActive" | "facilityId" | "phuId">>,
  ) {
    const previous = optimisticUsers;
    setOptimisticUsers((current) =>
      current.map((u) => (u.id === id ? { ...u, ...patch } : u)),
    );

    startTransition(async () => {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(patch),
      });

      if (!res.ok) {
        setOptimisticUsers(previous);
      }
    });
  }

  const allRoles: UserRole[] = ["FACILITY", "PHU", "ADMIN"];

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-500">
          <tr>
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Role</th>
            <th className="px-4 py-3">Facility / PHU</th>
            <th className="px-4 py-3">Region</th>
            <th className="px-4 py-3">Active</th>
            <th className="px-4 py-3">Created</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {optimisticUsers.length === 0 ? (
            <tr>
              <td
                colSpan={6}
                className="px-4 py-6 text-center text-sm text-slate-500"
              >
                No users found.
              </td>
            </tr>
          ) : (
            optimisticUsers.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50/60">
                <td className="px-4 py-3 text-slate-900">{u.email}</td>
                <td className="px-4 py-3">
                  <select
                    className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-900"
                    value={u.role}
                    onChange={(e) =>
                      updateUser(u.id, {
                        role: e.target.value as UserRole,
                      })
                    }
                    disabled={isPending}
                  >
                    {allRoles.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1">
                    <select
                      className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-900"
                      value={u.facilityId ?? ""}
                      onChange={(e) =>
                        updateUser(u.id, {
                          facilityId: e.target.value
                            ? Number(e.target.value)
                            : null,
                          phuId: null,
                        })
                      }
                      disabled={isPending}
                    >
                      <option value="">No facility</option>
                      {facilities.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name}
                        </option>
                      ))}
                    </select>
                    <select
                      className="rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-900"
                      value={u.phuId ?? ""}
                      onChange={(e) =>
                        updateUser(u.id, {
                          phuId: e.target.value ? Number(e.target.value) : null,
                          facilityId: null,
                        })
                      }
                      disabled={isPending}
                    >
                      <option value="">No PHU</option>
                      {phus.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-700">
                  {u.facility?.region ?? u.phu?.region ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() =>
                      updateUser(u.id, {
                        isActive: !u.isActive,
                      })
                    }
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      u.isActive
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                    disabled={isPending}
                  >
                    {u.isActive ? "Active" : "Inactive"}
                  </button>
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">
                  {new Date(u.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

