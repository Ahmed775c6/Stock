import { invoke } from '@tauri-apps/api/core';
import { Metric, MetricsResponse } from '../types/metrics';

export const fetchMetrics = async (): Promise<Metric[]> => {
  try {
    const metrics = await invoke<MetricsResponse>('get_metrics101');
    return metrics;
  } catch (error) {
    console.error('Error fetching metrics:', error);
    throw new Error('Failed to fetch metrics');
  }
};