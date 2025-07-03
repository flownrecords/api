import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { User } from '@prisma/client';
import { GetUser } from 'src/auth/decorator';
import { JwtGuard } from 'src/auth/guard';
import { UserService } from './user.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { csvFilter } from './util';

@UseGuards(JwtGuard)
@Controller('users')
export class UserController {
    constructor(
        private userService: UserService
    ) {}

    @Get()
    healthCheck() {
        return { status: 'OK' };
    }

    @Get('me')
    getMe(@GetUser() user: User) {
        return user;
    }

    @Get('all')
    getAllUsers() {
        return this.userService.getAllUsers();
    }
    
    @Get('logbook')
    getLogbook(@GetUser() user: User) {
        return this.userService.getLogbook(user.id);
    }

    @HttpCode(HttpStatus.OK)
    @Post('logbook/upload')
    @UseInterceptors(FileInterceptor('file', { fileFilter: csvFilter } ))
    updateLogbook(@GetUser() user: User, @Body() body, @UploadedFile() file: Express.Multer.File ) {
        return this.userService.updateLogbook(user.id, body.source, file);
    }

    @HttpCode(HttpStatus.OK)
    @Post('logbook/edit')
    editLogbookEntry(@GetUser() user: User, @Body() body) {
        const { entryId, entryData } = body;
        return this.userService.editLogbookEntry(user.id, entryId, entryData);
    }

    @HttpCode(HttpStatus.OK)
    @Post('logbook/delete')
    deleteLogbookEntries(@GetUser() user: User, @Body() body) {
        const { entryIds } = body;
        return this.userService.deleteLogbookEntries(user.id, entryIds);
    }

    @HttpCode(HttpStatus.OK)
    @Post('logbook/crewAdd')
    addCrewToLogbookEntry(@GetUser() user: User, @Body() body) {
        const { entryId, crewUsername } = body;
        return this.userService.addCrewToLogbookEntry(user.id, entryId, crewUsername);
    }

    @HttpCode(HttpStatus.OK)
    @Post('logbook/crewRemove')
    removeCrewToLogbookEntry(@GetUser() user: User, @Body() body) {
        const { entryId, crewUsername } = body;
        return this.userService.removeCrewToLogbookEntry(user.id, entryId, crewUsername);
    }

    @Get(':username')
    getUserByUsername(@Req() req) {
        return this.userService.getUserByUsername(req.params?.username);
    }

    @Get('id/:id')
    getUserById(@Req() req) {
        return this.userService.getUserById(req.params?.id);
    }
}