export interface PriceOption {
  duration: string; // e.g., '60 Minutes'
  price: string;    // e.g., 'BDT 2,500'
  amount: number;
}

export interface Service {
  id: string;
  name: string;
  durationRange: string; // '60 / 90 Minutes'
  shortDescription: string;
  fullDescription: string;
  image: string;
  popular?: boolean;
  priceOptions: PriceOption[];
  benefits: string[];
}

export interface ReviewItem {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  date: string;
  reviewText: string;
  serviceUsed?: string;
  verified?: boolean;
}

export interface PhotoItem {
  id: string;
  title: string;
  category: 'All' | 'Rooms' | 'Ambience' | 'Facilities';
  image: string;
  fallbackImage?: string;
  caption: string;
  createTime?: string;
}

export interface Amenity {
  id: string;
  title: string;
  iconName: 'shield' | 'therapist' | 'spa' | 'lock';
}
