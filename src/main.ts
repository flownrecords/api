import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import { json, urlencoded } from "express";
import bodyParser from "body-parser";
import { uploadConfig } from "./config/upload.config";

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true, // Automatically remove properties that do not have any decorators
        }),
    );

    // Increase body size limits to accommodate file uploads
    const maxBodySize = Math.max(uploadConfig.maxCsvFileSize, uploadConfig.maxKmlFileSize);
    const bodySizeLimit = `${Math.ceil(maxBodySize / (1024 * 1024))}mb`;

    app.use(json({ limit: bodySizeLimit }));
    app.use(urlencoded({ extended: true, limit: bodySizeLimit }));

    // Enable CORS for all origins
    app.enableCors({
        origin: "*", // You can specify specific origins if needed
        methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
        allowedHeaders: "Content-Type, Accept, Authorization, Bearer",
    });

    await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
