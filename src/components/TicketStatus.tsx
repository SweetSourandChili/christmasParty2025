"use client";

interface TicketStatusProps {
  status: string;
  showMessage?: boolean;
}

export default function TicketStatus({
  status,
  showMessage = false,
}: TicketStatusProps) {
  const getBadgeClass = () => {
    switch (status) {
      case "ACTIVATED":
        return "badge-activated";
      case "PAYMENT_PENDING":
        return "badge-pending";
      default:
        return "badge-not-activated";
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case "ACTIVATED":
        return "✅";
      case "PAYMENT_PENDING":
        return "⏳";
      default:
        return "❌";
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case "ACTIVATED":
        return "Activated";
      case "PAYMENT_PENDING":
        return "Payment Pending";
      default:
        return "Not Activated";
    }
  };

  const getMessage = () => {
    switch (status) {
      case "ACTIVATED":
        return "🎉 Your ticket is activated! See you at the party!";
      case "PAYMENT_PENDING":
        return "⏳ Your registration is complete. Please complete the payment to activate your ticket.";
      default:
        return "⚠️ You need to create or register for a performance to activate your ticket.";
    }
  };

  return (
    <div>
      <span className={`badge ${getBadgeClass()}`}>
        {getStatusIcon()} {getStatusLabel()}
      </span>
      {showMessage && (
        <p className="mt-3 text-sm text-christmas-cream/80">{getMessage()}</p>
      )}
    </div>
  );
}

