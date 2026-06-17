/**
 * نظام شامل لإدارة المخزون والتحقق الفوري
 * يحل مشاكل التحقق من الكمية والمخزون المتاح
 */

/**
 * التحقق من توفر المنتج في المخزون
 * @param {Object} supabase - عميل Supabase
 * @param {number} productId - معرف المنتج
 * @param {number} requestedQuantity - الكمية المطلوبة
 * @returns {Promise<Object>} نتيجة التحقق
 */
export async function checkProductStock(supabase, productId, requestedQuantity) {
  try {
    const { data: product, error } = await supabase
      .from('products')
      .select('id, name, stock')
      .eq('id', productId)
      .single();

    if (error) {
      throw new Error(`خطأ في جلب بيانات المنتج: ${error.message}`);
    }

    if (!product) {
      return {
        available: false,
        reason: 'المنتج غير موجود',
        availableStock: 0,
        requestedQuantity
      };
    }

    const availableStock = product.stock || 0;
    const isAvailable = availableStock >= requestedQuantity;

    return {
      available: isAvailable,
      availableStock,
      requestedQuantity,
      productName: product.name,
      reason: isAvailable ? 'متوفر' : `الكمية المتاحة: ${availableStock} فقط`
    };

  } catch (error) {
    console.error('خطأ في التحقق من المخزون:', error);
    return {
      available: false,
      reason: `خطأ في النظام: ${error.message}`,
      availableStock: 0,
      requestedQuantity
    };
  }
}

/**
 * التحقق من توفر جميع المنتجات في السلة
 * @param {Object} supabase - عميل Supabase
 * @param {Array} cartItems - عناصر السلة
 * @returns {Promise<Object>} نتيجة التحقق الشامل
 */
export async function checkCartStock(supabase, cartItems) {
  try {
    const results = await Promise.all(
      cartItems.map(item => 
        checkProductStock(supabase, item.id, item.quantity)
      )
    );

    const unavailableItems = results.filter(result => !result.available);
    const allAvailable = unavailableItems.length === 0;

    return {
      allAvailable,
      unavailableItems,
      availableItems: results.filter(result => result.available),
      totalItems: cartItems.length,
      checkedAt: new Date().toISOString()
    };

  } catch (error) {
    console.error('خطأ في التحقق من مخزون السلة:', error);
    throw error;
  }
}

/**
 * NOTE: The following functions have been deprecated and removed:
 * - reserveProducts
 * - rollbackReservations
 * - confirmOrderStock
 * - cancelOrderReservation
 *
 * These functions were part of the reserved_stock system which has been
 * completely removed from the frontend. Stock is now checked directly
 * using the stock column only.
 */

/**
 * الحصول على مع��ومات مفصلة عن المخزون
 * @param {Object} supabase - عميل Supabase
 * @param {number} productId - معرف المنتج
 * @returns {Promise<Object>} معلومات المخزون
 */
export async function getProductStockInfo(supabase, productId) {
  try {
    const { data: product, error } = await supabase
      .from('products')
      .select('id, name, stock, price, discounted_price')
      .eq('id', productId)
      .single();

    if (error) {
      throw new Error(`خطأ في جلب معلومات المنتج: ${error.message}`);
    }

    const availableStock = product.stock || 0;

    return {
      productId: product.id,
      name: product.name,
      totalStock: product.stock || 0,
      availableStock,
      price: product.price,
      discountedPrice: product.discounted_price,
      status: availableStock > 0 ? 'متوفر' : 'غير متوفر'
    };

  } catch (error) {
    console.error('خطأ في جلب معلومات المخزون:', error);
    throw error;
  }
}

/**
 * دالة شاملة للتعامل مع الطلب
 * @param {Object} supabase - عميل Supabase
 * @param {Array} cartItems - عناصر السلة
 * @returns {Promise<Object>} نتيجة شاملة
 */
export async function processOrderStock(supabase, cartItems) {
  try {
    // 1. التحقق من توفر جميع المنتجات (بدون حجز)
    console.log('🔍 التحقق من توفر المنتجات...');
    const stockCheck = await checkCartStock(supabase, cartItems);

    if (!stockCheck.allAvailable) {
      return {
        success: false,
        step: 'stock_check',
        error: 'بعض المنتجات غير متوفرة',
        unavailableItems: stockCheck.unavailableItems
      };
    }

    return {
      success: true,
      step: 'verified',
      stockCheck,
      message: 'تم التحقق من توفر المنتجات بنجاح'
    };

  } catch (error) {
    console.error('❌ خطأ في معالجة مخزون الطلب:', error);
    return {
      success: false,
      step: 'error',
      error: error.message
    };
  }
}

/**
 * أمثلة على الاستخدام
 */
export const inventoryExamples = {
  // التحقق من منتج واحد
  async checkSingleProduct(supabase, productId, quantity) {
    return await checkProductStock(supabase, productId, quantity);
  },

  // التحقق من السلة كاملة
  async checkFullCart(supabase, cartItems) {
    return await checkCartStock(supabase, cartItems);
  },

  // معالجة طلب كامل
  async processOrder(supabase, cartItems) {
    return await processOrderStock(supabase, cartItems);
  }
};

console.log('📦 نظام إدارة المخزون جاهز للاستخدام');
