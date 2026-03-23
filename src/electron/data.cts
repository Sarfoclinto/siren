// ─── IPC channel constants ─────────────────────────────────────────────────────
// Both preload.ts and renderer hooks import from here — no magic strings anywhere.

export const IPC = {
  SCHEDULE_LIST: "schedule:list",
  SCHEDULE_CREATE: "schedule:create",
  SCHEDULE_UPDATE: "schedule:update",
  SCHEDULE_DELETE: "schedule:delete",
  SCHEDULE_TOGGLE: "schedule:toggle",

  SOUND_LIST: "sound:list",
  SOUND_ADD: "sound:add",
  SOUND_DELETE: "sound:delete",
  SOUND_TEST: "sound:test",

  TTS_SPEAK: "tts:speak",
  TTS_VOICES: "tts:voices",

  SETTINGS_GET: "settings:get",
  SETTINGS_SAVE: "settings:save",
  SETTINGS_VERIFY_PIN: "settings:verifyPin",
  SETTINGS_SET_PIN: "settings:setPin",

  APP_MINIMIZE: "app:minimize",
  APP_VERSION: "app:version",

  // Pushed from main → renderer when a schedule fires
  EVENT_TRIGGERED: "event:triggered",
} as const;
