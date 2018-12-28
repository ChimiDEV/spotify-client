const chai = require('chai');
const expect = chai.expect;
require('dotenv').config();

const Session = require('../../src/api/Session');
const User = require('../../src/api/User');
// Mock current Session and User
let testSession = new Session(
  {},
  process.env.SPOTIFY_ID,
  process.env.SPOTIFY_SECRET,
  ['playlist-modify-public'],
  'http://localhost:8081/api/spotify/authorization'
);

const mockClient = { Session: testSession, baseURL: 'https://api.spotify.com/v1' };
mockClient.User = new User(mockClient);

// Playlist instance does not have any state => does not need to be reseted after a test
const Playlist = require('../../src/api/Playlist');
const playlist = new Playlist(mockClient);
mockClient.Playlist = playlist;

let createdPlaylistIDs = [];
describe('Spotify Client - Playlist', function() {
  beforeEach(async () => {
    await playlist._client.Session.clientAuthorization();
    await playlist._client.Session.refreshAccessToken(process.env.SPOTIFY_REFRESHTOKEN);
  });

  it('Retrieves all playlists of current user', async () => {
    const playlists = await playlist.getCurrentUserPlaylists(1);
    expect(playlists).to.be.not.empty;
  });

  it('Retrieves all public playlists of an user', async () => {
    const playlists = await playlist.getUserPlaylists(process.env.SPOTIFY_USERID, 1);
    expect(playlists).to.be.empty;
  });

  it('Retrieves a playlist by id', async () => {
    const spotifyPlaylist = await playlist.get(process.env.SPOTIFY_PLAYLISTID);
    expect(spotifyPlaylist.id).to.be.equal(process.env.SPOTIFY_PLAYLISTID);
  });

  it('Retrieves tracks of a playlist', async () => {
    const playlistTracks = await playlist.getTracks(process.env.SPOTIFY_PLAYLISTID);
    expect(playlistTracks).to.be.not.empty;
    // OR
    // const spotifyPlaylist = await playlist.get(process.env.SPOTIFY_PLAYLISTID);
    // const tracks = await spotifyPlaylist.getTracks();
  });

  it('Creates a playlist', async () => {
    const spotifyPlaylist = await playlist.create('Test API', 'Playlist created with the Spotify API', false, false);
    createdPlaylistIDs.push(spotifyPlaylist.id);

    expect(spotifyPlaylist.name).to.be.equal('Test API');
  });

  it('Updates a playlist', async () => {
    // Create a playlist to update it
    const newPlaylist = await playlist.create('Former Playlist', 'Playlist created with the Spotify API', false, false);
    const updatedPlaylist = await playlist.update(newPlaylist.id, 'Update Test API', 'Playlist created with the Spotify API', false, false)
    // OR
    // const spotifyPlaylist = await playlist.get(newPlaylist.id);
    // const updatedPlaylist = await spotifyPlaylist.update('Update Test API', 'Playlist created with the Spotify API', false, false);
    createdPlaylistIDs.push(newPlaylist.id);

    expect(updatedPlaylist.id).to.be.equal(newPlaylist.id);
    expect(updatedPlaylist.name).to.be.not.equal(newPlaylist.name);
  });

  it('Adds songs to a playlist', async () => {
    const songURIs = [
      'spotify:track:7tFiyTwD0nx5a1eklYtX2J', // Queen - Bohemian Rapsody
      'spotify:track:3lrNq7iGL5r3KS93YiKAbC' // Quenn - Don't Stop Me Now
    ]
    let spotifyPlaylist = await playlist.addTracks(createdPlaylistIDs[0], songURIs);
    // OR
    spotifyPlaylist = await playlist.get(createdPlaylistIDs[0]);
    spotifyPlaylist = await spotifyPlaylist.add(songURIs);

    expect((await spotifyPlaylist.getTracks()).length).to.be.equal(4)
  });
});
