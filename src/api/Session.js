const request = require('request-promise-native');

/**
 * The session class is used for the OAuth 2.0 Authentication by Spotify.
 * Methods like generating the authorization URL or refreshing the access token are defined in this class.
 */
class Session {
  constructor(client, clientID, clientSecret, scopes, redirectURL) {
    this._client = client;
    this.clientID = clientID;
    this.clientSecret = clientSecret;

    this.scopes = scopes;
    this.OAuthURL = 'https://accounts.spotify.com';
    this.redirectURL = redirectURL;
    this.clientAccessToken = '';
    this.accessToken = '';
    this.refreshToken = '';
  }

  async clientAuthorization() {
    // https://developer.spotify.com/documentation/general/guides/authorization-guide/#client-credentials-flow
    try {
      const response = await request.post(`${this.OAuthURL}/api/token`, {
        form: {
          grant_type: 'client_credentials'
        },
        auth: {
          user: this.clientID,
          pass: this.clientSecret
        }
      });
      this.clientAccessToken = JSON.parse(response).access_token;
      return Promise.resolve(this.clientAccessToken);
    } catch (err) {
      console.log(err);
      return Promise.reject(err);
    }
  }

  generateAuthorizationURL() {
    const authorizationURL = `${this.OAuthURL}/authorize?response_type=code&client_id=${
      this.clientID
    }&scope=${this.scopes.join('%20')}&redirect_uri=${encodeURIComponent(this.redirectURL)}`;
    return authorizationURL;
  }

  async retrieveAccessToken(code) {
    try {
      const response = await request.post(`${this.OAuthURL}/api/token`, {
        form: {
          grant_type: 'authorization_code',
          code,
          redirect_uri: this.redirectURL
        },
        auth: {
          user: this.clientID,
          pass: this.clientSecret
        }
      });

      // SIDE EFFECT: retrieving an access token also provides a refresh token
      this.accessToken = JSON.parse(response).access_token;
      this.refreshToken = JSON.parse(response).refresh_token;
      return Promise.resolve();
    } catch (err) {
      console.log(err);
      return Promise.reject(err);
    }
  }

  async refreshAccessToken(refreshToken) {
    if (refreshToken) {
      this.refreshToken = refreshToken;
    }

    try {
      const response = await request.post(`${this.OAuthURL}/api/token`, {
        form: {
          grant_type: 'refresh_token',
          refresh_token: this.refreshToken
        },
        auth: {
          user: this.clientID,
          pass: this.clientSecret
        }
      });
      this.accessToken = JSON.parse(response).access_token;
      return Promise.resolve(this.accessToken);
    } catch (err) {
      console.log(err);
      return Promise.reject(err);
    }
  }

  async refreshedRetryClient(options) {
    // Try again with new access token:
    await this.clientAuthorization();
    options.auth = {
      bearer: this.clientAccessToken
    }

    try {
      const response = await request(options);
      return Promise.resolve(JSON.parse(response));
    } catch (err) {
      // Something different went wrong
      return Promise.reject(err);
    }
  }

  async refreshedRetryUser(options) {
    // Try again with new access token:
    await this.refreshAccessToken();
    options.auth = {
      bearer: this.accessToken
    }

    try {
      const response = await request(options);
      return Promise.resolve(JSON.parse(response));
    } catch (err) {
      // Something different went wrong
      return Promise.reject(err);
    }
  }
}

module.exports = Session;
