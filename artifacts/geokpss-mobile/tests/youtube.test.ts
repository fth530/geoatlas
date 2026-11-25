import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  buildPlaylistEmbedUrl,
  buildPlaylistUrl,
  CURATED_PLAYLISTS,
  parsePlaylistId,
} from '../services/youtube-service';

test('parsePlaylistId extracts list param from watch URLs', () => {
  assert.equal(
    parsePlaylistId('https://www.youtube.com/watch?v=abc123&list=PL5kIOunpmSBOBDQbSpgzjR8PgClHVmxgK'),
    'PL5kIOunpmSBOBDQbSpgzjR8PgClHVmxgK',
  );
});

test('parsePlaylistId extracts list param from playlist URLs with extra params', () => {
  assert.equal(
    parsePlaylistId('https://www.youtube.com/playlist?list=PLnBnugScc-7ImTQrm8DvvMFHByN5Pg31V&si=xyz&t=10'),
    'PLnBnugScc-7ImTQrm8DvvMFHByN5Pg31V',
  );
});

test('parsePlaylistId accepts bare playlist ids', () => {
  assert.equal(parsePlaylistId('PL5kIOunpmSBOBDQbSpgzjR8PgClHVmxgK'), 'PL5kIOunpmSBOBDQbSpgzjR8PgClHVmxgK');
});

test('parsePlaylistId accepts ids with underscores and dashes', () => {
  assert.equal(parsePlaylistId('PL8xiaE-wCWlaqe7mplhO-fd6kQgOAYHh_'), 'PL8xiaE-wCWlaqe7mplhO-fd6kQgOAYHh_');
});

test('parsePlaylistId rejects invalid input', () => {
  assert.equal(parsePlaylistId(''), null);
  assert.equal(parsePlaylistId('   '), null);
  assert.equal(parsePlaylistId('not a url'), null);
  assert.equal(parsePlaylistId('https://example.com/page'), null);
  assert.equal(parsePlaylistId('https://youtu.be/dQw4w9WgXcQ'), null);
});

test('curated playlists have unique valid ids', () => {
  const ids = CURATED_PLAYLISTS.map((p) => p.playlistId);
  assert.equal(new Set(ids).size, ids.length);
  for (const p of CURATED_PLAYLISTS) {
    assert.ok(p.playlistId.length >= 10, `${p.title} playlistId too short`);
    assert.ok(p.title.length > 3);
    assert.ok(p.channel.length > 1);
  }
});

test('buildPlaylistEmbedUrl produces videoseries embed', () => {
  const url = buildPlaylistEmbedUrl('PL5kIOunpmSBOBDQbSpgzjR8PgClHVmxgK');
  assert.ok(url.startsWith('https://www.youtube.com/embed/videoseries?'));
  assert.ok(url.includes('list=PL5kIOunpmSBOBDQbSpgzjR8PgClHVmxgK'));
  assert.ok(url.includes('playsinline=1'));
});

test('buildPlaylistUrl produces canonical playlist URL', () => {
  const url = buildPlaylistUrl('PLabc-def_123');
  assert.equal(url, 'https://www.youtube.com/playlist?list=PLabc-def_123');
});
