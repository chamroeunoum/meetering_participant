<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { ChevronLeft, ChevronRight, Download, FileText, Maximize2, MessageSquare, Send, X } from 'lucide-vue-next'
import VuePdfEmbed from 'vue-pdf-embed'
import 'vue-pdf-embed/dist/styles/textLayer.css'
import { useMeetingWorkspaceStore } from '@/stores/meetingWorkspace'
import type { HighlightRect } from '@/stores/meetingWorkspace'

const SAMPLE_PDF = 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf'

const props = withDefaults(
  defineProps<{
    mode?: 'embedded' | 'page'
    pdfUrl?: string
    docxUrl?: string
    editable?: boolean
    title?: string
    version?: number | string
    status?: string
    regulator?: string
    meetingId: string
    startWithSidebar?: boolean
  }>(),
  {
    mode: 'embedded',
    pdfUrl: '',
    docxUrl: '',
    editable: true,
    title: 'សេចក្តីព្រាង',
    version: '',
    status: '',
    regulator: '',
    startWithSidebar: false,
  },
)

const workspace = useMeetingWorkspaceStore()
const ws = computed(() => workspace.getWorkspace(props.meetingId))

// Some PDF exporters lay out each Khmer glyph cluster (base consonant +
// subscript/vowel signs) as its own positioned text-show operation, which
// pdf.js's text layer turns into extra spans and pdf.js/the browser then
// read back as stray single spaces between them. Khmer prose has no spaces
// between words, so a lone space sandwiched between two Khmer characters is
// almost always this artifact rather than an intended word break — collapse
// those, but leave real spacing (e.g. around Latin/number runs) untouched.
function cleanKhmerSpacing(text: string): string {
  return text.replace(/([ក-៿])[ \t]+(?=[ក-៿])/g, '$1')
}

function getOrderedSelectionText(range: Range, textLayer: Element | null): string {
  if (!textLayer) return cleanKhmerSpacing((range.toString() || '').replace(/\s+/g, ' ').trim())
  const spans = Array.from(textLayer.querySelectorAll('span')).filter((span) => {
    if (!span.textContent) return false
    try {
      return range.intersectsNode(span)
    } catch {
      return false
    }
  })
  if (!spans.length) return cleanKhmerSpacing((range.toString() || '').replace(/\s+/g, ' ').trim())
  spans.sort((a, b) => {
    const ra = a.getBoundingClientRect()
    const rb = b.getBoundingClientRect()
    if (Math.abs(ra.top - rb.top) > 4) return ra.top - rb.top
    return ra.left - rb.left
  })
  const browserText = (range.toString() || '').replace(/\s+/g, ' ').trim()
  const orderedText = spans.map((s) => s.textContent || '').join('').replace(/\s+/g, ' ').trim()
  const best = browserText && orderedText.includes(browserText) ? browserText : orderedText && browserText.includes(orderedText) ? orderedText : browserText || orderedText
  return cleanKhmerSpacing(best)
}

function getRelativeRects(range: Range, wrapEl: HTMLElement): HighlightRect[] {
  const wrapRect = wrapEl.getBoundingClientRect()
  if (!wrapRect.width || !wrapRect.height) return []
  return Array.from(range.getClientRects())
    .filter((r) => r.width > 1 && r.height > 1)
    .map((r) => ({
      x: ((r.left - wrapRect.left) / wrapRect.width) * 100,
      y: ((r.top - wrapRect.top) / wrapRect.height) * 100,
      w: (r.width / wrapRect.width) * 100,
      h: (r.height / wrapRect.height) * 100,
    }))
}

const pdfPane = ref<HTMLElement | null>(null)
const pdfHost = ref<HTMLElement | null>(null)
const pageWrap = ref<HTMLElement | null>(null)
const commentInput = ref<HTMLTextAreaElement | null>(null)

const fileTab = ref<'pdf' | 'docx'>('pdf')
const showComments = ref(props.mode === 'page' || props.startWithSidebar)
const sidebarTab = ref<'comment' | 'notes'>('comment')
const isFullscreen = ref(false)
const currentPage = ref(1)
const totalPages = ref(0)
const selectedCommentId = ref<string | null>(null)
const pdfWidth = ref(0)
const commentDraftText = ref('')
const noteDraftText = ref('')
const openThreadId = ref<string | null>(null)
const replyDraftText = ref('')
const pendingScrollCommentId = ref<string | null>(null)
let resizeObserver: ResizeObserver | null = null

