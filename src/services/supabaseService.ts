import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config';
import { v4 as uuidv4 } from 'uuid';

/**
 * Product data interface matching the Supabase products table schema
 */
export interface Product {
  id?: number;
  created_at?: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
}

/**
 * Order data interface matching the Supabase orders table schema
 */
export interface Order {
  id?: number;
  created_at?: string;
  order_number: string;
  customer_email: string;
  status: string;
  tracking_number: string | null;
}

/**
 * Supabase service class providing database and storage operations
 */
export class SupabaseService {
  private client: SupabaseClient;

  constructor() {
    this.client = createClient(
      config.supabase.url,
      config.supabase.serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  }

  /**
   * Uploads an image buffer to Supabase Storage
   * @param imageBuffer - The image data as a Buffer
   * @param fileExtension - The file extension (e.g., 'jpg', 'png')
   * @returns The public URL of the uploaded image
   */
  async uploadProductImage(imageBuffer: Buffer, fileExtension: string): Promise<string> {
    const fileName = `${uuidv4()}.${fileExtension}`;
    const filePath = `products/${fileName}`;

    const { data, error } = await this.client.storage
      .from('product_images')
      .upload(filePath, imageBuffer, {
        contentType: `image/${fileExtension}`,
        upsert: false,
      });

    if (error) {
      throw new Error(`Failed to upload image to Supabase Storage: ${error.message}`);
    }

    // Get the public URL
    const { data: publicUrlData } = this.client.storage
      .from('product_images')
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  }

  /**
   * Creates a new product in the database
   * @param product - Product data to insert
   * @returns The created product with its ID
   */
  async createProduct(product: Omit<Product, 'id' | 'created_at'>): Promise<Product> {
    const { data, error } = await this.client
      .from('products')
      .insert([product])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create product in Supabase: ${error.message}`);
    }

    return data;
  }

  /**
   * Finds an order by its order number
   * @param orderNumber - The order number to search for
   * @returns The order if found, null otherwise
   */
  async findOrderByNumber(orderNumber: string): Promise<Order | null> {
    const { data, error } = await this.client
      .from('orders')
      .select('*')
      .eq('order_number', orderNumber)
      .single();

    if (error) {
      // If the error is that no rows were found, return null
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Failed to find order in Supabase: ${error.message}`);
    }

    return data;
  }

  /**
   * Updates an existing order
   * @param orderNumber - The order number to update
   * @param updates - Partial order data to update
   * @returns The updated order
   */
  async updateOrder(
    orderNumber: string,
    updates: Partial<Pick<Order, 'status' | 'tracking_number'>>
  ): Promise<Order> {
    const { data, error } = await this.client
      .from('orders')
      .update(updates)
      .eq('order_number', orderNumber)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update order in Supabase: ${error.message}`);
    }

    return data;
  }
}

// Export singleton instance
export const supabaseService = new SupabaseService();
