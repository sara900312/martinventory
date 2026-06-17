const SUPABASE_URL = 'https://ykyzviqwscrjjkucorlp.supabase.co';
const ORDER_NOTIFICATION_FUNCTION = `${SUPABASE_URL}/functions/v1/order-notification`;

async function sendOrder(orderData) {
  try {
    const res = await fetch(ORDER_NOTIFICATION_FUNCTION, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(orderData)
    });

    // ✅ Robust error handling: Use res.text() to prevent crashes
    // This handles cases where server returns 404, 500, or non-JSON responses
    const text = await res.text();
    let result;

    try {
      result = text ? JSON.parse(text) : null;
    } catch (parseError) {
      console.error("خطأ في تحليل رد JSON من السيرفر:", parseError);
      console.error("حالة الرد:", res.status);
      console.error("نص الرد:", text);

      // Throw a descriptive error if JSON parsing fails
      throw new Error(`رد غير صحيح من السيرفر: ${res.status} ${res.statusText}`);
    }

    // Check if request was successful
    if (!res.ok) {
      const errorMessage = result?.error || result?.message || "يرجى المحاولة مرة أخرى";
      console.error("خطأ في الرد من السيرفر:", result?.error || result);
      throw new Error(errorMessage);
    }

    // Verify success flag
    if (!result || !result.success) {
      throw new Error(result?.error || result?.message || "يرجى المحاولة مرة أخرى");
    }

    const storeName = result?.storeName ?? "غير محدد";
    console.log("تم إرسال الطلب. اسم المتجر:", storeName);

    return {
      ...result,
      storeName
    };

  } catch (error) {
    console.error("خطأ أثناء إرسال الطلب:", error);
    throw error;
  }
}

export { sendOrder };
