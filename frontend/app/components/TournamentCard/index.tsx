import { Tournament } from "../../types";

interface TournamentCardProps {
  tournament: Tournament;
  onJoin?: (id: number) => void;
}

function getStatusColor(status: string | undefined) {
  const s = (status ?? "upcoming").toLowerCase();

  const colorMap: Record<string, string> = {
    active: "bg-green-600",
    upcoming: "bg-yellow-500",
    completed: "bg-gray-600",
  };

  return colorMap[s] || "bg-blue-600";
}

export default function TournamentCard({ tournament, onJoin }: TournamentCardProps) {
  const statusValue = tournament.is_active ? "active" : "upcoming";

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  return (
    <div className="bg-gray-900 rounded-xl p-6 border border-gray-700 hover:border-blue-500 transition-all shadow-lg">
      {/* Title & Status */}
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-semibold text-white truncate">
          {tournament.name}
        </h3>

        <span
          className={`${getStatusColor(
            statusValue
          )} text-white text-xs px-2 py-1 rounded uppercase whitespace-nowrap`}
        >
          {statusValue.toUpperCase()}
        </span>
      </div>

      {/* Description */}
      <p className="text-gray-400 text-sm mb-4 line-clamp-2">
        {tournament.description || "No description available"}
      </p>

      {/* Details */}
      <div className="space-y-2 mb-5 text-sm">
        <DetailRow label="Start Date" value={formatDate(tournament.start_time)} />
        <DetailRow label="End Date" value={formatDate(tournament.end_time)} />
        <DetailRow
          label="Initial Balance"
          value={<span className="text-blue-400 font-semibold">₹{tournament.initial_balance}</span>}
        />
        <DetailRow
          label="Prize Pool"
          value={<span className="text-green-400 font-semibold">₹{tournament.prize_pool}</span>}
        />
      </div>

      {/* Button */}
      {statusValue === "active" || statusValue === "upcoming" ? (
        <button
          onClick={() => onJoin?.(tournament.id)}
          className="w-full bg-blue-600 text-white font-medium py-2 rounded-lg hover:bg-blue-700 transition"
        >
          Join Tournament
        </button>
      ) : (
        <button
          disabled
          className="w-full bg-gray-700 text-gray-400 font-medium py-2 rounded-lg cursor-not-allowed"
        >
          Tournament Ended
        </button>
      )}
    </div>
  );
}

/* Small helper component */
function DetailRow({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-400">{label}:</span>
      <span className="text-white">{value}</span>
    </div>
  );
}