const addCommentTip = reactive({ visible: false, x: 0, y: 0 })
const selectionDraft = reactive<{ text: string; page_number: number; rects: HighlightRect[] }>({ text: '', page_number: 1, rects: [] })
const pendingQuote = ref<{ text: string; page_number: number; rects: HighlightRect[] } | null>(null)

const activeVersion = computed(() => {
  if (ws.value.draftVersions.length) {
    return ws.value.draftVersions.find((v) => v.id === ws.value.selectedDraftVersionId) || ws.value.draftVersions[0]!
  }
  return { id: '', version_number: Number(props.version) || 1, status: props.status || '', message: '', actor: '', created_at: '', pdf_url: '' }
})
const isLatestVersion = computed(() => !ws.value.draftVersions.length || activeVersion.value.id === ws.value.draftVersions[0]!.id)
const effectiveEditable = computed(() => props.editable && isLatestVersion.value)
// A dedicated route (mode="page") is already "full screen" by nature, so it
// shares the exact same fixed, full-viewport chrome as the embedded
// fullscreen toggle instead of maintaining a second, slimmer header.
const isFullView = computed(() => props.mode === 'page' || isFullscreen.value)

const lockBanner = computed(() => {
  if (!isLatestVersion.value) {
    return {
      text: `អ្នកកំពុងមើលកំណែ v${activeVersion.value.version_number} — សូមត្រឡប់ទៅកំណែបច្ចុប្បន្នដើម្បីបន្ថែមមតិ។`,
      showLatestBtn: true,
    }
  }
  if (!props.editable) {
    return { text: 'មិនអាចបន្ថែមមតិបានទេនៅពេលនេះ — អាចមើលបានតែប៉ុណ្ណោះ។', showLatestBtn: false }
  }
  return null
})

const pdfSource = computed(() => {
  const versionUrl = (activeVersion.value.pdf_url || '').trim()
  if (versionUrl && versionUrl !== '#') return versionUrl
  const url = (props.pdfUrl || '').trim()
  if (!url || url === '#') return SAMPLE_PDF
  return url
})

const openThread = computed(() => ws.value.comments.find((c) => c.id === openThreadId.value) || null)
const pageComments = computed(() => ws.value.comments.filter((c) => c.page_number === currentPage.value))
const pendingHighlightRects = computed(() => {
  if (!pendingQuote.value || pendingQuote.value.page_number !== currentPage.value) return []
  return pendingQuote.value.rects
})
// Only the comment the user actually pressed gets a highlight drawn — no
// standing highlights for every comment on the page.
const activeHighlightRects = computed(() => {
  const c = ws.value.comments.find((c) => c.id === selectedCommentId.value)
  if (!c || c.page_number !== currentPage.value) return []
  return c.rects || []
})

const STATUS_LABELS: Record<string, string> = { new: 'ថ្មី', progressing: 'កំពុងដំណើរការ', finished: 'បញ្ចប់', final: 'ចុងក្រោយ' }
const statusLabel = computed(() => STATUS_LABELS[activeVersion.value.status] || activeVersion.value.status || '')

function updatePdfWidth() {
  const el = pdfHost.value || pdfPane.value
  if (!el) return
  const w = Math.floor(el.clientWidth - 8)
  if (w > 100 && w !== pdfWidth.value) pdfWidth.value = w
}

function onPdfLoaded(pdf: { numPages?: number }) {
  totalPages.value = pdf?.numPages || 0
  nextTick(updatePdfWidth)
}
function onPdfRendered() {
  pageWrap.value?.querySelector('.textLayer')?.classList.add('pdf-text-selectable')
  if (pendingScrollCommentId.value) {
    scrollActiveHighlightIntoView()
    pendingScrollCommentId.value = null
  }
}

function scrollActiveHighlightIntoView() {
  nextTick(() => {
    const el = pageWrap.value?.querySelector('.highlight-active') as HTMLElement | null
    el?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' })
  })
}
function onPdfError(err: unknown) {
  console.error(err)
}

function toggleComments() {
  showComments.value = !showComments.value
  if (showComments.value) sidebarTab.value = 'comment'
  nextTick(updatePdfWidth)
}

function enterFullscreen() {
  isFullscreen.value = true
  showComments.value = true
  document.body.style.overflow = 'hidden'
  nextTick(updatePdfWidth)
}
function exitFullscreen() {
  isFullscreen.value = false
  document.body.style.overflow = ''
  nextTick(updatePdfWidth)
}

function downloadFile() {
  const url = fileTab.value === 'docx' ? props.docxUrl : props.pdfUrl
  if (url && url !== '#') window.open(url, '_blank')
}

