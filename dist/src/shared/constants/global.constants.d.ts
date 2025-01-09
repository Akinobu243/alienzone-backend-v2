export declare const JWT_SECRET: string;
export declare const JWT_EXPIRY_SECONDS = 3600;
export declare enum ROLES_ENUM {
    ADMIN = "admin",
    USER = "user"
}
export declare const ROLES: {
    ADMIN: string;
    USER: string;
};
export declare const DEFAULT_PAGE_LIMIT = 10;
export declare const MAX_PAGE_LIMIT = 100;
export declare const DEFAULT_SORT_BY = "id";
export declare const API_PREFIX = "/api/v1";
export declare const PHONE_REGEX: RegExp;
export declare const SLUG_SEPARATOR = "-";
