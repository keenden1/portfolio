import test from "node:test";
import assert from "node:assert/strict";
import { projectImageUrls, moveGalleryImage, resolveGalleryImages } from "../lib/project-gallery.ts";

test("legacy covers and gallery arrays become one unique ordered gallery", () => {
  assert.deepEqual(projectImageUrls(undefined, "cover.jpg"), ["cover.jpg"]);
  assert.deepEqual(projectImageUrls(["detail.jpg", "cover.jpg", "", "detail.jpg"], "cover.jpg"), ["cover.jpg", "detail.jpg"]);
  assert.deepEqual(projectImageUrls(["detail.jpg"], " "), ["detail.jpg"]);
  assert.deepEqual(projectImageUrls(null, null), []);
});

test("choosing a cover and changing order preserve other photos", () => {
  const original = ["cover.jpg", "detail.jpg", "mobile.jpg"];
  assert.deepEqual(moveGalleryImage(original, 2, 0), ["mobile.jpg", "cover.jpg", "detail.jpg"]);
  assert.deepEqual(moveGalleryImage(original, 0, 1), ["detail.jpg", "cover.jpg", "mobile.jpg"]);
  assert.deepEqual(original, ["cover.jpg", "detail.jpg", "mobile.jpg"]);
  assert.deepEqual(moveGalleryImage(original, 0, -1), original);
  assert.deepEqual(moveGalleryImage(original, 2, 3), original);
});

test("uploading a new cover retains existing photos in their selected order", async () => {
  const file = new File(["image"], "new.png", { type: "image/png" });
  const draft = [{ id: "new", url: "blob:new", file }, { id: "old", url: "old.jpg" }];
  let uploads = 0;
  const urls = await resolveGalleryImages(draft, async () => { uploads++; return "new.png"; });
  assert.deepEqual(urls, ["new.png", "old.jpg"]);
  assert.equal(uploads, 1);
  assert.equal(draft[0].file, undefined);
});

test("an interrupted upload can retry without re-uploading completed files", async () => {
  const first = new File(["a"], "first.png", { type: "image/png" });
  const second = new File(["b"], "second.png", { type: "image/png" });
  const draft = [{ id: "old", url: "old.jpg" }, { id: "a", url: "blob:a", file: first }, { id: "b", url: "blob:b", file: second }];
  await assert.rejects(resolveGalleryImages(draft, async (file) => { if (file === second) throw new Error("Upload failed"); return "first.png"; }), /Upload failed/);
  const retriedFiles = [];
  const urls = await resolveGalleryImages(draft, async (file) => { retriedFiles.push(file.name); return "second.png"; });
  assert.deepEqual(retriedFiles, ["second.png"]);
  assert.deepEqual(urls, ["old.jpg", "first.png", "second.png"]);
});

test("retrying the database save uses the resolved URLs without uploading again", async () => {
  const draft = [{ id: "a", url: "blob:a", file: new File(["a"], "a.png") }];
  await resolveGalleryImages(draft, async () => "saved.png");
  const urls = await resolveGalleryImages(draft, async () => { assert.fail("Must not re-upload a saved photo"); });
  assert.deepEqual(urls, ["saved.png"]);
});

test("removing all photos produces an empty gallery without restoring the old cover", async () => {
  assert.deepEqual(await resolveGalleryImages([], async () => { assert.fail("Nothing to upload"); }), []);
});
