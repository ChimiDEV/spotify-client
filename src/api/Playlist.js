const request = require('request-promise-native');

class Playlist {
  constructor(client, market) {
    this._client = client;
    this.market = market;
  }

  async getUserPlaylists(userid, limit = 20, offset = 0) {
    if (!this._client.Session) {
      throw new Error('No Session has been initialized');
    }

    let url = `${this._client.baseURL}/users/${userid}/playlists?limit=${limit}&offset=${offset}`;

    const options = {
      url,
      auth: this._client.Session.getClientAuthDetails(),
      method: 'GET'
    };
    try {
      const response = await request(options);
      const playlists = JSON.parse(response).items.map(
        playlist => new ExtendedSpotifyPlaylist(playlist, this._client)
      );
      return Promise.resolve(playlists);
    } catch (e) {
      try {
        const response = this._client.Session.refreshedRetryClient(options);
        const playlists = response.items.map(
          playlist => new ExtendedSpotifyPlaylist(playlist, this._client)
        );
        return Promise.resolve(playlists);
      } catch (err) {
        return Promise.reject(new Error(err));
      }
    }
  }

  async getCurrentUserPlaylists(limit = 20, offset = 0) {
    if (!this._client.Session) {
      throw new Error('No Session has been initialized');
    }

    const url = `${this._client.baseURL}/me/playlists?limit=${limit}&offset=${offset}`;
    const options = {
      url,
      auth: this._client.Session.getUserAuthDetails(),
      method: 'GET'
    };
    try {
      const response = await request(options);
      const playlists = JSON.parse(response).items.map(
        playlist => new ExtendedSpotifyPlaylist(playlist, this._client)
      );
      return Promise.resolve(playlists);
    } catch (e) {
      try {
        const response = this._client.Session.refreshedRetryUser(options);
        const playlists = response.items.map(
          playlist => new ExtendedSpotifyPlaylist(playlist, this._client)
        );
        return Promise.resolve(playlists);
      } catch (err) {
        return Promise.reject(new Error(err));
      }
    }
  }

  async get(playlistid, asUser = false) {
    if (!this._client.Session) {
      throw new Error('No Session has been initialized');
    }

    const url = `${this._client.baseURL}/playlists/${playlistid}`;
    const auth = asUser
      ? this._client.Session.getUserAuthDetails()
      : this._client.Session.getClientAuthDetails();
    const options = {
      url,
      auth,
      method: 'GET'
    };

    try {
      const response = await request(options);
      const playlist = new ExtendedSpotifyPlaylist(JSON.parse(response), this._client);
      return Promise.resolve(playlist);
    } catch (e) {
      try {
        const response = (await asUser)
          ? this._client.Session.refreshedRetryUser(options)
          : this._client.Session.refreshedRetryClient(options);
        const playlist = new ExtendedSpotifyPlaylist(response, this._client);
        return Promise.resolve(playlist);
      } catch (err) {
        return Promise.reject(new Error(err));
      }
    }
  }

  async create(name, description, collaborative, isPublic) {
    if (!this._client.Session) {
      throw new Error('No Session has been initialized');
    }

    // https://api.spotify.com/v1/users/{user_id}/playlists

    // 1. Get User ID
    let user;
    try {
      user = await this._client.User.current();
    } catch (err) {
      return Promise.reject(new Error(err));
    }
    const url = `https://api.spotify.com/v1/users/${user.id}/playlists`;
    const options = {
      url,
      method: 'POST',
      auth: this._client.Session.getUserAuthDetails(),
      json: { name, description, collaborative, public: isPublic }
    };

    try {
      const response = await request(options);
      return Promise.resolve(new ExtendedSpotifyPlaylist(response));
    } catch (e) {
      try {
        const response = await this._client.Session.refreshedRetryUser(options);
        return Promise.resolve(new ExtendedSpotifyPlaylist(response));
      } catch (err) {
        return Promise.reject(new Error(err));
      }
    }
  }

