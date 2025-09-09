#!/usr/bin/env node
/**
 * Benchmark script for MQTT topic parsing performance
 * Investigates whether the 25ms threshold is justified or if we have performance degradation
 */

import { buildTopicParser } from './src/ingestion/parseTopic.js';

function runBenchmark() {
  console.log('🔍 MQTT Topic Parsing Performance Benchmark');
  console.log('='.repeat(50));

  const parser = buildTopicParser();
  const topic = 'home/house-001/sensors/device-001/reading';
  const iterations = 1000;
  const runs = 10;

  console.log(`📊 Configuration:`);
  console.log(`   • Iterations: ${iterations.toLocaleString()}`);
  console.log(`   • Runs: ${runs}`);
  console.log(`   • Topic: "${topic}"`);
  console.log();

  const results = [];

  for (let run = 1; run <= runs; run++) {
    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
      parser(topic);
    }
    const end = performance.now();
    const duration = end - start;
    results.push(duration);

    console.log(`Run ${run.toString().padStart(2)}: ${duration.toFixed(2)}ms`);
  }

  console.log();
  console.log('📈 Statistics:');

  const min = Math.min(...results);
  const max = Math.max(...results);
  const avg = results.reduce((a, b) => a + b, 0) / results.length;
  const median = [...results].sort((a, b) => a - b)[Math.floor(results.length / 2)];

  console.log(`   • Min:    ${min.toFixed(2)}ms`);
  console.log(`   • Max:    ${max.toFixed(2)}ms`);
  console.log(`   • Avg:    ${avg.toFixed(2)}ms`);
  console.log(`   • Median: ${median.toFixed(2)}ms`);

  console.log();
  console.log('🎯 Performance Analysis:');

  const originalThreshold = 10; // ms
  const currentThreshold = 25; // ms

  console.log(`   • Original threshold: ${originalThreshold}ms`);
  console.log(`   • Current threshold:  ${currentThreshold}ms`);
  console.log(`   • Threshold increase: ${((currentThreshold / originalThreshold - 1) * 100).toFixed(0)}%`);

  if (max <= originalThreshold) {
    console.log(`   ✅ EXCELLENT: All runs under original ${originalThreshold}ms threshold`);
    console.log(`   💡 RECOMMENDATION: Revert to ${originalThreshold}ms threshold`);
  } else if (avg <= originalThreshold) {
    console.log(`   ✅ GOOD: Average under original ${originalThreshold}ms threshold`);
    console.log(`   ⚠️  Some runs exceed threshold - investigate outliers`);
  } else if (max <= currentThreshold) {
    console.log(`   ⚠️  ACCEPTABLE: All runs under current ${currentThreshold}ms threshold`);
    console.log(`   🔍 INVESTIGATE: Why performance degraded from ${originalThreshold}ms`);
  } else {
    console.log(`   ❌ POOR: Some runs exceed current ${currentThreshold}ms threshold`);
    console.log(`   🚨 ACTION REQUIRED: Performance optimization needed`);
  }

  console.log();
  console.log(`📝 Per-operation performance: ${(avg / iterations * 1000).toFixed(3)}μs per parse`);
}

runBenchmark();
