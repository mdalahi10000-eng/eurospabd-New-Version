import { Service, ReviewItem, PhotoItem } from '../types';

export const SPA_INFO = {
  name: "Euro Spa Center",
  tagline: "Relax • Refresh • Rejuvenate",
  category: "Spa and Wellness Center",
  locationShort: "Banani, Dhaka",
  fullAddress: "73 Road No. 6, Banani, Dhaka 1213, Bangladesh",
  phone: "+880 1842-658423",
  displayPhone: "01842-658423",
  whatsappNumber: "8801842658423",
  whatsappFormatted: "+880 1842-658423",
  email: "info@eurospacenter.com",
  rating: 4.9,
  reviewsCount: 48,
  status: "Open 10:00 AM – 10:00 PM",
  openingHours: "10:00 AM – 10:00 PM",
  googleMapsUrl: "https://www.google.com/maps/place/Euro+Spa+Center/@23.7931511,90.4030721,17z/data=!4m6!3m5!1s0x3755c7d7ea287605:0xde1e138b608693d5!8m2!3d23.7931511!4d90.4030721!16s%2Fg%2F11zbcx07pr",
  googlePlaceId: "ChIJBXYo6tfHVTcR1ZOGYIsTHt4",
  googleCid: "16005206941168178133",
  plusCode: "QCV3+76 Dhaka, Bangladesh",
  coordinates: {
    lat: 23.7931511,
    lng: 90.4030721
  },
  description: "Euro Spa Center is a premium spa and wellness center located in Banani, Dhaka. We offer professional Swedish Massage, Deep Tissue Massage, Aromatherapy, Hot Stone Massage, Four Hand Massage, Body Scrub, and complete wellness therapy. Experience relaxation in a peaceful, hygienic, and luxurious environment with certified therapists."
};

