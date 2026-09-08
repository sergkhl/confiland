import assert from 'node:assert/strict';
import test from 'node:test';
import {
  GUARDIAN_ASSETS,
  observeArtwork,
  type ArtworkResult,
} from '../lib/guardian-artwork.ts';

class TestImage extends EventTarget {
  complete = false;
  naturalWidth = 0;
  decodeCalls = 0;
  decoding = Promise.withResolvers<void>();
  decode = () => {
    this.decodeCalls++;
    return this.decoding.promise;
  };
  load() {
    this.complete = true;
    this.naturalWidth = 1024;
    this.dispatchEvent(new Event('load'));
  }
}

void test('startup artwork covers twelve unique poses and the answering mark', () => {
  assert.equal(GUARDIAN_ASSETS.length, 13);
  assert.equal(new Set(GUARDIAN_ASSETS).size, 13);
  assert.ok(GUARDIAN_ASSETS.includes('curious'));
  assert.ok(GUARDIAN_ASSETS.includes('answer-mark'));
});

void test('an image loaded before hydration still waits for decoding', async () => {
  const image = new TestImage();
  image.load();
  const results: ArtworkResult[] = [];
  const dispose = observeArtwork(image, (result) => results.push(result));
  assert.deepEqual(results, []);
  assert.equal(image.decodeCalls, 1);
  image.decoding.resolve();
  await image.decoding.promise;
  assert.deepEqual(results, ['ready']);
  dispose();
});

void test('delayed and repeated load events decode and count an asset once', async () => {
  const image = new TestImage();
  const results: ArtworkResult[] = [];
  const dispose = observeArtwork(image, (result) => results.push(result));
  assert.equal(image.decodeCalls, 0);
  image.load();
  image.load();
  assert.equal(image.decodeCalls, 1);
  assert.deepEqual(results, []);
  image.decoding.resolve();
  await image.decoding.promise;
  image.load();
  image.dispatchEvent(new Event('error'));
  assert.deepEqual(results, ['ready']);
  dispose();
});

void test('cached failures and new network errors report failure without decoding', () => {
  for (const cached of [true, false]) {
    const image = new TestImage();
    image.complete = cached;
    const results: ArtworkResult[] = [];
    const dispose = observeArtwork(image, (result) => results.push(result));
    image.dispatchEvent(new Event('error'));
    image.dispatchEvent(new Event('error'));
    assert.deepEqual(results, ['error']);
    assert.equal(image.decodeCalls, 0);
    dispose();
  }
});

void test('a decode rejection is a recoverable artwork failure', async () => {
  const image = new TestImage();
  const results: ArtworkResult[] = [];
  const dispose = observeArtwork(image, (result) => results.push(result));
  image.load();
  image.decoding.reject(new Error('Image data could not decode'));
  await image.decoding.promise.catch(() => {});
  assert.deepEqual(results, ['error']);
  dispose();
});

void test('an error during decode cannot later become a second completion', async () => {
  const image = new TestImage();
  const results: ArtworkResult[] = [];
  const dispose = observeArtwork(image, (result) => results.push(result));
  image.load();
  image.dispatchEvent(new Event('error'));
  image.decoding.resolve();
  await image.decoding.promise;
  assert.deepEqual(results, ['error']);
  dispose();
});

void test('unmount removes listeners and ignores a pending decode result', async () => {
  for (const pending of [true, false]) {
    const image = new TestImage();
    const results: ArtworkResult[] = [];
    const dispose = observeArtwork(image, (result) => results.push(result));
    if (pending) image.load();
    dispose();
    image.load();
    image.dispatchEvent(new Event('error'));
    image.decoding.resolve();
    await image.decoding.promise;
    assert.equal(image.decodeCalls, pending ? 1 : 0);
    assert.deepEqual(results, []);
  }
});
