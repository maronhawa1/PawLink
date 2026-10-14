
import { useState } from "react";
import { Link } from "react-router-dom";
import ReportHelpOffers from "../components/ReportHelpOffers";
import {
  useGetMyHelpOffersQuery,
  useGetMyReportsQuery,
  useWithdrawHelpOfferMutation,
  useCreateHelpOfferMutation,
} from "../api/reportsApi";
import "../styles/my-activity-page.css";
// import "../styles/report-details.css";

type ActivityTab = "reports" | "offers";

type ReportFilter = "ALL" | "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
type OfferFilter = "ALL" | "PENDING" | "ACCEPTED" | "DECLINED" | "WITHDRAWN";

function formatStatus(status: string) {
  return status.replaceAll("_", " ").toLowerCase();
}

function ReportThumbnail({
  photoUrl,
  title,
}: {
  photoUrl?: string | null;
  title: string;
}) {
  return (
    <div className="my-activity-thumbnail">
      {photoUrl ? (
        <img src={photoUrl} alt={title} loading="lazy" />
      ) : (
        <span aria-label="Animal photo unavailable" role="img">
          🐾
        </span>
      )}
    </div>
  );
}

export default function MyActivityPage() {
  const [activeTab, setActiveTab] = useState<ActivityTab>("reports");
  const [reportFilter, setReportFilter] = useState<ReportFilter>("ALL");
  const [offerFilter, setOfferFilter] = useState<OfferFilter>("ALL");
  const [withdrawHelpOffer] = useWithdrawHelpOfferMutation();
  const [busyOfferId, setBusyOfferId] = useState<number | null>(null);
  const [offerActionError, setOfferActionError] = useState("");
  const [createHelpOffer] = useCreateHelpOfferMutation();
  const [reofferId, setReofferId] = useState<number | null>(null);
  const [reofferMessage, setReofferMessage] = useState("");

  const {
    data: myReports = [],
    isLoading: reportsLoading,
    isError: reportsError,
    refetch: refetchReports,
  } = useGetMyReportsQuery();

  const {
    data: myOffers = [],
    isLoading: offersLoading,
    isError: offersError,
    refetch: refetchOffers,
  } = useGetMyHelpOffersQuery();

  const filteredReports = myReports.filter(
    (report) => reportFilter === "ALL" || report.status === reportFilter
  );

  const filteredOffers = myOffers.filter(
    (offer) => offerFilter === "ALL" || offer.status === offerFilter
  );

  async function handleWithdraw(offerId: number) {
    setBusyOfferId(offerId);
    setOfferActionError("");

    try {
        await withdrawHelpOffer(offerId).unwrap();
        await refetchOffers();
    } catch {
        setOfferActionError("Unable to withdraw your offer. Please try again.");
    } finally {
        setBusyOfferId(null);
    }
  }

  async function handleReoffer(offerId: number, reportId: number) {
        if (!reofferMessage.trim()) return;

        setBusyOfferId(offerId);
        setOfferActionError("");

        try {
            await createHelpOffer({
            reportId,
            message: reofferMessage.trim(),
            }).unwrap();

            await refetchOffers();
            setReofferId(null);
            setReofferMessage("");
        } catch {
            setOfferActionError("Unable to send your offer. Please try again.");
        } finally {
            setBusyOfferId(null);
        }
    }

  return (
    <main className="my-activity-page">
      <header className="my-activity-header">
        <h1>My Activity</h1>
        <p>Manage your reports and the help you've offered.</p>
      </header>

      <div className="my-activity-tabs" aria-label="My Activity">
        <button
          type="button"
          className={activeTab === "reports" ? "active" : ""}
          onClick={() => setActiveTab("reports")}
        >
          My Reports
          <span className="my-activity-tab-count">{myReports.length}</span>
        </button>

        <button
          type="button"
          className={activeTab === "offers" ? "active" : ""}
          onClick={() => setActiveTab("offers")}
        >
          My Help Offers
          <span className="my-activity-tab-count">{myOffers.length}</span>
        </button>
      </div>

      {activeTab === "reports" ? (
        <section className="my-activity-content">
          <div className="my-activity-section-header">
            <h2>My Reports</h2>

            <label className="my-activity-filter">
              <span>Filter:</span>
              <select
                value={reportFilter}
                onChange={(event) =>
                  setReportFilter(event.target.value as ReportFilter)
                }
              >
                <option value="ALL">All statuses</option>
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In progress</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
              </select>
            </label>
          </div>

          {reportsLoading && <p>Loading your reports...</p>}

          {reportsError && (
            <p role="alert">Unable to load your reports.</p>
          )}

          {!reportsLoading && !reportsError && myReports.length === 0 && (
            <p>You haven't created any reports yet.</p>
          )}

          {!reportsLoading &&
            !reportsError &&
            myReports.length > 0 &&
            filteredReports.length === 0 && (
              <p>No reports match this filter.</p>
            )}

          {!reportsLoading && !reportsError && (
            <div className="my-activity-list">
              {filteredReports.map((report) => (
                <details className="my-activity-item" key={report.id}>
                  <summary className="my-activity-summary">
                    <ReportThumbnail
                      photoUrl={report.photoUrl}
                      title={report.title}
                    />

                    <div className="my-activity-summary-info">
                        <h3>{report.title}</h3>
                    </div>

                    <span
                    className={`status-badge status-${report.status.toLowerCase()}`}
                    >
                        {formatStatus(report.status)}
                    </span>

                    <span className="my-activity-chevron" aria-hidden="true">
                      ▾
                    </span>
                  </summary>

                  <div className="my-activity-expanded">
                    <div className="my-activity-report-preview">
                        <p className="my-activity-description">
                            {report.description}
                        </p>

                        <Link
                            className="my-activity-view-link"
                            to={`/reports/${report.id}`}
                        >
                            View report ↗
                        </Link>
                    </div>

                    <div className="my-activity-offers-section">
                      <ReportHelpOffers
                        reportId={report.id}
                        onOfferAccepted={() => {
                          refetchReports();
                        }}
                      />
                    </div>
                  </div>
                </details>
              ))}
            </div>
          )}
        </section>
      ) : (
        <section className="my-activity-content">
          <div className="my-activity-section-header">
            <h2>My Help Offers</h2>

            <label className="my-activity-filter">
              <span>Filter:</span>
              <select
                value={offerFilter}
                onChange={(event) =>
                  setOfferFilter(event.target.value as OfferFilter)
                }
              >
                <option value="ALL">All statuses</option>
                <option value="PENDING">Pending</option>
                <option value="ACCEPTED">Accepted</option>
                <option value="DECLINED">Declined</option>
                <option value="WITHDRAWN">Withdrawn</option>
              </select>
            </label>
          </div>

          {offersLoading && <p>Loading your offers...</p>}

          {offersError && (
            <p role="alert">Unable to load your help offers.</p>
          )}

          {!offersLoading && !offersError && myOffers.length === 0 && (
            <p>You haven't offered help on any reports yet.</p>
          )}

          {!offersLoading &&
            !offersError &&
            myOffers.length > 0 &&
            filteredOffers.length === 0 && (
              <p>No help offers match this filter.</p>
            )}

          {!offersLoading && !offersError && (
            <div className="my-activity-list">
              {filteredOffers.map((offer) => (
                <details className="my-activity-item" key={offer.id}>
                  <summary className="my-activity-summary">
                    <ReportThumbnail
                      title={offer.reportTitle ?? `Report #${offer.reportId}`}
                    />

                    <div className="my-activity-summary-info">
                      <h3>
                        {offer.reportTitle ?? `Report #${offer.reportId}`}
                      </h3>
                    </div>
                    <span
                        className={`my-activity-offer-status my-activity-offer-${offer.status.toLowerCase()}`}
                    >
                        {formatStatus(offer.status)}
                    </span>
                    

                    <span className="my-activity-chevron" aria-hidden="true">
                      ▾
                    </span>
                  </summary>
                <div className="my-activity-expanded">
                  <div className="my-activity-report-preview">
                    <p className="my-activity-description">
                      {offer.message}
                    </p>

                    <Link
                      className="my-activity-view-link"
                      to={`/reports/${offer.reportId}`}
                    >
                      View report ↗
                    </Link>
                  </div>

                  {offer.status === "PENDING" && (
                        <div className="my-activity-offer-actions">
                            <button
                            type="button"
                            disabled={busyOfferId !== null}
                            onClick={() => handleWithdraw(offer.id)}
                            >
                            {busyOfferId === offer.id ? "Withdrawing..." : "Withdraw offer"}
                            </button>
                        </div>
                        )}

                        {offerActionError && busyOfferId === null && (
                        <p className="report-details-error" role="alert">
                            {offerActionError}
                        </p>
                    )}

                    {offer.status === "WITHDRAWN" &&
                        (offer.reportStatus === "OPEN" ||
                            offer.reportStatus === "IN_PROGRESS") && (
                            <div className="my-activity-reoffer">
                            {reofferId === offer.id ? (
                                <form
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    handleReoffer(offer.id, offer.reportId);
                                }}
                                >
                                <textarea
                                    value={reofferMessage}
                                    onChange={(event) => setReofferMessage(event.target.value)}
                                    placeholder="How can you help?"
                                    aria-label="Your help offer message"
                                    rows={3}
                                    required
                                />

                                <div className="my-activity-offer-actions">
                                    <button type="submit" disabled={busyOfferId !== null || !reofferMessage.trim()}>
                                    {busyOfferId === offer.id ? "Sending..." : "Send offer"}
                                    </button>
                                    <button
                                    type="button"
                                    disabled={busyOfferId !== null}
                                    onClick={() => setReofferId(null)}
                                    >
                                    Cancel
                                    </button>
                                </div>
                                </form>
                            ) : (
                                <div className="my-activity-offer-actions">
                                <button
                                    type="button"
                                    onClick={() => {
                                    setReofferId(offer.id);
                                    setReofferMessage(offer.message);
                                    setOfferActionError("");
                                    }}
                                >
                                    Offer Again
                                </button>
                                </div>
                            )}
                            </div>
                        )}

                </div>
                </details>
              ))}
            </div>
          )}
        </section>
      )}
    </main>
  );
}
