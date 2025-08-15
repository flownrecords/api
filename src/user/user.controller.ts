import {
    Body,
    Controller,
    Get,
    Header,
    HttpCode,
    HttpStatus,
    Post,
    Req,
    Res,
    UploadedFile,
    UseGuards,
    UseInterceptors,
} from "@nestjs/common";
// import { User } from "@prisma/client";
import { GetUser } from "src/auth/decorator";
import { JwtGuard } from "src/auth/guard";
import { UserService } from "./user.service";
import { FileInterceptor } from "@nestjs/platform-express";
import { csvFilter, kmlFilter } from "./util";
import { Response } from "express";

@UseGuards(JwtGuard)
@Controller("users")
export class UserController {
    constructor(private userService: UserService) {}

    @Get()
    healthCheck() {
        return { status: "OK" };
    }

    @Get("me")
    getMe(@GetUser() user: any) {
        return user;
    }

    @HttpCode(HttpStatus.OK)
    @Post("me")
    updateMe(@GetUser() user: any, @Body() payload) {
        return this.userService.updateUser(user.id, payload);
    }

    @Get("all")
    getAllUsers() {
        return this.userService.getAllUsers();
    }

    @Get("logbook")
    getLogbook(@GetUser() user: any) {
        return this.userService.getLogbook(user.id);
    }

    @Get("logbook/:id")
    getLogbookEntry(@GetUser() user: any, @Req() req) {
        return this.userService.getLogbookEntry(user.id, req.params?.id);
    }

    @HttpCode(HttpStatus.OK)
    @Post("logbook/upload")
    @UseInterceptors(FileInterceptor("file", { fileFilter: csvFilter }))
    updateLogbook(@GetUser() user: any, @Body() body, @UploadedFile() file: Express.Multer.File) {
        return this.userService.updateLogbook(user.id, body.source, file);
    }

    @HttpCode(HttpStatus.OK)
    @Post("logbook/add")
    addLogbookEntry(@GetUser() user: any, @Body() body) {
        return this.userService.addLogbookEntry(user.id, body);
    }

    @HttpCode(HttpStatus.OK)
    @Post("logbook/edit")
    editLogbookEntry(@GetUser() user: any, @Body() body) {
        const { entryId, entryData } = body;
        return this.userService.editLogbookEntry(user.id, entryId, entryData);
    }

    @HttpCode(HttpStatus.OK)
    @Post("logbook/delete")
    deleteLogbookEntries(@GetUser() user: any, @Body() body) {
        const { entryIds } = body;
        return this.userService.deleteLogbookEntries(user.id, entryIds);
    }

    @HttpCode(HttpStatus.OK)
    @Post("logbook/crewAdd")
    addCrewToLogbookEntry(@GetUser() user: any, @Body() body) {
        const { entryId, crewUsername } = body;
        return this.userService.addCrewToLogbookEntry(user.id, entryId, crewUsername);
    }

    @HttpCode(HttpStatus.OK)
    @Post("logbook/crewRemove")
    removeCrewToLogbookEntry(@GetUser() user: any, @Body() body) {
        const { entryId, crewUsername } = body;
        return this.userService.removeCrewToLogbookEntry(user.id, entryId, crewUsername);
    }

    @HttpCode(HttpStatus.OK)
    @Post("recording/upload")
    @UseInterceptors(FileInterceptor("file", { fileFilter: kmlFilter }))
    uploadRecording(
        @GetUser() user: any,
        @Body() body,
        @UploadedFile() file: Express.Multer.File,
    ) {
        return this.userService.uploadRecording(user.id, body, file);
    }

    @Get("report")
    @Header('Content-Type', 'image/png')
    async generateReport(@GetUser() user: any, @Res() res: Response) {
        const imageBuffer = await this.userService.generateReport(user.id);
        res.send(imageBuffer);
    }

    @Get(":username")
    getUserByUsername(@Req() req) {
        return this.userService.getUserByUsername(req.params?.username);
    }

    @Get("id/:id")
    getUserById(@Req() req) {
        return this.userService.getUserById(req.params?.id);
    }
}
