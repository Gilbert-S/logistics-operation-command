import type { DeliveryItem, Order, OrderItem, SyncOrder } from "@loc/types";
export declare const highFilter: (item: OrderItem | DeliveryItem) => boolean;
export declare const mediumFilter: (item: OrderItem | DeliveryItem) => boolean;
export declare const lowFilter: (item: OrderItem | DeliveryItem) => boolean;
export declare function updateOrderStats(order: SyncOrder | Order): void;
//# sourceMappingURL=order-stats.d.ts.map