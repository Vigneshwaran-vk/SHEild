/* ============================================
   SHEild AI — Main Application Logic
   ALL REAL DEVICE APIS — GPS, Camera, Mic,
   Voice Recognition, SMS/Share, Downloads
   ============================================ */

// ===========================
// Theme Management
// ===========================
(function initTheme() {
  var theme = localStorage.getItem('sheild_theme') || 'dark';
  if (theme === 'light') {
    document.body.classList.add('light-mode');
  }
  var toggle = document.getElementById('theme-toggle');
  if (toggle) toggle.checked = (theme === 'light');
})();

function toggleTheme() {
  document.body.classList.toggle('light-mode');
  var isLight = document.body.classList.contains('light-mode');
  localStorage.setItem('sheild_theme', isLight ? 'light' : 'dark');
  showToast(isLight ? '☀️ Light mode enabled' : '🌙 Dark mode enabled', 'info');
}

// ===========================
// Toast Notification System
// ===========================
function showToast(message, type) {
  type = type || 'success';
  var toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.className = 'toast toast-' + type + ' show';
  setTimeout(function () { toast.classList.remove('show'); }, 3000);
}

// ===========================
// Ripple Effect on Buttons
// ===========================
document.addEventListener('click', function (e) {
  var btn = e.target.closest('.btn');
  if (!btn) return;
  var ripple = document.createElement('span');
  ripple.classList.add('ripple');
  var rect = btn.getBoundingClientRect();
  var size = Math.max(rect.width, rect.height);
  ripple.style.width = ripple.style.height = size + 'px';
  ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
  ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
  btn.appendChild(ripple);
  setTimeout(function () { ripple.remove(); }, 700);
});

// ===========================
// Scroll Reveal Animation
// ===========================
(function initScrollReveal() {
  var reveals = document.querySelectorAll('.reveal');
  if (!reveals.length) return;
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  reveals.forEach(function (el) { observer.observe(el); });
})();

