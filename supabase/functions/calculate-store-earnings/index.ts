import { createClient } from 'npm:@supabase/supabase-js@2.42.0';

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    const body = await req.json();
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(
        JSON.stringify({ error: 'Missing Supabase environment variables' }),
        { status: 500, headers: corsHeaders }
      );
    }

    // Validate required fields
    const { store_name, profit_type, profit_value } = body;

    if (!store_name || !profit_type || profit_value === undefined || profit_value === null) {
      return new Response(
        JSON.stringify({
          error: 'Missing profit_type or profit_value',
        }),
        { status: 400, headers: corsHeaders }
      );
    }

    if (!['percentage', 'fixed'].includes(profit_type)) {
      return new Response(
        JSON.stringify({ error: 'profit_type must be "percentage" or "fixed"' }),
        { status: 400, headers: corsHeaders }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch orders that have items from the specified store
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select('order_id, price, quantity')
      .eq('main_store_name', store_name);

    if (itemsError) {
      console.error('Error fetching order items:', itemsError);
      return new Response(JSON.stringify({ error: itemsError.message }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    if (!orderItems || orderItems.length === 0) {
      return new Response(
        JSON.stringify({
          totalEarnings: 0,
          totalProfit: 0,
          orders: [],
        }),
        { status: 200, headers: corsHeaders }
      );
    }

    // Get unique order IDs
    const orderIds = [...new Set(orderItems.map((item: any) => item.order_id))];

    // Fetch the actual orders with these IDs
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, order_code, total_amount, customer_name, created_at')
      .in('id', orderIds);

    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
      return new Response(JSON.stringify({ error: ordersError.message }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    if (!orders || orders.length === 0) {
      return new Response(
        JSON.stringify({
          totalEarnings: 0,
          totalProfit: 0,
          orders: [],
        }),
        { status: 200, headers: corsHeaders }
      );
    }

    // Calculate profits based on profit_type
    let totalEarnings = 0;
    let totalProfit = 0;

    const formattedOrders = orders.map((order: any) => {
      const amount = parseFloat(order.total_amount) || 0;
      totalEarnings += amount;

      // Calculate profit for this order's items from this store
      let orderProfit = 0;
      const orderItemsForStore = orderItems.filter(
        (item: any) => item.order_id === order.id
      );

      orderItemsForStore.forEach((item: any) => {
        const price = parseFloat(item.price) || 0;
        const quantity = parseInt(item.quantity) || 0;

        if (profit_type === 'percentage') {
          const profitPercent = parseFloat(profit_value) || 0;
          orderProfit += (price * profitPercent) / 100 * quantity;
        } else if (profit_type === 'fixed') {
          const fixedProfit = parseFloat(profit_value) || 0;
          orderProfit += fixedProfit * quantity;
        }
      });

      totalProfit += orderProfit;

      return {
        id: order.id,
        order_code: order.order_code,
        total_amount: Math.round(amount * 100) / 100,
        customer_name: order.customer_name,
        created_at: order.created_at,
      };
    });

    return new Response(
      JSON.stringify({
        totalEarnings: Math.round(totalEarnings * 100) / 100,
        totalProfit: Math.round(totalProfit * 100) / 100,
        orders: formattedOrders,
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Internal server error',
      }),
      { status: 500, headers: corsHeaders }
    );
  }
});
