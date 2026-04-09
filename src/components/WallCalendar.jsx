import React, { useEffect, useMemo, useState } from 'react'

const HERO_IMAGE = 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.0.3&s=8b9e7eef1e0f5b5fc49cc3bdfcd7746f'

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function daysInMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
}

function buildMonthGrid(date) {
  const first = startOfMonth(date)
  const total = daysInMonth(date)
  const startWeekday = first.getDay() // 0 Sun - 6 Sat
  const cells = []

  // Pad leading blanks (we'll show Monday-first visually via CSS transform)
  for (let i = 0; i < startWeekday; i++) cells.push(null)
  for (let d = 1; d <= total; d++) cells.push(new Date(date.getFullYear(), date.getMonth(), d))
  return cells
}

function formatKey(date) {
  return date.toISOString().slice(0, 10)
}

export default function WallCalendar() {
  const today = new Date()
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(today))
  const cells = useMemo(() => buildMonthGrid(currentMonth), [currentMonth])

  const [rangeStart, setRangeStart] = useState(null)
  const [rangeEnd, setRangeEnd] = useState(null)

  const [monthNote, setMonthNote] = useState('')
  const [rangeNote, setRangeNote] = useState('')

  // load saved notes from localStorage
  useEffect(() => {
    const mKey = `month-note:${currentMonth.getFullYear()}-${currentMonth.getMonth()}`
    const saved = localStorage.getItem(mKey)
    if (saved) setMonthNote(saved)
    else setMonthNote('')
    // reset range note
    setRangeNote('')
  }, [currentMonth])

  useEffect(() => {
    if (rangeStart && rangeEnd) {
      const key = `range-note:${formatKey(rangeStart)}|${formatKey(rangeEnd)}`
      const saved = localStorage.getItem(key)
      setRangeNote(saved || '')
    } else {
      setRangeNote('')
    }
  }, [rangeStart, rangeEnd])

  function isInRange(d) {
    if (!d || !rangeStart || !rangeEnd) return false
    return d >= rangeStart && d <= rangeEnd
  }

  function onDayClick(d) {
    if (!d) return
    // click to set start/end
    if (!rangeStart || (rangeStart && rangeEnd)) {
      setRangeStart(d)
      setRangeEnd(null)
      setRangeNote('')
      return
    }
    if (rangeStart && !rangeEnd) {
      if (d < rangeStart) {
        setRangeEnd(rangeStart)
        setRangeStart(d)
      } else {
        setRangeEnd(d)
      }
    }
  }

  function saveMonthNote() {
    const key = `month-note:${currentMonth.getFullYear()}-${currentMonth.getMonth()}`
    localStorage.setItem(key, monthNote)
    alert('Saved month note')
  }

  function saveRangeNote() {
    if (!rangeStart || !rangeEnd) return alert('Select a start and end date first')
    const key = `range-note:${formatKey(rangeStart)}|${formatKey(rangeEnd)}`
    localStorage.setItem(key, rangeNote)
    alert('Saved range note')
  }

  return (
    <div className="calendar-shell">
      <aside className="hero">
        <div className="hero-image" style={{ backgroundImage: `url(${HERO_IMAGE})` }} />
        <div className="hero-caption">
          <div className="year">{currentMonth.getFullYear()}</div>
          <div className="month">{currentMonth.toLocaleString(undefined, { month: 'long' }).toUpperCase()}</div>
        </div>
      </aside>

      <main className="calendar-main">
        <header className="calendar-header">
          <div className="controls">
            <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}>&lt;</button>
            <div className="title">{currentMonth.toLocaleString(undefined, { month: 'long', year: 'numeric' })}</div>
            <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}>&gt;</button>
          </div>
          <div className="legend">
            <div><span className="dot start"/> start</div>
            <div><span className="dot end"/> end</div>
            <div><span className="dot mid"/> selected</div>
          </div>
        </header>

        <section className="grid-wrap">
          <div className="weekday-row">
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(w => <div key={w} className="weekday">{w}</div>)}
          </div>

          <div className="grid">
            {cells.map((d, i) => {
              const isStart = d && rangeStart && formatKey(d) === formatKey(rangeStart)
              const isEnd = d && rangeEnd && formatKey(d) === formatKey(rangeEnd)
              const inRange = d && isInRange(d)
              const todayClass = d && formatKey(d) === formatKey(new Date())

              return (
                <button
                  key={i}
                  className={['cell', isStart && 'start', isEnd && 'end', inRange && 'mid', todayClass && 'today'].filter(Boolean).join(' ')}
                  onClick={() => onDayClick(d)}
                  disabled={!d}
                >
                  <span className="date-num">{d ? d.getDate() : ''}</span>
                </button>
              )
            })}
          </div>
        </section>

        <section className="notes">
          <div className="note-block">
            <h4>Month Notes</h4>
            <textarea value={monthNote} onChange={e => setMonthNote(e.target.value)} placeholder="Add general notes for the month..." />
            <div className="note-actions">
              <button onClick={saveMonthNote}>Save Month Note</button>
            </div>
          </div>

          <div className="note-block">
            <h4>Range Note</h4>
            <textarea value={rangeNote} onChange={e => setRangeNote(e.target.value)} placeholder={rangeStart && rangeEnd ? `Note for ${formatKey(rangeStart)} → ${formatKey(rangeEnd)}` : 'Select a start and end date to attach a note.'} />
            <div className="note-actions">
              <button onClick={saveRangeNote} disabled={!(rangeStart && rangeEnd)}>Save Range Note</button>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
