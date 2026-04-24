import { describe, expect, it } from "vitest";
import {
  checkForPackageUpdate,
  compareVersions,
  type UpdateNotifierCache,
} from "../src/core/update-notifier.js";

describe("compareVersions", () => {
  it("compares semantic versions correctly", () => {
    expect(compareVersions("1.6.1", "1.6.0")).toBeGreaterThan(0);
    expect(compareVersions("1.7.0", "1.6.9")).toBeGreaterThan(0);
    expect(compareVersions("1.6.0", "1.6.0")).toBe(0);
    expect(compareVersions("1.6.0-beta.1", "1.6.0")).toBeLessThan(0);
  });
});

describe("checkForPackageUpdate", () => {
  it("stores the fetched latest version and returns it when newer", async () => {
    let cache: UpdateNotifierCache | null = null;

    const latestVersion = await checkForPackageUpdate({
      packageName: "@arseno25/comet",
      currentVersion: "1.6.0",
      now: () => 1_000_000,
      readCache: async () => cache,
      writeCache: async (nextCache) => {
        cache = nextCache;
      },
      fetchLatestVersion: async () => "1.7.0",
    });

    expect(latestVersion).toBe("1.7.0");
    expect(cache).toMatchObject({
      latestVersion: "1.7.0",
      lastCheckedAt: 1_000_000,
      lastNotifiedAt: 1_000_000,
      lastNotifiedVersion: "1.7.0",
    });
  });

  it("does not notify repeatedly inside the cooldown window", async () => {
    let cache: UpdateNotifierCache | null = {
      lastCheckedAt: 1_000_000,
      latestVersion: "1.7.0",
      lastNotifiedAt: 1_000_000,
      lastNotifiedVersion: "1.7.0",
    };

    const latestVersion = await checkForPackageUpdate({
      packageName: "@arseno25/comet",
      currentVersion: "1.6.0",
      now: () => 1_000_001,
      readCache: async () => cache,
      writeCache: async (nextCache) => {
        cache = nextCache;
      },
      fetchLatestVersion: async () => {
        throw new Error("should not refetch while cache is fresh");
      },
    });

    expect(latestVersion).toBeNull();
    expect(cache).toMatchObject({
      latestVersion: "1.7.0",
      lastNotifiedVersion: "1.7.0",
    });
  });

  it("falls back to a cached newer version when refresh fails", async () => {
    let cache: UpdateNotifierCache | null = {
      lastCheckedAt: 1,
      latestVersion: "1.7.0",
    };

    const latestVersion = await checkForPackageUpdate({
      packageName: "@arseno25/comet",
      currentVersion: "1.6.0",
      now: () => 99_999_999,
      readCache: async () => cache,
      writeCache: async (nextCache) => {
        cache = nextCache;
      },
      fetchLatestVersion: async () => null,
    });

    expect(latestVersion).toBe("1.7.0");
    expect(cache).toMatchObject({
      latestVersion: "1.7.0",
      lastCheckedAt: 99_999_999,
      lastNotifiedVersion: "1.7.0",
      lastNotifiedAt: 99_999_999,
    });
  });
});
