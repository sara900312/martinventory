import { createClient } from 'npm:@supabase/supabase-js@2.42.0';

/**
 * Update Order Status Edge Function
 * 
 * Handles order status updates with:
 * - Input validation (order_id, new_status)
 * - Order existence check
 * - Status transition validation
 * - Inventory stock updates based on status change
 * - Comprehensive error handling with JSON responses
 * 
 * Security:
 * - Uses SERVICE_ROLE_KEY for database access
 * - Server-side validation (not trusting frontend)
 * - Clear error responses with appropriate HTTP status codes
 * - All paths return JSON responses
 */

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
};

/**
 * Valid order status transitions
 */
const VALID_STATUSES = [
  'pending',
  'reviewing',
  'accepted',
  'preparing',
  'shipped',
  'delivered',
  'cancelled',
];

/**
 * Check if status transition is valid
 */
function isValidStatusTransition(
  currentStatus: string,
  newStatus: string
): boolean {
  // Cancelled orders cannot be changed
  if (currentStatus === 'cancelled') {
    return false;
  }

  // Validate both statuses are in the valid list
  if (!VALID_STATUSES.includes(currentStatus) || !VALID_STATUSES.includes(newStatus)) {
    return false;
  }

  return true;
}

/**
 * Update inventory based on order status change
 */
async function updateInventoryForStatusChange(
  supabase: any,
  orderId: string,
  currentStatus: string,
  newStatus: string
): Promise<boolean> {
  try {
    // If transitioning to 'accepted', decrease inventory
    if (newStatus === 'accepted' && currentStatus !== 'accepted') {
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select('product_id, quantity')
        .eq('order_id', orderId);

      if (itemsError) {
        console.error('Error fetching order items:', itemsError);
        return false;
      }

      // Update inventory for each product
      for (const item of orderItems) {
        // ✅ Fetch current stock, then decrease it
        const { data: product, error: fetchError } = await supabase
          .from('products')
          .select('stock')
          .eq('id', item.product_id)
          .single();

        if (fetchError || !product) {
          console.error(`Error fetching stock for product ${item.product_id}:`, fetchError);
          continue;
        }

        const newStock = Math.max(0, (product.stock || 0) - item.quantity);

        const { error: inventoryError } = await supabase
          .from('products')
          .update({ stock: newStock })
          .eq('id', item.product_id);

        if (inventoryError) {
          console.error(`Error updating inventory for product ${item.product_id}:`, inventoryError);
        } else {
          console.log(`✓ Decreased stock for product ${item.product_id} by ${item.quantity} (new stock: ${newStock})`);
        }
      }
    }

    // If transitioning from 'accepted' to 'cancelled', restore inventory
    if (currentStatus === 'accepted' && newStatus === 'cancelled') {
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select('product_id, quantity')
        .eq('order_id', orderId);

      if (itemsError) {
        console.error('Error fetching order items for reversal:', itemsError);
        return false;
      }

      // Restore inventory for each product
      for (const item of orderItems) {
        // ✅ Fetch current stock, then increase it
        const { data: product, error: fetchError } = await supabase
          .from('products')
          .select('stock')
          .eq('id', item.product_id)
          .single();

        if (fetchError || !product) {
          console.error(`Error fetching stock for product ${item.product_id}:`, fetchError);
          continue;
        }

        const newStock = (product.stock || 0) + item.quantity;

        const { error: inventoryError } = await supabase
          .from('products')
          .update({ stock: newStock })
          .eq('id', item.product_id);

        if (inventoryError) {
          console.error(`Error restoring inventory for product ${item.product_id}:`, inventoryError);
        } else {
          console.log(`✓ Restored stock for product ${item.product_id} by ${item.quantity} (new stock: ${newStock})`);
        }
      }
    }

    return true;
  } catch (error) {
    console.error('Error updating inventory:', error);
    return false;
  }
}

/**
 * Main handler
 */
Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Method Not Allowed',
      }),
      { status: 405, headers: corsHeaders }
    );
  }

  try {
    // Validate environment
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing Supabase configuration');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing Supabase configuration',
        }),
        { status: 500, headers: corsHeaders }
      );
    }

    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid JSON in request body',
        }),
        { status: 400, headers: corsHeaders }
      );
    }

    const { order_id, new_status } = body;

    // Validate required fields
    if (!order_id || !new_status) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required fields: order_id and new_status',
        }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate new_status is in the valid list
    if (!VALID_STATUSES.includes(new_status)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Invalid status. Valid statuses are: ${VALID_STATUSES.join(', ')}`,
        }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch order
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('id, order_code, order_status, updated_at')
      .eq('id', order_id)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching order:', fetchError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Database error while fetching order',
        }),
        { status: 500, headers: corsHeaders }
      );
    }

    // Check if order exists
    if (!order) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Order not found',
        }),
        { status: 404, headers: corsHeaders }
      );
    }

    // Validate status transition
    if (!isValidStatusTransition(order.order_status, new_status)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Cannot transition from ${order.order_status} to ${new_status}`,
        }),
        { status: 409, headers: corsHeaders }
      );
    }

    // Update inventory if needed
    await updateInventoryForStatusChange(
      supabase,
      order_id,
      order.order_status,
      new_status
    );

    // Update order status
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({
        order_status: new_status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', order_id)
      .select(
        `
        id,
        order_code,
        order_status,
        updated_at,
        customer_name,
        customer_phone,
        customer_address,
        total_amount,
        main_store_name,
        order_items(id, product_name, quantity, price, discounted_price),
        created_at,
        customer_notes,
        shipping_type,
        delivery_cost
        `
      )
      .single();

    if (updateError) {
      console.error('Error updating order:', updateError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to update order status in database',
        }),
        { status: 500, headers: corsHeaders }
      );
    }

    console.log(`✅ Order ${order.order_code} status updated to ${new_status}`);

    // ✅ SUCCESS PATH - Always returns JSON with complete order data
    return new Response(
      JSON.stringify({
        success: true,
        order: updatedOrder,
      }),
      { status: 200, headers: corsHeaders }
    );

  } catch (error) {
    // ✅ UNHANDLED ERROR PATH - Always returns JSON
    console.error('Unhandled error in update_order_status:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      { status: 500, headers: corsHeaders }
    );
  }
});
