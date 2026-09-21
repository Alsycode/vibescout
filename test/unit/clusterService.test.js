// FILE: test/unit/clusterService.test.js
// PURPOSE: Stage 2.11 — clusterService.js#assignCluster: reuse-vs-create decision
// logic, isolated from Mongo via a mocked Cluster model (this is a pure decision
// over query results, not a DB integration test — that's Stage 3's job).

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/models/Cluster.js', () => ({
  default: {
    find: vi.fn(),
    findOneAndUpdate: vi.fn(),
  },
}));

const Cluster = (await import('../../src/models/Cluster.js')).default;
const { assignCluster, haversineKm, CLUSTER_RADIUS_M } = await import('../../src/services/clusterService.js');

beforeEach(() => {
  vi.clearAllMocks();
});

describe('haversineKm', () => {
  it('returns 0 for identical coordinates', () => {
    expect(haversineKm({ lat: 12.9, lng: 77.6 }, { lat: 12.9, lng: 77.6 })).toBe(0);
  });

  it('computes a known distance (Bangalore CBD to ~10.8km away)', () => {
    const km = haversineKm({ lat: 12.9716, lng: 77.5946 }, { lat: 12.9716, lng: 77.6946 });
    expect(km).toBeGreaterThan(10.5);
    expect(km).toBeLessThan(11.1);
  });
});

describe('assignCluster', () => {
  it('reuses the nearest existing cluster within CLUSTER_RADIUS_M', async () => {
    // ~500m away — well within the 1500m radius
    Cluster.find.mockResolvedValue([
      { clusterId: 'existing_1', centroidLat: 12.9716, centroidLng: 77.5990 },
    ]);
    const result = await assignCluster(12.9716, 77.5946);
    expect(result).toBe('existing_1');
    expect(Cluster.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('picks the nearest of several candidate clusters', async () => {
    Cluster.find.mockResolvedValue([
      { clusterId: 'far', centroidLat: 12.98, centroidLng: 77.61 },
      { clusterId: 'near', centroidLat: 12.9718, centroidLng: 77.5948 },
    ]);
    const result = await assignCluster(12.9716, 77.5946);
    expect(result).toBe('near');
  });

  it('creates a new cluster when no nearby cluster is within CLUSTER_RADIUS_M', async () => {
    Cluster.find.mockResolvedValue([
      { clusterId: 'too_far', centroidLat: 13.5, centroidLng: 78.5 },
    ]);
    Cluster.findOneAndUpdate.mockResolvedValue({});
    const result = await assignCluster(12.9716, 77.5946);
    expect(result).toBe('12.97_77.59');
    expect(Cluster.findOneAndUpdate).toHaveBeenCalledOnce();
  });

  it('creates a new cluster when no candidates exist at all', async () => {
    Cluster.find.mockResolvedValue([]);
    Cluster.findOneAndUpdate.mockResolvedValue({});
    const result = await assignCluster(12.9716, 77.5946);
    expect(result).toBe('12.97_77.59');
  });

  it('treats a cluster exactly at CLUSTER_RADIUS_M as reusable (boundary inclusive)', async () => {
    // Construct a point exactly CLUSTER_RADIUS_M (1500m) north of the search point.
    const lat = 12.9716, lng = 77.5946;
    const dLat = CLUSTER_RADIUS_M / 111320; // metres per degree latitude
    Cluster.find.mockResolvedValue([
      { clusterId: 'boundary', centroidLat: lat + dLat, centroidLng: lng },
    ]);
    const result = await assignCluster(lat, lng);
    expect(result).toBe('boundary');
  });
});
