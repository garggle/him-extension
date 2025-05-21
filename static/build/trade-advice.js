// src/lib/features/chat/data/openai-api.ts
async function sendChatRequest(message, history = [], isJsonResponse = false) {
  try {
    const response = await fetch("https://him-api.vercel.app/api/openai", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message,
        history,
        isJsonResponse
      })
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to get response from server");
    }
    const data = await response.json();
    return data.choices[0]?.message?.content || "Sorry, I could not generate a response.";
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    throw error;
  }
}

// src/lib/features/chat/data/trading-analyzer.ts
function getReadableFactorName(factorKey) {
  const factorNames = {
    momentum: "Momentum",
    volumeTrend: "Volume Trend",
    flowImbalance: "Buy/Sell Flow",
    liquidityScore: "Liquidity",
    whaleRisk: "Whale Risk",
    rsi: "RSI",
    volatility: "Volatility",
    vwapDeviation: "VWAP Deviation",
    volatilityAdjustedMomentum: "Risk-Adjusted Momentum"
  };
  return factorNames[factorKey];
}
function formatEnhancedAnalysisPrompt(enhancedResult, snapshot) {
  const { modelResult, manipulationWarnings, manipulationScore } = enhancedResult;
  const { decision, score, normalizedFactors, factorContributions } = modelResult;
  let context = `Trading Opportunity Analysis Context:

MODEL RECOMMENDATION: ${decision} (Score: ${score.toFixed(2)})

KEY INDICATORS:`;
  Object.keys(normalizedFactors).forEach((key) => {
    const value = normalizedFactors[key];
    const contribution = factorContributions[key];
    const isPositiveOnly = key === "liquidityScore";
    const isNegativeBetter = key === "whaleRisk";
    const status = getIndicatorStatus(isNegativeBetter ? -value : value, isPositiveOnly);
    context += `
- ${getReadableFactorName(key)}: ${value.toFixed(2)} (${status}, Impact: ${(contribution * 100).toFixed(1)}%)`;
  });
  if (manipulationWarnings.length > 0 || manipulationScore > 0) {
    context += `

MANIPULATION ANALYSIS:
- Risk Score: ${manipulationScore.toFixed(2)} (${getManipulationLevel(manipulationScore)})`;
    if (manipulationWarnings.length > 0) {
      context += `
- Warnings: ${manipulationWarnings.join("; ")}`;
    }
  } else {
    context += `

MANIPULATION ANALYSIS: Risk Score: ${manipulationScore.toFixed(2)} (Low)`;
  }
  if (snapshot) {
    context += `

TOKEN METRICS:
- Market Cap: ${snapshot.overall.mcap}
- Price: ${snapshot.overall.price}
- Liquidity: ${snapshot.overall.liquidity}
- Total Supply: ${snapshot.overall.totalSupply}
- Volume (${snapshot.timestamped.timeframe}): ${snapshot.timestamped.volume}
- Net Volume (${snapshot.timestamped.timeframe}): ${snapshot.timestamped.netVolume}
- Buyers/Sellers (${snapshot.timestamped.timeframe}): ${snapshot.timestamped.buyers}/${snapshot.timestamped.sellers}
- Top 10 Holders %: ${snapshot.tokenInfo.top10Holders}
- Insider Holdings %: ${snapshot.tokenInfo.insiderHoldings}
- Developer Holdings %: ${snapshot.tokenInfo.developerHolding}
- Sniper Holdings %: ${snapshot.tokenInfo.sniperHolding}
- Bundlers %: ${snapshot.tokenInfo.bundlers}
- LP Burned %: ${snapshot.tokenInfo.lpBurned}
- Holders: ${snapshot.tokenInfo.holders}
- Pro Traders: ${snapshot.tokenInfo.proTraders}
- Dexscreener Paid: ${snapshot.tokenInfo.dexPaid}`;
  }
  const instructions = `
INSTRUCTIONS:
Based *only* on the provided Trading Opportunity Analysis Context, generate a JSON object containing practical advice for trading this SOLANA memecoin.
The JSON object MUST strictly follow this structure:
{
  "actionStrategy": { "header": string, "body": { "entry": string, "tp_sl": string, "timeframe": string }, "metrics": string[] },
  "liquidityPump": { "header": string, "body": { "mcap": string, "liquidity": string, "net_volume": string, "buyer_seller_ratio": string, "interpretation": string }, "metrics": string[] },
  "holderStructure": { "header": string, "body": { "holders": string, "pro_traders": string, "top_10_pct": string, "interpretation": string }, "metrics": string[] },
  "manipulationRisk": { "header": string, "body": { "insider_pct": string, "dev_pct": string, "snipers_pct": string, "lp_burned_pct": string, "bundlers_pct": string, "interpretation": string }, "metrics": string[] },
  "finalCall": { "header": string, "body": { "based_on": string[] }, "metrics": string[] }
}

- Headers should follow the examples: "\u2705 Strategy: ...", "\u2728 Liquidity Health: ...", "\u{1F465} Holder Risk: ...", "\u{1F433} Manipulation Risk: ...", "\u26A0\uFE0F Final Call: ..."
- Populate the body fields using the provided context. Be concise and specific (e.g., give percentages for TP/SL). Assume a standard memecoin goal of >60% profit if buying. More than 100% and 200% is possible.
- The 'metrics' arrays should list the key data points from the context that informed each card's analysis.
- Respond ONLY with the JSON object. Do not include any other text, greetings, or explanations before or after the JSON. Ensure the JSON is valid.
`;
  const prompt = context + instructions;
  return prompt;
}
function getIndicatorStatus(value, isPositiveOnly = false) {
  if (isPositiveOnly) {
    if (value >= 0.8) return "Excellent";
    if (value >= 0.5) return "Good";
    if (value >= 0.3) return "Moderate";
    return "Low";
  } else {
    if (value >= 0.5) return "Bullish";
    if (value >= 0.1) return "Slightly Bullish";
    if (value > -0.1) return "Neutral";
    if (value > -0.5) return "Slightly Bearish";
    return "Bearish";
  }
}
function getManipulationLevel(score) {
  if (score < 0.2) return "Low";
  if (score < 0.5) return "Moderate";
  if (score < 0.8) return "High";
  return "Extreme";
}
async function getEnhancedTradeAdvice(enhancedResult, snapshot) {
  try {
    const prompt = formatEnhancedAnalysisPrompt(enhancedResult, snapshot);
    const jsonResponseString = await sendChatRequest(prompt, [], true);
    const adviceCards = JSON.parse(jsonResponseString);
    return adviceCards;
  } catch (error) {
    console.error("Error getting or parsing enhanced trade advice:", error);
    throw new Error("Failed to get or parse trade advice from AI.");
  }
}
export {
  getEnhancedTradeAdvice,
  getEnhancedTradeAdvice as getTradeAdvice
};
