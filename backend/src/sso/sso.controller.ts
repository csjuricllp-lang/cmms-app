import { Controller, Get, Post, Delete, Body, Param, Request, Req, UseGuards, Query, Res, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SsoService } from './sso.service';
import { Public } from '../auth/decorators/public.decorator';
import { randomUUID } from 'crypto';
import type { Response } from 'express';

@Controller('sso')
export class SsoController {
    constructor(private readonly ssoService: SsoService) {}

    @UseGuards(JwtAuthGuard)
    @Get('config')
    async getConfig(@Request() req) {
        return this.ssoService.getConfig(req.user.organizationId);
    }

    @UseGuards(JwtAuthGuard)
    @Post('config')
    async saveConfig(@Request() req, @Body() body: any) {
        return this.ssoService.upsertConfig(req.user.organizationId, body);
    }

    @UseGuards(JwtAuthGuard)
    @Delete('config')
    async deleteConfig(@Request() req) {
        return this.ssoService.deleteConfig(req.user.organizationId);
    }

    @Public()
    @Get('metadata')
    async getMetadata(@Res() res: Response) {
        const metadata = this.ssoService.getSpMetadata();
        res.type('application/xml');
        return res.send(metadata);
    }

    @Public()
    @Get('initiate')
    async initiate(@Query('email') email: string, @Req() req: any, @Res() res: Response) {
        if (!email) {
            return res.status(HttpStatus.BAD_REQUEST).json({ message: 'Email query parameter is required' });
        }
        const domain = email.split('@')[1];
        if (!domain) {
            return res.status(HttpStatus.BAD_REQUEST).json({ message: 'Invalid email domain' });
        }

        try {
            // CSRF Security Fix: Generate anti-replay state nonce
            const state = randomUUID();
            res.cookie('sso_state', state, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 10 * 60 * 1000, // 10 minutes TTL
            });

            const redirectUrl = await this.ssoService.getLoginUrlForDomain(domain, state);
            return res.redirect(redirectUrl);
        } catch (err) {
            return res.status(HttpStatus.BAD_REQUEST).json({ message: err.message });
        }
    }

    @Public()
    @Post('callback')
    async callback(
        @Body('SAMLResponse') samlResponse: string,
        @Body('RelayState') relayStateBody: string,
        @Req() req: any,
        @Res() res: Response
    ) {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        if (!samlResponse) {
            return res.status(HttpStatus.BAD_REQUEST).send('SAMLResponse is missing');
        }

        // CSRF & Anti-Replay Verification: Verify RelayState matches httpOnly sso_state cookie
        const stateCookie = req.cookies?.['sso_state'];
        const relayState = relayStateBody || req.query?.RelayState;
        if (stateCookie && relayState && stateCookie !== relayState) {
            res.clearCookie('sso_state');
            return res.redirect(`${frontendUrl}/login?sso_error=${encodeURIComponent('SSO state/RelayState validation failed (CSRF protection)')}`);
        }
        res.clearCookie('sso_state');

        try {
            const tokens = await this.ssoService.processSamlResponse(samlResponse);
            
            res.cookie('refresh_token', tokens.refresh_token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000,
            });
            
            // Security Fix: Issue short-lived, single-use exchange code instead of leaking access token in URL
            const code = await this.ssoService.createSsoCode(tokens.access_token);
            return res.redirect(`${frontendUrl}/sso-callback?code=${code}`);
        } catch (err) {
            return res.redirect(`${frontendUrl}/login?sso_error=${encodeURIComponent(err.message)}`);
        }
    }

    @Public()
    @Post('exchange-code')
    async exchangeCode(@Body('code') code: string) {
        const accessToken = await this.ssoService.exchangeSsoCode(code);
        return { access_token: accessToken };
    }
}
