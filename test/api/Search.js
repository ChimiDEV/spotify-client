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

const mockClient = { Session: testSession, baseURL: 'https://api.spotify.com/v1' };

// Search instance does not have any state => does not need to be reseted after a test
const Search = require('../../src/api/Search');
const search = new Search(mockClient, process.env.SPOTIFY_LOCALE);

describe('Spotify Client - Search', function() {
  beforeEach(async () => {
    // retrieve client access token
    await search._client.Session.clientAuthorization();
  });

  it('Queries a search term to the Spotify API', async () => {
    const { tracks } = await search.query('Drunken Lullabies', ['track'], 9);
    expect(tracks.limit).to.be.equal(9);
  });
});
