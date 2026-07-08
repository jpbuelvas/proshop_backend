import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-facebook';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor(
    private readonly config: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      clientID: config.get<string>('FACEBOOK_APP_ID')!,
      clientSecret: config.get<string>('FACEBOOK_APP_SECRET')!,
      callbackURL: config.get<string>('FACEBOOK_CALLBACK_URL')!,
      scope: ['public_profile', 'email'],
      profileFields: ['id', 'emails', 'name', 'picture.type(large)'],
      enableProof: true,
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: Function,
  ) {
    const { id, name, emails, photos } = profile;
    const user = await this.authService.findOrCreateUser({
      provider: 'facebook',
      providerId: id,
      email: emails?.[0]?.value ?? `fb_${id}@noemail.com`,
      name: `${name?.givenName ?? ''} ${name?.familyName ?? ''}`.trim(),
      avatar: photos?.[0]?.value,
    });
    done(null, user);
  }
}