  async update(playlistid, name, description, collaborative, isPublic) {
    if (!this._client.Session) {
      throw new Error('No Session has been initialized');
    }
    const updatedPlaylist = await updatePlaylist(this._client, playlistid, {name, description, collaborative, public: isPublic});
    return updatedPlaylist;
  }

  async getTracks(playlistid, asUser = false) {
    if (!this._client.Session) {
      throw new Error('No Session has been initialized');
    }

    const tracks = await retrieveTracks(this._client, playlistid, asUser);
    return tracks;
  }

  async addTracks(playlistid, spotifyURIs, position = 0) {
    if (!this._client.Session) {
      throw new Error('No Session has been initialized');
    }

    return addTracksToPlaylist(this._client, playlistid, spotifyURIs, position);
  }
}

class ExtendedSpotifyPlaylist {
  constructor(playlist, client) {
    this._client = client;
    for (const key in playlist) {
      this[key] = playlist[key];
    }
  }

  async getTracks(asUser = false) {
    if (this.tracks.items) {
      return this.tracks.items.map(item => item.track);
    }
    const tracks = await retrieveTracks(this._client, this.id, asUser);
    this.tracks.items = tracks;
    return tracks;
  }

  async update(name, description, collaborative, isPublic) {
    return updatePlaylist(this._client, this.id, {name, description, collaborative, public: isPublic});
  }

  async add(spotifyURIs, position = 0) {
    return addTracksToPlaylist(this._client, this.id, spotifyURIs, position);
  }
}

async function retrieveTracks(client, playlistid, asUser) {
  const url = `${client.baseURL}/playlists/${playlistid}/tracks`;
  const auth = asUser ? client.Session.getUserAuthDetails() : client.Session.getClientAuthDetails();
  const options = {
    url,
    auth,
    method: 'GET'
  };

  try {
    const response = await request(options);
    const tracksMeta = JSON.parse(response);
    const tracks = tracksMeta.items;
    // if (tracksMeta.next) {
    //   // TODO: Include next page in object

    // }
    return Promise.resolve(tracks);
  } catch (e) {
    try {
      const response = (await asUser)
        ? client.Session.refreshedRetryUser(options)
        : client.Session.refreshedRetryClient(options);
      return Promise.resolve(response.items);
    } catch (err) {
      return Promise.reject(new Error(err));
    }
  }
}

async function updatePlaylist(client, playlistid, json) {
  const url = `${client.baseURL}/playlists/${playlistid}`
  const options = {
    url,
    json,
    method: 'PUT',
    auth: client.Session.getUserAuthDetails()
  }

  try {
    await request(options); // Update playlist
    const updatedPlaylist = await client.Playlist.get(playlistid);
    return Promise.resolve(updatedPlaylist);
  } catch (e) {
    try {
      client.Session.refreshedRetryUser(options);
      const updatedPlaylist = await client.Playlist.get(playlistid);
      return Promise.resolve(updatedPlaylist);
    } catch (err) {
      return Promise.reject(new Error(err));
    }
  }

}

async function addTracksToPlaylist(client, playlistid, uris, position) {
  const url = `${client.baseURL}/playlists/${playlistid}/tracks`
  const json = {uris, position}
  const options = {
    url,
    json,
    method: 'POST',
    auth: client.Session.getUserAuthDetails()
  }

  try {
    await request(options); // Add to playlist
    const updatedPlaylist = await client.Playlist.get(playlistid);
    return Promise.resolve(updatedPlaylist);
  } catch (e) {
    try {
      client.Session.refreshedRetryUser(options);
      const updatedPlaylist = await client.Playlist.get(playlistid);
      return Promise.resolve(updatedPlaylist);
    } catch (err) {
      return Promise.reject(new Error(err));
    }
  }
}

async function deleteTracks(playlistid) {

}
module.exports = Playlist;
