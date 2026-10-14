
import { useState } from "react";
import {
  useGetReportHelpOffersQuery,
  useRespondToHelpOfferMutation,
} from "../api/reportsApi";
import "../styles/report-help-offers.css"

type Props = {
  reportId: number;
  onOfferAccepted: () => void;
};

export default function ReportHelpOffers({
  reportId,
  onOfferAccepted,
}: Props) {
  const { data: offers = [], isLoading, isError, refetch } =
    useGetReportHelpOffersQuery(reportId);

  const [respondToOffer] = useRespondToHelpOfferMutation();
  const [busyOfferId, setBusyOfferId] = useState<number | null>(null);
  const [error, setError] = useState("");

  async function handleResponse(
    offerId: number,
    status: "ACCEPTED" | "DECLINED",
  ) {
    setBusyOfferId(offerId);
    setError("");

    try {
      await respondToOffer({
        reportId,
        offerId,
        status,
      }).unwrap();

      await refetch();

      if (status === "ACCEPTED") {
        onOfferAccepted();
      }
    } catch {
      setError("Unable to respond to this offer. Please try again.");
    } finally {
      setBusyOfferId(null);
    }
  }

  if (isLoading) {
    return (
      <section className="help-offers-card">
        <h2>Help offers</h2>
        <p>Loading offers...</p>
      </section>
    );
  }

  return (
    <section className="help-offers-card">
      <h2>Help offers</h2>

      {isError && (
        <p className="report-details-error" role="alert">
          Unable to load help offers.
        </p>
      )}

      {!isError && !offers.some(
        (offer) => offer.status !== "WITHDRAWN"
        ) && (
            <p>No help offers yet.</p>
      )}

      {offers
       .filter((offer) => offer.status !== "WITHDRAWN")
       .map((offer) => (
        <div key={offer.id} className="help-offer-item">
          <div className="help-offer-header">
            <strong>{offer.volunteerName ?? "PawLink volunteer"}</strong>
            <span className={`help-offer-status help-offer-${offer.status.toLowerCase()}`}>
              {offer.status.toLowerCase()}
            </span>
          </div>

          <p>{offer.message}</p>

          {offer.status === "PENDING" && (
            <div className="help-offer-actions">
              <button
                type="button"
                disabled={busyOfferId !== null}
                onClick={() => handleResponse(offer.id, "ACCEPTED")}
              >
                {busyOfferId === offer.id ? "Saving..." : "Accept"}
              </button>

              <button
                type="button"
                disabled={busyOfferId !== null}
                onClick={() => handleResponse(offer.id, "DECLINED")}
              >
                Decline
              </button>
            </div>
          )}
        </div>
      ))}

      {error && (
        <p className="report-details-error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
