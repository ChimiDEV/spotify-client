const chai = require('chai');
const expect = chai.expect;
require('dotenv').config();

const request = require('request-promise-native');
const SpotifyClient = require('../src/spotify-client');
let spotifyClient;

beforeEach(async () => {
    // Create new Client
    spotifyClient = new SpotifyClient(
      process.env.SPOTIFY_ID,
      process.env.SPOTIFY_SECRET,
      ['playlist-modify-public'],
      'http://localhost:8081/api/spotify/authorization',
      process.env.SPOTIFY_LOCALE
    );

    await spotifyClient.Session.clientAuthorization();
});

describe('Spotify Client', function() {
  it('Search via client', async () => {
    const response = await spotifyClient.Search.query('Drunken Lullabies', ['track'], 9);
    expect(response.tracks.limit).to.be.equal(9);
  })
});