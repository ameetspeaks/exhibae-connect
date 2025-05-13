
export interface Exhibition {
  id: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  location: {
    address: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
    latitude: number;
    longitude: number;
  };
  bannerImage: string;
  organiserId: string;
  stallCount: number;
  stallsAvailable: number;
  ticketPrice?: number;
  categories: string[];
  status: "draft" | "published" | "completed" | "cancelled";
}

export interface Stall {
  id: string;
  exhibitionId: string;
  brandId: string;
  name: string;
  description: string;
  size: "small" | "medium" | "large";
  price: number;
  status: "available" | "applied" | "confirmed" | "rejected" | "cancelled";
  location?: {
    row: string;
    number: number;
  };
}

export interface StallApplication {
  id: string;
  stallId: string;
  brandId: string;
  status: "pending" | "approved" | "rejected";
  submittedAt: Date;
  notes?: string;
}
