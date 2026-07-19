import Link from "next/link";
import { StatusBadge, ProgressBar } from "./primitives";
import { IconTruck } from "./icons";
import { formatCents } from "@/lib/money";

// Gallery-view vehicle card (Section 15). Photo slot degrades to a branded
// placeholder when no image is present (photo upload lands in Phase 3).
export interface VehicleCardData {
  id: string;
  year: number;
  make: string;
  model: string;
  nickname?: string | null;
  status: string;
  percentComplete?: number;
  trueCashInvestedCents?: number;
  currentMarketValueCents?: number | null;
  imageUrl?: string | null;
}

export function VehicleCard({ v }: { v: VehicleCardData }) {
  return (
    <Link
      href={`/os/vehicles/${v.id}`}
      className="panel group block overflow-hidden p-0 transition hover:border-bg-panel"
    >
      <div className="surface-texture relative flex h-36 items-center justify-center border-b border-bg-gunmetal">
        {v.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={v.imageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <IconTruck className="text-5xl text-bg-panel" />
        )}
        <div className="absolute right-2 top-2">
          <StatusBadge status={v.status} />
        </div>
      </div>
      <div className="p-4">
        <div className="font-display text-lg uppercase leading-tight text-paper-warm group-hover:text-rust-400">
          {v.year} {v.make} {v.model}
        </div>
        {v.nickname && <div className="text-xs text-paper-muted">&ldquo;{v.nickname}&rdquo;</div>}

        {typeof v.percentComplete === "number" && (
          <div className="mt-3">
            <div className="mb-1 flex justify-between text-[11px] text-paper-muted">
              <span>Build</span>
              <span className="tnum">{v.percentComplete}%</span>
            </div>
            <ProgressBar value={v.percentComplete} />
          </div>
        )}

        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <div>
            <div className="text-paper-muted">Invested</div>
            <div className="tnum text-paper-steel">{formatCents(v.trueCashInvestedCents ?? 0)}</div>
          </div>
          <div>
            <div className="text-paper-muted">Market</div>
            <div className="tnum text-paper-steel">
              {v.currentMarketValueCents != null ? formatCents(v.currentMarketValueCents) : "—"}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
