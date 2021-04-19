import { barks, warnings, chartData, settings } from './lib'
import format from 'date-fns/format'
import Chart from 'chart.js'

export const init = () => {
  // check local storage
  const lsSettings = JSON.parse(localStorage.getItem('settings')) //eslint-disable-line
  if (lsSettings) {
    settings.treshhold = lsSettings.treshhold
    settings.barksBetweenAudio = lsSettings.barksBetweenAudio
  }

  const chart = createChart(chartData.countArray, chartData.timeArray)
  document.querySelectorAll('input').forEach(input => {
    input.value = settings[input.id]
    const label = document.getElementById(`${input.id}Label`)
    if (label) label.innerHTML = `${settings[input.id]}`
  })

  const history = JSON.parse(localStorage.getItem('history')) // eslint-disable-line
  if (history) {
    const string = history.map(item =>
      `<li>${item.date},  duration: ${item.duration}, barks: ${item.totalBarks}</li>`
    ).join('')
    console.log(string)

    document.getElementById('history-list').innerHTML = string
  }
  return chart
}

export const updateUi = (chart) => {
  document.getElementById('total-bark-count').innerHTML = `aantal blafjes: ${barks.length}`
  document.getElementById('total-warning-count').innerHTML = `aantal keer terecht gewezen: ${warnings.length}`
  if (barks[barks.length - 1].time - chartData.start > 250000) document.getElementById('stop-audio').innerHTML = `STOP en OPSLAAN`

  updateChart(chart)
}

export const updateChart = (chart) => {
  const data = buildChartData(barks, chartData)
  chart.data.labels = data.timeArray
  chart.data.datasets.forEach((dataset, i) => {
    if (i === 0) {
      dataset.data = data.countArray
    } else {
      dataset.data = data.colorArray
      dataset.backgroundColor = 'rgba(255, 100, 100, 1)'
    }
  })
  chart.update()

  // setTimeout(() => {
  //   if (settings.recording) updateChart(chart)
  // }, 2000)
}

export const buildChartData = (barks, chartData) => {
  // check if starttime is set
  if (chartData.start === null) {
    if (barks.length > 0) {
      chartData.start = barks[0].time
    } else {
      chartData.start = new Date().getTime()
    }
  }
  // declare vars
  const singlePeriod = 1000 * 60 * settings.chartInterval
  const totalTime = new Date().getTime() - chartData.start
  let time = 0
  const timeArray = []
  const countArray = []
  const colorArray = []

  // count barks per timebar
  const count = (barks, time, singlePeriod, startTime) => {
    return barks.filter((bark) => {
      const barkTime = bark.time - startTime
      return (time <= barkTime && barkTime < time + singlePeriod)
    }).length
  }

  // main loop
  while (time < totalTime) {
    countArray.push(count(barks, time, singlePeriod, chartData.start))

    // const color = count(warnings, time, singlePeriod, chartData.start) > 0 ? 'rgba(255, 100, 100)' : 'rgba(0, 0, 0, 0.2)'
    colorArray.push(count(warnings, time, singlePeriod, chartData.start))

    const currentTime = chartData.start + time
    timeArray.push(format(currentTime, 'H:mm'))
    time = time + singlePeriod
  }
  return {
    countArray,
    timeArray,
    colorArray
  }
}

export const createChart = (countArray, timeArray, colorArray) => {
  const ctx = document.getElementById('myChart')
  const chart = new Chart(ctx, { //eslint-disable-line
    type: 'bar',
    data: {
      labels: timeArray,
      datasets: [{
        label: 'flafjes',
        data: countArray,
        borderColor: 'black',
        borderWidth: 1
      }, {
        label: 'waarschuwingen',
        data: [],
        backgroundColor: 'rgba(255, 100, 100, 0.5)'
      }
      ]
    },
    options: {
      hover: {
        mode: 'none'
      },
      responsive: true,
      maintainAspectRatio: false,

      scales: {
        xAxes: [{
          barPercentage: 1,
          categoryPercentage: 0.9
        }],
        yAxes: [{
          ticks: {
            beginAtZero: true
          }
        }]
      }
    }
  })
  return chart
}
