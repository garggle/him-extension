// src/lib/shared/constants/api-keys.ts
var keyParts = [
  "sk-proj-PXoZxerOCmm6E7KEboOtwtZ-Nz4RKCH",
  "17XDjRoQpElm2T3RB3bhtZBfgAbPUXPjATewzn",
  "asjDgT3BlbkFJWGV8e-xpUkc122cPTPL3hbRCbK",
  "HVWZYhQin1OOcFiVHu1iDA7mSYsAwd5ZnXxMMvi4g_h4WzcA"
];
function getAPIKey() {
  return keyParts.join("");
}
var DEFAULT_OPENAI_API_KEY = getAPIKey();

// src/lib/features/chat/data/openai-api.ts
var SYSTEM_PROMPT = `Use words that are understandable by a 12 year old. Wait for the user to give you signals or ask you questions. No caps. Be as concise as possible. The user is a Solana memecoin trader on Photon.

If the user gives you signals, you should analyze the signals and give a quick, natural take on the volume, wallet moves, social sentiment, and chart action. No caps. Sentences are short, loose, and to the point. Often speaks in sentence fragments. If you can say something in one sentence, do not say more. No emojis.

You mix smart analysis with gut feel. Notice when whales move, retail panics, or volume spikes weirdly. Don't lecture or explain too much, just drops what matters in a noob-friendly way.

Use crypto slang, but not constantly. No hype talk, stay rational. If a setup looks promising, show interest and give advice on what strategy to use. If it looks risky, give chill warnings.

Sprinkle in metaphors or vivid language only when it fits the moment, like something you'd naturally say if you've seen enough charts go sideways.

Use numbers naturally \u2014 like 8.5M cap, 157k volume in 5 min, <50k wallets \u2014 to back up the read. Always combines market signals with sentiment and narrative.

When analyzing trading opportunities, be direct about whether to buy, sell, or hold, but also explain why in a casual yet insightful way. If the model score is high, express confidence; if it's low or negative, express caution. Consider liquidity, momentum, and whale risk in your assessment.

Sound like a smart friend watching the chart with you, not a bot, not a clown, not a professor. Be understandable by a stupid 12 year old.`;
async function getApiKey() {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(["openaiApiKey"], (result) => {
      try {
        if (result.openaiApiKey && typeof result.openaiApiKey === "string" && result.openaiApiKey.trim().startsWith("sk-")) {
          resolve(result.openaiApiKey);
          return;
        }
        resolve(DEFAULT_OPENAI_API_KEY);
      } catch (error) {
        console.error("Error retrieving API key:", error);
        resolve(DEFAULT_OPENAI_API_KEY);
      }
    });
  });
}
function prepareHistoryForApi(history) {
  if (history.length <= 1)
    return history;
  const mergedHistory = [];
  let currentSender = null;
  let currentText = "";
  for (const msg of history) {
    if (currentSender !== msg.sender) {
      if (currentText) {
        mergedHistory.push({
          sender: currentSender,
          text: currentText.trim()
        });
      }
      currentSender = msg.sender;
      currentText = msg.text;
    } else {
      currentText += " " + msg.text;
    }
  }
  if (currentText) {
    mergedHistory.push({
      sender: currentSender,
      text: currentText.trim()
    });
  }
  return mergedHistory;
}
async function sendChatRequest(message, history = [], isJsonResponse = false, messageId) {
  try {
    const apiKey = await getApiKey();
    const mergedHistory = prepareHistoryForApi(history);
    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      // Add previous conversation history
      ...mergedHistory.map((msg) => ({
        role: msg.sender === "self" ? "user" : "assistant",
        content: msg.text
      })),
      // Add the current message
      { role: "user", content: message }
    ];
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4.1",
        messages,
        response_format: isJsonResponse ? { type: "json_object" } : void 0,
        user: messageId?.toString()
        // Add messageId as user identifier
      })
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      if (response.status === 401) {
        throw new Error("Invalid API key. Please reconfigure your OpenAI API key.");
      } else {
        throw new Error(
          `OpenAI API error: ${response.status} ${response.statusText} ${JSON.stringify(errorData)}`
        );
      }
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
  "actionStrategy": { "header": string, "body": { "entry": string, "tp_sl": string, "timeframe": string, "reason": string }, "metrics": string[] },
  "liquidityPump": { "header": string, "body": { "liquidity": string, "net_volume": string, "buyer_seller_ratio": string, "interpretation": string }, "metrics": string[] },
  "holderStructure": { "header": string, "body": { "holders": string, "pro_traders": string, "top_10_pct": string, "interpretation": string }, "metrics": string[] },
  "manipulationRisk": { "header": string, "body": { "insider_pct": string, "dev_pct": string, "snipers_pct": string, "lp_burned_pct": string, "bundlers_pct": string, "interpretation": string }, "metrics": string[] },
  "finalCall": { "header": string, "body": { "based_on": string[], "text": string }, "metrics": string[] }
}

- Headers should follow the examples: "\u2705 Strategy: ...", "\u2728 Liquidity Health: ...", "\u{1F465} Holder Risk: ...", "\u{1F433} Manipulation Risk: ...", "\u26A0\uFE0F Final Call: ..."
- Populate the body fields using the provided context. Be concise and specific (e.g., give percentages for TP/SL). Assume a standard memecoin goal of >60% profit if buying.
- The 'metrics' arrays should list the key data points from the context that informed each card's analysis.
- Respond ONLY with the JSON object. Do not include any other text, greetings, or explanations before or after the JSON. Ensure the JSON is valid.
`;
  const prompt = context + instructions;
  return prompt;
}
function getIndicatorStatus(value, isPositiveOnly = false) {
  if (isPositiveOnly) {
    if (value >= 0.8)
      return "Excellent";
    if (value >= 0.5)
      return "Good";
    if (value >= 0.3)
      return "Moderate";
    return "Low";
  } else {
    if (value >= 0.5)
      return "Bullish";
    if (value >= 0.1)
      return "Slightly Bullish";
    if (value > -0.1)
      return "Neutral";
    if (value > -0.5)
      return "Slightly Bearish";
    return "Bearish";
  }
}
function getManipulationLevel(score) {
  if (score < 0.2)
    return "Low";
  if (score < 0.5)
    return "Moderate";
  if (score < 0.8)
    return "High";
  return "Extreme";
}
async function getEnhancedTradeAdvice(enhancedResult, snapshot, messageId) {
  try {
    const prompt = formatEnhancedAnalysisPrompt(enhancedResult, snapshot);
    const jsonResponseString = await sendChatRequest(prompt, [], true, messageId);
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
