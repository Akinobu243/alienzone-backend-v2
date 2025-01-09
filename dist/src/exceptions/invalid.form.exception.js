"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidFormException = void 0;
const common_1 = require("@nestjs/common");
class InvalidFormException extends common_1.BadRequestException {
    constructor(errors, message) {
        super(message);
        this.errors = errors;
    }
    getErrorMessage() {
        return this.message;
    }
    getFieldErrors() {
        return this.errors;
    }
}
exports.InvalidFormException = InvalidFormException;
//# sourceMappingURL=invalid.form.exception.js.map