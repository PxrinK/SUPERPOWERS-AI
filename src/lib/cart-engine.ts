// ==============================================================
// ระบบตะกร้าสินค้า E-Commerce และคำนวณส่วนลด (TypeScript & Next.js)
// ==============================================================

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category: 'ELECTRONICS' | 'CLOTHING' | 'FOOD' | 'GENERAL';
}

export interface DiscountCoupon {
  code: string;
  type: 'PERCENTAGE' | 'FIXED' | 'CATEGORY_TIER';
  value: number; // e.g. 10 for 10% or 100 for 100 THB
  minSpend?: number;
  maxDiscount?: number;
}

export interface CartCalculationResult {
  subtotal: number;
  discountAmount: number;
  shippingFee: number;
  grandTotal: number;
  appliedCoupon?: string;
  breakdown: string[];
}

export class CartEngine {
  public static calculate(
    items: CartItem[],
    coupon?: DiscountCoupon
  ): CartCalculationResult {
    // 1. คำนวณราคารวมสินค้า (Subtotal)
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    let discountAmount = 0;
    const breakdown: string[] = [];

    // 2. ตรวจสอบและคำนวณคูปองส่วนลด
    if (coupon) {
      if (coupon.minSpend && subtotal < coupon.minSpend) {
        breakdown.push(`คูปอง ${coupon.code} ใช้ไม่ได้เนื่องจากยอดสั่งซื้อขั้นต่ำไม่ถึง ${coupon.minSpend} บาท`);
      } else {
        if (coupon.type === 'PERCENTAGE') {
          discountAmount = (subtotal * coupon.value) / 100;
          if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
            discountAmount = coupon.maxDiscount;
          }
          breakdown.push(`ใช้คูปอง ${coupon.code}: ส่วนลด ${coupon.value}% (-${discountAmount.toLocaleString()} บาท)`);
        } else if (coupon.type === 'FIXED') {
          discountAmount = Math.min(coupon.value, subtotal);
          breakdown.push(`ใช้คูปอง ${coupon.code}: ส่วนลดคงที่ -${discountAmount.toLocaleString()} บาท`);
        }
      }
    }

    // 3. ค่าจัดส่ง (ฟรีเมื่อซื้อครบ 500 บาท)
    const shippingFee = subtotal >= 500 || subtotal === 0 ? 0 : 50;
    if (shippingFee === 0 && subtotal > 0) {
      breakdown.push('ฟรีค่าจัดส่ง (โปรโมชั่นยอดสั่งซื้อเกิน 500 บาท)');
    } else if (shippingFee > 0) {
      breakdown.push(`ค่าจัดส่ง: ${shippingFee} บาท (ยอดสั่งซื้อต่ำกว่า 500 บาท)`);
    }

    // 4. ยอดชำระสุทธิ (Grand Total)
    const grandTotal = Math.max(0, subtotal - discountAmount + shippingFee);

    return {
      subtotal,
      discountAmount,
      shippingFee,
      grandTotal,
      appliedCoupon: coupon?.code,
      breakdown,
    };
  }
}