export const SERVICES_DATA: Service[] = [
  {
    id: "dry-massage",
    name: "Dry Massage",
    durationRange: "30 / 60 / 90 Minutes",
    shortDescription: "A relaxing dry massage designed to release muscle tension and promote overall relaxation.",
    fullDescription: "A professional dry massage focused on relieving everyday muscle tension, improving relaxation, and helping the body feel refreshed.",
    image: "https://lh3.googleusercontent.com/geougc/AF1QipPLNOXvJcErsUyF-6Jorv4EaoC6kDl3WaDnpL6W=w1200-h800-k-no",
    popular: true,
    priceOptions: [
      { duration: "30 Minutes", price: "BDT 3,500", amount: 3500 },
      { duration: "60 Minutes", price: "BDT 5,500", amount: 5500 },
      { duration: "90 Minutes", price: "BDT 7,500", amount: 7500 }
    ],
    benefits: [
      "Relieves muscle tension",
      "Promotes relaxation",
      "Helps refresh the body"
    ]
  },
  {
    id: "oil-massage",
    name: "Oil Massage",
    durationRange: "30 / 60 / 90 Minutes",
    shortDescription: "A soothing oil massage designed to relax the body and ease everyday muscle tension.",
    fullDescription: "A professional oil massage using smooth massage techniques to help relax tired muscles and promote a calm, comfortable experience.",
    image: "https://lh3.googleusercontent.com/geougc/AF1QipPDGlDn8JiA8nC2xubXZCHfaV8c7sQkBsZr3iWL=w1200-h800-k-no",
    priceOptions: [
      { duration: "30 Minutes", price: "BDT 3,500", amount: 3500 },
      { duration: "60 Minutes", price: "BDT 5,500", amount: 5500 },
      { duration: "90 Minutes", price: "BDT 7,000", amount: 7000 }
    ],
    benefits: [
      "Relaxing oil massage",
      "Eases muscle tension",
      "Promotes relaxation"
    ]
  },
  {
    id: "aroma-body-massage",
    name: "Aroma Body Massage",
    durationRange: "30 / 60 / 90 Minutes",
    shortDescription: "A calming aroma body massage designed to relax the body and create a soothing spa experience.",
    fullDescription: "A relaxing aroma body massage combining soothing massage techniques with aromatic oils for a peaceful and refreshing experience.",
    image: "/photos/Image Aug.png",
    priceOptions: [
      { duration: "30 Minutes", price: "BDT 3,500", amount: 3500 },
      { duration: "60 Minutes", price: "BDT 5,500", amount: 5500 },
      { duration: "90 Minutes", price: "BDT 7,500", amount: 7500 }
    ],
    benefits: [
      "Calming spa experience",
      "Helps reduce everyday tension",
      "Promotes relaxation"
    ]
  },
  {
  id: "swedish",
  name: "Swedish Massage",
  durationRange: "60 Minutes",
  shortDescription: "A relaxing Swedish massage designed to ease muscle tension and promote overall relaxation.",
  fullDescription: "A professional Swedish massage using smooth, flowing massage techniques to help relax the body and relieve everyday muscle tension.",
  image: "https://lh3.googleusercontent.com/geougc/AF1QipPDGlDn8JiA8nC2xubXZCHfaV8c7sQkBsZr3iWL=w1200-h800-k-no",
  priceOptions: [
    { duration: "60 Minutes", price: "BDT 6,500", amount: 6500 }
  ],
  benefits: [
    "Relieves muscle tension",
    "Promotes relaxation",
    "Calming massage experience"
  ]
},
  {
    id: "body-to-body",
    name: "Body to Body Massage",
    durationRange: "60 / 90 Minutes",
    shortDescription: "A premium massage service available in 60 and 90 minute sessions.",
    fullDescription: "A premium massage experience at Euro Spa Center designed around relaxation and a comfortable private spa environment.",
    image: "https://lh3.googleusercontent.com/geougc/AF1QipPLNOXvJcErsUyF-6Jorv4EaoC6kDl3WaDnpL6W=w1200-h800-k-no",
    priceOptions: [
      { duration: "60 Minutes", price: "BDT 6,500", amount: 6500 },
      { duration: "90 Minutes", price: "BDT 8,500", amount: 8500 }
    ],
    benefits: [
      "Premium relaxation",
      "Private spa experience",
      "Comfortable session"
    ]
  },
  {
    id: "four-hand",
    name: "Four Hand Massage",
    durationRange: "60 / 90 Minutes",
    shortDescription: "A premium four hand massage experience designed for deep relaxation and comfort.",
    fullDescription: "A premium four hand massage session providing a coordinated and relaxing spa experience at Euro Spa Center.",
    image: "https://lh3.googleusercontent.com/geougc/AF1QipPDGlDn8JiA8nC2xubXZCHfaV8c7sQkBsZr3iWL=w1200-h800-k-no",
    priceOptions: [
      { duration: "60 Minutes", price: "BDT 14,000", amount: 14000 },
      { duration: "90 Minutes", price: "BDT 19,500", amount: 19500 }
    ],
    benefits: [
      "Premium massage experience",
      "Coordinated massage technique",
      "Deep relaxation"
    ]
  },
  {
    id: "six-hand",
    name: "Six Hand Massage",
    durationRange: "60 / 90 / 120 Minutes",
    shortDescription: "A premium six hand massage experience available in three session durations.",
    fullDescription: "An exclusive premium massage experience at Euro Spa Center with 60, 90, and 120 minute options.",
    image: "https://lh3.googleusercontent.com/geougc/AF1QipPLNOXvJcErsUyF-6Jorv4EaoC6kDl3WaDnpL6W=w1200-h800-k-no",
    priceOptions: [
      { duration: "60 Minutes", price: "BDT 18,000", amount: 18000 },
      { duration: "90 Minutes", price: "BDT 25,000", amount: 25000 },
      { duration: "120 Minutes", price: "BDT 30,000", amount: 30000 }
    ],
    benefits: [
      "Exclusive premium experience",
      "Extended relaxation session",
      "Multiple duration options"
    ]
  }
];

