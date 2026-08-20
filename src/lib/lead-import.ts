export const IMPORT_COLUMNS: { label: string; field: string }[] = [
  { label: "Title", field: "title" },
  { label: "Contact name", field: "contactName" },
  { label: "Phone number(s)", field: "contactPhone" },
  { label: "Email(s)", field: "contactEmail" },
  { label: "WhatsApp", field: "whatsappNumber" },
  { label: "Country", field: "country" },
  { label: "State", field: "state" },
  { label: "City", field: "city" },
  { label: "Urgency", field: "urgency" },
  { label: "Company", field: "company" },
  { label: "Source", field: "source" },
  { label: "Competitor", field: "competitor" },
  { label: "Competitor other", field: "competitorOther" },
  { label: "Engagement", field: "engagementType" },
  { label: "LinkedIn post", field: "sourceUrl" },
  { label: "Requirement tag", field: "requirementTag" },
  { label: "Details", field: "details" },
];

export const IMPORT_HEADER_MAP: Record<string, string> = Object.fromEntries(
  IMPORT_COLUMNS.map((c) => [c.label.trim().toLowerCase(), c.field]),
);
