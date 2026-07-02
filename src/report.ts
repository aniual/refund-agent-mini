import type {
    AgentState,
    RefundTrendPoint,
  } from "./state.js";
  
  export type RefundRiskLevel = "low" | "medium" | "high";
  
  export type TrendDirection =
    | "increasing"
    | "decreasing"
    | "stable"
    | "unknown";
  
  export type TrendAnalysis = {
    firstWeekAmount: number;
    lastWeekAmount: number;
    changeAmount: number;
    changePercent: number;
    direction: TrendDirection;
  };
  
  export type RefundAnalysisReport = {
    title: string;
    summary: AgentState["summary"];
    topProducts: AgentState["topProducts"];
    reasons: AgentState["reasons"];
    trend: AgentState["trend"];
    trendAnalysis: TrendAnalysis;
    riskLevel: RefundRiskLevel;
    recommendations: string[];
    requiresHumanReview: boolean;
    approvalStatus: "not_required" | "pending" | "approved";
    errors: string[];
  };
  
  function analyzeTrend(trend: RefundTrendPoint[]): TrendAnalysis {
    if (trend.length < 2) {
      return {
        firstWeekAmount: trend[0]?.refundAmount ?? 0,
        lastWeekAmount: trend[0]?.refundAmount ?? 0,
        changeAmount: 0,
        changePercent: 0,
        direction: "unknown",
      };
    }
  
    const firstWeekAmount = trend[0].refundAmount;
    const lastWeekAmount = trend[trend.length - 1].refundAmount;
    const changeAmount = lastWeekAmount - firstWeekAmount;
  
    const changePercent =
    firstWeekAmount === 0
        ? lastWeekAmount > 0
            ? 100
            : 0
        : Number(
            ((changeAmount / firstWeekAmount) * 100)
                .toFixed(2)
        );
  
    let direction: TrendDirection = "stable";
  
    if (changePercent >= 10) {
      direction = "increasing";
    } else if (changePercent <= -10) {
      direction = "decreasing";
    }
  
    return {
      firstWeekAmount,
      lastWeekAmount,
      changeAmount,
      changePercent,
      direction,
    };
  }
  
  function determineRiskLevel(
    state: AgentState,
    trendAnalysis: TrendAnalysis
  ): RefundRiskLevel {
    const refundRate = Number(
      state.summary?.refundRate.replace("%", "") ?? 0
    );
  
    if (
      refundRate >= 8 ||
      trendAnalysis.changePercent >= 50
    ) {
      return "high";
    }
  
    if (
      refundRate >= 5 ||
      trendAnalysis.changePercent >= 10
    ) {
      return "medium";
    }
  
    return "low";
  }
  
  function buildRecommendations(
    state: AgentState,
    trendAnalysis: TrendAnalysis
  ): string[] {
    const recommendations: string[] = [];
  
    const topProduct = state.topProducts?.[0];
  
    if (topProduct) {
      recommendations.push(
        `Review ${topProduct.productName} because it has the highest refund amount of ${topProduct.refundAmount}.`
      );
    }
  
    const topReason = state.reasons?.[0];
  
    if (topReason) {
      recommendations.push(
        `Address "${topReason.reason}", which represents ${topReason.percentage} of refund reasons.`
      );
    }
  
    if (trendAnalysis.direction === "increasing") {
      recommendations.push(
        `Refund amount increased by ${trendAnalysis.changePercent}% from the first to the last week. Review recent product, promotion, packaging, and carrier changes.`
      );
    }
  
    if (state.pendingApproval) {
      recommendations.push(
        "Review and approve or reject the pending action draft."
      );
    }
  
    return recommendations;
  }
  
  export function buildRefundAnalysisReport(
    state: AgentState
  ): RefundAnalysisReport {
    const trendAnalysis = analyzeTrend(state.trend ?? []);
    const riskLevel = determineRiskLevel(state, trendAnalysis);
  
    return {
      title: "Refund Analysis Report",
      summary: state.summary,
      topProducts: state.topProducts,
      reasons: state.reasons,
      trend: state.trend,
      trendAnalysis,
      riskLevel,
      recommendations: buildRecommendations(state, trendAnalysis),
      requiresHumanReview:
        riskLevel === "high" || Boolean(state.pendingApproval),
      approvalStatus: state.actionDraft
        ? "approved"
        : state.pendingApproval
          ? "pending"
          : "not_required",
      errors: state.errors,
    };
  }