// Clears the active highlight for any click anywhere outside the PDF pane
// (which has its own drag-vs-click handling in onTextSelect) — this has to be
// a document-level listener, not one scoped to this component's root element,
// because clicks on the meeting header/other tabs/outside this widget entirely
// never bubble through an element they aren't inside of. A click on another
// comment's list row still ends up correctly selected: mousedown fires and
// clears first, then the row's own click handler runs and sets the new id.
function onDocumentMouseDown(e: MouseEvent) {
  if (!selectedCommentId.value) return
  const target = e.target as Element | null
  if (!target) return
  if (pdfPane.value?.contains(target)) return
  selectedCommentId.value = null
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    if (addCommentTip.visible) dismissTip()
    else if (pendingQuote.value) clearPendingQuote()
    else if (isFullscreen.value) exitFullscreen()
  }
}

function onTextSelect() {
  if (fileTab.value !== 'pdf') return
  const sel = window.getSelection()
  if (!sel || sel.isCollapsed || !sel.rangeCount) {
    // A plain click (no drag-selection) anywhere in the PDF clears the active highlight.
    selectedCommentId.value = null
    return
  }
  const wrap = pageWrap.value
  if (!wrap) return
  const anchor = sel.anchorNode
  if (!anchor || !wrap.contains(anchor)) return
  const range = sel.getRangeAt(0)
  const text = getOrderedSelectionText(range, wrap.querySelector('.textLayer'))
  if (!text) return
  const rects = getRelativeRects(range, wrap)
  if (!rects.length) return
  const last = range.getBoundingClientRect()
  const tipWidth = 140
  let x = last.left + last.width / 2 - tipWidth / 2
  let y = last.bottom + 8
  x = Math.min(Math.max(x, 8), window.innerWidth - tipWidth - 8)
  if (y + 44 > window.innerHeight) y = Math.max(last.top - 44, 8)
  selectionDraft.text = text
  selectionDraft.page_number = currentPage.value
  selectionDraft.rects = rects
  addCommentTip.visible = true
  addCommentTip.x = x
  addCommentTip.y = y
}

function dismissTip() {
  addCommentTip.visible = false
  window.getSelection()?.removeAllRanges()
}

function startCommentFromSelection() {
  if (!selectionDraft.text) return
  pendingQuote.value = { text: selectionDraft.text, page_number: selectionDraft.page_number, rects: [...selectionDraft.rects] }
  addCommentTip.visible = false
  showComments.value = true
  sidebarTab.value = 'comment'
  selectedCommentId.value = null
  openThreadId.value = null
  window.getSelection()?.removeAllRanges()
  nextTick(() => setTimeout(() => commentInput.value?.focus?.(), 50))
}

function clearPendingQuote() {
  pendingQuote.value = null
}

function handleCommentEnter(e: KeyboardEvent) {
  if (e.shiftKey) return
  e.preventDefault()
  submitComment()
}
function handleNoteEnter(e: KeyboardEvent) {
  if (e.shiftKey) return
  e.preventDefault()
  submitNote()
}

function submitComment() {
  if (!effectiveEditable.value) return
  const text = commentDraftText.value.trim()
  if (!text) return
  const quote = pendingQuote.value
  const id = workspace.addComment(props.meetingId, {
    page_number: quote ? quote.page_number : currentPage.value,
    selected_text: quote ? quote.text : '',
    rects: quote ? [...quote.rects] : [],
    text,
  })
  selectedCommentId.value = id
  commentDraftText.value = ''
  pendingQuote.value = null
}

function focusComment(c: { id: string; page_number: number }) {
  selectedCommentId.value = c.id
  fileTab.value = 'pdf'
  if (c.page_number && c.page_number !== currentPage.value) {
    currentPage.value = c.page_number
    pendingScrollCommentId.value = c.id
  } else {
    scrollActiveHighlightIntoView()
  }
}

function removeComment(id: string) {
  workspace.removeComment(props.meetingId, id)
  if (selectedCommentId.value === id) selectedCommentId.value = null
  if (openThreadId.value === id) openThreadId.value = null
}

function openCommentThread(c: { id: string; page_number: number }) {
  focusComment(c)
  openThreadId.value = c.id
  replyDraftText.value = ''
}

function closeThread() {
  openThreadId.value = null
  replyDraftText.value = ''
}

function submitReply(c: { id: string }) {
  if (!effectiveEditable.value) return
  const text = replyDraftText.value.trim()
  if (!text) return
  workspace.addReply(props.meetingId, c.id, text)
  replyDraftText.value = ''
}

