import React, { useEffect, useMemo, useRef, useState } from 'react'

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

// small mock holiday dataset (monthIndex -> [{day, label}])
const HOLIDAYS = {
  0: [{ day: 1, label: 'New Year\'s Day' }],
  6: [{ day: 4, label: 'Independence Day' }],
  11: [{ day: 25, label: 'Christmas' }],
  // example: April
  3: [{ day: 14, label: 'Sample Holiday' }]
}

export default function WallCalendar() {
  const heroRef = useRef(null)
  const today = new Date()
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(today))
  const cells = useMemo(() => buildMonthGrid(currentMonth), [currentMonth])

  const [heroSrc, setHeroSrc] = useState(() => localStorage.getItem('hero-image') || HERO_IMAGE)
  const [useImageColor, setUseImageColor] = useState(true)
  const [extractionFailed, setExtractionFailed] = useState(false)

  const [rangeStart, setRangeStart] = useState(null)
  const [rangeEnd, setRangeEnd] = useState(null)
  const [animClass, setAnimClass] = useState('')

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

  // animate flip when month changes
  useEffect(() => {
    setAnimClass('flip')
    const t = setTimeout(() => setAnimClass(''), 600)
    return () => clearTimeout(t)
  }, [currentMonth])

  // extract dominant/average color from hero image and set CSS variable for accent
  useEffect(() => {
    if (!useImageColor || !heroSrc) return
    setExtractionFailed(false)
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = heroSrc
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = Math.min(200, img.width)
        canvas.height = Math.min(200, img.height)
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
        let r = 0, g = 0, b = 0, count = 0
        // sample every Nth pixel for speed
        const step = 6
        for (let i = 0; i < data.length; i += 4 * step) {
          r += data[i]
          g += data[i+1]
          b += data[i+2]
          count++
        }
        if (count === 0) throw new Error('no-pixels')
        r = Math.round(r / count)
        g = Math.round(g / count)
        b = Math.round(b / count)
        const css = `rgb(${r}, ${g}, ${b})`
        document.documentElement.style.setProperty('--accent', css)
        // also set a slightly darker accent for gradients
        const darker = `rgb(${Math.max(0,r-30)}, ${Math.max(0,g-30)}, ${Math.max(0,b-30)})`
        document.documentElement.style.setProperty('--accent-dark', darker)
        setExtractionFailed(false)
      } catch (e) {
        // probably CORS or read error
        setExtractionFailed(true)
      }
    }
    img.onerror = () => setExtractionFailed(true)
  }, [heroSrc, useImageColor])

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

  function onUploadImage(file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      const url = e.target.result
      setHeroSrc(url)
      localStorage.setItem('hero-image', url)
      // attempt extraction will run from effect
    }
    reader.readAsDataURL(file)
  }

  function resetHero() {
    // remove uploaded image from storage and reset theme vars
    localStorage.removeItem('hero-image')
    setHeroSrc(HERO_IMAGE)
    setUseImageColor(true)
    setExtractionFailed(false)
    document.documentElement.style.removeProperty('--accent')
    document.documentElement.style.removeProperty('--accent-dark')
    alert('Reset to default hero image and theme')
  }

  return (
    <div className="calendar-shell">
      <aside className="hero">
        <div className="hero-image" style={{ backgroundImage: `url(${heroSrc})` }} ref={heroRef} />
        <div className="hero-caption">
          <div>
            <div className="year">{currentMonth.getFullYear()}</div>
            <div className="month">{currentMonth.toLocaleString(undefined, { month: 'long' }).toUpperCase()}</div>
          </div>
          <div style={{textAlign:'right'}}>
            <label style={{fontSize:12, opacity:0.9}}>
              <input type="checkbox" checked={useImageColor} onChange={e => setUseImageColor(e.target.checked)} /> Use image theme
            </label>
            <div style={{marginTop:6, display:'flex', gap:8, alignItems:'center'}}>
              <input style={{fontSize:12}} type="file" accept="image/*" onChange={e => e.target.files && onUploadImage(e.target.files[0])} />
              <button onClick={resetHero} style={{fontSize:12, padding:'6px 8px', borderRadius:6, border:'none', cursor:'pointer'}}>Reset</button>
            </div>
            {extractionFailed && <div style={{fontSize:11, color:'rgba(255,255,255,0.9)', marginTop:6}}>Color extraction failed (CORS). Upload an image or host with CORS enabled.</div>}
          </div>
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

          <div className={`grid ${animClass}`}>
            {cells.map((d, i) => {
              const isStart = d && rangeStart && formatKey(d) === formatKey(rangeStart)
              const isEnd = d && rangeEnd && formatKey(d) === formatKey(rangeEnd)
              const inRange = d && isInRange(d)
              const todayClass = d && formatKey(d) === formatKey(new Date())
              const holiday = d && HOLIDAYS[currentMonth.getMonth()] && HOLIDAYS[currentMonth.getMonth()].find(h => h.day === d.getDate())

              return (
                <button
                  key={i}
                  className={['cell', isStart && 'start', isEnd && 'end', inRange && 'mid', todayClass && 'today'].filter(Boolean).join(' ')}
                  onClick={() => onDayClick(d)}
                  disabled={!d}
                >
                  <span className="date-num">{d ? d.getDate() : ''}</span>
                  {holiday && (
                    <span className="holiday-badge" title={holiday.label} aria-hidden>•</span>
                  )}
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
