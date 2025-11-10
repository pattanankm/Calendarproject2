// ================================
// FIREBASE SETUP
// ================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  orderBy,
  query,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  enableIndexedDbPersistence
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyBhXAxeQSG82C3815AdbsI6jZZqV6ohIw0",
  authDomain: "calendar030-b2037.firebaseapp.com",
  projectId: "calendar030-b2037",
  storageBucket: "calendar030-b2037.firebasestorage.app",
  messagingSenderId: "1025342358133",
  appId: "1:1025342358133:web:e7300b3fbbdde76c0c2e3c",
  measurementId: "G-5CGW8224Z8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Enable offline persistence
enableIndexedDbPersistence(db).catch(() => {});

const eventsRef = collection(db, "events");

// ================================
// GLOBAL VARIABLES
// ================================
let events = [];
let currentDate = new Date();
let editingId = null;

// ================================
// HELPER FUNCTIONS
// ================================

// Format Date to YYYY-MM-DD
function fmt(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

// Parse String เto Date Object
function parse(s) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// เช็คว่าเป็นวันเดียวกันหรือไม่
function same(a, b) {
  return a.getFullYear() == b.getFullYear() && 
         a.getMonth() == b.getMonth() && 
         a.getDate() == b.getDate();
}

// ================================
// FIREBASE LISTENERS
// ================================

// Real-time Updates from Firestore
onSnapshot(query(eventsRef, orderBy("date", "asc")), snap => {
  events = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  renderCalendar();
});

// ================================
// RENDER CALENDAR
// ================================
function renderCalendar() {
  const grid = document.getElementById('calendarGrid');
  const monthLbl = document.getElementById('currentMonth');
  grid.innerHTML = '';

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Display current month and year
  monthLbl.textContent = `${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`;

  // Create day headers (Sun, Mon, Tue...)
  days.forEach(d => {
    const h = document.createElement('div');
    h.className = 'day-header';
    h.textContent = d;
    grid.appendChild(h);
  });

  // Find the first day of the month
  const first = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());

  const today = new Date();

  // Create 42 cells (6 weeks)
  for (let i = 0; i < 42; i++) {
    const cd = new Date(start);
    cd.setDate(start.getDate() + i);

    const cell = document.createElement('div');
    cell.className = 'day-cell';

    // Check if it's another month
    if (cd.getMonth() !== currentDate.getMonth()) {
      cell.classList.add('other-month');
    }

    // Check if it's today
    if (same(cd, today)) {
      cell.classList.add('today');
    }

    // Display day number
    const num = document.createElement('div');
    num.className = 'day-number';
    num.textContent = cd.getDate();
    cell.appendChild(num);

    // Display Events for today
    const ds = fmt(cd);
    const evts = events.filter(e => e.date === ds);

    evts.forEach(ev => {
      const tag = document.createElement('div');
      tag.className = 'event';
      tag.textContent = ev.title;
      tag.onclick = e => {
        e.stopPropagation();
        openModal(ev);
      }
      cell.appendChild(tag);
    });

    // Click on a day cell to add an Event
    cell.onclick = () => openModal({ date: ds });
    grid.appendChild(cell);
  }

  updateSidebar();
}

// ================================
// UPDATE SIDEBAR
// ================================
function updateSidebar() {
  const list = document.getElementById('eventsList');
  const count = document.getElementById('eventCount');
  const m = currentDate.getMonth();
  const y = currentDate.getFullYear();

  // Filter Events for the current month
  const monthEv = events.filter(e => {
    const d = parse(e.date);
    return d.getMonth() == m && d.getFullYear() == y;
  });

  count.textContent = `Number of Events: ${monthEv.length}`;
  list.innerHTML = '';

  if (monthEv.length === 0) {
    list.innerHTML = '<div class="no-events">No events this month</div>';
    return;
  }

  // Sort by date and display
  monthEv.sort((a, b) => parse(a.date) - parse(b.date)).forEach(ev => {
    const div = document.createElement('div');
    div.className = 'event-item';
    const dateStr = parse(ev.date).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });

    div.innerHTML = `
      <div class="event-item-title">${ev.title}</div>
      <div class="event-item-date"> ${dateStr}</div>
      <div class="event-item-time"> ${ev.time || '-'}</div>
    `;

    div.onclick = () => openModal(ev);
    list.appendChild(div);
  });
}

// ================================
// SAVE EVENT
// ================================
async function saveEvent() {
  const title = document.getElementById('eventTitle').value.trim();
  const date = document.getElementById('eventDate').value;
  const time = document.getElementById('eventTime').value;
  const description = document.getElementById('eventDescription').value;

  if (!title || !date) {
    alert('Please enter title and date');
    return;
  }

  if (editingId) {
    // Edit Event
    await updateDoc(doc(db, 'events', editingId), {
      title,
      date,
      time,
      description,
      updatedAt: serverTimestamp()
    });
  } else {
    // Add new Event
    await addDoc(eventsRef, {
      title,
      date,
      time,
      description,
      createdAt: serverTimestamp()
    });
  }

  closeModal();
}

// ================================
// DELETE EVENT
// ================================
async function deleteEvent() {
  if (!editingId) return;

  if (confirm('Delete this event?')) {
    await deleteDoc(doc(db, 'events', editingId));
    closeModal();
  }
}

// ================================
// OPEN MODAL
// ================================
function openModal(ev) {
  document.getElementById('eventModal').style.display = 'flex';
  document.getElementById('modalTitle').textContent = ev.id ? 'Edit Event' : 'New Event';
  document.getElementById('eventTitle').value = ev.title || '';
  document.getElementById('eventDate').value = ev.date || fmt(new Date());
  document.getElementById('eventTime').value = ev.time || '';
  document.getElementById('eventDescription').value = ev.description || '';
  document.getElementById('deleteBtn').style.display = ev.id ? 'inline-block' : 'none';
  editingId = ev.id || null;
}

// ================================
// CLOSE MODAL
// ================================
function closeModal() {
  document.getElementById('eventModal').style.display = 'none';
  editingId = null;
}

// ================================
// EVENT LISTENERS
// ================================

// ปุ่มเพิ่ม Event
document.getElementById('addBtn').onclick = () => openModal({ date: fmt(new Date()) });

// ปุ่ม Save
document.getElementById('saveBtn').onclick = saveEvent;

// ปุ่ม Cancel
document.getElementById('cancelBtn').onclick = closeModal;

// ปุ่ม Delete
document.getElementById('deleteBtn').onclick = deleteEvent;

// ปุ่มเดือนก่อนหน้า
document.getElementById('prevBtn').onclick = () => {
  currentDate.setMonth(currentDate.getMonth() - 1);
  renderCalendar();
}

// ปุ่มเดือนถัดไป
document.getElementById('nextBtn').onclick = () => {
  currentDate.setMonth(currentDate.getMonth() + 1);
  renderCalendar();
}

// Click outside Modal to close
window.onclick = e => {
  if (e.target.id === 'eventModal') {
    closeModal();
  }
}

// ================================
// INITIAL RENDER
// ================================
renderCalendar();