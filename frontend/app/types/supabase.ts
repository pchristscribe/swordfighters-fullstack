export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Platform = 'DHGATE' | 'ALIEXPRESS' | 'AMAZON' | 'WISH'
export type ProductStatus = 'ACTIVE' | 'INACTIVE' | 'OUT_OF_STOCK'

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          image_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          image_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          image_url?: string | null
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          external_id: string
          platform: Platform
          title: string
          description: string
          image_url: string
          price: number
          currency: string
          price_updated_at: string
          category_id: string
          status: ProductStatus
          rating: number | null
          review_count: number
          tags: string[]
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          external_id: string
          platform: Platform
          title: string
          description: string
          image_url: string
          price: number
          currency?: string
          price_updated_at?: string
          category_id: string
          status?: ProductStatus
          rating?: number | null
          review_count?: number
          tags?: string[]
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          external_id?: string
          platform?: Platform
          title?: string
          description?: string
          image_url?: string
          price?: number
          currency?: string
          price_updated_at?: string
          category_id?: string
          status?: ProductStatus
          rating?: number | null
          review_count?: number
          tags?: string[]
          metadata?: Json | null
          updated_at?: string
        }
      }
      affiliate_links: {
        Row: {
          id: string
          product_id: string
          original_url: string
          tracked_url: string
          dub_link_id: string | null
          clicks: number
          conversions: number
          revenue: number
          last_clicked_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          original_url: string
          tracked_url: string
          dub_link_id?: string | null
          clicks?: number
          conversions?: number
          revenue?: number
          last_clicked_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          original_url?: string
          tracked_url?: string
          dub_link_id?: string | null
          clicks?: number
          conversions?: number
          revenue?: number
          last_clicked_at?: string | null
          updated_at?: string
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      platform: Platform
      product_status: ProductStatus
    }
  }
}
