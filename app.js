const qs = (s, r = document) => r.querySelector(s)
const qsa = (s, r = document) => Array.from(r.querySelectorAll(s))
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d } catch { return d } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)) } catch {} },
  del(k) { try { localStorage.removeItem(k) } catch {} }
}
const uid = () => Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-5)
const defaultChecklistModel = [
  { id: uid(), title: 'Analysis & Testing', items: [
    'Define scope and acceptance criteria',
    'Write test plan and scenarios',
    'Unit and integration coverage',
    'Cross-browser responsive checks',
    'Performance baseline and budgets'
  ].map(t => ({ id: uid(), text: t })) },
  { id: uid(), title: 'Frontend & Backend Best Practices', items: [
    'Accessibility passes with keyboard and screen reader',
    'Error handling and graceful fallbacks',
    'Secure input validation and sanitization',
    'Logging with trace IDs',
    'API contracts versioned'
  ].map(t => ({ id: uid(), text: t })) },
  { id: uid(), title: 'Commit & PR Checklist', items: [
    'Meaningful commit messages',
    'Linked issue or ticket',
    'Lint and typecheck clean',
    'Tests green in CI',
    'Small, reviewable PR scope'
  ].map(t => ({ id: uid(), text: t })) },
  { id: uid(), title: 'Migration', items: [
    'Data migration plan and rollback',
    'Idempotent scripts',
    'Backfill job scheduled',
    'Monitoring and alerting',
    'Post-migration verification'
  ].map(t => ({ id: uid(), text: t })) }
]
const state = {
  checks: store.get('checks', {}),
  sessions: store.get('sessions', []),
  model: store.get('checklistModel', defaultChecklistModel),
  currentPage: 'welcome'
}
if (!store.get('checklistModel')) {
  store.set('checklistModel', state.model)
  store.del('checks')
  state.checks = {}
}
function saveModel() { store.set('checklistModel', state.model) }
function addCategory(title, items) {
  const cat = { id: uid(), title: title.trim(), items: [] }
  items.forEach(t => { if (t.trim()) cat.items.push({ id: uid(), text: t.trim() }) })
  state.model.unshift(cat)
  saveModel()
}
function deleteCategory(id) {
  const cat = state.model.find(c => c.id === id)
  if (!cat) return
  cat.items.forEach(it => { delete state.checks[it.id] })
  state.model = state.model.filter(c => c.id !== id)
  saveModel()
  store.set('checks', state.checks)
}
function addItem(catId, text) {
  const cat = state.model.find(c => c.id === catId)
  if (!cat) return
  cat.items.push({ id: uid(), text: text.trim() })
  saveModel()
}
function deleteItem(catId, itemId) {
  const cat = state.model.find(c => c.id === catId)
  if (!cat) return
  cat.items = cat.items.filter(i => i.id !== itemId)
  delete state.checks[itemId]
  saveModel()
  store.set('checks', state.checks)
}
function renderChecklist() {
  const root = qs('#checklistContent')
  root.innerHTML = ''
  const addCard = document.createElement('div')
  addCard.className = 'card mission'
  const addTitle = document.createElement('h3')
  addTitle.className = 'card-title'
  addTitle.textContent = 'Add Checklist Heading'
  const form = document.createElement('div')
  form.className = 'form'
  const f1 = document.createElement('div')
  f1.className = 'field'
  const l1 = document.createElement('label')
  l1.textContent = 'Heading Title'
  const i1 = document.createElement('input')
  i1.type = 'text'
  i1.id = 'headingTitle'
  i1.placeholder = 'e.g., Release Readiness'
  const f2 = document.createElement('div')
  f2.className = 'field'
  const l2 = document.createElement('label')
  l2.textContent = 'Points (one per line, optional)'
  const i2 = document.createElement('textarea')
  i2.placeholder = 'Write points, each line becomes a checkbox'
  const r = document.createElement('div')
  r.className = 'row'
  const addBtn = document.createElement('button')
  addBtn.className = 'btn primary'
  addBtn.textContent = 'Add Heading'
  addBtn.addEventListener('click', () => {
    const title = i1.value.trim()
    const pts = i2.value.split('\n')
    if (!title) return
    addCategory(title, pts)
    i1.value = ''
    i2.value = ''
    renderChecklist()
  })
  r.appendChild(addBtn)
  form.appendChild(f1); f1.appendChild(l1); f1.appendChild(i1)
  form.appendChild(f2); f2.appendChild(l2); f2.appendChild(i2)
  form.appendChild(r)
  addCard.appendChild(addTitle)
  addCard.appendChild(form)
  root.appendChild(addCard)
  state.model.forEach((cat, ci) => {
    const card = document.createElement('div')
    card.className = 'card mission'
    card.style.animationDelay = (ci * 80) + 'ms'
    const top = document.createElement('div')
    top.className = 'mission-top'
    const badge = document.createElement('div')
    badge.className = 'mission-badge'
    badge.textContent = '🛡'
    const ref = document.createElement('div')
    ref.className = 'mission-ref'
    ref.textContent = 'REF: STARK-' + String(ci + 1).padStart(3, '0')
    top.appendChild(badge)
    top.appendChild(ref)
    const title = document.createElement('h3')
    title.className = 'card-title'
    title.textContent = cat.title
    const actions = document.createElement('div')
    actions.className = 'card-actions'
    const addPointInput = document.createElement('input')
    addPointInput.type = 'text'
    addPointInput.placeholder = 'Add point'
    addPointInput.className = 'field'
    const addPointBtn = document.createElement('button')
    addPointBtn.className = 'btn xs ghost'
    addPointBtn.textContent = 'Add Point'
    addPointBtn.addEventListener('click', () => {
      const v = addPointInput.value.trim()
      if (!v) return
      addItem(cat.id, v)
      addPointInput.value = ''
      renderChecklist()
    })
    const delCatBtn = document.createElement('button')
    delCatBtn.className = 'btn xs danger'
    delCatBtn.textContent = 'Delete Heading'
    delCatBtn.addEventListener('click', () => {
      deleteCategory(cat.id)
      renderChecklist()
    })
    actions.appendChild(addPointInput)
    actions.appendChild(addPointBtn)
    actions.appendChild(delCatBtn)
    const list = document.createElement('div')
    list.className = 'list'
    cat.items.forEach((it, ii) => {
      const wrap = document.createElement('div')
      wrap.className = 'item'
      const input = document.createElement('input')
      input.type = 'checkbox'
      input.id = it.id
      input.checked = !!state.checks[it.id]
      const label = document.createElement('label')
      label.htmlFor = it.id
      label.textContent = it.text
      const remove = document.createElement('button')
      remove.className = 'remove btn xs'
      remove.textContent = '✕'
      remove.addEventListener('click', () => {
        deleteItem(cat.id, it.id)
        renderChecklist()
      })
      input.addEventListener('change', () => {
        state.checks[it.id] = input.checked
        store.set('checks', state.checks)
        updateCompletion()
        sparkle(wrap)
      })
      wrap.appendChild(input)
      wrap.appendChild(label)
      wrap.appendChild(remove)
      list.appendChild(wrap)
    })
    card.appendChild(top)
    card.appendChild(title)
    card.appendChild(actions)
    card.appendChild(list)
    root.appendChild(card)
  })
  updateCompletion()
}
function resetAll() {
  state.checks = {}
  store.del('checks')
  renderChecklist()
  hideSuccess()
}
function refreshApp() {
  state.checks = {}
  store.del('checks')
  location.reload()
}
function updateCompletion() {
  const total = state.model.reduce((a, c) => a + c.items.length, 0)
  const done = Object.values(state.checks).filter(Boolean).length
  if (done === total && total > 0) showSuccess()
  else hideSuccess()
}
function showSuccess() {
  qs('#successBanner').classList.remove('hidden')
  confetti()
}
function hideSuccess() {
  qs('#successBanner').classList.add('hidden')
}
function confetti() {
  const root = qs('#confetti')
  for (let i = 0; i < 60; i++) {
    const p = document.createElement('div')
    const s = Math.random() * 8 + 4
    const x = Math.random() * 100
    const d = Math.random() * 1200 + 800
    const r = ['#6ef3ff','#4aa9ff','#ff5eb1','#70ffcc','#ff886b'][Math.floor(Math.random()*5)]
    p.style.position = 'fixed'
    p.style.left = x + 'vw'
    p.style.top = '-10px'
    p.style.width = s + 'px'
    p.style.height = s*0.6 + 'px'
    p.style.background = r
    p.style.opacity = '0.8'
    p.style.transform = 'rotate(' + (Math.random()*360) + 'deg)'
    p.style.borderRadius = '2px'
    p.style.boxShadow = '0 6px 12px rgba(0,0,0,0.35)'
    root.appendChild(p)
    const start = performance.now()
    const spin = Math.random()*2+1
    function step(t) {
      const dt = t - start
      const y = dt / d * (window.innerHeight + 40)
      const sway = Math.sin(dt/180 + i) * 20
      p.style.transform = 'translate('+(sway)+'px,'+y+'px) rotate('+(dt*spin)+'deg)'
      if (dt < d) requestAnimationFrame(step)
      else root.removeChild(p)
    }
    requestAnimationFrame(step)
  }
}
function sparkle(el) {
  const s = document.createElement('div')
  s.className = 'spark'
  el.appendChild(s)
  setTimeout(() => { if (s.parentNode) s.parentNode.removeChild(s) }, 700)
}
function switchTab(tab) {
  qsa('.tab').forEach(b => b.classList.toggle('active', b.dataset.tab === tab))
  qsa('.panel').forEach(p => p.classList.toggle('active', p.id === tab))
}
function updateHeaderVisibility() {
  const btn = qs('#newChecklistBtn')
  const show = state.currentPage === 'checklist' || state.currentPage === 'checklistTopics'
  if (btn) btn.style.display = show ? '' : 'none'
}
function goto(panel) {
  state.currentPage = panel
  qsa('.panel').forEach(p => p.classList.toggle('active', p.id === panel))
  updateHeaderVisibility()
}
function renderTopics() {
  const grid = qs('#topicsGrid')
  grid.innerHTML = ''
  state.model.forEach((cat, i) => {
    const card = document.createElement('div')
    card.className = 'card mission'
    card.style.animationDelay = (i * 60) + 'ms'
    const top = document.createElement('div')
    top.className = 'mission-top'
    const badge = document.createElement('div')
    badge.className = 'mission-badge'
    badge.textContent = '🛡'
    const ref = document.createElement('div')
    ref.className = 'mission-ref'
    ref.textContent = 'REF: STARK-' + String(i + 1).padStart(3, '0')
    const title = document.createElement('h3')
    title.className = 'card-title'
    title.textContent = cat.title
    const actions = document.createElement('div')
    actions.className = 'card-actions'
    const open = document.createElement('button')
    open.className = 'btn primary'
    open.textContent = 'Open'
    open.addEventListener('click', () => {
      state.currentCat = cat.id
      goto('checklist')
      renderChecklistDetail(cat.id)
    })
    actions.appendChild(open)
    top.appendChild(badge); top.appendChild(ref)
    card.appendChild(top)
    card.appendChild(title)
    card.appendChild(actions)
    grid.appendChild(card)
  })
}
function renderChecklistDetail(catId) {
  const cat = state.model.find(c => c.id === catId)
  if (!cat) return
  const root = qs('#checklistContent')
  root.innerHTML = ''
  const card = document.createElement('div')
  card.className = 'card mission'
  const header = document.createElement('div')
  header.className = 'mission-top'
  const badge = document.createElement('div')
  badge.className = 'mission-badge'
  badge.textContent = '⚡'
  const status = document.createElement('div')
  status.className = 'status-row'
  const total = cat.items.length || 1
  const done = cat.items.filter(i => state.checks[i.id]).length
  const pct = Math.floor(done / total * 100)
  status.innerHTML = '<span id="detailStatusText">Operational Status: '+pct+'%</span>'
  const prog = document.createElement('div')
  prog.className = 'progress'
  const bar = document.createElement('div')
  bar.className = 'progress-bar'
  bar.style.width = pct + '%'
  bar.id = 'detailProgressBar'
  prog.appendChild(bar)
  status.appendChild(prog)
  header.appendChild(badge)
  header.appendChild(status)
  const title = document.createElement('h3')
  title.className = 'card-title'
  title.textContent = cat.title
  const sub = document.createElement('div')
  sub.className = 'muted'
  sub.textContent = 'Essential checks for a robust ' + cat.title.toLowerCase() + '.'
  const actionsTop = document.createElement('div')
  actionsTop.className = 'card-actions'
  const delCatBtn = document.createElement('button')
  delCatBtn.className = 'btn danger'
  delCatBtn.textContent = 'Delete Checklist'
  delCatBtn.addEventListener('click', () => {
    const ok = confirm('Delete checklist "'+cat.title+'"?')
    if (!ok) return
    deleteCategory(cat.id)
    goto('checklistTopics')
    renderTopics()
  })
  const list = document.createElement('div')
  list.className = 'list'
  cat.items.forEach(it => {
    const wrap = document.createElement('div')
    wrap.className = 'item'
    const input = document.createElement('input')
    input.type = 'checkbox'
    input.id = it.id
    input.checked = !!state.checks[it.id]
    const label = document.createElement('label')
    label.htmlFor = it.id
    label.textContent = it.text
    const remove = document.createElement('button')
    remove.className = 'remove btn xs'
    remove.textContent = '✕'
    remove.addEventListener('click', () => {
      deleteItem(cat.id, it.id)
      renderChecklistDetail(cat.id)
    })
    input.addEventListener('change', () => {
      state.checks[it.id] = input.checked
      store.set('checks', state.checks)
      updateCompletion()
      sparkle(wrap)
      updateDetailProgress(cat.id)
    })
    wrap.appendChild(input)
    wrap.appendChild(label)
    wrap.appendChild(remove)
    list.appendChild(wrap)
  })
  const deployRow = document.createElement('div')
  deployRow.className = 'deploy-row'
  const addInput = document.createElement('input')
  addInput.type = 'text'
  addInput.className = 'deploy-input'
  addInput.placeholder = 'Enter mission objective…'
  const addBtn = document.createElement('button')
  addBtn.className = 'btn cta'
  addBtn.textContent = 'Deploy'
  addBtn.addEventListener('click', () => {
    const v = addInput.value.trim()
    if (!v) return
    addItem(cat.id, v)
    addInput.value = ''
    renderChecklistDetail(cat.id)
  })
  deployRow.appendChild(addInput)
  deployRow.appendChild(addBtn)
  card.appendChild(header)
  card.appendChild(title)
  card.appendChild(sub)
  actionsTop.appendChild(delCatBtn)
  card.appendChild(actionsTop)
  card.appendChild(list)
  card.appendChild(deployRow)
  root.appendChild(card)
  updateCompletion()
}
function updateDetailProgress(catId) {
  const cat = state.model.find(c => c.id === catId)
  if (!cat) return
  const total = cat.items.length || 1
  const done = cat.items.filter(i => state.checks[i.id]).length
  const pct = Math.floor(done / total * 100)
  const bar = qs('#detailProgressBar')
  const txt = qs('#detailStatusText')
  if (bar) bar.style.width = pct + '%'
  if (txt) txt.textContent = 'Operational Status: ' + pct + '%'
}
function renderSessions() {
  const list = qs('#ktList')
  list.innerHTML = ''
  state.sessions.forEach((s, i) => {
    const card = document.createElement('div')
    card.className = 'card kt-card'
    card.style.animationDelay = (i * 60) + 'ms'
    const title = document.createElement('div')
    title.className = 'card-title'
    title.textContent = s.topic
    const meta = document.createElement('div')
    meta.className = 'kt-meta'
    const dt = new Date(s.date + 'T' + s.time)
    meta.textContent = dt.toLocaleString()
    const desc = document.createElement('div')
    desc.className = 'muted'
    desc.textContent = s.description
    const actions = document.createElement('div')
    actions.className = 'kt-actions'
    const open = document.createElement('a')
    open.className = 'btn primary'
    open.textContent = 'Open URL'
    open.target = '_blank'
    open.rel = 'noopener noreferrer'
    open.href = s.url || '#'
    const edit = document.createElement('button')
    edit.className = 'btn ghost'
    edit.textContent = 'Edit'
    edit.addEventListener('click', () => editSession(i))
    const del = document.createElement('button')
    del.className = 'btn danger'
    del.textContent = 'Delete'
    del.addEventListener('click', () => deleteSession(i))
    actions.appendChild(open)
    actions.appendChild(edit)
    actions.appendChild(del)
    const trans = document.createElement('div')
    trans.className = 'muted'
    trans.textContent = s.transcript ? s.transcript.slice(0, 260) + (s.transcript.length > 260 ? '…' : '') : ''
    card.appendChild(title)
    card.appendChild(meta)
    card.appendChild(desc)
    card.appendChild(actions)
    if (s.transcript) card.appendChild(trans)
    list.appendChild(card)
  })
}
function editSession(i) {
  const s = state.sessions[i]
  qs('#ktTopic').value = s.topic
  qs('#ktDescription').value = s.description
  qs('#ktDate').value = s.date
  qs('#ktTime').value = s.time
  qs('#ktUrl').value = s.url || ''
  qs('#ktTranscript').value = s.transcript || ''
  qs('#ktForm').dataset.edit = String(i)
  switchTab('kt')
}
function deleteSession(i) {
  const s = state.sessions[i]
  const ok = confirm('Delete this session: ' + (s.topic || 'Untitled') + '?')
  if (!ok) return
  state.sessions.splice(i, 1)
  store.set('sessions', state.sessions)
  if (qs('#ktForm').dataset.edit === String(i)) {
    qs('#ktForm').dataset.edit = ''
    qs('#ktForm').reset()
  }
  renderSessions()
}
function handleKtSubmit(e) {
  e.preventDefault()
  const topic = qs('#ktTopic').value.trim()
  const description = qs('#ktDescription').value.trim()
  const date = qs('#ktDate').value
  const time = qs('#ktTime').value
  const url = qs('#ktUrl').value.trim()
  const transcript = qs('#ktTranscript').value.trim()
  if (!topic || !description || !date || !time) return
  const payload = { topic, description, date, time, url, transcript }
  const idx = qs('#ktForm').dataset.edit
  if (idx !== undefined && idx !== '') {
    state.sessions[Number(idx)] = payload
    qs('#ktForm').dataset.edit = ''
  } else {
    state.sessions.unshift(payload)
  }
  store.set('sessions', state.sessions)
  renderSessions()
  qs('#ktForm').reset()
}
function clearForm() {
  qs('#ktForm').reset()
  qs('#ktForm').dataset.edit = ''
}
function toggleTheme() {
  const t = document.documentElement.getAttribute('data-theme') === 'light' ? '' : 'light'
  if (t) document.documentElement.setAttribute('data-theme', t)
  else document.documentElement.removeAttribute('data-theme')
}
function parallax(e) {
  const x = (e.clientX / window.innerWidth - 0.5) * 40
  const y = (e.clientY / window.innerHeight - 0.5) * 40
  document.documentElement.style.setProperty('--parallaxX', x.toFixed(2))
  document.documentElement.style.setProperty('--parallaxY', y.toFixed(2))
}
function init() {
  renderTopics()
  renderSessions()
  qsa('.tab').forEach(b => b.addEventListener('click', () => switchTab(b.dataset.tab)))
  qs('#resetAll').addEventListener('click', refreshApp)
  qs('#themeToggle').addEventListener('click', toggleTheme)
  qs('#ktForm').addEventListener('submit', handleKtSubmit)
  qs('#clearForm').addEventListener('click', clearForm)
  window.addEventListener('pointermove', parallax)
  const newBtn = qs('#newChecklistBtn')
  if (newBtn) newBtn.addEventListener('click', () => {
    qs('#newChecklistModal').showModal()
    qs('#newCheckTitle').focus()
  })
  const saveCheck = qs('#saveCheckModal')
  if (saveCheck) saveCheck.addEventListener('click', () => {
    const t = qs('#newCheckTitle').value.trim()
    const p = qs('#newCheckPoints').value.split('\n')
    if (!t) return
    addCategory(t, p)
    qs('#newCheckTitle').value = ''
    qs('#newCheckPoints').value = ''
    qs('#newChecklistModal').close()
    if (state.currentPage === 'checklistTopics') renderTopics()
    else if (state.currentPage === 'checklistDetail') goto('checklistTopics')
  })
  const cancelCheck = qs('#cancelCheckModal')
  if (cancelCheck) cancelCheck.addEventListener('click', () => {
    qs('#newChecklistModal').close()
  })
  // Routing buttons
  qsa('[data-goto]').forEach(b => b.addEventListener('click', () => {
    goto(b.getAttribute('data-goto'))
    if (b.getAttribute('data-goto') === 'checklistTopics') renderTopics()
  }))
  goto('welcome')
  updateHeaderVisibility()
}
document.addEventListener('DOMContentLoaded', init)