export const INITIAL_REVIEWS: ReviewItem[] = [
  {
    id: "rev-1",
    name: "Rifat Ahmed",
    avatar: "https://lh3.googleusercontent.com/a/default-user",
    rating: 5,
    date: "3 days ago",
    reviewText: "Very relaxing environment and professional staff. Highly recommended!",
    serviceUsed: "Full Body Massage",
    verified: true
  },
  {
    id: "rev-2",
    name: "Mahima Islam",
    avatar: "https://lh3.googleusercontent.com/a/default-user",
    rating: 5,
    date: "1 week ago",
    reviewText: "One of the best spa experiences in Banani. Will visit again!",
    serviceUsed: "Swedish Massage",
    verified: true
  },
  {
    id: "rev-3",
    name: "Tanzid Hasan",
    avatar: "https://lh3.googleusercontent.com/a/default-user",
    rating: 5,
    date: "2 weeks ago",
    reviewText: "Clean, peaceful and very professional service. Loved it!",
    serviceUsed: "Deep Tissue Massage",
    verified: true
  },
  {
    id: "rev-4",
    name: "Sarah Jenkins",
    avatar: "https://lh3.googleusercontent.com/a/default-user",
    rating: 5,
    date: "3 weeks ago",
    reviewText: "Living in Gulshan/Banani, I was searching for an immaculate, truly tranquil spa. The Swedish massage was world-class. Pristine sheets and calming ambient music.",
    serviceUsed: "Swedish Massage",
    verified: true
  },
  {
    id: "rev-5",
    name: "Farhan Kabir",
    avatar: "https://lh3.googleusercontent.com/a/default-user",
    rating: 5,
    date: "1 month ago",
    reviewText: "Booked a 90-minute Hot Stone massage after a hectic business trip. The warmth of the stones relieved weeks of stiffness. 100% worth every taka.",
    serviceUsed: "Hot Stone Massage",
    verified: true
  },
  {
    id: "rev-6",
    name: "Nusrat Jahan",
    avatar: "https://lh3.googleusercontent.com/a/default-user",
    rating: 5,
    date: "1 month ago",
    reviewText: "The hygiene standards are exceptional! Private washroom, disposable slippers, and courteous reception. The aromatherapy oils smelled celestial.",
    serviceUsed: "Aromatherapy Massage",
    verified: true
  },
  {
    id: "rev-7",
    name: "Adnan Chowdhury",
    avatar: "https://lh3.googleusercontent.com/a/default-user",
    rating: 5,
    date: "1 month ago",
    reviewText: "Great to have Euro Spa Center on Road 6 in Banani with proper certified therapists. Very convenient booking via WhatsApp and prompt confirmation.",
    serviceUsed: "Deep Tissue Massage",
    verified: true
  },
  {
    id: "rev-8",
    name: "Sabrina Rahman",
    avatar: "https://lh3.googleusercontent.com/a/default-user",
    rating: 5,
    date: "2 months ago",
    reviewText: "The Thai Herbal Compress gave me immediate relief from lower back ache. Beautiful decor with warm soothing lighting. Felt deeply revitalized!",
    serviceUsed: "Thai Herbal Compress Therapy",
    verified: true
  },
  {
    id: "rev-9",
    name: "Kazi Asif",
    avatar: "https://lh3.googleusercontent.com/a/default-user",
    rating: 5,
    date: "2 months ago",
    reviewText: "Super clean rooms and complete privacy on Road 6 Banani. Loved the herbal tea served right after the session. Highly recommended!",
    serviceUsed: "Full Body Massage",
    verified: true
  },
  {
    id: "rev-10",
    name: "Tasnim Anjum",
    avatar: "https://lh3.googleusercontent.com/a/default-user",
    rating: 5,
    date: "2 months ago",
    reviewText: "My mom and I booked a duo session for Swedish massage. The therapists were respectful, gentle, and very attentive to our comfort levels.",
    serviceUsed: "Swedish Massage",
    verified: true
  },
  {
    id: "rev-11",
    name: "Zubair Khan",
    avatar: "https://lh3.googleusercontent.com/a/default-user",
    rating: 5,
    date: "3 months ago",
    reviewText: "Convenient location on Road 6, Banani. Staff escorted me inside promptly. Excellent massage and peaceful atmosphere.",
    serviceUsed: "Full Body Massage",
    verified: true
  },
  {
    id: "rev-12",
    name: "Sadia Parveen",
    avatar: "https://lh3.googleusercontent.com/a/default-user",
    rating: 5,
    date: "3 months ago",
    reviewText: "A true oasis in the middle of Banani. You forget the city noise the minute you step inside Euro Spa Center. The soothing scents are therapeutic.",
    serviceUsed: "Aromatherapy Massage",
    verified: true
  },
  {
    id: "rev-13",
    name: "Shahriar Hossain",
    avatar: "https://lh3.googleusercontent.com/a/default-user",
    rating: 5,
    date: "3 months ago",
    reviewText: "The deep tissue pressure was dialed in precisely. My desk-job shoulder tension completely melted away. Will definitely be a regular here.",
    serviceUsed: "Deep Tissue Massage",
    verified: true
  },
  {
    id: "rev-14",
    name: "Ayesha Siddiqua",
    avatar: "https://lh3.googleusercontent.com/a/default-user",
    rating: 5,
    date: "4 months ago",
    reviewText: "The warm foot reflexology scrub is heavenly! Left my feet feeling baby soft and walking felt lighter instantly.",
    serviceUsed: "Foot Reflexology & Botanical Scrub",
    verified: true
  },
  {
    id: "rev-15",
    name: "Imran Haque",
    avatar: "https://lh3.googleusercontent.com/a/default-user",
    rating: 5,
    date: "4 months ago",
    reviewText: "Booked an evening appointment around 7:00 PM. Welcoming reception, pristine towels, and pure professionalism throughout.",
    serviceUsed: "Full Body Massage",
    verified: true
  },
  {
    id: "rev-16",
    name: "Nabila Karim",
    avatar: "https://lh3.googleusercontent.com/a/default-user",
    rating: 5,
    date: "4 months ago",
    reviewText: "One of the best spa experiences in Banani, hands down. The heated massage beds make all the difference in relaxing muscles.",
    serviceUsed: "Swedish Massage",
    verified: true
  },
  {
    id: "rev-17",
    name: "Mohammad Tareq",
    avatar: "https://lh3.googleusercontent.com/a/default-user",
    rating: 5,
    date: "5 months ago",
    reviewText: "Great customer care, courteous team, and clean private shower room. 5 stars for Euro Spa Center without hesitation.",
    serviceUsed: "Hot Stone Massage",
    verified: true
  },
  {
    id: "rev-18",
    name: "Samira Akhtar",
    avatar: "https://lh3.googleusercontent.com/a/default-user",
    rating: 5,
    date: "5 months ago",
    reviewText: "The hot stone therapy was soothing and magical. The therapists are certified and observe strict hygienic protocols.",
    serviceUsed: "Hot Stone Massage",
    verified: true
  },
  {
    id: "rev-19",
    name: "Arifur Rahman",
    avatar: "https://lh3.googleusercontent.com/a/default-user",
    rating: 5,
    date: "5 months ago",
    reviewText: "Convenient location on 73 Road 6, Banani. The rooms are spotless, tranquil, and comfortable.",
    serviceUsed: "Full Body Massage",
    verified: true
  },
  {
    id: "rev-20",
    name: "Mehnaz Latif",
    avatar: "https://lh3.googleusercontent.com/a/default-user",
    rating: 5,
    date: "6 months ago",
    reviewText: "Remarkable attention to detail from the warm reception to the lavender wipe. Truly a relaxing haven in Banani.",
    serviceUsed: "Aromatherapy Massage",
    verified: true
  },
  {
    id: "rev-21",
    name: "Tanvir Ahmed",
    avatar: "https://lh3.googleusercontent.com/a/default-user",
    rating: 5,
    date: "6 months ago",
    reviewText: "Visited twice already this month. Consistent quality, warm therapists, and prompt booking via WhatsApp.",
    serviceUsed: "Deep Tissue Massage",
    verified: true
  }
];

