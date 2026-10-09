import { useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import {
  getReportDetails,
  updateReportStatus,
  type ReportDetails,
  type ReportHistoryEntry,
  type ReportStatus,
  type ReportType,
} from "../services/reports.service";
import "../styles/reports-map.css";
import "../styles/report-details.css";

const TOKEN_KEY = "pawlink_token";

const typeLabels: Record<ReportType, string> = {
  INJURED: "Injured",
  LOST: "Lost",
  FOUND: "Found",
  NEEDS_RESCUE: "Needs rescue",
};

const statusLabels: Record<ReportStatus, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In progress",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

// Must match the rules in server/src/routes/report-status.routes.ts.
const reporterTransitions: Record<ReportStatus, ReportStatus[]> = {
  OPEN: ["IN_PROGRESS", "RESOLVED", "CLOSED"],
  IN_PROGRESS: ["OPEN", "RESOLVED", "CLOSED"],
  RESOLVED: ["OPEN"],
  CLOSED: ["OPEN"],
};

const helperTransitions: Partial<Record<ReportStatus, ReportStatus[]>> = {
  OPEN: ["IN_PROGRESS"],
  IN_PROGRESS: ["OPEN"],
};

function readToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

// Reads the user id from the JWT payload. Only used to decide what to show;
// the server still checks permissions on every update.
function getUserIdFromToken(token: string | null): number | null {
  if (!token) {
    return null;
  }

  try {
    const payload = token.split(".")[1];
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const data = JSON.parse(json) as { sub?: string; exp?: number };

    if (data.exp && data.exp * 1000 < Date.now()) {
      return null;
    }

    const id = Number(data.sub);
    return Number.isSafeInteger(id) && id > 0 ? id : null;
  } catch {
    return null;
  }
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function StatusBadge({ status }: { status: ReportStatus }) {
  return (
    <span className={`status-badge status-${status.toLowerCase()}`}>
      {statusLabels[status]}
    </span>
  );
}

export default function ReportDetailsPage() {
  const { id } = useParams();
  const reportId = Number(id);

  const [report, setReport] = useState<ReportDetails | null>(null);
  const [history, setHistory] = useState<ReportHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [nextStatus, setNextStatus] = useState<ReportStatus | "">("");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const token = readToken();
  const currentUserId = getUserIdFromToken(token);

  const isValidId = Number.isSafeInteger(reportId) && reportId > 0;
  // Bumped after a successful update to load the report again.
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!isValidId) {
      return;
    }

    let cancelled = false;

    getReportDetails(reportId)
      .then((data) => {
        if (cancelled) return;
        setError("");
        setReport(data.report);
        setHistory(data.history);
      })
      .catch((loadError: unknown) => {
        if (cancelled) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load the report",
        );
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isValidId, reportId, reloadKey]);

  if (isValidId && isLoading) {
    return (
      <main className="report-details-page">
        <p className="report-details-message">Loading report...</p>
      </main>
    );
  }

  if (!isValidId || error || !report) {
    return (
      <main className="report-details-page">
        <p className="report-details-message report-details-error" role="alert">
          {error || "Report not found"}
        </p>
        <Link className="report-back-link" to="/reports/map">
          ← Back to the map
        </Link>
      </main>
    );
  }

  const isReporter = currentUserId === report.reporterId;
  const isHelper =
    report.assignedToId !== null && currentUserId === report.assignedToId;

  const options = isReporter
    ? reporterTransitions[report.status]
    : isHelper
      ? helperTransitions[report.status] ?? []
      : [];

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!nextStatus || !token) {
      return;
    }

    setFormError("");
    setIsSaving(true);

    try {
      await updateReportStatus(reportId, nextStatus, message, token);
      setNextStatus("");
      setMessage("");
      setReloadKey((key) => key + 1);
    } catch (saveError) {
      setFormError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to update the status",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="report-details-page">
      <Link className="report-back-link" to="/reports/map">
        ← Back to the map
      </Link>

      <section className="report-details-card">
        <div className="report-details-tags">
          <span
            className={`report-type report-type-${report.type.toLowerCase()}`}
          >
            {typeLabels[report.type]}
          </span>
          <StatusBadge status={report.status} />
        </div>

        <h1>{report.title}</h1>
        <p className="report-details-description">{report.description}</p>

        {report.photoUrl && (
          <img
            className="report-details-photo"
            src={report.photoUrl}
            alt={report.title}
          />
        )}

        <dl className="report-details-meta">
          {report.locationText && (
            <div>
              <dt>Location</dt>
              <dd>{report.locationText}</dd>
            </div>
          )}
          <div>
            <dt>Reported by</dt>
            <dd>{report.reporterName ?? "PawLink user"}</dd>
          </div>
          <div>
            <dt>Reported on</dt>
            <dd>{formatDate(report.createdAt)}</dd>
          </div>
        </dl>
      </section>

      <div className="report-details-columns">
        <section className="report-details-card">
          <h2>Status history</h2>

          <ol className="status-timeline">
            <li>
              <StatusBadge status="OPEN" />
              <p className="timeline-text">Report created</p>
              <p className="timeline-meta">
                {report.reporterName ?? "PawLink user"} ·{" "}
                <time dateTime={report.createdAt}>
                  {formatDate(report.createdAt)}
                </time>
              </p>
            </li>

            {history.map((entry) => (
              <li key={entry.id}>
                <StatusBadge status={entry.status} />
                {entry.message && (
                  <p className="timeline-text">{entry.message}</p>
                )}
                <p className="timeline-meta">
                  {entry.authorName ?? "PawLink user"} ·{" "}
                  <time dateTime={entry.createdAt}>
                    {formatDate(entry.createdAt)}
                  </time>
                </p>
              </li>
            ))}
          </ol>
        </section>

        {options.length > 0 && (
          <section className="report-details-card">
            <h2>Update status</h2>

            <form className="status-form" onSubmit={handleSubmit}>
              <label htmlFor="next-status">New status</label>
              <select
                id="next-status"
                value={nextStatus}
                onChange={(event) =>
                  setNextStatus(event.target.value as ReportStatus | "")
                }
                required
              >
                <option value="" disabled>
                  Choose a status
                </option>
                {options.map((status) => (
                  <option key={status} value={status}>
                    {statusLabels[status]}
                  </option>
                ))}
              </select>

              <label htmlFor="status-message">Note (optional)</label>
              <textarea
                id="status-message"
                value={message}
                maxLength={500}
                rows={3}
                placeholder="What changed?"
                onChange={(event) => setMessage(event.target.value)}
              />

              {formError && (
                <p className="report-details-error" role="alert">
                  {formError}
                </p>
              )}

              <button type="submit" disabled={isSaving || !nextStatus}>
                {isSaving ? "Saving..." : "Update status"}
              </button>
            </form>
          </section>
        )}
      </div>
    </main>
  );
}