function handleReplyEnter(e: KeyboardEvent, c: { id: string }) {
  if (e.shiftKey) return
  e.preventDefault()
  submitReply(c)
}

function submitNote() {
  if (!effectiveEditable.value) return
  const text = noteDraftText.value.trim()
  if (!text) return
  workspace.addNote(props.meetingId, text)
  noteDraftText.value = ''
}
function deleteNote(id: string) {
  workspace.removeNote(props.meetingId, id)
}

function selectVersion(v: { id: string }) {
  workspace.selectDraftVersion(props.meetingId, v.id)
  fileTab.value = 'pdf'
  currentPage.value = 1
  dismissTip()
  pendingQuote.value = null
}
function goToLatestVersion() {
  const latest = ws.value.draftVersions[0]
  if (latest) selectVersion(latest)
}

watch(
  () => props.pdfUrl,
  () => {
    currentPage.value = 1
    dismissTip()
    clearPendingQuote()
  },
)

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
  document.addEventListener('mousedown', onDocumentMouseDown)
  nextTick(() => {
    updatePdfWidth()
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => updatePdfWidth())
      if (pdfPane.value) resizeObserver.observe(pdfPane.value)
      if (pdfHost.value) resizeObserver.observe(pdfHost.value)
    }
  })
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
  document.removeEventListener('mousedown', onDocumentMouseDown)
  document.body.style.overflow = ''
  resizeObserver?.disconnect()
})
</script>