export const USER_PROVIDED_PHOTOS: PhotoItem[] = [
  {
    id: "user-photo-new-1",
    title: "Euro Spa Center - Reception & Professional Team",
    category: "Ambience",
    image: "/photos/new (1).jpg",
    fallbackImage: "https://images.fresha.com/locations/location-profile-images/3078419/6606373/bf6dbe8d-a1bb-43c0-a36a-444b4488cbfa-EuroSpaCenter-BD-DhakaDivision-Dhaka-Gulshan-Fresha.jpg?class=venue-gallery-large",
    caption: "Welcoming therapists and courteous reception team at Euro Spa Center, Road 6, Banani."
  },
  {
    id: "user-photo-image-aug",
    title: "Euro Spa Center - Therapy Preparation & Setup",
    category: "Facilities",
    image: "/photos/Image Aug.png",
    fallbackImage: "https://images.fresha.com/locations/location-profile-images/3078419/6606376/6c4d7161-b109-48b1-a18b-a0229c27e418-EuroSpaCenter-BD-DhakaDivision-Dhaka-Gulshan-Fresha.jpg?class=venue-gallery-large",
    caption: "Therapist prepares massage table at Euro Spa Center, creating a clean and calm ambiance."
  },
  {
    id: "user-photo-euroo",
    title: "Euro Spa Center - Twin Therapy Suite",
    category: "Rooms",
    image: "/photos/euroo.png",
    fallbackImage: "https://images.fresha.com/locations/location-profile-images/3078419/6606368/87e75dff-9ad8-4d19-9ff1-2226a94ec0c6-EuroSpaCenter-BD-DhakaDivision-Dhaka-Gulshan-Fresha.jpg?class=venue-gallery-large",
    caption: "Relaxing two-bed room with white sheets and cyan runners in a purple ambient room."
  },
  {
    id: "user-photo-euroo11",
    title: "Euro Spa Center - Ornate Golden VIP Suite",
    category: "Rooms",
    image: "/photos/euroo11.png",
    fallbackImage: "https://images.fresha.com/locations/location-profile-images/3078419/6606369/08671ee0-a030-4fb2-98b6-ad2c4e69f7a2-EuroSpaCenter-BD-DhakaDivision-Dhaka-Gulshan-Fresha.jpg?class=venue-gallery-large",
    caption: "Tranquil massage room with cozy bed, ornate golden wallpaper, and patterned runner."
  },
  {
    id: "user-photo-euros",
    title: "Euro Spa Center - Twin Massage Beds & Seating",
    category: "Rooms",
    image: "/photos/euros.png",
    fallbackImage: "https://images.fresha.com/locations/location-profile-images/3078419/6606372/b031a51d-f965-442f-91ed-7926b5d56992-EuroSpaCenter-BD-DhakaDivision-Dhaka-Gulshan-Fresha.jpg?class=venue-gallery-large",
    caption: "Cozy spa room with two massage beds and armchairs at Euro Spa Center, Banani."
  },
  {
    id: "user-photo-3r333",
    title: "Euro Spa Center - Serene Haven Spa Room",
    category: "Rooms",
    image: "/photos/3r333.png",
    fallbackImage: "https://images.fresha.com/locations/location-profile-images/3078419/6606371/e8f6836a-ddd0-4280-b380-fc92a093ddde-EuroSpaCenter-BD-DhakaDivision-Dhaka-Gulshan-Fresha.jpg?class=venue-gallery-large",
    caption: "Tranquil therapy room with comfortable bed, ideal for relaxation at Euro Spa Center."
  }
];

