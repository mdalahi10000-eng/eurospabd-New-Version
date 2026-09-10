/**
 * Supabase Database TypeScript Definitions for Euro Spa & Salon Dhaka
 * Matches PostgreSQL schema defined in supabase/migrations/20260908000000_init_euro_spa_schema.sql
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          display_name: string | null;
          photo_url: string | null;
          phone: string | null;
          role: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          display_name?: string | null;
          photo_url?: string | null;
          phone?: string | null;
          role?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          display_name?: string | null;
          photo_url?: string | null;
          phone?: string | null;
          role?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      admins: {
        Row: {
          id: string;
          email: string;
          display_name: string | null;
          role: string;
          permissions: Json;
          assigned_at: string;
        };
        Insert: {
          id: string;
          email: string;
          display_name?: string | null;
          role?: string;
          permissions?: Json;
          assigned_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          display_name?: string | null;
          role?: string;
          permissions?: Json;
          assigned_at?: string;
        };
      };
      services: {
        Row: {
          id: string;
          name: string;
          slug: string | null;
          duration_range: string | null;
          short_description: string;
          full_description: string;
          image: string;
          image_alt: string | null;
          gallery_images: Json;
          category: string;
          price: string | null;
          popular: boolean;
          price_options: Json;
          benefits: Json;
          booking_cta: string | null;
          display_order: number;
          status: string;
          service_areas: Json;
          seo_title: string | null;
          meta_description: string | null;
          focus_keyword: string | null;
          secondary_keywords: Json;
          canonical_url: string | null;
          robots_index: boolean;
          robots_follow: boolean;
          og_title: string | null;
          og_description: string | null;
          og_image: string | null;
          schema_type: string | null;
          custom_schema: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          slug?: string | null;
          duration_range?: string | null;
          short_description?: string;
          full_description?: string;
          image?: string;
          image_alt?: string | null;
          gallery_images?: Json;
          category?: string;
          price?: string | null;
          popular?: boolean;
          price_options?: Json;
          benefits?: Json;
          booking_cta?: string | null;
          display_order?: number;
          status?: string;
          service_areas?: Json;
          seo_title?: string | null;
          meta_description?: string | null;
          focus_keyword?: string | null;
          secondary_keywords?: Json;
          canonical_url?: string | null;
          robots_index?: boolean;
          robots_follow?: boolean;
          og_title?: string | null;
          og_description?: string | null;
          og_image?: string | null;
          schema_type?: string | null;
          custom_schema?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['services']['Insert']>;
      };
      reviews: {
        Row: {
          id: string;
          user_id: string | null;
          user_name: string;
          user_photo: string | null;
          rating: number;
          comment: string;
          service_tag: string | null;
          verified: boolean;
          status: string;
          admin_response: string | null;
          date_str: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          user_id?: string | null;
          user_name: string;
          user_photo?: string | null;
          rating?: number;
          comment: string;
          service_tag?: string | null;
          verified?: boolean;
          status?: string;
          admin_response?: string | null;
          date_str?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['reviews']['Insert']>;
      };
      appointments: {
        Row: {
          id: string;
          user_id: string | null;
          user_name: string;
          user_email: string | null;
          phone: string;
          service_id: string | null;
          service_name: string;
          duration: string | null;
          price: string | null;
          preferred_date: string;
          preferred_time: string;
          status: string;
          notes: string | null;
          admin_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          user_id?: string | null;
          user_name: string;
          user_email?: string | null;
          phone: string;
          service_id?: string | null;
          service_name: string;
          duration?: string | null;
          price?: string | null;
          preferred_date: string;
          preferred_time: string;
          status?: string;
          notes?: string | null;
          admin_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['appointments']['Insert']>;
      };
      articles: {
        Row: {
          id: string;
          title: string;
          slug: string;
          excerpt: string;
          content: string;
          featured_image: string;
          image_alt: string | null;
          category: string;
          author: string;
          status: string;
          published_at: string | null;
          tags: Json;
          reading_time_minutes: number;
          views_count: number;
          seo_title: string | null;
          meta_description: string | null;
          focus_keyword: string | null;
          canonical_url: string | null;
          og_title: string | null;
          og_description: string | null;
          og_image: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          title: string;
          slug: string;
          excerpt?: string;
          content?: string;
          featured_image?: string;
          image_alt?: string | null;
          category?: string;
          author?: string;
          status?: string;
          published_at?: string | null;
          tags?: Json;
          reading_time_minutes?: number;
          views_count?: number;
          seo_title?: string | null;
          meta_description?: string | null;
          focus_keyword?: string | null;
          canonical_url?: string | null;
          og_title?: string | null;
          og_description?: string | null;
          og_image?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['articles']['Insert']>;
      };
      gallery: {
        Row: {
          id: string;
          title: string;
          category: string;
          image: string;
          fallback_image: string | null;
          alt_text: string | null;
          caption: string | null;
          description: string | null;
          storage_path: string | null;
          display_order: number;
          status: string;
          file_name: string | null;
          file_size: number | null;
          mime_type: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          title: string;
          category?: string;
          image: string;
          fallback_image?: string | null;
          alt_text?: string | null;
          caption?: string | null;
          description?: string | null;
          storage_path?: string | null;
          display_order?: number;
          status?: string;
          file_name?: string | null;
          file_size?: number | null;
          mime_type?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['gallery']['Insert']>;
      };
      site_settings: {
        Row: {
          id: string;
          data: Json;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          id: string;
          data: Json;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: Partial<Database['public']['Tables']['site_settings']['Insert']>;
      };
      service_areas: {
        Row: {
          id: string;
          name: string;
          slug: string;
          headline: string | null;
          description: string | null;
          landmarks: Json;
          keywords: Json;
          popular_services: Json;
          status: string;
          display_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          slug: string;
          headline?: string | null;
          description?: string | null;
          landmarks?: Json;
          keywords?: Json;
          popular_services?: Json;
          status?: string;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['service_areas']['Insert']>;
      };
      faqs: {
        Row: {
          id: string;
          question: string;
          answer: string;
          category: string;
          status: string;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          question: string;
          answer: string;
          category?: string;
          status?: string;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['faqs']['Insert']>;
      };
      google_business_sync: {
        Row: {
          id: string;
          status: string;
          sync_summary: Json;
          last_sync_at: string | null;
          updated_at: string;
        };
        Insert: {
          id: string;
          status?: string;
          sync_summary?: Json;
          last_sync_at?: string | null;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['google_business_sync']['Insert']>;
      };
    };
  };
}
