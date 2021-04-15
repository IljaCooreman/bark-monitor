// import {Howl} from 'Howler'
import { settings, warnings, barks, loudFreqs, chartData } from './lib'
import { updateUi, init } from './init'
import format from 'date-fns/format'
import distanceInWords from 'date-fns/distance_in_words'

const stopAudio = document.querySelector('#stop-audio')
const form = document.querySelector('form')
const toggleAudioButton = document.getElementById('toggle-audio')
// const saveButton = document.getElementById('save-session')

toggleAudioButton.addEventListener('click',
  () => {
    document.querySelector('body').style.border = '4px dotted orange'
    toggleAudioButton.disabled = true
    setTimeout(() => {
      startRecording()
    }, settings.delayBeforeRecording * 60 * 1000)
    toggleAudioButton.innerHTML = `waarschuwingen AAN`
  })

const startRecording = () => {
  settings.playWarnings = true
  settings.recording = true
  document.querySelector('body').style.border = '4px solid #f54e38'
  stopAudio.disabled = false
  chartData.start = new Date().getTime()
}

stopAudio.addEventListener('click',
  () => {
    settings.playWarnings = false
    settings.recording = false
    toggleAudioButton.disabled = settings.playWarnings
    document.querySelector('body').style.border = '4px solid #efefef'
    stopAudio.disabled = true
    if (barks[barks.length - 1].time - chartData.start > 250000) save()
    chartData.end = new Date().getTime()
  })

form.addEventListener('change', (e) => {
  const node = e.target
  settings[node.id] = parseFloat(node.value)
  const label = document.getElementById(`${node.id}Label`)
  if (label) label.innerHTML = `${settings[node.id]}`
}, false)

const save = () => {
  localStorage.setItem('settings', JSON.stringify(settings)) //eslint-disable-line
  console.log(`save to ls`, settings)
  const history = JSON.parse(localStorage.getItem('history')) //eslint-disable-line
  const entry = {
    date: format(chartData.start, 'ddd D/MM/YY HH:mm'),
    duration: distanceInWords(chartData.start, new Date().getTime()),
    totalBarks: barks.length,
    totalWarnings: warnings.length,
    settings,
    barks,
    warnings
  }
  if (history) {
    const newHistory = [...history, entry]
    console.log('newHistory', newHistory)
    localStorage.setItem('history', JSON.stringify([...history, entry])) //eslint-disable-line
  } else {
    localStorage.setItem('history', JSON.stringify([entry])) //eslint-disable-line
  }
  // location.reload() //eslint-disable-line
}

let barkCount = 0

const chart = init()

// const getPercentile = (array, percentile) => {
//   const values = array.sort((previous, current) => previous - current)
//   const perc = Math.floor(values.length * percentile)
//   return values.length % 2 ? values[perc] : (values[perc - 1] + values[perc]) / 2
// }

// const analyseStream = (stream) => {
//   if (!settings.recording) return
//   // check avg
//   const sum = stream.reduce((previous, current) => current + Math.abs(previous))
//   const avg = Math.abs((sum / stream.length) * 1000)

//   const time = new Date().getTime()
//   if (time % 3) addToStreamHistory({ avg, time })

//   if (avg > settings.treshhold) {
//     handleBark(time, avg)
//   }
// }

// const addToStreamHistory = (obj) => {
//   if (streamHistory.length > 0 && (streamHistory[streamHistory.length - 1].time - streamHistory[0].time) / 1000 > 30) streamHistory.shift()
//   if (settings.recording) {
//     streamHistory.push(obj)
//   }
//   if (obj.time % (10) === 0) {
//     // const sum = streamHistory.map(obj => obj.avg).reduce((previous, current) => current + previous)
//     // const avg = (sum / streamHistory.length)

//   }
// }

const suspendRecording = (settings, time) => {
  settings.recording = false
  setTimeout(() => {
    if (!settings.playingAudio) {
      settings.recording = true
      console.log(`start recording`)
    }
  }, time)
}

const handleBark = (timestamp, volume) => {
  console.log(`bark!, ${format(timestamp, 'H:mm')} peak`, volume)
  barks.push({
    time: timestamp,
    volume: volume
  })
  suspendRecording(settings, settings.interval)

  if (settings.playWarnings) triggerWarning(barks, settings)
  updateUi(chart)
}
// ################### - play audio - ##################### //
const triggerWarning = (barks, settings) => {
  // check if the audio has to be played
  if (barks.length > 1) {
    const thisBarkTime = barks[barks.length - 1].time
    const prevBarkTime = barks[barks.length - 2].time

    if (thisBarkTime - prevBarkTime > (settings.audioResetTime * 1000 * 60)) {
      barkCount = 0
    }
  }
  barkCount = barkCount + 1
  if (barkCount >= settings.barksBetweenAudio) {
    playAudio()
    barkCount = 0
  }
}

