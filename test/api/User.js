const chai = require('chai');
const expect = chai.expect;
require('dotenv').config();

const Session = require('../../src/api/Session');
// Mock current Session
let testSession = new Session(
  {},
  process.env.SPOTIFY_ID,
  process.env.SPOTIFY_SECRET,
  ['playlist-modify-public'],
  'http://localhost:8081/api/spotify/authorization'
);

const mockClient = {Session: testSession, baseURL: 'https://api.spotify.com/v1'}

// User instance does not have any state => does not need to be reseted after a test
const User = require('../../src/api/User');
const user = new User(mockClient);

describe('Spotify Client - User', function () {
  beforeEach(async () => {
    // retrieve client and user access token
    await user._client.Session.clientAuthorization()
    await user._client.Session.refreshAccessToken(process.env.SPOTIFY_REFRESHTOKEN)
  });

  it('Gets an user by his id', async () => {
    const spotifyUser = await user.get(process.env.SPOTIFY_USERID);
    expect(spotifyUser.id).to.be.equal(process.env.SPOTIFY_USERID);
  });

  it('Gets current user, if authorized', async () => {
    const spotifyUser = await user.current();
    expect(spotifyUser.id).to.be.equal(process.env.SPOTIFY_USERID);
  });
});