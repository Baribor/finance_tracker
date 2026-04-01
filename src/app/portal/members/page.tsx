"use client";

import { useEffect, useState } from "react";

interface GroupMember {
  _id: string;
  stateCode: string;
  name: string;
  role: string;
  serviceStatus: string;
  createdAt: string;
}

export default function PortalMembersPage() {
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMembers = async () => {
      const res = await fetch("/api/members/group");
      if (res.ok) {
        const data = await res.json();
        setMembers(data);
      }
      setLoading(false);
    };
    fetchMembers();
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text">Group Members</h1>
        <p className="text-text-secondary text-sm mt-1">
          Active serving members in your CDS group
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : members.length === 0 ? (
        <div className="bg-white rounded-xl border border-border shadow-sm p-8 text-center">
          <p className="text-text-secondary text-sm">
            No active serving members found in your group.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="border-b border-border bg-surface-alt">
                  <th className="p-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">
                    State Code
                  </th>
                  <th className="p-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">
                    Name
                  </th>
                  <th className="p-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide">
                    Role
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {members.map((m) => (
                  <tr key={m._id} className="hover:bg-surface-alt/50">
                    <td className="p-4">
                      <span className="font-mono text-sm font-medium text-text">
                        {m.stateCode}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-text">{m.name}</td>
                    <td className="p-4">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          m.role === "secretary"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {m.role}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-3 border-t border-border bg-surface-alt">
            <p className="text-xs text-text-secondary text-center">
              {members.length} active member{members.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