const playAudio = () => {
  const audioFragments = ['audio1', 'audio2', 'audio3', 'audio4', 'audio5', 'audio6', 'audio7']
  const audio = document.getElementById(audioFragments[Math.floor(Math.random() * audioFragments.length)])

  warnings.push({time: new Date(), warning: audio.id})
  console.log('warning: ', warnings)
  // const audio = new Audio('./audio/ilja1.mp3') //eslint-disable-line
  setTimeout(() => {
    audio.play()
    settings.playingAudio = true
    console.log('playing audio', audio.duration)
    setTimeout(() => {
      settings.playingAudio = false
      console.log('stop playing audio')
    }, audio.duration * 1000)
    suspendRecording(settings, audio.duration * 1000)
  }, 100)

  console.warn(`BAD DOG!`, audio.duration)
}

// ################### - get my audio stream - ##################### //

navigator.mediaDevices.getUserMedia({ audio: true, video: false })
  .then(stream => {
    const audioTracks = stream.getAudioTracks()
    console.log('Using audio device: ' + audioTracks[0].label)

    const AudioContext = window.AudioContext || window.webkitAudioContext
    const audioContext = new AudioContext()
    const volume = audioContext.createGain() // creates a gain node
    const audioInput = audioContext.createMediaStreamSource(stream) // creates an audio node from the mic stream
    const highPassFilter = audioContext.createBiquadFilter()
    const lowPassFilter = audioContext.createBiquadFilter()
    const analyser = audioContext.createAnalyser()
    audioInput.connect(volume)// connect the stream to the gain node
    volume.connect(highPassFilter)
    highPassFilter.connect(lowPassFilter)
    lowPassFilter.connect(analyser)
    const recorder = audioContext.createScriptProcessor(2048, 1, 1)
    // recorder.onaudioprocess = function (e) {
    //   if (!settings.listening) return
    //   // var left = e.inputBuffer.getChannelData(0)
    //   // var right = e.inputBuffer.getChannelData(1);
    //   // analyseStream(new Float32Array(left))
    // }
    lowPassFilter.connect(recorder)// connect the recorder
    recorder.connect(audioContext.destination)

    // highPassFilter settings
    highPassFilter.type = 'highpass'
    highPassFilter.frequency.setValueAtTime(500, audioContext.currentTime)

    lowPassFilter.type = 'lowpass'
    lowPassFilter.frequency.setValueAtTime(2000, audioContext.currentTime)

    analyser.fftSize = 2048
    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    // Get a canvas defined with ID "oscilloscope"
    const canvas = document.getElementById('oscilloscope')
    const canvasCtx = canvas.getContext('2d')

    const analyseStream = (dataArray, settings) => {
      const loudFreq = dataArray.filter(amplitude => {
        return amplitude > settings.treshhold
      })
      if (loudFreq.length > 100) {
        const time = new Date().getTime()
        loudFreqs.count = loudFreqs.count + 1
        loudFreqs.counting = true
        if (loudFreqs.startTime === 0) loudFreqs.startTime = time

        if (settings.recording && loudFreqs.count > settings.loudCountBeforeWarning) handleBark(time, dataArray.sort((a, b) => b - a)[0])
      } else {
        if (loudFreqs.counting) {
          console.log(loudFreqs.count)
          // reset
          loudFreqs.count = 0
          loudFreqs.counting = false
          loudFreqs.startTime = 0
        }
      }
    }

    function draw () {
      analyseStream(dataArray, settings)

      // draw an oscilloscope of the current audio source
      requestAnimationFrame(draw) //eslint-disable-line

      canvasCtx.fillStyle = `rgb(${loudFreqs.count > 0 ? '255, 200, 200' : '245, 245, 245'})`
      canvasCtx.fillRect(0, 0, canvas.width, canvas.height)

      canvasCtx.lineWidth = 2
      canvasCtx.strokeStyle = 'rgb(0, 0, 0)'
      analyser.getByteFrequencyData(dataArray)

      canvasCtx.beginPath()
      canvasCtx.moveTo(0, canvas.height - settings.treshhold / 2)
      canvasCtx.lineTo(canvas.width, canvas.height - settings.treshhold / 2)

      // var sliceWidth = canvas.width * 1.0 / bufferLength

      const barWidth = (canvas.width / bufferLength) * 2.5
      let barHeight = 0
      var x = 0
      dataArray.forEach((buffer, i) => {
        barHeight = buffer
        canvasCtx.fillStyle = 'rgb(' + (barHeight > settings.treshhold ? 250 : 0) + ',50,50)'
        canvasCtx.fillRect(x, canvas.height - barHeight / 2, barWidth, barHeight / 2)

        x += barWidth + 1
      })

      // canvasCtx.lineTo(canvas.width, canvas.height / 2)
      canvasCtx.strokeStyle = 'red'
      canvasCtx.stroke()
    };

    draw()
  })
  .catch(err => {
    /* handle the error */
    console.log(err)
    console.log(`error bitch`)
    document.body.style.backgroundColor = '#881c02'
  })