<template>
  <div class="draft-pdf-section">
    <div class="draft-viewer-frame" :class="{ 'is-fixed': isFullView }">
      <!-- Header: the single toolbar shared by embedded, fullscreen, and page mode -->
      <div class="draft-header">
        <div class="header-row">
          <div class="header-left">
            <router-link v-if="mode === 'page'" :to="{ name: 'meeting-viewer' }" class="back-link">
              <ChevronLeft :size="20" :stroke-width="2.2" />
            </router-link>
            <button v-else-if="isFullscreen" type="button" class="back-link" @click="exitFullscreen">
              <X :size="20" :stroke-width="2.2" />
            </button>
            <div class="file-icon"><FileText :size="20" :stroke-width="2" /></div>
            <div class="header-meta">
              <h2 class="header-title">{{ title || 'សេចក្តីព្រាង' }}</h2>
              <div class="header-tags">
                <span v-if="statusLabel" class="tag">{{ statusLabel }}</span>
                <span class="text-muted">v{{ activeVersion.version_number }}</span>
                <span v-if="regulator" class="text-muted">{{ regulator }}</span>
              </div>
            </div>
          </div>
          <div class="header-actions">
            <div class="btn-group">
              <button type="button" class="btn-group-item" :class="{ active: fileTab === 'pdf' }" @click="fileTab = 'pdf'">PDF</button>
              <button type="button" class="btn-group-item" :class="{ active: fileTab === 'docx' }" @click="fileTab = 'docx'">DOCX</button>
            </div>
            <button class="btn btn-secondary btn-sm" type="button" @click="downloadFile">
              <Download :size="14" :stroke-width="2.4" />
              ទាញយក
            </button>
            <button class="btn btn-secondary btn-sm" type="button" :class="{ active: showComments }" @click="toggleComments">
              <MessageSquare :size="14" :stroke-width="2.4" />
              មតិ ({{ ws.comments.length }})
            </button>
            <button v-if="mode !== 'page' && !isFullscreen" class="btn btn-secondary btn-sm" type="button" @click="enterFullscreen">
              <Maximize2 :size="14" :stroke-width="2.4" />
              ពេញអេក្រង់
            </button>
          </div>
        </div>

        <div v-if="lockBanner" class="lock-banner">
          <span>{{ lockBanner.text }}</span>
          <button v-if="lockBanner.showLatestBtn" class="btn btn-secondary btn-sm" type="button" @click="goToLatestVersion">ត្រឡប់ទៅកំណែបច្ចុប្បន្ន</button>
        </div>
      </div>

      <!-- Viewer shell -->
      <div class="draft-pdf-shell">
        <div class="shell-body">
        <div ref="pdfPane" class="pdf-pane" @mouseup="onTextSelect">
          <div v-if="fileTab === 'docx'" class="pdf-empty-wrap">
            <div class="empty-block">
              <FileText :size="40" :stroke-width="1.6" />
              <span>ឯកសារប្រភេទ DOCX មិនអាចបង្ហាញដោយផ្ទាល់បានទេ</span>
              <button class="btn btn-primary btn-sm" type="button" @click="downloadFile">ទាញយកឯកសារ DOCX</button>
            </div>
          </div>

          <template v-else>
            <div class="pdf-page-bar">
              <div class="pdf-page-nav">
                <button type="button" class="icon-btn" :disabled="currentPage <= 1" @click="currentPage--"><ChevronLeft :size="16" :stroke-width="2.4" /></button>
                <span>ទំព័រ {{ currentPage }} / {{ totalPages || '—' }}</span>
                <button type="button" class="icon-btn" :disabled="currentPage >= totalPages" @click="currentPage++"><ChevronRight :size="16" :stroke-width="2.4" /></button>
              </div>
              <span class="text-muted">{{ pageComments.length }} មតិនៅទំព័រនេះ</span>
            </div>

            <div v-if="!pdfSource" class="pdf-empty-wrap">
              <div class="empty-block"><FileText :size="40" :stroke-width="1.6" /><span>មិនមានឯកសារ PDF</span></div>
            </div>

            <div v-else ref="pdfHost" class="pdf-host">
              <div ref="pageWrap" class="page-wrap">
                <VuePdfEmbed
                  text-layer
                  :source="pdfSource"
                  :page="currentPage"
                  :width="pdfWidth || undefined"
                  class="pdf-embed"
                  @loaded="onPdfLoaded"
                  @rendered="onPdfRendered"
                  @rendering-failed="onPdfError"
                />
                <div class="highlight-layer">
                  <div
                    v-for="(r, ri) in pendingHighlightRects"
                    :key="'pending-' + ri"
                    class="highlight-box highlight-pending"
                    :style="{ left: r.x + '%', top: r.y + '%', width: r.w + '%', height: r.h + '%' }"
                  />
                  <div
                    v-for="(r, ri) in activeHighlightRects"
                    :key="'active-' + ri"
                    class="highlight-box highlight-active"
                    :style="{ left: r.x + '%', top: r.y + '%', width: r.w + '%', height: r.h + '%' }"
                  />
                </div>
              </div>
            </div>
          </template>
        </div>

        <Teleport to="body">
          <div
            v-if="addCommentTip.visible && fileTab === 'pdf'"
            class="selection-tip"
            :style="{ left: addCommentTip.x + 'px', top: addCommentTip.y + 'px' }"
            @mousedown.stop
          >
            <button type="button" class="selection-tip-btn" @click="startCommentFromSelection">Add Comment</button>
            <button type="button" class="selection-tip-btn selection-tip-close" @click="dismissTip">✕</button>
          </div>
        </Teleport>

        <!-- Right sidebar -->
        <aside v-if="showComments" class="draft-sidebar" :class="{ 'sidebar-full': isFullView }">
          <div class="sidebar-tabs-bar">
            <button type="button" class="sidebar-tab" :class="{ active: sidebarTab === 'comment' }" @click="sidebarTab = 'comment'">មតិ ({{ ws.comments.length }})</button>
            <button type="button" class="sidebar-tab" :class="{ active: sidebarTab === 'notes' }" @click="sidebarTab = 'notes'">កំណត់ ({{ ws.notes.length }})</button>
          </div>

          <!-- Comments pane -->
          <div v-if="sidebarTab === 'comment'" class="sidebar-pane">
            <template v-if="!openThread">
              <div class="pane-scroll">
                <div v-if="ws.comments.length === 0" class="pane-empty">ជ្រើសអត្ថបទក្នុង PDF រួចចុច Add Comment ឬសរសេរផ្ទាល់ខាងក្រោម</div>
                <div v-for="c in ws.comments" :key="c.id" class="list-item" :class="{ active: selectedCommentId === c.id }" @click="openCommentThread(c)">
                  <div class="item-avatar">{{ (c.creator || '?').charAt(0) }}</div>
                  <div class="item-body">
                    <div class="item-head"><span class="item-author">{{ c.creator }}</span><span class="item-time">{{ c.created_at }}</span></div>
                    <div v-if="c.selected_text" class="item-quote">"{{ c.selected_text }}"</div>
                    <p class="item-text">{{ c.comment }}</p>
                    <div class="item-foot"><span>ទំ. {{ c.page_number }}</span><span>{{ c.replies.length ? `ឆ្លើយតប ${c.replies.length}` : 'គ្មានការឆ្លើយតប' }}</span></div>
                  </div>
                </div>
              </div>

              <div class="composer">
                <div v-if="pendingQuote" class="quote-chip">
                  <span class="quote-chip-text">"{{ pendingQuote.text }}"</span>
                  <button type="button" class="icon-btn tiny" @click="clearPendingQuote">✕</button>
                </div>
                <div class="composer-row">
                  <textarea
                    ref="commentInput"
                    v-model="commentDraftText"
                    class="form-input"
                    rows="1"
                    placeholder="សរសេរមតិយោបល់... (Enter ដើម្បីផ្ញើ)"
                    :disabled="!effectiveEditable"
                    @keydown.enter="handleCommentEnter"
                  />
                  <button class="send-btn" type="button" :disabled="!effectiveEditable || !commentDraftText.trim()" @click="submitComment">
                    <Send :size="15" :stroke-width="2.4" />
                  </button>
                </div>
              </div>
            </template>

            <template v-else-if="openThread">
              <div class="thread-header">
                <button type="button" class="text-btn" @click="closeThread"><ChevronLeft :size="14" :stroke-width="2.4" />ត្រឡប់ទៅមតិទាំងអស់</button>
                <button v-if="effectiveEditable" type="button" class="text-btn danger" @click="removeComment(openThread.id)">លុបមតិនេះ</button>
              </div>
              <div class="pane-scroll">
                <div class="thread-root">
                  <div class="item-avatar">{{ (openThread.creator || '?').charAt(0) }}</div>
                  <div class="item-body">
                    <div class="item-head"><span class="item-author">{{ openThread.creator }}</span><span class="item-time">{{ openThread.created_at }}</span></div>
                    <div v-if="openThread.selected_text" class="item-quote">"{{ openThread.selected_text }}"</div>
                    <p class="item-text">{{ openThread.comment }}</p>
                    <div class="item-foot"><span>ទំ. {{ openThread.page_number }}</span></div>
                  </div>
                </div>
                <div class="reply-list">
                  <div v-if="openThread.replies.length === 0" class="pane-empty">មិនទាន់មានការឆ្លើយតប</div>
                  <div v-for="r in openThread.replies" :key="r.id" class="reply-item">
                    <div class="item-avatar sm">{{ (r.creator || '?').charAt(0) }}</div>
                    <div class="item-body">
                      <div class="item-head"><span class="item-author">{{ r.creator }}</span><span class="item-time">{{ r.created_at }}</span></div>
                      <p class="item-text">{{ r.text }}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div class="composer">
                <div class="composer-row">
                  <textarea
                    v-model="replyDraftText"
                    class="form-input"
                    rows="1"
                    placeholder="សរសេរការឆ្លើយតប... (Enter ដើម្បីផ្ញើ)"
                    :disabled="!effectiveEditable"
                    @keydown.enter="handleReplyEnter($event, openThread)"
                  />
                  <button class="send-btn" type="button" :disabled="!effectiveEditable || !replyDraftText.trim()" @click="submitReply(openThread)">
                    <Send :size="15" :stroke-width="2.4" />
                  </button>
                </div>
              </div>
            </template>
          </div>

          <!-- Notes pane -->
          <div v-else class="sidebar-pane">
            <div class="pane-scroll">
              <div v-if="ws.notes.length === 0" class="pane-empty">មិនទាន់មានកំណត់ចំណាំ</div>
              <div v-for="n in ws.notes" :key="n.id" class="list-item static">
                <div class="item-avatar">{{ (n.creator || '?').charAt(0) }}</div>
                <div class="item-body">
                  <p class="item-text">{{ n.note }}</p>
                  <div class="item-foot">
                    <span>{{ n.creator }} · {{ n.created_at }}</span>
                    <button v-if="effectiveEditable" type="button" class="text-btn danger" @click="deleteNote(n.id)">លុប</button>
                  </div>
                </div>
              </div>
            </div>
            <div class="composer">
              <div class="composer-row">
                <textarea
                  v-model="noteDraftText"
                  class="form-input"
                  rows="1"
                  placeholder="សរសេរកំណត់ចំណាំ... (Enter ដើម្បីផ្ញើ)"
                  :disabled="!effectiveEditable"
                  @keydown.enter="handleNoteEnter"
                />
                <button class="send-btn" type="button" :disabled="!effectiveEditable || !noteDraftText.trim()" @click="submitNote">
                  <Send :size="15" :stroke-width="2.4" />
                </button>
              </div>
            </div>
          </div>
        </aside>
      </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.draft-pdf-section { min-width: 0; max-width: 100%; }

