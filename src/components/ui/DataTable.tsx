import type { ReactNode } from "react";
import Link from "next/link";

// Standardized presentational table (Section 12). Sticky header, numeric
// alignment, hover, optional clickable rows, and a built-in empty row.
// Interactive sorting / saved views / column visibility land with the features
// that need them (documented as intentionally deferred).

export interface Column<T> {
  key: string;
  header: ReactNode;
  align?: "left" | "right" | "center";
  render: (row: T) => ReactNode;
  headerClassName?: string;
  cellClassName?: string;
}

export function DataTable<T>({
  columns,
  rows,
  getKey,
  rowHref,
  empty = "No records.",
}: {
  columns: Column<T>[];
  rows: T[];
  getKey: (row: T) => string;
  rowHref?: (row: T) => string;
  empty?: ReactNode;
}) {
  const alignClass = (a?: "left" | "right" | "center") =>
    a === "right" ? "text-right num" : a === "center" ? "text-center" : "text-left";

  return (
    <div className="scroll-steel overflow-x-auto rounded-md border border-bg-gunmetal">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} className={`${alignClass(c.align)} ${c.headerClassName ?? ""}`}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const href = rowHref?.(row);
            return (
              <tr key={getKey(row)} className={href ? "cursor-pointer" : ""}>
                {columns.map((c, i) => {
                  const content = c.render(row);
                  return (
                    <td key={c.key} className={`${alignClass(c.align)} ${c.cellClassName ?? ""}`}>
                      {href && i === 0 ? (
                        <Link href={href} className="block font-medium text-paper-warm hover:text-rust-400">
                          {content}
                        </Link>
                      ) : (
                        content
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
          {rows.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-4 py-10 text-center text-paper-muted">
                {empty}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
