import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Post,
    Query,
    Req,
    UploadedFile,
    UseGuards,
    UseInterceptors,
} from "@nestjs/common";
import { User } from "@prisma/client";
import { GetUser } from "src/auth/decorator";
import { JwtGuard } from "src/auth/guard";
import { UserService } from "./user.service";
import { FileInterceptor } from "@nestjs/platform-express";
import { csvFilter, kmlFilter } from "./util";

@UseGuards(JwtGuard)
@Controller("users")
export class UserController {
    constructor(private userService: UserService) {}

    @Get()
    healthCheck() {
        return { status: "OK" };
    }

    @Get("me")
    getMe(@GetUser() user: User) {
        return user;
    }

    @HttpCode(HttpStatus.OK)
    @Post("me")
    updateMe(@GetUser() user: User, @Body() payload) {
        return this.userService.updateUser(user.id, payload);
    }

    @Get("all")
    getAllUsers() {
        return this.userService.getAllUsers();
    }

    @Get("logbook")
    getLogbook(
        @GetUser() user: User,
        @Query("page") page: string = "1",
        @Query("limit") limit: string = "100",
    ) {
        const pageNum = parseInt(page, 10) || 1;
        const limitNum = parseInt(limit, 10) || 100;
        return this.userService.getLogbook(user.id, pageNum, limitNum);
    }

    @HttpCode(HttpStatus.OK)
    @Post("logbook/upload")
    @UseInterceptors(FileInterceptor("file", { fileFilter: csvFilter }))
    updateLogbook(@GetUser() user: User, @Body() body, @UploadedFile() file: Express.Multer.File) {
        return this.userService.updateLogbook(user.id, body.source, file);
    }

    @HttpCode(HttpStatus.OK)
    @Post("logbook/add")
    addLogbookEntry(@GetUser() user: User, @Body() body) {
        return this.userService.addLogbookEntry(user.id, body);
    }

    @HttpCode(HttpStatus.OK)
    @Post("logbook/edit")
    editLogbookEntry(@GetUser() user: User, @Body() body) {
        const { entryId, entryData } = body;
        return this.userService.editLogbookEntry(user.id, entryId, entryData);
    }

    @HttpCode(HttpStatus.OK)
    @Post("logbook/delete")
    deleteLogbookEntries(@GetUser() user: User, @Body() body) {
        const { entryIds } = body;
        return this.userService.deleteLogbookEntries(user.id, entryIds);
    }

    @HttpCode(HttpStatus.OK)
    @Post("logbook/crewAdd")
    addCrewToLogbookEntry(@GetUser() user: User, @Body() body) {
        const { entryId, crewUsername } = body;
        return this.userService.addCrewToLogbookEntry(user.id, entryId, crewUsername);
    }

    @HttpCode(HttpStatus.OK)
    @Post("logbook/crewRemove")
    removeCrewToLogbookEntry(@GetUser() user: User, @Body() body) {
        const { entryId, crewUsername } = body;
        return this.userService.removeCrewToLogbookEntry(user.id, entryId, crewUsername);
    }

    @HttpCode(HttpStatus.OK)
    @Post("recording/upload")
    @UseInterceptors(FileInterceptor("file", { fileFilter: kmlFilter }))
    uploadRecording(
        @GetUser() user: User,
        @Body() body,
        @UploadedFile() file: Express.Multer.File,
    ) {
        return this.userService.uploadRecording(user.id, body, file);
    }

    @Get("recording/:id")
    getFlightRecording(@GetUser() user: User, @Req() req) {
        const recordingId = parseInt(req.params?.id, 10);
        return this.userService.getFlightRecording(user.id, recordingId);
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