.draft-viewer-frame { display: flex; flex-direction: column; min-width: 0; }
.draft-viewer-frame.is-fixed { position: fixed; inset: 0; z-index: 1000; background: var(--color-bg); }
.draft-viewer-frame.is-fixed .draft-header { border-radius: 0; border-left: 0; border-right: 0; border-top: 0; margin-bottom: 0; }
.draft-viewer-frame.is-fixed .draft-pdf-shell { flex: 1; min-height: 0; height: auto; border: 0; border-radius: 0; }

.draft-header { border: 1px solid var(--color-border-soft); border-radius: var(--radius-md); margin-bottom: 12px; flex: none; background: #fff; }

.header-row { padding: 12px 16px; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; }
.header-left { display: flex; align-items: center; gap: 12px; min-width: 0; }
.back-link { flex: none; display: grid; place-items: center; width: 32px; height: 32px; color: var(--color-text-secondary); border: 1px solid var(--color-border); border-radius: 8px; }
.back-link:hover { color: var(--color-primary); border-color: var(--color-primary); }
.file-icon { width: 36px; height: 36px; border-radius: 8px; border: 1px solid var(--color-border); display: flex; align-items: center; justify-content: center; flex: none; color: var(--color-text-secondary); }
.header-meta { min-width: 0; }
.header-title { font-family: var(--font-heading); font-size: 16px; font-weight: 400; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--color-text); }
.header-tags { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; font-size: 12px; margin-top: 2px; }
.header-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }

.text-muted { color: var(--color-text-secondary); }
.tag { display: inline-flex; padding: 2px 9px; font-size: 11px; font-weight: 700; border-radius: 999px; background: #e6f0fd; color: var(--color-primary-hover); }
.tag-success { background: #e7f8ee; color: #1c7a44; }
.tag-info { background: #e6f0fd; color: var(--color-primary-hover); }

.btn-sm { min-height: 30px; padding: 5px 10px; font-size: 12px; display: inline-flex; align-items: center; gap: 5px; }
.btn-sm.active { color: #fff; background: var(--color-primary); border-color: var(--color-primary); }
.btn-group { display: inline-flex; border: 1px solid var(--color-border); border-radius: var(--radius-sm); overflow: hidden; }
.btn-group-item { padding: 5px 12px; font-size: 12px; font-weight: 700; background: #fff; color: var(--color-text-secondary); border: none; border-right: 1px solid var(--color-border); }
.btn-group-item:last-child { border-right: none; }
.btn-group-item.active { color: #fff; background: var(--color-primary); }

.lock-banner { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px; padding: 8px 16px; font-size: 13px; color: #92660a; background: #fdf3d8; border-top: 1px solid #e8c766; }

.draft-pdf-shell { position: relative; display: flex; flex-direction: column; border: 1px solid var(--color-border-soft); border-radius: var(--radius-md); overflow: hidden; background: var(--color-bg); height: 640px; }

.shell-body { flex: 1; display: flex; min-height: 0; min-width: 0; overflow: hidden; }

.pdf-pane { flex: 1; min-width: 0; position: relative; overflow: auto; }
.pdf-empty-wrap { display: flex; align-items: center; justify-content: center; min-height: 420px; padding: 32px; }
.empty-block { display: flex; flex-direction: column; align-items: center; gap: 10px; color: var(--color-text-secondary); }
.pdf-page-bar { position: sticky; top: 0; z-index: 10; background: #fff; border-bottom: 1px solid var(--color-border-soft); padding: 8px 16px; display: flex; align-items: center; justify-content: space-between; font-size: 13px; }
.pdf-page-nav { display: flex; align-items: center; gap: 8px; }
.icon-btn { display: grid; place-items: center; width: 26px; height: 26px; color: var(--color-text-secondary); background: transparent; border: none; border-radius: 7px; }
.icon-btn:hover:not(:disabled) { background: var(--color-bg); }
.icon-btn:disabled { opacity: 0.35; }
.icon-btn.tiny { width: 20px; height: 20px; }
.pdf-host { position: relative; margin: 16px auto; width: 100%; max-width: 900px; padding: 0 8px; }
.page-wrap { position: relative; width: 100%; box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12); }
.pdf-embed { width: 100%; }

.highlight-layer { pointer-events: none; position: absolute; inset: 0; z-index: 1; }
.highlight-box { position: absolute; border-radius: 2px; }
.highlight-pending { background-color: rgba(59, 130, 246, 0.35); box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.7) inset; }
.highlight-active { background-color: rgba(245, 158, 11, 0.5); box-shadow: 0 0 0 1px rgba(245, 158, 11, 0.8) inset; }

.selection-tip { position: fixed; z-index: 2000; display: flex; align-items: center; gap: 4px; background: #1f2937; border-radius: 6px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3); padding: 4px; }
.selection-tip-btn { border: 0; background: transparent; color: #fff; font-size: 11px; font-weight: 700; border-radius: 4px; padding: 6px 10px; cursor: pointer; white-space: nowrap; }
.selection-tip-btn:hover { background: rgba(255, 255, 255, 0.12); }
.selection-tip-close { opacity: 0.7; padding: 6px 8px; }

.draft-sidebar { width: 22rem; flex: none; border-left: 1px solid var(--color-border-soft); background: #fff; display: flex; flex-direction: column; max-height: 640px; }
.draft-sidebar.sidebar-full { height: 100%; max-height: none; }
.sidebar-tabs-bar { flex: none; display: flex; border-bottom: 1px solid var(--color-border-soft); }
.sidebar-tab { flex: 1; padding: 10px 6px; font-size: 12px; font-weight: 700; color: var(--color-text-secondary); background: transparent; border: none; border-bottom: 2px solid transparent; }
.sidebar-tab.active { color: var(--color-primary); border-bottom-color: var(--color-primary); }
.sidebar-pane { flex: 1; display: flex; flex-direction: column; min-height: 0; }
.pane-scroll { flex: 1; min-height: 0; overflow-y: auto; }
.pane-empty { padding: 32px 16px; text-align: center; color: var(--color-text-secondary); font-size: 13px; }

.list-item { display: flex; gap: 10px; padding: 12px 16px; border-bottom: 1px solid var(--color-border-soft); cursor: pointer; }
.list-item:hover { background: var(--color-bg); }
.list-item.static { cursor: default; }
.list-item.static:hover { background: transparent; }
.list-item.active { background: rgba(245, 158, 11, 0.1); border-left: 3px solid #f59e0b; padding-left: 13px; }
.item-avatar { flex: none; margin-top: 2px; width: 26px; height: 26px; border-radius: 50%; display: grid; place-items: center; font-size: 11px; font-weight: 700; color: var(--color-primary); background: var(--color-accent-pale); }
.item-avatar.sm { width: 20px; height: 20px; font-size: 10px; }
.item-body { flex: 1; min-width: 0; }
.item-head { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; margin-bottom: 4px; }
.item-author { font-size: 12px; font-weight: 700; }
.item-time { font-size: 11px; flex: none; color: var(--color-text-secondary); }
.item-quote { font-size: 11px; font-style: italic; background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.25); border-radius: 4px; padding: 4px 8px; margin-bottom: 6px; }
.item-text { font-size: 13px; white-space: pre-wrap; margin: 0; }
.item-foot { display: flex; align-items: center; justify-content: space-between; margin-top: 8px; font-size: 11px; color: var(--color-text-secondary); }

.thread-header { flex: none; display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 8px; border-bottom: 1px solid var(--color-border-soft); }
.text-btn { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; font-weight: 700; color: var(--color-primary); background: transparent; border: none; }
.text-btn.danger { color: var(--color-danger); }
.thread-root { display: flex; gap: 10px; padding: 16px; border-bottom: 1px solid var(--color-border-soft); }
.reply-list { padding: 12px 16px 16px; display: flex; flex-direction: column; gap: 14px; }
.reply-item { display: flex; gap: 8px; }

.composer { flex: none; border-top: 1px solid var(--color-border-soft); padding: 10px 12px; }
.composer-row { display: flex; align-items: flex-end; gap: 8px; }
.composer-row .form-input { flex: 1; min-height: 38px; resize: none; }
.send-btn { display: grid; place-items: center; width: 34px; height: 34px; flex: none; color: #fff; background: var(--color-primary); border: none; border-radius: 50%; }
.send-btn:disabled { opacity: 0.4; }
.quote-chip { display: flex; align-items: flex-start; justify-content: space-between; gap: 6px; background: rgba(59, 130, 246, 0.08); border: 1px solid rgba(59, 130, 246, 0.25); border-radius: 6px; padding: 6px 8px; margin-bottom: 8px; }
.quote-chip-text { font-size: 12px; font-style: italic; color: var(--color-text-secondary); }

.pdf-text-selectable { cursor: text; }
.draft-pdf-shell :deep(.textLayer) { z-index: 2 !important; pointer-events: auto !important; opacity: 1 !important; font-family: sans-serif !important; line-height: 1 !important; cursor: text; }
.draft-pdf-shell :deep(.textLayer span) { color: transparent !important; cursor: text; pointer-events: auto !important; }
.draft-pdf-shell :deep(.textLayer ::selection) { background: rgba(59, 130, 246, 0.4); }
.draft-pdf-shell :deep(.vue-pdf-embed__page) { position: relative !important; }
.draft-pdf-shell :deep(.vue-pdf-embed__page canvas) { display: block; }
</style>