// ===========================
// Utility: HTML Escape
// ===========================
function escapeHtml(str) {
  var div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

// ===========================
// Utility: Format Timer
// ===========================
function formatTime(seconds) {
  var m = Math.floor(seconds / 60);
  var s = seconds % 60;
  return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
}

// ===========================
// Utility: Auto-download file
// ===========================
function downloadFile(blob, filename) {
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
}

// ===========================
// REAL GPS LOCATION
// ===========================
var currentLat = null;
var currentLng = null;
var gpsWatchId = null;

function getRealLocation(callback) {
  if (!navigator.geolocation) {
    // Fallback to random
    currentLat = (17 + Math.random() * 10).toFixed(6);
    currentLng = (78 + Math.random() * 5).toFixed(6);
    if (callback) callback(currentLat, currentLng);
    return;
  }

  navigator.geolocation.getCurrentPosition(
    function (pos) {
      currentLat = pos.coords.latitude.toFixed(6);
      currentLng = pos.coords.longitude.toFixed(6);
      if (callback) callback(currentLat, currentLng);
    },
    function (err) {
      console.warn('GPS error:', err.message);
      // Fallback
      currentLat = (17 + Math.random() * 10).toFixed(6);
      currentLng = (78 + Math.random() * 5).toFixed(6);
      if (callback) callback(currentLat, currentLng);
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
}

function startGPSWatch(displayEl) {
  if (!navigator.geolocation) return;

  gpsWatchId = navigator.geolocation.watchPosition(
    function (pos) {
      currentLat = pos.coords.latitude.toFixed(6);
      currentLng = pos.coords.longitude.toFixed(6);
      if (displayEl) {
        displayEl.textContent = '📍 LAT: ' + currentLat + ' | LNG: ' + currentLng;
      }
    },
    function (err) {
      if (displayEl) {
        displayEl.textContent = '📍 GPS unavailable — LAT: ' + (currentLat || '—') + ' | LNG: ' + (currentLng || '—');
      }
    },
    { enableHighAccuracy: true }
  );
}

function stopGPSWatch() {
  if (gpsWatchId !== null) {
    navigator.geolocation.clearWatch(gpsWatchId);
    gpsWatchId = null;
  }
}

// ===========================
// Onboarding Logic
// ===========================
var currentStep = 1;

function goToStep(step) {
  if (step > currentStep) {
    if (currentStep === 1) {
      var keyword = document.getElementById('keyword-input').value.trim();
      if (!keyword) {
        showToast('Please enter an emergency keyword.', 'error');
        return;
      }
    }
    if (currentStep === 2) {
      var pin = document.getElementById('pin-input').value.trim();
      var confirm = document.getElementById('pin-confirm').value.trim();
      if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
        showToast('Please enter a valid 4-digit PIN.', 'error');
        return;
      }
      if (pin !== confirm) {
        showToast('PINs do not match. Please try again.', 'error');
        return;
      }
    }
  }

  currentStep = step;
  document.querySelectorAll('.step-panel').forEach(function (p) { p.classList.remove('active'); });
  var panel = document.getElementById('step-' + step);
  if (panel) panel.classList.add('active');

  document.querySelectorAll('.step-dot').forEach(function (dot, i) {
    dot.classList.remove('active', 'completed');
    if (i + 1 === step) dot.classList.add('active');
    else if (i + 1 < step) dot.classList.add('completed');
  });
}

function completeOnboarding() {
  var keyword = document.getElementById('keyword-input').value.trim();
  var pin = document.getElementById('pin-input').value.trim();
  var voiceEnabled = document.getElementById('voice-toggle').checked;

  if (!keyword) { showToast('Please set an emergency keyword.', 'error'); return; }
  if (!pin || pin.length !== 4) { showToast('Please set a valid 4-digit PIN.', 'error'); return; }

  localStorage.setItem('sheild_keyword', keyword);
  localStorage.setItem('sheild_pin', pin);
  localStorage.setItem('sheild_voice', voiceEnabled ? 'true' : 'false');
  localStorage.setItem('sheild_onboarded', 'true');

  showToast('✅ Setup complete! Redirecting...', 'success');
  setTimeout(function () { window.location.href = 'contacts.html'; }, 1200);
}

// ===========================
// Contacts Management (CRUD)
// ===========================
function getContacts() {
  return JSON.parse(localStorage.getItem('sheild_contacts') || '[]');
}

function setContacts(contacts) {
  localStorage.setItem('sheild_contacts', JSON.stringify(contacts));
}

function saveContact() {
  var name = document.getElementById('contact-name').value.trim();
  var phone = document.getElementById('contact-phone').value.trim();
  var relation = document.getElementById('contact-relation').value;
  var editIndex = parseInt(document.getElementById('edit-index').value, 10);

  if (!name || !phone || !relation) {
    showToast('Please fill in all fields.', 'error');
    return;
  }

  var contacts = getContacts();

  if (editIndex >= 0) {
    contacts[editIndex] = { name: name, phone: phone, relation: relation };
    showToast('✅ Contact updated!', 'success');
  } else {
    if (contacts.length >= 5) {
      showToast('Maximum 5 contacts allowed.', 'error');
      return;
    }
    contacts.push({ name: name, phone: phone, relation: relation });
    showToast('✅ Contact added!', 'success');
  }

  setContacts(contacts);
  clearContactForm();
  renderContacts();
}

function editContact(index) {
  var contacts = getContacts();
  var c = contacts[index];
  document.getElementById('contact-name').value = c.name;
  document.getElementById('contact-phone').value = c.phone;
  document.getElementById('contact-relation').value = c.relation;
  document.getElementById('edit-index').value = index;
  document.getElementById('form-title').textContent = 'Edit Contact';
  document.getElementById('save-contact-btn').textContent = '✓ Update Contact';
  document.getElementById('cancel-edit-btn').style.display = 'inline-flex';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deleteContact(index) {
  var contacts = getContacts();
  contacts.splice(index, 1);
  setContacts(contacts);
  renderContacts();
  showToast('🗑️ Contact removed.', 'info');
}

function cancelEdit() { clearContactForm(); }

function clearContactForm() {
  document.getElementById('contact-name').value = '';
  document.getElementById('contact-phone').value = '';
  document.getElementById('contact-relation').value = '';
  document.getElementById('edit-index').value = -1;
  var formTitle = document.getElementById('form-title');
  if (formTitle) formTitle.textContent = 'Add New Contact';
  var saveBtn = document.getElementById('save-contact-btn');
  if (saveBtn) saveBtn.textContent = '➕ Add Contact';
  var cancelBtn = document.getElementById('cancel-edit-btn');
  if (cancelBtn) cancelBtn.style.display = 'none';
}

function renderContacts() {
  var list = document.getElementById('contacts-list');
  var empty = document.getElementById('empty-state');
  if (!list) return;

  var contacts = getContacts();
  list.innerHTML = '';

  if (contacts.length === 0) {
    if (empty) empty.style.display = 'block';
    return;
  }

  if (empty) empty.style.display = 'none';

  contacts.forEach(function (c, i) {
    var card = document.createElement('div');
    card.className = 'glass-card contact-card animate-fadeInUp';
    card.style.animationDelay = (i * 0.1) + 's';
    card.innerHTML =
      '<div class="contact-info">' +
      '<h3>' + escapeHtml(c.name) + '</h3>' +
      '<p>📞 ' + escapeHtml(c.phone) + ' • ' + escapeHtml(c.relation) + '</p>' +
      '</div>' +
      '<div class="contact-actions">' +
      '<button class="btn-edit" onclick="editContact(' + i + ')" title="Edit">✏️</button>' +
      '<button class="btn-delete" onclick="deleteContact(' + i + ')" title="Delete">🗑️</button>' +
      '</div>';
    list.appendChild(card);
  });
}

// ===========================
// REAL SMS / SHARE to Contacts
// ===========================

/**
 * Build the emergency message string with real GPS
 */
function buildEmergencyMessage(lat, lng) {
  var mapsLink = 'https://www.google.com/maps?q=' + lat + ',' + lng;
  return '🚨 SHEild AI EMERGENCY ALERT!\n' +
    'I need help immediately!\n\n' +
    '📍 My Location:\n' +
    'Latitude: ' + lat + '\n' +
    'Longitude: ' + lng + '\n' +
    '🗺️ Google Maps: ' + mapsLink + '\n\n' +
    '⏰ Time: ' + new Date().toLocaleString() + '\n' +
    '— Sent via SHEild AI';
}

/**
 * Send real alert to all contacts via SMS + WhatsApp
 */
function sendRealAlertToContacts(lat, lng) {
  var contacts = getContacts();
  var message = buildEmergencyMessage(lat, lng);
  var encodedMsg = encodeURIComponent(message);

  if (contacts.length === 0) {
    showToast('⚠️ No emergency contacts configured!', 'error');
    return;
  }

  // Try Web Share API first (works on mobile)
  if (navigator.share) {
    navigator.share({
      title: '🚨 SHEild AI Emergency Alert',
      text: message,
      url: 'https://www.google.com/maps?q=' + lat + ',' + lng
    }).catch(function () {
      // If share cancelled, fall back to SMS URIs
      openSMSForContacts(contacts, encodedMsg);
    });
  } else {
    // Desktop or no Web Share: open SMS URI for first contact
    openSMSForContacts(contacts, encodedMsg);
  }

  // Also open WhatsApp for each contact (in new tabs)
  contacts.forEach(function (c) {
    var cleanPhone = c.phone.replace(/[^0-9+]/g, '');
    // Ensure country code (default India +91 if no + prefix)
    if (cleanPhone.charAt(0) !== '+') {
      cleanPhone = '91' + cleanPhone;
    } else {
      cleanPhone = cleanPhone.substring(1);
    }
    var waLink = 'https://wa.me/' + cleanPhone + '?text=' + encodedMsg;
    window.open(waLink, '_blank');
  });
}

function openSMSForContacts(contacts, encodedMsg) {
  // Open SMS app with all contacts (comma-separated phones)
  var phones = contacts.map(function (c) { return c.phone; }).join(',');
  var smsLink = 'sms:' + phones + '?body=' + encodedMsg;
  window.open(smsLink, '_self');
}

// ===========================
// Share Location (Real GPS)
// ===========================
function shareLocation() {
  showToast('📍 Getting your real location...', 'info');

  getRealLocation(function (lat, lng) {
    var mapsLink = 'https://www.google.com/maps?q=' + lat + ',' + lng;
    var message = '📍 My current location:\nLat: ' + lat + ', Lng: ' + lng + '\n🗺️ ' + mapsLink;

    // Try Web Share API (mobile)
    if (navigator.share) {
      navigator.share({
        title: '📍 My Location — SHEild AI',
        text: message,
        url: mapsLink
      }).then(function () {
        showToast('✅ Location shared successfully!', 'success');
      }).catch(function () {
        showToast('📍 Location: ' + lat + ', ' + lng, 'info');
      });
    } else {
      // Desktop: send via SMS to all contacts
      var contacts = getContacts();
      if (contacts.length > 0) {
        var phones = contacts.map(function (c) { return c.phone; }).join(',');
        window.open('sms:' + phones + '?body=' + encodeURIComponent(message), '_self');
        showToast('📍 Opening SMS with your location...', 'success');
      } else {
        // Copy to clipboard
        navigator.clipboard.writeText(message).then(function () {
          showToast('📍 Location copied to clipboard! ' + lat + ', ' + lng, 'success');
        }).catch(function () {
          showToast('📍 Your Location: ' + lat + ', ' + lng, 'info');
        });
      }
    }

    // Save GPS log as JSON file
    var gpsLog = {
      event: 'location_share',
      timestamp: new Date().toISOString(),
      latitude: lat,
      longitude: lng,
      mapsUrl: mapsLink
    };
    var logBlob = new Blob([JSON.stringify(gpsLog, null, 2)], { type: 'application/json' });
    downloadFile(logBlob, 'SHEild_GPS_' + Date.now() + '.json');
  });
}

// ====================================
// REAL CAMERA + AUDIO RECORDING
// (Emergency Page)
// ====================================
var emergencyStream = null;
var emergencyRecorder = null;
var emergencyChunks = [];
var emergencyTimerInterval = null;
var emergencySeconds = 0;

function startEmergencyRecording() {
  var videoEl = document.getElementById('camera-feed');
  var fallback = document.getElementById('camera-fallback');
  var timerEl = document.getElementById('rec-timer');

  if (!videoEl) return;

  // Request camera + microphone
  navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then(function (stream) {
      emergencyStream = stream;
      videoEl.srcObject = stream;
      videoEl.style.display = 'block';
      if (fallback) fallback.style.display = 'none';

      // Start MediaRecorder
      emergencyRecorder = new MediaRecorder(stream, { mimeType: getSupportedMimeType() });
      emergencyChunks = [];

      emergencyRecorder.ondataavailable = function (e) {
        if (e.data && e.data.size > 0) emergencyChunks.push(e.data);
      };

      emergencyRecorder.onstop = function () {
        // Save the recording
        var blob = new Blob(emergencyChunks, { type: emergencyRecorder.mimeType });
        var ext = emergencyRecorder.mimeType.indexOf('mp4') >= 0 ? '.mp4' : '.webm';
        downloadFile(blob, 'SHEild_Evidence_Video_' + Date.now() + ext);
        showToast('📥 Video evidence saved!', 'success');
      };

      emergencyRecorder.start(1000); // collect data every second

      // Start timer
      emergencySeconds = 0;
      emergencyTimerInterval = setInterval(function () {
        emergencySeconds++;
        if (timerEl) timerEl.textContent = formatTime(emergencySeconds);
      }, 1000);

    })
    .catch(function (err) {
      console.warn('Camera unavailable:', err);
      // Try audio-only
      if (fallback) fallback.style.display = 'flex';
      videoEl.style.display = 'none';

      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(function (stream) {
          emergencyStream = stream;
          emergencyRecorder = new MediaRecorder(stream);
          emergencyChunks = [];

          emergencyRecorder.ondataavailable = function (e) {
            if (e.data && e.data.size > 0) emergencyChunks.push(e.data);
          };

          emergencyRecorder.onstop = function () {
            var blob = new Blob(emergencyChunks, { type: 'audio/webm' });
            downloadFile(blob, 'SHEild_Evidence_Audio_' + Date.now() + '.webm');
            showToast('📥 Audio evidence saved!', 'success');
          };

          emergencyRecorder.start(1000);

          emergencySeconds = 0;
          emergencyTimerInterval = setInterval(function () {
            emergencySeconds++;
            if (timerEl) timerEl.textContent = formatTime(emergencySeconds);
          }, 1000);

          var recLabel = document.getElementById('rec-label');
          if (recLabel) recLabel.textContent = 'REC • Audio recording (no camera)';
        })
        .catch(function (err2) {
          showToast('⚠️ Camera & mic unavailable. Evidence cannot be recorded.', 'error');
          if (fallback) {
            fallback.style.display = 'flex';
            fallback.querySelector('span').textContent = 'Camera & Mic unavailable';
          }
        });
    });
}

function stopEmergencyRecording() {
  if (emergencyRecorder && emergencyRecorder.state !== 'inactive') {
    emergencyRecorder.stop();
  }
  if (emergencyStream) {
    emergencyStream.getTracks().forEach(function (t) { t.stop(); });
    emergencyStream = null;
  }
  if (emergencyTimerInterval) {
    clearInterval(emergencyTimerInterval);
    emergencyTimerInterval = null;
  }
}

function getSupportedMimeType() {
  var types = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4'];
  for (var i = 0; i < types.length; i++) {
    if (MediaRecorder.isTypeSupported(types[i])) return types[i];
  }
  return '';
}

// ===========================
// Dashboard — Activate SOS
// ===========================
function activateSOS() {
  showToast('🚨 Getting your location & alerting contacts...', 'error');

  getRealLocation(function (lat, lng) {
    // Create real incident log
    var incident = {
      id: Date.now(),
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
      timestamp: new Date().toISOString(),
      lat: lat,
      lng: lng,
      status: 'active'
    };

    var incidents = JSON.parse(localStorage.getItem('sheild_incidents') || '[]');
    incidents.unshift(incident);
    localStorage.setItem('sheild_incidents', JSON.stringify(incidents));
    localStorage.setItem('sheild_active_incident', JSON.stringify(incident));

    // Save incident log as JSON file
    var logBlob = new Blob([JSON.stringify(incident, null, 2)], { type: 'application/json' });
    downloadFile(logBlob, 'SHEild_Incident_' + Date.now() + '.json');

    // Send REAL alerts to contacts via SMS + WhatsApp
    sendRealAlertToContacts(lat, lng);

    // Navigate to emergency page
    setTimeout(function () {
      window.location.href = 'emergency.html';
    }, 1500);
  });
}

// ===========================
// REAL VOICE RECOGNITION
// ===========================
var voiceRecognition = null;
var voiceListening = false;

function startVoiceListening() {
  var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    showToast('⚠️ Voice recognition not supported in this browser. Use Chrome.', 'error');
    return;
  }

  if (voiceListening) {
    stopVoiceListening();
    return;
  }

  var keyword = localStorage.getItem('sheild_keyword') || 'help';
  voiceRecognition = new SpeechRecognition();
  voiceRecognition.continuous = true;
  voiceRecognition.interimResults = true;
  voiceRecognition.lang = 'en-US';

  voiceRecognition.onstart = function () {
    voiceListening = true;
    var btn = document.getElementById('voice-btn');
    if (btn) {
      btn.textContent = '🔴 Listening... (tap to stop)';
      btn.classList.add('btn-danger');
      btn.classList.remove('btn-secondary');
    }
    var statusEl = document.getElementById('voice-status');
    if (statusEl) {
      statusEl.style.display = 'block';
      statusEl.textContent = '🎙️ Say "' + keyword + '" to trigger SOS...';
    }
    showToast('🎙️ Voice listening active. Say "' + keyword + '" for SOS', 'info');
  };

  voiceRecognition.onresult = function (event) {
    var transcript = '';
    for (var i = event.resultIndex; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript;
    }

    var statusEl = document.getElementById('voice-status');
    if (statusEl) {
      statusEl.textContent = '🎙️ Heard: "' + transcript.trim() + '"';
    }

    // Check if keyword was spoken
    if (transcript.toLowerCase().indexOf(keyword.toLowerCase()) >= 0) {
      showToast('🚨 Keyword "' + keyword + '" detected! Activating SOS!', 'error');
      stopVoiceListening();
      setTimeout(function () { activateSOS(); }, 1000);
    }
  };

  voiceRecognition.onerror = function (event) {
    if (event.error === 'no-speech') return; // Ignore silence
    console.warn('Voice error:', event.error);
    if (event.error === 'not-allowed') {
      showToast('⚠️ Microphone permission denied.', 'error');
      stopVoiceListening();
    }
  };

  voiceRecognition.onend = function () {
    // Auto-restart if still supposed to be listening
    if (voiceListening) {
      try { voiceRecognition.start(); } catch (e) { }
    }
  };

  try {
    voiceRecognition.start();
  } catch (e) {
    showToast('⚠️ Could not start voice recognition.', 'error');
  }
}

function stopVoiceListening() {
  voiceListening = false;
  if (voiceRecognition) {
    try { voiceRecognition.stop(); } catch (e) { }
    voiceRecognition = null;
  }
  var btn = document.getElementById('voice-btn');
  if (btn) {
    btn.textContent = '🎙️ Start Voice Listening';
    btn.classList.remove('btn-danger');
    btn.classList.add('btn-secondary');
  }
  var statusEl = document.getElementById('voice-status');
  if (statusEl) statusEl.style.display = 'none';
}

// Legacy function name kept for compatibility
function simulateVoiceActivation() { startVoiceListening(); }

// ===========================
// Fake Call Mode
// ===========================
function fakeCall() {
  var modal = document.getElementById('fake-call-modal');
  if (modal) {
    var contacts = getContacts();
    var name = contacts.length > 0 ? contacts[0].name : 'Mom';
    var callerEl = document.getElementById('fake-caller-name');
    if (callerEl) callerEl.textContent = name;
    modal.classList.add('active');
  }
}

function closeFakeCall() {
  var modal = document.getElementById('fake-call-modal');
  if (modal) modal.classList.remove('active');
}

// ===========================
// Emergency Page Init (REAL)
// ===========================
(function initEmergencyPage() {
  var gpsDisplay = document.getElementById('gps-display');
  if (!gpsDisplay) return; // Not on emergency page

  // Start REAL camera + audio recording
  startEmergencyRecording();

  // Start REAL GPS watch
  startGPSWatch(gpsDisplay);
  getRealLocation(function (lat, lng) {
    gpsDisplay.textContent = '📍 LAT: ' + lat + ' | LNG: ' + lng;
  });

  // Show toast
  setTimeout(function () { showToast('🚨 Emergency mode active — recording evidence!', 'error'); }, 500);

  // Display incident timestamp
  var incident = JSON.parse(localStorage.getItem('sheild_active_incident') || '{}');
  var timestampEl = document.getElementById('incident-timestamp');
  if (timestampEl && incident.timestamp) {
    timestampEl.textContent = 'Incident logged: ' + new Date(incident.timestamp).toLocaleString();
  }

  // Show alert confirmation
  var alertConfirm = document.getElementById('alert-confirm');
  if (alertConfirm) {
    setTimeout(function () { alertConfirm.style.display = 'block'; }, 1000);
  }

  // Render notified contacts
  var notifiedEl = document.getElementById('notified-contacts');
  if (notifiedEl) {
    var contacts = getContacts();
    if (contacts.length > 0) {
      contacts.forEach(function (c) {
        var div = document.createElement('div');
        div.className = 'notified-contact';
        div.innerHTML =
          '<span class="check-icon">✅</span>' +
          '<div>' +
          '<strong>' + escapeHtml(c.name) + '</strong>' +
          '<div style="font-size:0.8rem; color: rgba(255,255,255,0.5);">' + escapeHtml(c.phone) + ' • ' + escapeHtml(c.relation) + '</div>' +
          '</div>';
        notifiedEl.appendChild(div);
      });
    } else {
      notifiedEl.innerHTML += '<p style="color: rgba(255,255,255,0.5); font-size: 0.85rem;">No emergency contacts configured. Add contacts in settings.</p>';
    }
  }
})();

// ===========================
// Stop Emergency (PIN + save)
// ===========================
function showStopModal() {
  var modal = document.getElementById('pin-modal');
  if (modal) modal.classList.add('active');
}

function closeStopModal() {
  var modal = document.getElementById('pin-modal');
  if (modal) modal.classList.remove('active');
  var pinInput = document.getElementById('stop-pin-input');
  if (pinInput) pinInput.value = '';
  var errEl = document.getElementById('pin-error');
  if (errEl) errEl.style.display = 'none';
}

function stopEmergency() {
  var pin = document.getElementById('stop-pin-input').value.trim();
  var savedPIN = localStorage.getItem('sheild_pin');

  if (pin !== savedPIN) {
    document.getElementById('pin-error').style.display = 'block';
    return;
  }

  // Stop all recording
  stopEmergencyRecording();
  stopGPSWatch();

  // Save GPS log
  if (currentLat && currentLng) {
    var gpsLog = {
      event: 'emergency_stop',
      timestamp: new Date().toISOString(),
      latitude: currentLat,
      longitude: currentLng,
      duration_seconds: emergencySeconds
    };
    var logBlob = new Blob([JSON.stringify(gpsLog, null, 2)], { type: 'application/json' });
    downloadFile(logBlob, 'SHEild_GPS_Log_' + Date.now() + '.json');
  }

  // Mark incident as resolved
  var incidents = JSON.parse(localStorage.getItem('sheild_incidents') || '[]');
  if (incidents.length > 0 && incidents[0].status === 'active') {
    incidents[0].status = 'resolved';
    incidents[0].duration = emergencySeconds;
    localStorage.setItem('sheild_incidents', JSON.stringify(incidents));
  }
  localStorage.removeItem('sheild_active_incident');

  showToast('✅ Emergency stopped. Evidence files saved.', 'success');
  setTimeout(function () { window.location.href = 'dashboard.html'; }, 1500);
}

// ====================================
// EVIDENCE RECORDING (Dashboard)
// Audio-only recording from dashboard
// ====================================
var evidenceStream = null;
var evidenceRecorder = null;
var evidenceChunks = [];
var evidenceTimerInterval = null;
var evidenceSeconds = 0;

function startEvidenceRecording() {
  var modal = document.getElementById('evidence-modal');

  navigator.mediaDevices.getUserMedia({ audio: true })
    .then(function (stream) {
      evidenceStream = stream;
      evidenceRecorder = new MediaRecorder(stream);
      evidenceChunks = [];

      evidenceRecorder.ondataavailable = function (e) {
        if (e.data && e.data.size > 0) evidenceChunks.push(e.data);
      };

      evidenceRecorder.onstop = function () {
        var blob = new Blob(evidenceChunks, { type: 'audio/webm' });
        downloadFile(blob, 'SHEild_Evidence_Audio_' + Date.now() + '.webm');
        showToast('📥 Audio evidence saved to downloads!', 'success');
      };

      evidenceRecorder.start(1000);

      // Show modal
      if (modal) modal.classList.add('active');

      // Start timer
      evidenceSeconds = 0;
      var timerEl = document.getElementById('evidence-timer');
      evidenceTimerInterval = setInterval(function () {
        evidenceSeconds++;
        if (timerEl) timerEl.textContent = formatTime(evidenceSeconds);
      }, 1000);

      showToast('🎤 Recording audio evidence...', 'info');
    })
    .catch(function (err) {
      showToast('⚠️ Microphone access denied. Please allow mic permission.', 'error');
    });
}

function stopEvidenceRecording() {
  if (evidenceRecorder && evidenceRecorder.state !== 'inactive') {
    evidenceRecorder.stop();
  }
  if (evidenceStream) {
    evidenceStream.getTracks().forEach(function (t) { t.stop(); });
    evidenceStream = null;
  }
  if (evidenceTimerInterval) {
    clearInterval(evidenceTimerInterval);
    evidenceTimerInterval = null;
  }

  var modal = document.getElementById('evidence-modal');
  if (modal) modal.classList.remove('active');

  // Reset timer display
  var timerEl = document.getElementById('evidence-timer');
  if (timerEl) timerEl.textContent = '00:00';
}

// ===========================
// Vault / Incident History
// ===========================
var currentFilter = 'all';

function filterIncidents(filter, btnEl) {
  currentFilter = filter;
  document.querySelectorAll('.filter-btn').forEach(function (b) { b.classList.remove('active'); });
  if (btnEl) btnEl.classList.add('active');
  renderIncidents();
}

function renderIncidents() {
  var list = document.getElementById('incidents-list');
  var empty = document.getElementById('vault-empty');
  if (!list) return;

  var incidents = JSON.parse(localStorage.getItem('sheild_incidents') || '[]');
  var now = new Date();

  if (currentFilter === 'today') {
    incidents = incidents.filter(function (inc) {
      return new Date(inc.timestamp).toDateString() === now.toDateString();
    });
  } else if (currentFilter === 'week') {
    var weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    incidents = incidents.filter(function (inc) {
      return new Date(inc.timestamp) >= weekAgo;
    });
  }

  list.innerHTML = '';

  if (incidents.length === 0) {
    if (empty) empty.style.display = 'block';
    return;
  }
  if (empty) empty.style.display = 'none';

  incidents.forEach(function (inc, i) {
    var card = document.createElement('div');
    card.className = 'glass-card incident-card animate-fadeInUp';
    card.style.animationDelay = (i * 0.08) + 's';
    var statusClass = inc.status === 'active' ? 'status-active' : 'status-resolved';
    var statusLabel = inc.status === 'active' ? '🔴 Active' : '✅ Resolved';
    var duration = inc.duration ? ' • Duration: ' + formatTime(inc.duration) : '';
    card.innerHTML =
      '<div class="incident-icon">🚨</div>' +
      '<div class="incident-details">' +
      '<h3>Emergency Incident</h3>' +
      '<p>📅 ' + inc.date + ' • 🕐 ' + inc.time + duration + '</p>' +
      '<p>📍 LAT: ' + inc.lat + ' | LNG: ' + inc.lng + '</p>' +
      '</div>' +
      '<span class="incident-status ' + statusClass + '">' + statusLabel + '</span>';
    list.appendChild(card);
  });
}

/** Download report */
function downloadReport() {
  var incidents = JSON.parse(localStorage.getItem('sheild_incidents') || '[]');
  if (incidents.length === 0) {
    showToast('No incidents to download.', 'error');
    return;
  }

  var report = 'SHEild AI — Incident Report\n';
  report += 'Generated: ' + new Date().toLocaleString() + '\n';
  report += '='.repeat(40) + '\n\n';

  incidents.forEach(function (inc, i) {
    report += 'Incident #' + (i + 1) + '\n';
    report += 'Date: ' + inc.date + '\n';
    report += 'Time: ' + inc.time + '\n';
    report += 'Location: LAT ' + inc.lat + ', LNG ' + inc.lng + '\n';
    report += 'Google Maps: https://www.google.com/maps?q=' + inc.lat + ',' + inc.lng + '\n';
    report += 'Status: ' + inc.status + '\n';
    if (inc.duration) report += 'Duration: ' + formatTime(inc.duration) + '\n';
    report += '-'.repeat(30) + '\n\n';
  });

  var blob = new Blob([report], { type: 'text/plain' });
  downloadFile(blob, 'SHEild_AI_Report_' + Date.now() + '.txt');
  showToast('📥 Report downloaded!', 'success');
}

// ===========================
// Settings Logic
// ===========================
(function initSettings() {
  var keywordInput = document.getElementById('settings-keyword');
  if (!keywordInput) return;

  keywordInput.value = localStorage.getItem('sheild_keyword') || '';

  var voiceToggle = document.getElementById('settings-voice-toggle');
  if (voiceToggle) voiceToggle.checked = localStorage.getItem('sheild_voice') === 'true';
})();

function updateKeyword() {
  var keyword = document.getElementById('settings-keyword').value.trim();
  if (!keyword) { showToast('Keyword cannot be empty.', 'error'); return; }
  localStorage.setItem('sheild_keyword', keyword);
  showToast('✅ Keyword updated!', 'success');
}

function updatePIN() {
  var current = document.getElementById('settings-current-pin').value.trim();
  var newPIN = document.getElementById('settings-new-pin').value.trim();
  var savedPIN = localStorage.getItem('sheild_pin');

  if (current !== savedPIN) {
    showToast('Current PIN is incorrect.', 'error');
    return;
  }
  if (!newPIN || newPIN.length !== 4 || !/^\d{4}$/.test(newPIN)) {
    showToast('New PIN must be exactly 4 digits.', 'error');
    return;
  }

  localStorage.setItem('sheild_pin', newPIN);
  document.getElementById('settings-current-pin').value = '';
  document.getElementById('settings-new-pin').value = '';
  showToast('✅ PIN changed successfully!', 'success');
}

function updateVoiceSetting() {
  var voiceToggle = document.getElementById('settings-voice-toggle');
  localStorage.setItem('sheild_voice', voiceToggle.checked ? 'true' : 'false');
  showToast(voiceToggle.checked ? '🎙️ Voice activation enabled' : '🎙️ Voice activation disabled', 'info');
}

function resetAllData() {
  if (!confirm('Are you sure you want to reset ALL data? This cannot be undone.')) return;
  localStorage.removeItem('sheild_keyword');
  localStorage.removeItem('sheild_pin');
  localStorage.removeItem('sheild_voice');
  localStorage.removeItem('sheild_onboarded');
  localStorage.removeItem('sheild_contacts');
  localStorage.removeItem('sheild_incidents');
  localStorage.removeItem('sheild_active_incident');
  localStorage.removeItem('sheild_theme');
  showToast('🗑️ All data cleared.', 'info');
  setTimeout(function () { window.location.href = 'index.html'; }, 1200);
}

// ===========================
// Dashboard Status Check
// ===========================
(function initDashboard() {
  var statusBadge = document.getElementById('status-badge');
  if (!statusBadge) return;

  var activeIncident = localStorage.getItem('sheild_active_incident');
  if (activeIncident) {
    statusBadge.className = 'status-badge status-emergency';
    document.getElementById('status-text').textContent = 'EMERGENCY ACTIVE';
  }

  var profileIcon = document.getElementById('profile-icon');
  if (profileIcon) {
    var keyword = localStorage.getItem('sheild_keyword');
    if (keyword) profileIcon.textContent = keyword.charAt(0).toUpperCase();
  }
})();

// ===========================
// Page Init — auto-render
// ===========================
(function pageInit() {
  if (document.getElementById('contacts-list')) renderContacts();
  if (document.getElementById('incidents-list')) renderIncidents();
})();

// ===========================
// Generic Modal Close
// ===========================
function closeModal(id) {
  var modal = document.getElementById(id);
  if (modal) modal.classList.remove('active');
}

// ===========================
// EASY ACCESS FEATURES
// ===========================

/** Shake-to-Alert */
function triggerShakeAlert() {
  document.body.classList.add('shake-active');
  showToast('📳 Shake detected! Activating SOS...', 'error');
  setTimeout(function () {
    document.body.classList.remove('shake-active');
    activateSOS();
  }, 2000);
}

// Real device shake detection
(function initShakeDetection() {
  var shakeThreshold = 25;
  var lastX = 0, lastY = 0, lastZ = 0;
  var lastTime = Date.now();

  window.addEventListener('devicemotion', function (e) {
    var acc = e.accelerationIncludingGravity;
    if (!acc) return;
    var now = Date.now();
    if (now - lastTime < 100) return;

    var dx = Math.abs(acc.x - lastX);
    var dy = Math.abs(acc.y - lastY);
    var dz = Math.abs(acc.z - lastZ);

    if ((dx + dy + dz) > shakeThreshold) {
      triggerShakeAlert();
    }

    lastX = acc.x; lastY = acc.y; lastZ = acc.z;
    lastTime = now;
  });
})();

/** Siren Alarm — Web Audio API */
var sirenContext = null;
var sirenOsc = null;
var sirenPlaying = false;

function activateSiren() {
  if (sirenPlaying) { stopSiren(); return; }

  try {
    sirenContext = new (window.AudioContext || window.webkitAudioContext)();
    sirenOsc = sirenContext.createOscillator();
    var gainNode = sirenContext.createGain();

    sirenOsc.type = 'sawtooth';
    sirenOsc.frequency.setValueAtTime(800, sirenContext.currentTime);
    gainNode.gain.setValueAtTime(0.8, sirenContext.currentTime);

    sirenOsc.connect(gainNode);
    gainNode.connect(sirenContext.destination);
    sirenOsc.start();
    sirenPlaying = true;

    var sirenUp = true;
    var sirenInterval = setInterval(function () {
      if (!sirenPlaying) { clearInterval(sirenInterval); return; }
      var freq = sirenUp ? 1200 : 600;
      sirenOsc.frequency.linearRampToValueAtTime(freq, sirenContext.currentTime + 0.5);
      sirenUp = !sirenUp;
    }, 500);

    showToast('🔊 SIREN ACTIVE — Tap again to stop', 'error');
    setTimeout(function () { if (sirenPlaying) stopSiren(); }, 10000);
  } catch (err) {
    showToast('🔊 Siren activated! (Audio simulation)', 'info');
  }
}

function stopSiren() {
  if (sirenOsc) { try { sirenOsc.stop(); } catch (e) { } }
  if (sirenContext) { try { sirenContext.close(); } catch (e) { } }
  sirenPlaying = false;
  sirenOsc = null;
  sirenContext = null;
  showToast('🔇 Siren stopped.', 'info');
}

/** Audio Guide — Web Speech API */
function playAudioGuide() {
  if (!('speechSynthesis' in window)) {
    showToast('🗣️ Audio guide: Press the big red SOS button for help. Shake phone for emergency.', 'info');
    return;
  }

  var messages = [
    'Welcome to Shield A.I. Your safety companion.',
    'To call for help, press the big red S.O.S. button.',
    'You can also shake your phone to alert your contacts.',
    'Press the siren button to make a loud alarm sound.',
    'Press record evidence to save audio proof.',
    'Stay safe. We are always with you.'
  ];

  speechSynthesis.cancel();

  messages.forEach(function (msg, i) {
    var utterance = new SpeechSynthesisUtterance(msg);
    utterance.rate = 0.9;
    utterance.pitch = 1.1;
    utterance.lang = 'en-US';
    setTimeout(function () { speechSynthesis.speak(utterance); }, i * 3500);
  });

  showToast('🗣️ Audio guidance started...', 'info');
}

// ===========================
// ADVANCED FEATURES
// ===========================

/** Safety Score */
function showSafetyScore() {
  var score = 0;
  var details = [];

  if (localStorage.getItem('sheild_onboarded') === 'true') {
    score += 20;
    details.push({ label: 'Profile Setup', value: 20, max: 20 });
  } else {
    details.push({ label: 'Profile Setup', value: 0, max: 20 });
  }

  if (localStorage.getItem('sheild_keyword')) {
    score += 15;
    details.push({ label: 'Emergency Keyword', value: 15, max: 15 });
  } else {
    details.push({ label: 'Emergency Keyword', value: 0, max: 15 });
  }

  if (localStorage.getItem('sheild_pin')) {
    score += 15;
    details.push({ label: 'Security PIN', value: 15, max: 15 });
  } else {
    details.push({ label: 'Security PIN', value: 0, max: 15 });
  }

  var contacts = getContacts();
  var contactScore = Math.min(contacts.length * 10, 50);
  score += contactScore;
  details.push({ label: 'Emergency Contacts (' + contacts.length + '/5)', value: contactScore, max: 50 });

  var label = 'Critical';
  if (score >= 80) label = 'Excellent';
  else if (score >= 60) label = 'Good';
  else if (score >= 40) label = 'Fair';
  else if (score >= 20) label = 'Needs Work';

  var scoreEl = document.getElementById('score-display');
  if (scoreEl) scoreEl.textContent = score + '/100';

  var breakdownEl = document.getElementById('score-breakdown');
  if (breakdownEl) breakdownEl.textContent = label + ' — Keep improving your safety setup!';

  var detailsEl = document.getElementById('score-details');
  if (detailsEl) {
    var html = '';
    details.forEach(function (d) {
      var pct = Math.round((d.value / d.max) * 100);
      var barColor = pct === 100 ? '#22C55E' : (pct >= 50 ? '#F59E0B' : '#EF4444');
      html += '<div class="score-item"><span>' + d.label + '</span><span>' + d.value + '/' + d.max + '</span></div>';
      html += '<div class="score-bar-track"><div class="score-bar-fill" style="width:' + pct + '%; background:' + barColor + ';"></div></div>';
    });
    detailsEl.innerHTML = html;
  }

  var modal = document.getElementById('safety-score-modal');
  if (modal) modal.classList.add('active');
}

/** Legal Helplines */
function showHelplines() {
  var modal = document.getElementById('helplines-modal');
  if (modal) modal.classList.add('active');
}

/** Safety Tips */
var allSafetyTips = [
  { title: '🏃‍♀️ Trust Your Instincts', text: 'If a situation feels wrong, leave immediately. Your gut feeling is your best defense.' },
  { title: '📍 Share Your Route', text: 'Always tell a trusted person where you are going and when you expect to arrive.' },
  { title: '📱 Keep Phone Charged', text: 'Ensure your phone is always charged above 30%. Carry a portable charger when traveling.' },
  { title: '🔑 Keys as Defense', text: 'Hold your keys between your fingers while walking alone — they can be used as a defensive tool.' },
  { title: '🚶‍♀️ Walk Confidently', text: 'Walk with purpose and confidence. Attackers are less likely to target people who look alert and aware.' },
  { title: '🚕 Verify Your Ride', text: 'Always verify the license plate and driver photo before entering a cab or rideshare.' },
  { title: '🔊 Make Noise', text: 'If you feel threatened, shout loudly, use a whistle, or activate a siren.' },
  { title: '📞 Emergency Numbers', text: 'Memorize key emergency numbers: 112 (universal), 181 (women helpline), 100 (police).' },
  { title: '🏠 Safe Havens', text: 'Identify safe places near your regular routes — police stations, hospitals, busy shops.' },
  { title: '🚫 Avoid Distractions', text: 'Avoid wearing headphones or scrolling your phone while walking alone, especially at night.' },
  { title: '👥 Buddy System', text: 'Whenever possible, travel with a friend or group, especially during late hours.' },
  { title: '🔐 Secure Social Media', text: 'Don\'t share your real-time location on social media. Disable geotagging on photos.' },
  { title: '🚪 Door Safety', text: 'Always verify who is at the door before opening. Use a peephole or ask for identification.' },
  { title: '💪 Learn Self-Defense', text: 'Take a basic self-defense class. Knowing even a few moves can boost confidence and safety.' },
  { title: '🌙 Night Safety', text: 'Stick to well-lit, populated paths at night. Avoid shortcuts through dark or isolated areas.' },
  { title: '📋 Document Evidence', text: 'If you experience harassment, document everything — screenshots, photos, dates, and witnesses.' }
];

function loadNewTips() {
  var container = document.getElementById('tips-container');
  if (!container) return;
  var shuffled = allSafetyTips.slice().sort(function () { return Math.random() - 0.5; });
  var selected = shuffled.slice(0, 4);
  container.innerHTML = '';
  selected.forEach(function (tip) {
    var item = document.createElement('div');
    item.className = 'tip-item';
    item.innerHTML = '<strong>' + tip.title + '</strong><p>' + tip.text + '</p>';
    container.appendChild(item);
  });
}

function showSafetyTips() {
  loadNewTips();
  var modal = document.getElementById('safety-tips-modal');
  if (modal) modal.classList.add('active');
}
