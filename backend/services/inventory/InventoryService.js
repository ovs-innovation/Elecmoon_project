const { handleProductQuantity } = require("../../lib/stock-controller/others");

class InventoryService {
  /**
   * Decrement stock only after verified payment success.
   * Idempotent via caller ensuring this runs once per order.
   */
  async reduceForOrder(cart) {
    if (!Array.isArray(cart) || cart.length === 0) return;
    await handleProductQuantity(cart);
  }
}

module.exports = new InventoryService();
