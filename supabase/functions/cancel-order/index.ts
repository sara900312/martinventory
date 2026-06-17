import { createClient } from 'npm:@supabase/supabase-js@2.42.0';

/**
 * Cancel Order Edge Function
 * 
 * Handles order cancellation with:
 * - Server-side 6-hour cancellation window validation
 * - Order status update (pending -> cancelled)
 * - Customer rejection flag update
 * - Telegram notification to store/admin
 * 
 * Security:
 * - Uses SERVICE_ROLE_KEY for database access
 * - Server-side timestamp validation (not trusting frontend)
 * - Clear error responses with appropriate HTTP status codes
 */

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN') || '';
const TELEGRAM_CHAT_ID = Deno.env.get('TELEGRAM_CHAT_ID') || '';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
};

/**
 * Calculate if cancellation is within 6-hour window
 */
function isCancellationAllowed(createdAt: string): boolean {
  const orderTime = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - orderTime.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  
  // Allow cancellation only within 6 hours
  return diffHours <= 6;
}

/**
 * Send Telegram notification
 */
async function sendTelegramNotification(
  message: string
): Promise<boolean> {
  try {
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      console.warn('Telegram credentials not configured');
      return false;
    }

    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: message,
          parse_mode: 'HTML',
        }),
      }
    );

    if (!response.ok) {
      console.error('Failed to send Telegram notification:', response.statusText);
      return false;
    }

    console.log('✅ Telegram notification sent successfully');
    return true;
  } catch (error) {
    console.error('Error sending Telegram notification:', error);
    return false;
  }
}

/**
 * Format price for Telegram message
 */
function formatPrice(price: number): string {
  return `${Math.round(price).toLocaleString('en-US')} IQD`;
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
      JSON.stringify({ error: 'Method Not Allowed' }),
      { status: 405, headers: corsHeaders }
    );
  }

  try {
    // Validate environment
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(
        JSON.stringify({ error: 'Missing Supabase configuration' }),
        { status: 500, headers: corsHeaders }
      );
    }

    // Parse request body
    const body = await req.json();
    const { order_id, cancellation_reason } = body;

    // Validate required fields
    if (!order_id) {
      return new Response(
        JSON.stringify({ error: 'Missing order_id' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch order with all required data
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select(`
        id,
        order_code,
        order_status,
        created_at,
        customer_name,
        customer_phone,
        customer_address,
        total_amount,
        main_store_name
      `)
      .eq('id', order_id)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching order:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Database error while fetching order' }),
        { status: 500, headers: corsHeaders }
      );
    }

    // Check if order exists
    if (!order) {
      return new Response(
        JSON.stringify({
          error: 'Order not found',
          message: 'الطلب غير موجود',
        }),
        { status: 404, headers: corsHeaders }
      );
    }

    // Check if order is in pending status
    if (order.order_status !== 'pending') {
      return new Response(
        JSON.stringify({
          error: 'Invalid order status',
          message: `لا يمكن إلغاء طلب في حالة: ${order.order_status}`,
        }),
        { status: 409, headers: corsHeaders }
      );
    }

    // ⭐ CRITICAL: Server-side validation of 6-hour cancellation window
    if (!isCancellationAllowed(order.created_at)) {
      return new Response(
        JSON.stringify({
          error: 'Cancellation window expired',
          message: 'انتهت مهلة إلغاء الطلب (6 ساعات من الإنشاء)',
        }),
        { status: 403, headers: corsHeaders }
      );
    }

    // Update order status to cancelled
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({
        order_status: 'cancelled',
        updated_at: new Date().toISOString(),
        // Optional: track customer rejection if column exists
        customer_rejected: true,
      })
      .eq('id', order_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating order:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update order status' }),
        { status: 500, headers: corsHeaders }
      );
    }

    // 📢 Send Telegram notification to store/admin
    const telegramMessage = `
🚨 <b>تنبيه: تم إلغاء طلب من قبل العميل</b>

<b>رقم الطلب:</b> ${order.order_code}
<b>اسم العميل:</b> ${order.customer_name}
<b>رقم الهاتف:</b> ${order.customer_phone}
<b>المبلغ:</b> ${formatPrice(order.total_amount)}
<b>المتجر:</b> ${order.main_store_name}
<b>سبب الإلغاء:</b> ${cancellation_reason || 'لم يتم تحديد السبب'}

⏰ <b>الوقت:</b> ${new Date().toLocaleString('ar-IQ')}

✅ <i>تم تحديث حالة الطلب إلى: <b>ملغى</b></i>
    `.trim();

    // Send notification (non-blocking - continue even if it fails)
    sendTelegramNotification(telegramMessage).catch(error => {
      console.error('Telegram notification failed:', error);
    });

    console.log(`✅ Order ${order.order_code} cancelled successfully`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'تم إلغاء الطلب بنجاح',
        order: updatedOrder,
      }),
      { status: 200, headers: corsHeaders }
    );

  } catch (error) {
    console.error('Unhandled error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: corsHeaders }
    );
  }
});
