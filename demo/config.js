/* Smart Summarise settings.
   apiBase: the Cloudflare Worker that talks to the AI (the OpenAI key lives there as a secret, never here).
   eventCode: the code audience phones must enter (matches EVENT_CODE in Cloudflare). */
window.SS_CONFIG = {
  apiBase: "https://smart-summarise-api.intisarm48.workers.dev",
  eventCode: "FYAM26"
};
