import { useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import {
  getReportDetails,
  updateReportStatus,
  addReportUpdate,
  type ReportDetails,
  type ReportHistoryEntry,
  type ReportStatus,
  type ReportType,
} from "../services/reports.service";
import "../styles/reports-map.css";
import "../styles/report-details.css";
import OfferHelpForm from "../components/OfferHelpForm";
import { useGetMyHelpOffersQuery } from "../api/reportsApi";


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
  CLOSED: [],
};

const helperTransitions: Partial<Record<ReportStatus, ReportStatus[]>> = {
  OPEN: ["IN_PROGRESS"],
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

  const [updateMessage, setUpdateMessage] = useState("");
  const [isPostingUpdate, setIsPostingUpdate] = useState(false);
  const [updateError, setUpdateError] = useState("");

  const token = readToken();
  const currentUserId = getUserIdFromToken(token);

  const { data: myOffers = [] } = useGetMyHelpOffersQuery(undefined, {
    skip: currentUserId === null,
  });

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

  const isHelper = myOffers.some(
    (offer) =>
      offer.reportId === reportId &&
      offer.status === "ACCEPTED",
  );

  const canOfferHelp =
    currentUserId !== null &&
    !isReporter &&
    !isHelper &&
    ["OPEN", "IN_PROGRESS"].includes(report.status);

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

  async function handleAddUpdate(event: FormEvent<HTMLFormElement>) {
  event.preventDefault();

  if (!token || !updateMessage.trim()) return;

  setIsPostingUpdate(true);
  setUpdateError("");

  try {
    await addReportUpdate(reportId, updateMessage.trim(), token);
    setUpdateMessage("");
    setReloadKey((key) => key + 1);
  } catch (error) {
    setUpdateError(
      error instanceof Error ? error.message : "Failed to add update",
    );
  } finally {
    setIsPostingUpdate(false);
  }
}

  return (
    <main className="report-details-page">
      <Link className="report-back-link" to="/reports/map">
        ← Back to the map
      </Link>

      <section className="report-details-card report-details-overview">
        {report.photoUrl && (
          <img
            className="report-details-photo"
            src={report.photoUrl}
            alt={report.title}
          />
        )}

        <div className="report-details-overview-content">
          {!isReporter && currentUserId !== null && (canOfferHelp || isHelper) && (
            <div className="report-details-offer-action">
              <OfferHelpForm reportId={reportId} />
            </div>
          )}
           <h1>{report.title}</h1>

          <div className="report-details-tags">
            <span
              className={`report-type report-type-${report.type.toLowerCase()}`}
            >
              {typeLabels[report.type]}
            </span>

            <StatusBadge status={report.status} />
          </div>

        <div className="report-details-description-block">
          <span className="report-details-description-label">
            Description
          </span>
          <p className="report-details-description">
            {report.description}
          </p>
        </div>

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

        </div>
      </section>

      <div className="report-details-columns">
        <section className="report-details-card">
          <h2>Case Activity</h2>

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

            {history.map((entry, index) => {
              const previousStatus =
                index === 0 ? "OPEN" : history[index - 1].status;

              const isNote = entry.status === previousStatus;

              return (
                <li key={entry.id}>
                  {isNote ? (
                    <span className="activity-note-label">UPDATE</span>
                  ) : (
                    <StatusBadge status={entry.status} />
                  )}
                
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
              );
            })}
          </ol>
        </section>

        <div className="report-details-actions">

          {(isReporter || isHelper) && report.status !== "CLOSED" && (
            <section className="report-details-card">
              <h2>Add Update</h2>

              <form className="status-form" onSubmit={handleAddUpdate}>
                <label htmlFor="update-message">Share an update about this case</label>

                <textarea
                  id="update-message"
                  value={updateMessage}
                  onChange={(event) => setUpdateMessage(event.target.value)}
                  maxLength={1000}
                  rows={3}
                  placeholder="What happened? Any new information?"
                  required
                />

                {updateError && (
                  <p className="report-details-error" role="alert">
                    {updateError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isPostingUpdate || !updateMessage.trim()}
                >
                  {isPostingUpdate ? "Posting..." : "Post Update"}
                </button>
              </form>
            </section>
          )}

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
      </div>
    </main>
  );
}
