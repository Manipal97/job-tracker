export const STAGES = [
  { key: "WISHLIST", label: "Wishlist", color: "#8a94a6" },
  { key: "APPLIED", label: "Applied", color: "#3b82c4" },
  { key: "INTERVIEW", label: "Interview", color: "#d98a1f" },
  { key: "OFFER", label: "Offer", color: "#2f9e6b" },
  { key: "REJECTED", label: "Rejected", color: "#c2493f" },
];

// Local date as YYYY-MM-DD (not UTC), matching the date inputs and the backend.
export const todayIso = () => new Date().toLocaleDateString("en-CA");

export const isFollowUpDue = (app) =>
  !!app.followUpDate && app.followUpDate <= todayIso() && (app.status === "APPLIED" || app.status === "INTERVIEW");
