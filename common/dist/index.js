export const Events = {
    SYNC_INFO_LAYER: "SYNC_INFO_LAYER",
    SYNC_MAP_DATA: "SYNC_MAP_DATA",
    SYNC_OPS_BASE: "SYNC_OPS_BASE",
    SYNC_ORDERS: "SYNC_ORDERS",
    SYNC_PRESENCE: "SYNC_PRESENCE",
    SYNC_SETTINGS: "SYNC_SETTINGS",
    SYNC_TEMPLATES: "SYNC_TEMPLATES",
    REQUEST_INFO_LAYER: "REQUEST_INFO_LAYER",
    REQUEST_MAP_DATA: "REQUEST_MAP_DATA",
    REQUEST_OPS_BASE: "REQUEST_OPS_BASE",
    REQUEST_ORDERS: "REQUEST_ORDERS",
    REQUEST_PRESENCE: "REQUEST_PRESENCE",
    REQUEST_TEMPLATES: "REQUEST_TEMPLATES",
    DELIVERY_AUTOPICK15: "DELIVERY_AUTOPICK15",
    DELIVERY_CANCEL: "DELIVERY_CANCEL",
    DELIVERY_CHANGESTATE: "DELIVERY_CHANGESTATE",
    DELIVERY_PICK: "DELIVERY_PICK",
    TEMPLATE_DELETE: "TEMPLATE_DELETE",
    TEMPLATE_UPDATE: "TEMPLATE_UPDATE",
    ADMIN_BACKEND_SETTINGS: "ADMIN_BACKEND_SETTINGS",
    ADMIN_BACKUP_LIST: "ADMIN_BACKUP_LIST",
    ADMIN_BACKUP_RESTORE: "ADMIN_BACKUP_RESTORE",
    ADMIN_FRONTEND_SETTINGS: "ADMIN_FRONTEND_SETTINGS",
    ADMIN_RESET_DATA: "ADMIN_RESET_DATA",
};
export default Events;
export { updateOrderStats, highFilter, mediumFilter, lowFilter } from "./order-stats.js";
export { checkOrderCompletion } from "./order-completion.js";
export const defaultBackendSettings = {
    "auth.permitted-roles": [],
    "auth.admin-roles": [],
    "presence.cutoff-hours": 2,
};
export const defaultFrontendSettings = {
    "orders.display-completed-for": 15,
    "deliveries.display-completed-for": 15,
};
export const defaultSettings = {
    backend: defaultBackendSettings,
    frontend: defaultFrontendSettings,
};
//# sourceMappingURL=index.js.map