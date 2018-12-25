const chai = require('chai');
const expect = chai.expect;
require('dotenv').config();

const request = require('request-promise-native');
const Session = require('../../src/api/Session');
// Mock current Session
let testSession = new Session(
  {},
  process.env.SPOTIFY_ID,
  process.env.SPOTIFY_SECRET,
  ['playlist-modify-public'],
  'http://localhost:8081/api/spotify/authorization'
);
// Search instance does not have any state => does not need to be reseted after a test
const Search = require('../../src/api/Search');
let search = new Search({Session: testSession}, process.env.SPOTIFY_LOCALE);

beforeEach(async () => {
  // retrieve an client access code
  await search._client.Session.clientAuthorization();
});

describe('Spotify Client - Search', function () {
  it('Queries a search term to the Spotify API', async () => {
    const response = await search.query('Drunken Lullabies', ['track'], 9);
    expect(response.tracks.limit).to.be.equal(9);
  });
});