export const OFFICIAL_GBP_PHOTOS: PhotoItem[] = [
  {
    id: "euro-gbp-reception",
    title: "Euro Spa Center Reception & Wellness Suite",
    category: "Ambience",
    image: "https://lh3.googleusercontent.com/geougc/AF1QipPLNOXvJcErsUyF-6Jorv4EaoC6kDl3WaDnpL6W=w1200-h800-k-no",
    caption: "Euro Spa Center welcoming reception and serene wellness lounge on Road 6, Banani."
  },
  {
    id: "euro-gbp-room-1",
    title: "Private Therapy Room & Massage Bed",
    category: "Rooms",
    image: "https://lh3.googleusercontent.com/geougc/AF1QipPDGlDn8JiA8nC2xubXZCHfaV8c7sQkBsZr3iWL=w1200-h800-k-no",
    caption: "Spacious, peaceful private therapy room prepared for professional massage sessions."
  },
  {
    id: "euro-gbp-room-2",
    title: "Relaxation Lounge & Therapy Suite",
    category: "Rooms",
    image: "https://lh3.googleusercontent.com/geougc/AF1QipMfFcEWQskswYvq9pqc2q9710n5SDABSA0t7nuN=w1200-h800-k-no",
    caption: "Hygienic and comfortable environment designed for stress relief and deep relaxation."
  },
  {
    id: "euro-gbp-facility",
    title: "Treatment Room & Wellness Amenities",
    category: "Facilities",
    image: "/photos/amenities.jpg",
    fallbackImage: "https://images.fresha.com/locations/location-profile-images/3078419/6606374/9265cde4-8bbf-40e3-84d0-dd5310acb293-EuroSpaCenter-BD-DhakaDivision-Dhaka-Gulshan-Fresha.jpg?class=venue-gallery-large",
    caption: "Hygienic facilities, modern amenities, and clean botanical essentials at Euro Spa Center."
  }
];

export const PHOTOS_DATA: PhotoItem[] = [
  ...USER_PROVIDED_PHOTOS,
  ...OFFICIAL_GBP_PHOTOS
];
