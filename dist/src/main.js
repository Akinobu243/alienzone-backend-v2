"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const config_1 = require("@nestjs/config");
const swagger_1 = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const app_module_1 = require("./modules/app/app.module");
const global_constants_1 = require("./shared/constants/global.constants");
const global_config_1 = require("./configs/global.config");
const logger_service_1 = require("./modules/logger/logger.service");
const invalid_form_exception_filter_1 = require("./filters/invalid.form.exception.filter");
const all_exceptions_filter_1 = require("./filters/all.exceptions.filter");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        logger: ['error', 'error', 'warn'],
    });
    app.setGlobalPrefix(global_constants_1.API_PREFIX);
    app.useGlobalFilters(new all_exceptions_filter_1.AllExceptionsFilter(app.get(core_1.HttpAdapterHost)), new invalid_form_exception_filter_1.InvalidFormExceptionFilter());
    app.use((0, cors_1.default)({
        origin: process.env.FRONTEND_URL,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        credentials: true,
    }));
    app.use((0, cookie_parser_1.default)());
    app.useGlobalPipes(new common_1.ValidationPipe());
    const configService = app.get(config_1.ConfigService);
    const swaggerConfig = configService.get('swagger');
    if (swaggerConfig.enabled) {
        const options = new swagger_1.DocumentBuilder()
            .setTitle(swaggerConfig.title || 'Nestjs')
            .setDescription(swaggerConfig.description || 'The nestjs API description')
            .setVersion(swaggerConfig.version || '1.0')
            .addBearerAuth()
            .build();
        const document = swagger_1.SwaggerModule.createDocument(app, options);
        swagger_1.SwaggerModule.setup(swaggerConfig.path || 'api', app, document);
    }
    const PORT = process.env.PORT || global_config_1.GLOBAL_CONFIG.nest.port;
    await app.listen(PORT, async () => {
        const myLogger = await app.resolve(logger_service_1.MyLogger);
        myLogger.log(`Server started listening: ${PORT}`);
    });
}
bootstrap();
//# sourceMappingURL=main.js.map