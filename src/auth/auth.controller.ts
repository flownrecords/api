import { Controller, Post, Body, HttpCode, HttpStatus, Query } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthDto, LoginDto } from "./dto";

@Controller("auth")
export class AuthController {
    constructor(private authService: AuthService) {}

    @HttpCode(HttpStatus.OK)
    @Post("signin")
    signin(@Body() dto: LoginDto, @Query("type") type?: string) {
        return this.authService.signin(dto, type);
    }

    @HttpCode(HttpStatus.OK)
    @Post("signup")
    signup(@Body() dto: AuthDto) {
        return this.authService.signup(dto);
    }
}
