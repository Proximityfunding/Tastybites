export default function PeakHoursHeatmap({
  grid,
  max,
  dayNames,
}: {
  grid: number[][];
  max: number;
  dayNames: string[];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="border-collapse text-xs">
        <thead>
          <tr>
            <th className="w-10" />
            {Array.from({ length: 24 }, (_, h) => (
              <th key={h} className="w-6 pb-1 font-normal text-gray-400">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {grid.map((row, day) => (
            <tr key={day}>
              <td className="pr-2 text-gray-500">{dayNames[day]}</td>
              {row.map((count, hour) => {
                const intensity = count / max;
                return (
                  <td key={hour} className="p-0.5">
                    <div
                      title={`${dayNames[day]} ${hour}:00 — ${count} order(s)`}
                      className="h-5 w-5 rounded-sm"
                      style={{
                        backgroundColor:
                          count === 0 ? "var(--color-gray-100, #f3f4f6)" : `rgba(234, 88, 12, ${0.15 + intensity * 0.85})`,
                      }}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
