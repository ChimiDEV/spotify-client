const chai = require('chai');
const expect = chai.expect;
require('dotenv').config();

const request = require('request-promise-native');
const Session = require('../../src/api/Session');
let testSession;

describe('Spotify Client - Session', function() {
  beforeEach(() => {
    {
      // Create new Session, no attached client
      testSession = new Session(
        {},
        process.env.SPOTIFY_ID,
        process.env.SPOTIFY_SECRET,
        [
          'playlist-modify-public',
          'playlist-read-private',
          'playlist-modify-private',
          'playlist-read-collaborative',
          'user-modify-playback-state',
          'user-read-currently-playing',
          'user-read-playback-state',
          'user-top-read',
          'user-read-recently-played',
          'app-remote-control',
          'streaming',
          'user-read-birthdate',
          'user-read-email',
          'user-read-private',
          'user-follow-read',
          'user-follow-modify',
          'user-library-modify',
          'user-library-read'
        ],
        'http://localhost:8081/api/spotify/authorization'
      );
    }
  });

  it('Generates Authorization URL', () => {
    const expectedString = `https://accounts.spotify.com/authorize?response_type=code&client_id=${
      process.env.SPOTIFY_ID
    }&scope=playlist-modify-public&redirect_uri=http%3A%2F%2Flocalhost%3A8081%2Fapi%2Fspotify%2Fauthorization`;
    const authorizationURL = testSession.generateAuthorizationURL();
    expect(authorizationURL).to.be.equal(expectedString);
  });

  it('Authorizates the Client to use the Spotify API', async () => {
    const clientAccessToken = await testSession.clientAuthorization();

    // Use access token to make a request to the Spotify API
    const response = await request.get('https://api.spotify.com/v1/tracks/3nhJpxZXEQTsZwrDUihXQf', {
      auth: {
        bearer: clientAccessToken
      }
    });

    // Retrieved song is "Drunken Lullabies" =>
    expect(JSON.parse(response).name).to.be.equal('Drunken Lullabies');
  });

  it('Authorizates the User to use the Spotify API by retrieving an Access Token via Refresh Token', async () => {
    // This tests expects a granted application to your user account and an existing refresh token
    const accessToken = await testSession.refreshAccessToken(process.env.SPOTIFY_REFRESHTOKEN);

    // Use access token to make a request to the Spotify API
    const response = await request.get('https://api.spotify.com/v1/me', {
      auth: {
        bearer: accessToken
      }
    });

    expect(JSON.parse(response).id).to.be.equal(process.env.SPOTIFY_USERID);
  });

  it('Retry Request after refreshing client access token', async () => {
    // This method can be used in a catch block, to retry the same request
    const options = {
      url: 'https://api.spotify.com/v1/tracks/3nhJpxZXEQTsZwrDUihXQf',
      mehtod: 'GET'
    };

    // Requests done by the package are already parsed!
    const response = await testSession.refreshedRetryClient(options);
    expect(response.name).to.be.equal('Drunken Lullabies');
  });

  it('Retry Request after refreshing user access token', async () => {
    // Mock an already happend authorization flow
    testSession.refreshToken = process.env.SPOTIFY_REFRESHTOKEN;

    // This method can be used in a catch block, to retry the same request
    const options = {
      url: 'https://api.spotify.com/v1/me',
      mehtod: 'GET'
    };

    // Requests done by the package are already parsed!
    const response = await testSession.refreshedRetryUser(options);
    expect(response.id).to.be.equal(process.env.SPOTIFY_USERID);
  });
});
