export const settings = {
  treshhold: 80,
  interval: 500,
  // listening: true, // not used at the moment
  recording: false,
  playingAudio: false, // turned on while audio is playing, to prevent false registration
  playWarnings: false,
  timeBetweenAudio: 10,
  barksBetweenAudio: 2,
  audioResetTime: 3,
  delayBeforeRecording: 0.03, // in minutes
  loudCountBeforeWarning: 10, // amount of consecutive 'loud'samples
  chartInterval: 0.5,
  isWakelockActive: false, // wakelock prevents the pc from going to sleep
  isLoggedIn: false
}

export const chartSettings = {
}

export const loudFreqs = {
  count: 0,
  startTime: 0,
  counting: false
}

export const chart = null

export const chartData = {
  start: null,
  end: null,
  timeArray: [],
  countArray: []
}

export const streamHistory = []

export const barks = []

export const warnings = []
