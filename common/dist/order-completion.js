export function checkOrderCompletion(order) {
    if (!order)
        return;
    const stats = order.stats;
    if (stats.ordered.total > 0 && stats.ordered.total <= stats.delivered.total) {
        order.completed = true;
        order.timeEnd = Date.now();
    }
    else {
        order.completed = false;
        order.timeEnd = null;
    }
}
//# sourceMappingURL=order-completion.js.map