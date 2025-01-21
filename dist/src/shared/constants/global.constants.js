"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SLUG_SEPARATOR = exports.PHONE_REGEX = exports.API_PREFIX = exports.DEFAULT_SORT_BY = exports.MAX_PAGE_LIMIT = exports.DEFAULT_PAGE_LIMIT = exports.ROLES = exports.ROLES_ENUM = exports.JWT_EXPIRY_SECONDS = exports.JWT_SECRET = void 0;
require('dotenv').config();
exports.JWT_SECRET = process.env.JWT_SIGNATURE;
exports.JWT_EXPIRY_SECONDS = 3600;
var ROLES_ENUM;
(function (ROLES_ENUM) {
    ROLES_ENUM["ADMIN"] = "admin";
    ROLES_ENUM["USER"] = "user";
})(ROLES_ENUM = exports.ROLES_ENUM || (exports.ROLES_ENUM = {}));
exports.ROLES = {
    ADMIN: 'admin',
    USER: 'user',
};
exports.DEFAULT_PAGE_LIMIT = 10;
exports.MAX_PAGE_LIMIT = 100;
exports.DEFAULT_SORT_BY = 'id';
exports.API_PREFIX = '/api/v1';
exports.PHONE_REGEX = /^[0-9\s+-.()]+$/;
exports.SLUG_SEPARATOR = '-';
//# sourceMappingURL=global.constants.js.map