// src/lib/features/chat/data/openai-api.ts
var SYSTEM_PROMPT = `Use words that are understandable by a 12 year old. Wait for the user to give you signals or ask you questions. No caps. Be as concise as possible. The user is a Solana memecoin trader on Photon.

If the user gives you signals, you should analyze the signals and give a quick, natural take on the volume, wallet moves, social sentiment, and chart action. No caps. Sentences are short, loose, and to the point. Often speaks in sentence fragments. If you can say something in one sentence, do not say more. No emojis.

You mix smart analysis with gut feel. Notice when whales move, retail panics, or volume spikes weirdly. Don't lecture or explain too much, just drops what matters in a noob-friendly way.

Use crypto slang, but not constantly. No hype talk, stay rational. If a setup looks promising, show interest and give advice on what strategy to use. If it looks risky, give chill warnings.

Sprinkle in metaphors or vivid language only when it fits the moment, like something you'd naturally say if you've seen enough charts go sideways.

Use numbers naturally \u2014 like 8.5M cap, 157k volume in 5 min, <50k wallets \u2014 to back up the read. Always combines market signals with sentiment and narrative.

When analyzing trading opportunities, be direct about whether to buy, sell, or hold, but also explain why in a casual yet insightful way. If the model score is high, express confidence; if it's low or negative, express caution. Consider liquidity, momentum, and whale risk in your assessment.

Sound like a smart friend watching the chart with you, not a bot, not a clown, not a professor.`;
async function getApiKey() {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(["openaiApiKey"], (result) => {
      try {
        if (!result.openaiApiKey) {
          reject(new Error("API key not found. Please configure your OpenAI API key first."));
          return;
        }
        if (typeof result.openaiApiKey !== "string" || !result.openaiApiKey.trim().startsWith("sk-")) {
          reject(
            new Error("Invalid API key format. Please reconfigure with a valid OpenAI API key.")
          );
          return;
        }
        resolve(result.openaiApiKey);
      } catch (error) {
        console.error("Error retrieving API key:", error);
        reject(new Error("Failed to retrieve API key. Please try reconfiguring your API key."));
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
async function sendChatRequest(message, history = []) {
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
        model: "gpt-4o",
        messages
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
function formatAnalysisPrompt(analysisResult, snapshot) {
  let prompt = `Analyze this token trading opportunity:

MODEL RECOMMENDATION: ${analysisResult.decision} (Score: ${analysisResult.score.toFixed(2)})

KEY INDICATORS:
- Momentum: ${analysisResult.factors.momentum.toFixed(2)} (${getIndicatorStatus(analysisResult.factors.momentum)})
- Volume Trend: ${analysisResult.factors.volumeTrend.toFixed(2)} (${getIndicatorStatus(analysisResult.factors.volumeTrend)})
- Buy/Sell Flow: ${analysisResult.factors.flowRatio.toFixed(2)} (${getIndicatorStatus(analysisResult.factors.flowRatio)})
- Liquidity Score: ${analysisResult.factors.liquidityScore.toFixed(2)} (${getIndicatorStatus(analysisResult.factors.liquidityScore, true)})
- Whale Risk: ${analysisResult.factors.whaleRisk.toFixed(2)} (${getIndicatorStatus(-analysisResult.factors.whaleRisk)})`;
  if (snapshot) {
    prompt += `

TOKEN METRICS:
- Market Cap: ${snapshot.overall.mcap}
- Price: ${snapshot.overall.price}
- Liquidity: ${snapshot.overall.liquidity}
- Volume: ${snapshot.timestamped.volume}
- Buyers/Sellers: ${snapshot.timestamped.buyers}/${snapshot.timestamped.sellers}
- Top 10 Holders: ${snapshot.tokenInfo.top10Holders}
- Insider Holdings: ${snapshot.tokenInfo.insiderHoldings}`;
  }
  prompt += `

Based on these indicators and metrics, what should I do on this SOLANA memecoin? Give me very practical memecoin trading advice in a natural, conversational tone. Consider risk levels, timing, and potential strategies. First give what I should do, then explain why. But be concise. Don't use more than 15 sentences.`;
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
async function getTradeAdvice(analysisResult, snapshot) {
  try {
    const prompt = formatAnalysisPrompt(analysisResult, snapshot);
    return await sendChatRequest(prompt, []);
  } catch (error) {
    console.error("Error getting trade advice:", error);
    throw error;
  }
}
export {
  getTradeAdvice
};
