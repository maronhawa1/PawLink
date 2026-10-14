
import { useEffect, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import {
  useCreateHelpOfferMutation,
  useGetMyHelpOffersQuery,
  useWithdrawHelpOfferMutation,
} from "../api/reportsApi";
import "../styles/offer-help.css";

type OfferHelpFormProps = {
  reportId: number;
};

export default function OfferHelpForm({ reportId }: OfferHelpFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  const {
    data: myOffers = [],
    refetch,
    isLoading: isCheckingOffers,
  } = useGetMyHelpOffersQuery();

  const [withdrawHelpOffer, { isLoading: isWithdrawing }] =
    useWithdrawHelpOfferMutation();

  const existingOffer = myOffers.find(
    (offer) => offer.reportId === reportId,
 );

  const [createHelpOffer, { isLoading, error, reset }] =
    useCreateHelpOfferMutation();

  useEffect(() => {
    if (!isOpen) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !isLoading) {
        setIsOpen(false);
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, isLoading]);

  function closeModal() {
    if (isLoading) return;
    setIsOpen(false);
    setMessage("");
    reset();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedMessage = message.trim();
    if (!trimmedMessage) return;

    try {
      await createHelpOffer({
        reportId,
        message: trimmedMessage,
      }).unwrap();

      setSuccess(true);
      setIsOpen(false);
      setMessage("");
      await refetch();
    } catch {
      // Error is available in the mutation state.
    }
  }

  async function handleWithdraw() {
    if (!existingOffer || existingOffer.status !== "PENDING") return;

    try {
        await withdrawHelpOffer(existingOffer.id).unwrap();
        await refetch();
        setSuccess(false);
    } catch {
        alert("Unable to withdraw your offer. Please try again.");
    }
 }

  if (isCheckingOffers) {
  return <p>Checking your help offers...</p>;
}

if (success && existingOffer?.status === "PENDING") {
  return (
    <div className="offer-help-status">
      <span className="offer-help-status-label">
        Pending
      </span>

      <p className="offer-help-success" role="status">
        ✓ Help offer sent!
      </p>

      <button
        type="button"
        className="offer-help-withdraw"
        onClick={handleWithdraw}
        disabled={isWithdrawing}
      >
        {isWithdrawing ? "Withdrawing..." : "Withdraw Offer"}
      </button>
    </div>
  );
}


if (existingOffer && existingOffer.status !== "WITHDRAWN") {
  return (
    <div className="offer-help-status">
      <span
        className={`offer-help-status-label ${
          existingOffer.status === "ACCEPTED"
            ? "accepted"
            : existingOffer.status === "DECLINED"
              ? "declined"
              : ""
        }`}
      >
        {existingOffer.status.toLowerCase()}
      </span>

      {existingOffer.status === "ACCEPTED" && (
        <p className="offer-help-volunteer">
          ✓ You're helping with this case
        </p>
      )}

      {existingOffer.status === "PENDING" && (
        <button
          type="button"
          className="offer-help-withdraw"
          onClick={handleWithdraw}
          disabled={isWithdrawing}
        >
          {isWithdrawing ? "Withdrawing..." : "Withdraw Offer"}
        </button>
      )}
    </div>
  );
}


  return (
    <>
      <button
        type="button"
        className="offer-help-trigger"
        onClick={() => {
          reset();
          setIsOpen(true);
        }}
      >
        Offer Help
      </button>

      {isOpen &&
        createPortal(
          <div
            className="offer-help-overlay"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                closeModal();
              }
            }}
          >
            <div
              className="offer-help-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby={`offer-help-title-${reportId}`}
            >
              <button
                type="button"
                className="offer-help-close"
                aria-label="Close"
                onClick={closeModal}
                disabled={isLoading}
              >
                ×
              </button>

              <h2 id={`offer-help-title-${reportId}`}>
                Offer Help
              </h2>

              <p className="offer-help-description">
                Let the reporter know how you can help.
              </p>

              <form onSubmit={handleSubmit}>
                <label htmlFor={`offer-message-${reportId}`}>
                  Your message
                </label>

                <textarea
                  id={`offer-message-${reportId}`}
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="I'd be happy to help with..."
                  maxLength={1000}
                  rows={4}
                  required
                  autoFocus
                />

                {error && (
                  <p className="offer-help-error" role="alert">
                    Unable to send your offer. You may have
                    already offered help on this report.
                  </p>
                )}

                <div className="offer-help-actions">
                  <button
                    type="button"
                    className="offer-help-cancel"
                    onClick={closeModal}
                    disabled={isLoading}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="offer-help-submit"
                    disabled={isLoading || !message.trim()}
                  >
                    {isLoading ? "Sending..." : "Send Offer"}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
