import type { StudySummary } from "@/types/Study";
import { formatLvef } from "@/utils/formatLvef";

type StudiesTableProps = {
  studies: StudySummary[];
};

export default function StudiesTable({ studies }: StudiesTableProps) {
  return (
    <div className="mt-8">
      <h2 className="text-base font-semibold text-zinc-900">Studies</h2>
      <div className="mt-3 overflow-x-auto rounded-lg border border-zinc-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-zinc-700">
                Patient
              </th>
              <th className="px-4 py-2 text-left font-medium text-zinc-700">
                Study Date
              </th>
              <th className="px-4 py-2 text-left font-medium text-zinc-700">
                Indication
              </th>
              <th className="px-4 py-2 text-left font-medium text-zinc-700">
                LVEF
              </th>
              <th className="px-4 py-2 text-left font-medium text-zinc-700">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {studies.map((s) => (
              <tr key={s.id} className="border-t border-zinc-100">
                <td className="px-4 py-2">
                  <div className="font-semibold text-zinc-900">
                    {s.patientName}
                  </div>
                  <div className="text-xs text-zinc-500">{s.patientId}</div>
                </td>
                <td className="px-4 py-2 text-zinc-900">{s.studyDate}</td>
                <td className="px-4 py-2 text-zinc-900">
                  {String(s.indication)}
                </td>
                <td className="px-4 py-2 font-semibold text-zinc-900">
                  {formatLvef(s.lvef)}
                </td>
                <td className="px-4 py-2 text-zinc-900">
                  {String(s.status)}
                </td>
              </tr>
            ))}
            {studies.length === 0 ? (
              <tr>
                <td
                  className="px-4 py-6 text-center text-zinc-600"
                  colSpan={5}
                >
                  No studies available.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

