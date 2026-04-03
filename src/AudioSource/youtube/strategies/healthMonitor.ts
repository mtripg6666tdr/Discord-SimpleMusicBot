import { getLogger } from "../../../logger";

const logger = getLogger("StrategyHealthMonitor");

interface StrategyMetrics {
  successes: number;
  failures: number;
  totalLatencyMs: number;
  recentResults: boolean[]; // true=成功
}

// 直近20回の結果で判定、失敗率80%超で自動無効化、30分ごとにリカバリー
const MAX_RECENT_RESULTS = 20;
const AUTO_DISABLE_FAILURE_RATE = 0.8;
const RECOVERY_CHECK_INTERVAL_MS = 30 * 60 * 1000;

export class StrategyHealthMonitor {
  private metrics: Map<number, StrategyMetrics> = new Map();
  private disabledStrategies: Set<number> = new Set();
  private lastRecoveryCheck: number = Date.now();

  private getOrCreateMetrics(strategyIndex: number): StrategyMetrics {
    let m = this.metrics.get(strategyIndex);
    if (!m) {
      m = { successes: 0, failures: 0, totalLatencyMs: 0, recentResults: [] };
      this.metrics.set(strategyIndex, m);
    }
    return m;
  }

  recordSuccess(strategyIndex: number, latencyMs: number): void {
    const m = this.getOrCreateMetrics(strategyIndex);
    m.successes++;
    m.totalLatencyMs += latencyMs;
    m.recentResults.push(true);
    if (m.recentResults.length > MAX_RECENT_RESULTS) {
      m.recentResults.shift();
    }

    if (this.disabledStrategies.has(strategyIndex)) {
      this.disabledStrategies.delete(strategyIndex);
      logger.info(`Strategy #${strategyIndex} re-enabled after successful attempt`);
    }
  }

  recordFailure(strategyIndex: number): void {
    const m = this.getOrCreateMetrics(strategyIndex);
    m.failures++;
    m.recentResults.push(false);
    if (m.recentResults.length > MAX_RECENT_RESULTS) {
      m.recentResults.shift();
    }

    this.checkAutoDisable(strategyIndex);
  }

  private checkAutoDisable(strategyIndex: number): void {
    const m = this.metrics.get(strategyIndex);
    if (!m || m.recentResults.length < 5) return;

    const recentFailures = m.recentResults.filter(r => !r).length;
    const failureRate = recentFailures / m.recentResults.length;

    if (failureRate >= AUTO_DISABLE_FAILURE_RATE) {
      this.disabledStrategies.add(strategyIndex);
      logger.warn(`Strategy #${strategyIndex} auto-disabled (failure rate: ${(failureRate * 100).toFixed(0)}%)`);
    }
  }

  isDisabled(strategyIndex: number): boolean {
    // 定期的にリカバリーチェック
    if (this.disabledStrategies.size > 0 && Date.now() - this.lastRecoveryCheck >= RECOVERY_CHECK_INTERVAL_MS) {
      this.lastRecoveryCheck = Date.now();
      this.disabledStrategies.clear();
      logger.info("Recovery check: all auto-disabled strategies re-enabled for retry");
    }
    return this.disabledStrategies.has(strategyIndex);
  }
}

export const strategyHealthMonitor = new StrategyHealthMonitor();
