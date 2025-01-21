import { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import { InvalidFormException } from '../exceptions/invalid.form.exception';
export declare class InvalidFormExceptionFilter implements ExceptionFilter {
    catch(exception: InvalidFormException, host: ArgumentsHost): void;
}
