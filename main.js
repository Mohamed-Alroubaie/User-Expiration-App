const STORAGE_KEY = 'userExpirationApp';
let userToDeleteIndex = null;
let users = [];
let editingIndex = null;
let deferredPrompt = null;

// Load users from LocalStorage on window load
window.onload = function () {
  const storedUsers = localStorage.getItem(STORAGE_KEY);
  if (storedUsers) {
    users = JSON.parse(storedUsers);
    users = users.map((user) => ({
      ...user,
      startDate: new Date(user.startDate),
      endDate: new Date(user.endDate),
    }));
    renderUsers();
  }
};

function saveToLocalStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

function openModal(index = null) {
  document.getElementById('userModal').style.display = 'flex';
  document.getElementById('modalTitle').textContent =
    index !== null ? 'Benutzer Bearbeiten' : 'Neuen Schüler Hinzufügen';
  if (index !== null) {
    editingIndex = index;
    document.getElementById('username').value = users[index].username;
    document.getElementById('startDate').valueAsDate = new Date(
      users[index].startDate
    );
  } else {
    editingIndex = null;
    document.getElementById('username').value = '';
    document.getElementById('startDate').value = '';
  }
}

function closeModal() {
  document.getElementById('userModal').style.display = 'none';
}

function saveUser() {
  const username = document.getElementById('username').value.trim();
  const startDateStr = document.getElementById('startDate').value;

  if (!username || !startDateStr) {
    alert(
      'Bitte geben Sie sowohl den Studentennamen als auch das Startdatum ein.'
    );
    return;
  }

  const startDate = new Date(startDateStr);
  const endDate = new Date(startDate);
  endDate.setFullYear(endDate.getFullYear() + 1);

  if (editingIndex !== null) {
    users[editingIndex] = { username, startDate, endDate };
  } else {
    users.push({ username, startDate, endDate });
  }

  saveToLocalStorage();
  closeModal();
  renderUsers();
}

function deleteUser(index) {
  userToDeleteIndex = index;
  const username = users[index].username;
  document.getElementById(
    'deleteUserMessage'
  ).textContent = `Möchten Sie "${username}" wirklich löschen??`;
  document.getElementById('deleteModal').style.display = 'flex';
}

function confirmDelete() {
  if (userToDeleteIndex !== null) {
    users.splice(userToDeleteIndex, 1);
    saveToLocalStorage();
    renderUsers();
    closeDeleteModal();
    userToDeleteIndex = null;
  }
}

function closeDeleteModal() {
  document.getElementById('deleteModal').style.display = 'none';
}

function getRemainingTime(endDate) {
  const now = new Date();
  const diff = endDate - now;

  const months = Math.floor(diff / (1000 * 60 * 60 * 24 * 30.44));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  console.log(diff, days, months);

  if (diff <= 0) {
    return 'Expired';
  }

  if (months >= 1) {
    return `Noch ${months} Monate`;
  } else {
    return `${days} Tag(e) übrig`;
  }
}

function renderUsers() {
  const userList = document.getElementById('userList');
  userList.innerHTML = '';

  users.sort((a, b) => a.endDate - b.endDate);

  users.forEach((user, index) => {
    const card = document.createElement('div');
    const isExpired = user.endDate < new Date();

    card.className = 'user-card' + (isExpired ? ' Abgelaufen' : '');

    card.innerHTML = `
            <div class="user-info">
              <strong>${user.username}</strong>
              <span>Started: ${new Date(user.startDate).toDateString()}</span>
              <span>Expires: ${new Date(user.endDate).toDateString()}</span>
              <span class="${isExpired ? 'expired' : ''}">
                Status: ${getRemainingTime(user.endDate)}
              </span>
            </div>
            <div class="card-actions">
              <button class="edit-btn" onclick="openModal(${index})">Edit</button>
              <button class="delete-btn" onclick="deleteUser(${index})">Delete</button>
            </div>
          `;
    userList.appendChild(card);
  });
}

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('service-worker.js')
      .then((reg) => console.log('✅ Service Worker registered:', reg.scope))
      .catch((err) => console.error('❌ Service Worker failed:', err));
  });
}
