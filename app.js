const translations = {
  de: {
    title: "BikeBox Tauschbörse",
    subtitle: "Finde oder teile Fahrradkartons für den Flugtransport – lokal und nachhaltig.",
    languageLabel: "Sprache",
    createPost: "Neuen Eintrag erstellen",
    typeLabel: "Typ",
    offer: "Angebot",
    request: "Gesuch",
    titleLabel: "Titel",
    cityLabel: "Stadt",
    contactLabel: "Kontakt",
    latLabel: "Breitengrad",
    lngLabel: "Längengrad",
    descLabel: "Beschreibung",
    submitBtn: "Eintrag speichern",
    mapTitle: "Karte",
    mapHint: "Grün = Angebot, Orange = Gesuch",
    listTitle: "Aktuelle Einträge",
    noEntries: "Noch keine Einträge vorhanden.",
    contactPrefix: "Kontakt",
  },
  en: {
    title: "BikeBox Exchange",
    subtitle: "Find or share bike transport boxes for flights — local and sustainable.",
    languageLabel: "Language",
    createPost: "Create a new listing",
    typeLabel: "Type",
    offer: "Offer",
    request: "Request",
    titleLabel: "Title",
    cityLabel: "City",
    contactLabel: "Contact",
    latLabel: "Latitude",
    lngLabel: "Longitude",
    descLabel: "Description",
    submitBtn: "Save listing",
    mapTitle: "Map",
    mapHint: "Green = Offer, Orange = Request",
    listTitle: "Current listings",
    noEntries: "No listings yet.",
    contactPrefix: "Contact",
  },
};

const state = {
  lang: "de",
  posts: [
    {
      id: 1,
      type: "offer",
      title: "2 große Bikeboxen vom Rückflug",
      city: "München",
      contact: "anna@example.com",
      description: "Sauber und stabil, Abholung in Maxvorstadt.",
      lat: 48.1504,
      lng: 11.567,
    },
    {
      id: 2,
      type: "request",
      title: "Suche Bikebox für Flug nach Lissabon",
      city: "Köln",
      contact: "mario@example.com",
      description: "Benötige Box Mitte Mai für Rennrad.",
      lat: 50.9375,
      lng: 6.9603,
    },
  ],
};

const postList = document.getElementById("postList");
const languageSelect = document.getElementById("language");
const postForm = document.getElementById("postForm");

const map = L.map("map").setView([51.1657, 10.4515], 6);
const markersLayer = L.layerGroup().addTo(map);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);

const iconByType = {
  offer: L.divIcon({
    className: "",
    html: '<span style="display:block;width:14px;height:14px;background:#1f7a4d;border:2px solid #fff;border-radius:50%"></span>',
    iconSize: [14, 14],
  }),
  request: L.divIcon({
    className: "",
    html: '<span style="display:block;width:14px;height:14px;background:#dc7f1f;border:2px solid #fff;border-radius:50%"></span>',
    iconSize: [14, 14],
  }),
};

function t(key) {
  return translations[state.lang][key] ?? key;
}

function applyTranslations() {
  document.documentElement.lang = state.lang;
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n;
    el.textContent = t(key);
  });
}

function renderPosts() {
  postList.innerHTML = "";
  markersLayer.clearLayers();

  if (state.posts.length === 0) {
    const emptyItem = document.createElement("li");
    emptyItem.textContent = t("noEntries");
    postList.appendChild(emptyItem);
    return;
  }

  state.posts.forEach((post) => {
    const item = document.createElement("li");
    item.classList.add(post.type);
    item.innerHTML = `
      <div class="entry-top">
        <strong>${post.title}</strong>
        <span class="entry-type ${post.type}">${t(post.type)}</span>
      </div>
      <div class="entry-meta">${post.city} · ${t("contactPrefix")}: ${post.contact}</div>
      <p>${post.description}</p>
    `;
    postList.appendChild(item);

    const marker = L.marker([post.lat, post.lng], { icon: iconByType[post.type] }).bindPopup(`
      <strong>${post.title}</strong><br/>
      ${t(post.type)} · ${post.city}<br/>
      ${post.description}
    `);

    markersLayer.addLayer(marker);
  });
}

postForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const newPost = {
    id: Date.now(),
    type: document.getElementById("type").value,
    title: document.getElementById("postTitle").value.trim(),
    city: document.getElementById("city").value.trim(),
    contact: document.getElementById("contact").value.trim(),
    description: document.getElementById("description").value.trim(),
    lat: Number.parseFloat(document.getElementById("lat").value),
    lng: Number.parseFloat(document.getElementById("lng").value),
  };

  state.posts.unshift(newPost);
  renderPosts();
  postForm.reset();
});

languageSelect.addEventListener("change", (event) => {
  state.lang = event.target.value;
  applyTranslations();
  renderPosts();
});

applyTranslations();
renderPosts();
