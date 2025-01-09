import { BadRequestException } from '@nestjs/common';
export declare class InvalidFormException extends BadRequestException {
    private errors;
    constructor(errors: {
        [key: string]: string;
    }, message: string);
    getErrorMessage(): string;
    getFieldErrors(): {
        [key: string]: string;
    };
}
