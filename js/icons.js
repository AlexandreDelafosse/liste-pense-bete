// Illustrations des tuiles (style « petits dessins colorés »).
// Chaque dessin est un SVG de 32 × 32. Les articles sans dessin gardent leur lettre.
import { norm } from './utils.js';

const S = 'stroke-linecap="round" stroke-linejoin="round"';
const shade = d => `<path fill="#000" opacity=".08" d="${d}"/>`;

const ART = {
  // ----- Fruits & légumes -----
  pomme: `<path fill="#e5483a" d="M16 11c-4-3-10.5-1-10.5 6.5S10.5 28.5 14 28.5c1 0 1.5-.5 2-.5s1 .5 2 .5c3.5 0 8.5-4 8.5-11S20 8 16 11z"/><path fill="#ff7a68" d="M9 15c0-2.5 2-4 3.5-4-1 1.5-1.5 3-1.5 5z"/><path d="M16 11c0-3 1-5 2.5-6.5" stroke="#6b4423" stroke-width="2" ${S} fill="none"/><path fill="#3f9a3a" d="M18 8c2-3 5-3.2 6.8-2-2 3-4.8 3.2-6.8 2z"/>`,
  banane: `<g transform="translate(16 16) scale(1.2) translate(-16 -16)"><path fill="#f5c92c" d="M6 8.5c.5 9.5 7 16 19.5 14.5 1.2-.2 1.6-1.6.6-2.3C17 20 12 15 10 8c-.5-1.8-4.1-1.8-4 .5z"/><path fill="#e0a81c" d="M10 8c2 7 7 12 16.1 12.7-.1.8-.6 1.6-.6 2.3C16 23.5 10.5 17 9 10z"/><path fill="#6b4423" d="M5.6 6.5h3.6v2.5H5.6z"/></g>`,
  tomate: `<circle cx="16" cy="18" r="10" fill="#e5483a"/><ellipse cx="11.5" cy="14.5" rx="2.2" ry="3" fill="#ff7a68" transform="rotate(30 11.5 14.5)"/>${shade('M26 18a10 10 0 0 1-10 10c5-2 7-6 7-10s-1-7-3-9c4 1 6 5 6 9z')}<path fill="#3f9a3a" d="M16 7l1.8 3 3.4-.6-1.8 2.9H12.6L10.8 9.4l3.4.6z"/>`,
  carotte: `<path fill="#f08a24" d="M23.5 8.5c2 2 2 4.2 0 6.2L9.4 27.2c-2 1.5-4.4-.6-3-2.7L17.2 9.7c2-2.4 4.4-3.1 6.3-1.2z"/><path d="M13 17l2.5 1.8M10.5 21.5l2.2 1.5M17 12.5l2 1.5" stroke="#c9661a" stroke-width="1.6" ${S}/><path fill="#3f9a3a" d="M23 8.5c.5-3 2.5-5 5-5-.8 2.4-2 4.4-4 5.6zM24 9.6c3-1.2 5.5-.4 6.8 1-2.4 1-4.6.8-6.8-.4z"/>`,
  salade: `<circle cx="10.5" cy="18" r="7" fill="#5fae45"/><circle cx="21.5" cy="18" r="7" fill="#5fae45"/><circle cx="16" cy="12.5" r="7" fill="#6cbf4f"/><circle cx="16" cy="20" r="6.5" fill="#8fd46a"/><path d="M16 26V15M16 19l-3-3M16 21l3-3" stroke="#4a9a35" stroke-width="1.5" ${S} fill="none"/>`,
  oignon: `<path fill="#c98a4b" d="M16 7c-1 3.5-9.5 7-9.5 13.5C6.5 25 10.5 28 16 28s9.5-3 9.5-7.5C25.5 14 17 10.5 16 7z"/><path d="M16 9c-2 4-4 8-4 12.5S13.5 27 16 28M16 9c2 4 4 8 4 12.5S18.5 27 16 28" stroke="#e8b47a" stroke-width="1.4" fill="none"/><path d="M15 7.5c0-2 .5-3.5 1-4.5M17 7.5c.3-1.6 1-2.8 2-3.5" stroke="#3f9a3a" stroke-width="1.8" ${S} fill="none"/>`,
  citron: `<ellipse cx="16" cy="17" rx="10.5" ry="7.5" fill="#f7d33a" transform="rotate(-30 16 17)"/><path fill="#f7d33a" d="M23 8.5l3.5-1.5-1 3.5zM9 25.5l-3.5 1.5 1-3.5z"/><ellipse cx="13" cy="15" rx="3" ry="1.6" fill="#fff1a0" transform="rotate(-30 13 15)"/>`,
  orange: `<circle cx="16" cy="18" r="10" fill="#f39a2b"/><circle cx="12" cy="14.5" r="2.4" fill="#ffc06a"/>${shade('M26 18a10 10 0 0 1-10 10c5-2 7-6 7-10s-1-7-3-9c4 1 6 5 6 9z')}<path fill="#3f9a3a" d="M16 8.5c1-3 4-4.5 6.5-4-1 2.8-3.5 4.4-6.5 4z"/><circle cx="16" cy="8.6" r="1.2" fill="#6b4423"/>`,
  patate: `<path fill="#c9955c" d="M6 17c0-5 5-9 11-9s10 3 10 8-4 9-10 9-11-3-11-8z"/><path fill="#ddb07a" d="M9 15c1-3 4-4.5 7-4.5-2 1-4 3-4.5 5z"/><circle cx="20" cy="14" r="1" fill="#8a6a42"/><circle cx="13" cy="20" r="1" fill="#8a6a42"/><circle cx="22" cy="20" r="1" fill="#8a6a42"/>`,
  avocat: `<path fill="#4f7a2a" d="M16 4c-4 0-5.5 5-7.5 9.5S6 20 6 22a10 10 0 0 0 20 0c0-2-.5-4-2.5-8.5S20 4 16 4z"/><path fill="#c5df7a" d="M16 7c-2.8 0-4 4-5.6 7.6S8.8 19.8 8.8 21.5a7.2 7.2 0 0 0 14.4 0c0-1.7-.4-3.3-1.6-6.9S18.8 7 16 7z"/><circle cx="16" cy="21" r="4.2" fill="#8a5a2b"/><circle cx="14.6" cy="19.6" r="1.2" fill="#b07a45"/>`,
  fraise: `<path fill="#e53e4a" d="M16 28.5c-6-3.5-10.5-9-10.5-14 0-3 2-4.5 5-4.5h11c3 0 5 1.5 5 4.5 0 5-4.5 10.5-10.5 14z"/><g fill="#ffd966"><circle cx="11" cy="14" r=".9"/><circle cx="16" cy="13.5" r=".9"/><circle cx="21" cy="14" r=".9"/><circle cx="13.5" cy="18.5" r=".9"/><circle cx="18.5" cy="18.5" r=".9"/><circle cx="16" cy="23" r=".9"/></g><path fill="#3f9a3a" d="M9.5 10.5L13 7l3 2.5L19 7l3.5 3.5z"/>`,
  raisin: `<g fill="#8e44ad"><circle cx="12" cy="12" r="3.5"/><circle cx="19" cy="12" r="3.5"/><circle cx="15.5" cy="17.5" r="3.5"/><circle cx="9" cy="17.5" r="3.5"/><circle cx="22" cy="17.5" r="3.5"/><circle cx="12.5" cy="23" r="3.5"/><circle cx="19" cy="23" r="3.5"/><circle cx="16" cy="28" r="3"/></g><g fill="#b071cc"><circle cx="11" cy="11" r="1"/><circle cx="14.5" cy="16.5" r="1"/><circle cx="11.5" cy="22" r="1"/></g><path d="M15.5 8.5c0-2 .5-4 2-5.5" stroke="#6b4423" stroke-width="1.8" ${S} fill="none"/><path fill="#3f9a3a" d="M17 6c2-2.5 5-2.5 7-1.5-2 2.5-5 2.8-7 1.5z"/>`,

  // ----- Frais & crèmerie -----
  lait: `<path fill="#2f6fb5" d="M12 2.5h8v3.5h-8z"/><path fill="#fff" d="M9 12l3-6h8l3 6v16.5H9z"/><path fill="#4f8fd6" d="M9 12l3-6h8l3 6z"/><path fill="#4f8fd6" d="M9 17c3-2 6 2 9 0s4 0 5 0v5H9z"/>${shade('M20 6l3 6v16.5h-3z')}`,
  oeuf: `<path fill="#e8c9a0" d="M22 9.5c3.3 0 6.5 6 6.5 10.5a6.5 6.5 0 0 1-13 0c0-4.5 3.2-10.5 6.5-10.5z"/><path fill="#fff6ea" d="M11 5.5c4.2 0 7.5 7 7.5 12.5a7.5 7.5 0 0 1-15 0C3.5 12.5 6.8 5.5 11 5.5z"/><ellipse cx="8.5" cy="13" rx="1.6" ry="2.6" fill="#fff" transform="rotate(20 8.5 13)"/>${shade('M18.5 18a7.5 7.5 0 0 1-7.5 7.5c3-2 4.5-6 4-12 2 1 3.5 3 3.5 4.5z')}`,
  beurre: `<path fill="#ffe98a" d="M5 14l5-4.5h17L22 14z"/><path fill="#fff3b8" d="M5 14h17v11H5z"/><path fill="#f2d65a" d="M22 14l5-4.5V21l-5 4z"/><path fill="#4f8fd6" d="M5 18.5h17v4H5zM22 18.5l5-4v3.8l-5 4.2z"/>`,
  fromage: `<path fill="#f5c542" d="M4 16h24v10H4z"/><path fill="#ffdd70" d="M4 16l17-8 7 8z"/><g fill="#e0a92a"><circle cx="9" cy="20" r="1.8"/><circle cx="16" cy="23" r="1.4"/><circle cx="22" cy="19.5" r="2"/><ellipse cx="17" cy="13" rx="1.6" ry=".8"/></g>`,
  yaourt: `<path fill="#fff" d="M8 11h16l-2 17H10z"/><rect x="6.5" y="7" width="19" height="4.5" rx="1.5" fill="#9ad0ff"/><circle cx="16" cy="19.5" r="3.6" fill="#e5483a"/><path fill="#3f9a3a" d="M14.5 16.3l1.5 1 1.5-1-.5 1.6h-2z"/>${shade('M22 11h2l-2 17h-2z')}`,
  jambon: `<rect x="7" y="8" width="21" height="13" rx="6.5" fill="#f9c4c7" stroke="#fff" stroke-width="2"/><rect x="4" y="13" width="22" height="13" rx="6.5" fill="#f5a3a8" stroke="#fff" stroke-width="2"/><path d="M9 19c3-2 8-2 11 0" stroke="#fbd3d6" stroke-width="1.8" stroke-linecap="round" fill="none"/>`,

  // ----- Viande & poisson -----
  poulet: `<ellipse cx="13" cy="13" rx="8.5" ry="7" fill="#d9853b" transform="rotate(-40 13 13)"/><ellipse cx="11" cy="11" rx="3" ry="2" fill="#eba25a" transform="rotate(-40 11 11)"/><path d="M18 18l6 6" stroke="#f6efe2" stroke-width="3.2" ${S}/><circle cx="25.5" cy="23" r="2.2" fill="#f6efe2"/><circle cx="23" cy="25.5" r="2.2" fill="#f6efe2"/>`,
  poisson: `<path fill="#f28b6a" d="M4 16c4-6 10-8 16-6 2 .6 3.5 2 4.5 3.5L29 9v14l-4.5-4.5C23.5 20 22 21.4 20 22c-6 2-12 0-16-6z"/><path fill="#f6a888" d="M8 16c3-4 7-5.5 11-4.5-3 1-6 3-7 6z"/><circle cx="9" cy="15" r="1.4" fill="#1d1714"/><path d="M14 12.5c1 2 1 5 0 7" stroke="#d9694a" stroke-width="1.4" ${S} fill="none"/>`,
  viande: `<path fill="#c4453a" d="M5 17c0-6 5-10 12-10s10 4 10 9-4 9-11 9c-6 0-11-2-11-8z"/><path d="M8 17c0-4 4-7 9-7s7 3 7 6" stroke="#fff3ea" stroke-width="2" ${S} fill="none"/><path fill="#a8352c" d="M16 25c6 0 10-3 11-7-1 4-4 9-11 9-6 0-11-2-11-8 1 4 5 6 11 6z"/>`,

  // ----- Boulangerie -----
  pain: `<g transform="rotate(-35 16 16)"><rect x="2" y="11" width="28" height="10" rx="5" fill="#c97b2e"/><rect x="2" y="11" width="28" height="5" rx="2.5" fill="#e09a4a"/><path d="M9 13l2 5M15 13l2 5M21 13l2 5" stroke="#f6d9a4" stroke-width="2.2" stroke-linecap="round"/></g>`,
  croissant: `<path fill="#e09a4a" d="M3 21c2-8 8-13 13-13s11 5 13 13c-3-2-6-2.5-8-.5-1-3.5-3-5-5-5s-4 1.5-5 5c-2-2-5-1.5-8 .5z"/><path d="M11 20.5c.5-3 2-5.5 3.5-7M21 20.5c-.5-3-2-5.5-3.5-7" stroke="#b86e25" stroke-width="1.5" ${S} fill="none"/><path fill="#f2bd72" d="M12 11c2-1.5 6-1.5 8 0-2.5.5-5.5.5-8 0z"/>`,

  // ----- Épicerie -----
  pate: `<rect x="8" y="4.5" width="16" height="24" rx="2" fill="#2f6fb5"/><rect x="11" y="11" width="10" height="11" rx="2" fill="#f7d98a"/><path d="M12.5 13.5l2 2M15 12.5l3 3M12.5 17l4 4M17 17l3 3" stroke="#d9a63a" stroke-width="1.4" ${S}/><path fill="#fff" d="M10 7h12v2H10z" opacity=".7"/>${shade('M20 4.5h2a2 2 0 0 1 2 2v20a2 2 0 0 1-2 2h-2z')}`,
  riz: `<path fill="#fffaf0" d="M6.5 16a9.5 7 0 0 1 19 0z"/><g fill="#e8dcc4"><ellipse cx="12" cy="13" rx="1.2" ry=".6"/><ellipse cx="16" cy="11.5" rx="1.2" ry=".6"/><ellipse cx="20" cy="13.5" rx="1.2" ry=".6"/><ellipse cx="14.5" cy="14.5" rx="1.2" ry=".6"/></g><path fill="#4f8fd6" d="M4.5 16h23a11.5 10 0 0 1-23 0z"/><path fill="#fff" opacity=".35" d="M7 18h18c-.5 1.5-1.2 2.6-2 3.5H9c-.8-.9-1.5-2-2-3.5z"/>`,
  cafe: `<path d="M21 15h2a3 3 0 0 1 0 6h-2" stroke="#fff" stroke-width="2.6" fill="none"/><path fill="#fff" d="M6 12.5h15v9.5a5.5 5.5 0 0 1-5.5 5.5h-4A5.5 5.5 0 0 1 6 22z"/><ellipse cx="13.5" cy="13" rx="7" ry="1.8" fill="#6b3e1f"/>${shade('M17 12.5h4v9.5a5.5 5.5 0 0 1-5.5 5.5h-1c1.5-1 2.5-3 2.5-5.5z')}<path d="M11 3.5c-1 2 1 3 0 5M16 3.5c-1 2 1 3 0 5" stroke="#8a6a52" stroke-width="1.8" stroke-linecap="round" fill="none" opacity=".7"/>`,
  the: `<path d="M21 15h2a3 3 0 0 1 0 6h-2" stroke="#fff" stroke-width="2.6" fill="none"/><path fill="#fff" d="M6 12.5h15v9.5a5.5 5.5 0 0 1-5.5 5.5h-4A5.5 5.5 0 0 1 6 22z"/><ellipse cx="13.5" cy="13" rx="7" ry="1.8" fill="#c98a3a"/><path d="M17 13V6" stroke="#8a6a52" stroke-width="1.2"/><rect x="15" y="3" width="4.5" height="4" rx=".8" fill="#3f9a3a"/>`,
  sucre: `<path fill="#fff" d="M5 15l6-3 6 3v8l-6 3-6-3z"/><path fill="#e6e1da" d="M11 18v8l6-3v-8z"/><path fill="#fff" d="M15 9l6-3 6 3v8l-6 3-6-3z"/><path fill="#e6e1da" d="M21 12v8l6-3V9z"/><path fill="#f3efe9" d="M15 9l6-3 6 3-6 3z"/>`,
  farine: `<path fill="#f3e9d6" d="M8.5 9h15l1.5 19h-18z"/><path fill="#e2d4b8" d="M8.5 9l2-3 2 3 2-3 2 3 2-3 2 3 2-3 1.5 3z"/><path d="M16 25V14M16 16l-2.5-2M16 19l-2.5-2M16 22l-2.5-2M16 16l2.5-2M16 19l2.5-2M16 22l2.5-2" stroke="#c9955c" stroke-width="1.5" ${S} fill="none"/>`,
  huile: `<rect x="13.5" y="2.5" width="5" height="3.5" rx="1" fill="#e5483a"/><path fill="#d8c45a" d="M14 6h4v4l3 4v13a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 11 27V14l3-4z"/><path fill="#e8d870" d="M12.5 15h3v11h-3z"/><rect x="11" y="17" width="10" height="6" fill="#3f9a3a" opacity=".85"/>`,
  chocolat: `<rect x="7" y="4" width="18" height="25" rx="1.5" fill="#6b3e1f"/><g fill="#8a5530"><rect x="9" y="6" width="6.5" height="5" rx=".8"/><rect x="16.5" y="6" width="6.5" height="5" rx=".8"/><rect x="9" y="12" width="6.5" height="5" rx=".8"/><rect x="16.5" y="12" width="6.5" height="5" rx=".8"/></g><path fill="#e5483a" d="M7 18h18v9.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 7 27.5z"/><path fill="#ff7a68" d="M7 18h18v2H7z"/>`,
  confiture: `<rect x="8" y="10" width="16" height="18" rx="3" fill="#c8323f"/><rect x="7" y="5" width="18" height="5.5" rx="1.5" fill="#fff"/><path fill="#e5483a" d="M9 5h3v5.5H9zM15 5h3v5.5h-3zM21 5h3v5.5h-3z"/><rect x="11" y="15" width="10" height="7" rx="1.5" fill="#fff3dc"/><circle cx="16" cy="18.5" r="1.8" fill="#c8323f"/>`,
  sel: `<path fill="#fff" d="M10 12h12l1.5 15.5h-15z"/><path fill="#b8b2ab" d="M10 12c0-4 2.5-7 6-7s6 3 6 7z"/><g fill="#6d625b"><circle cx="14" cy="8.5" r=".8"/><circle cx="18" cy="8.5" r=".8"/><circle cx="16" cy="7" r=".8"/></g>${shade('M19 12h3l1.5 15.5h-3z')}`,

  // ----- Boissons -----
  eau: `<rect x="13" y="2.5" width="6" height="3" rx="1" fill="#2f6fb5"/><path fill="#bfe7fb" d="M13.5 5.5h5v3l3 3.5V27a1.5 1.5 0 0 1-1.5 1.5h-8A1.5 1.5 0 0 1 10.5 27V12l3-3.5z"/><rect x="10.5" y="16" width="11" height="6" fill="#4f8fd6"/><path fill="#fff" opacity=".6" d="M12 12.5h2V27h-2z"/>`,
  jus: `<path fill="#f39a2b" d="M9 12l3-6h8l3 6v16.5H9z"/><path fill="#ffc06a" d="M9 12l3-6h8l3 6z"/><circle cx="16" cy="20" r="4" fill="#fff4d6"/><circle cx="16" cy="20" r="2.5" fill="#f39a2b"/><path d="M18 6V2.5l3-1" stroke="#e5483a" stroke-width="1.8" ${S} fill="none"/>${shade('M20 6l3 6v16.5h-3z')}`,
  vin: `<rect x="14" y="2" width="4" height="9" rx="1" fill="#3a1520"/><path fill="#6b1f2e" d="M14 9h4l3 5v13.5a1.5 1.5 0 0 1-1.5 1.5h-7a1.5 1.5 0 0 1-1.5-1.5V14z"/><rect x="11" y="17" width="10" height="7" rx="1" fill="#f6efe2"/><path fill="#6b1f2e" d="M13 20h6v1.2h-6z"/>`,
  biere: `<path d="M22 13h2.5a3 3 0 0 1 3 3v4a3 3 0 0 1-3 3H22" stroke="#fff" stroke-width="2.4" fill="none"/><path fill="#f2b33d" d="M7 11h15v15a2.5 2.5 0 0 1-2.5 2.5h-10A2.5 2.5 0 0 1 7 26z"/><path fill="#fff" d="M6 10c0-2.5 2-4 4-4 1 0 1.5.5 2 .5.5-1 2-2 3.5-2s3 1 3.5 2c2 0 4 1.5 4 3.5v2H6z"/><path d="M11 15v9M15 15v9M19 15v9" stroke="#f7cc6a" stroke-width="1.5" ${S}/>`,

  // ----- Surgelés -----
  glace: `<path fill="#e8b46a" d="M9.5 14h13L16 30z"/><path d="M11 17l8 5M21 17l-8 5M12.5 21l5 3" stroke="#c98a3a" stroke-width="1.2" fill="none"/><circle cx="16" cy="11" r="6.5" fill="#f39ab5"/><circle cx="13.5" cy="9" r="1.8" fill="#ffc3d4"/><path fill="#f39ab5" d="M9.5 13c1 1 2 1.5 3 1v1h-3zM19.5 14c1 .5 2 .3 3-.6v1.6h-3z"/>`,
  pizza: `<path fill="#d99a4a" d="M4 9c8-4 16-4 24 0l-1.5 3c-7-3.5-14-3.5-21 0z"/><path fill="#f5c542" d="M5.5 12c7-3.5 14-3.5 21 0L16 29z"/><g fill="#d9473a"><circle cx="12" cy="14" r="2"/><circle cx="19.5" cy="14.5" r="2"/><circle cx="16" cy="20" r="2"/></g><circle cx="15" cy="16" r=".9" fill="#3f9a3a"/><circle cx="18" cy="18" r=".9" fill="#3f9a3a"/>`,

  // ----- Maison & hygiène -----
  papiertoilette: `<path fill="#fff" d="M12 15.5h16v8H12z"/><path d="M20 23.5v-4M24 23.5v-4" stroke="#e4d6dc" stroke-width="1.4"/><circle cx="12" cy="15.5" r="8.5" fill="#fff"/><circle cx="12" cy="15.5" r="8.5" fill="none" stroke="#e4d6dc" stroke-width="1.2"/><circle cx="12" cy="15.5" r="3" fill="#c9a98c"/><circle cx="12" cy="15.5" r="1.4" fill="#8a6a52"/>`,
  lessive: `<path fill="#2f6fb5" d="M19 5h5a2 2 0 0 1 2 2v4h-3V8h-4z"/><rect x="17" y="3" width="5" height="4" rx="1" fill="#e5483a"/><path fill="#4f8fd6" d="M8 10a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v16a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 8 26z"/><circle cx="16" cy="18" r="4.5" fill="#fff"/><circle cx="14.5" cy="16.5" r="1.4" fill="#bfe7fb"/><circle cx="17.5" cy="19" r="1" fill="#bfe7fb"/>`,
  eponge: `<path fill="#3f9a3a" d="M5 10.5l3-3h19v5.5l-3 3H5z"/><path fill="#f7d33a" d="M5 16h19v9.5H5z"/><path fill="#d9b520" d="M24 16l3-3v9.5l-3 3z"/><path fill="#2f7a2c" d="M24 10.5l3-3V13l-3 3z"/><path fill="#4fb048" d="M5 10.5h19V16H5z"/><g fill="#e0bc24"><circle cx="9" cy="19" r="1"/><circle cx="14" cy="22" r="1.2"/><circle cx="19.5" cy="19.5" r=".9"/><circle cx="11" cy="23.5" r=".7"/></g>`,
  savon: `<rect x="5" y="13" width="22" height="13" rx="5" fill="#b9e3f5"/><rect x="5" y="13" width="22" height="6" rx="3" fill="#d6effa"/><circle cx="20" cy="8" r="3" fill="#fff" stroke="#b9e3f5" stroke-width="1.2"/><circle cx="25" cy="5" r="1.8" fill="#fff" stroke="#b9e3f5" stroke-width="1"/><circle cx="14" cy="8.5" r="1.6" fill="#fff" stroke="#b9e3f5" stroke-width="1"/>`,
  dentifrice: `<path fill="#fff" d="M4 11h17l4 3v4l-4 3H4c-1 0-1-1-1-1v-8s0-1 1-1z"/><path fill="#4f8fd6" d="M8 11h3v10H8zM14 11h2v10h-2z"/><rect x="25" y="13" width="4" height="6" rx="1" fill="#e5483a"/><path fill="#000" opacity=".06" d="M4 18h21l-4 3H4z"/>`,
  poubelle: `<path fill="#4a4a52" d="M7 13c0-2 2-3 4-3h10c2 0 4 1 4 3l1.5 12.5c.2 2-1.3 3.5-3.3 3.5H8.8c-2 0-3.5-1.5-3.3-3.5z"/><path fill="#5d5d66" d="M9 14c3 1 5 4 5 9-2-2-4-2-5.5-1z"/><path fill="#4a4a52" d="M12 10l2-5 2 3 2-3 2 5z"/><path d="M13 10.5h6" stroke="#f3bfe0" stroke-width="2" ${S}/>`,
  vaisselle: `<path fill="#6cbf4f" d="M10 11c0-2 1.5-3 3-3h6c1.5 0 3 1 3 3v15.5a2 2 0 0 1-2 2h-8a2 2 0 0 1-2-2z"/><rect x="13.5" y="3" width="5" height="5.5" rx="1" fill="#2f7a2c"/><rect x="12.5" y="15" width="7" height="8" rx="1.5" fill="#fff" opacity=".85"/><circle cx="16" cy="19" r="1.8" fill="#bfe7fb"/><circle cx="25" cy="9" r="2.2" fill="#fff" stroke="#bfe7fb"/><circle cx="26.5" cy="14" r="1.4" fill="#fff" stroke="#bfe7fb"/>`
};

// Mots qui renvoient vers un dessin (sans accents, au singulier).
// Les expressions en plusieurs mots sont vérifiées en premier.
const PHRASES = {
  'pomme de terre': 'patate', 'papier toilette': 'papiertoilette', 'liquide vaisselle': 'vaisselle',
  'sac poubelle': 'poubelle', 'sac a dechet': 'poubelle', 'produit vaisselle': 'vaisselle'
};
const WORDS = {
  pomme: 'pomme', banane: 'banane', tomate: 'tomate', carotte: 'carotte', salade: 'salade', laitue: 'salade',
  oignon: 'oignon', echalote: 'oignon', citron: 'citron', orange: 'orange', clementine: 'orange', mandarine: 'orange',
  patate: 'patate', avocat: 'avocat', fraise: 'fraise', raisin: 'raisin',
  lait: 'lait', oeuf: 'oeuf', 'œuf': 'oeuf', beurre: 'beurre', fromage: 'fromage', emmental: 'fromage', comte: 'fromage',
  gruyere: 'fromage', yaourt: 'yaourt', yogourt: 'yaourt', skyr: 'yaourt', jambon: 'jambon',
  poulet: 'poulet', dinde: 'poulet', poisson: 'poisson', saumon: 'poisson', cabillaud: 'poisson', thon: 'poisson',
  viande: 'viande', steak: 'viande', boeuf: 'viande', 'bœuf': 'viande', hache: 'viande', porc: 'viande',
  pain: 'pain', baguette: 'pain', croissant: 'croissant', brioche: 'croissant',
  pate: 'pate', spaghetti: 'pate', coquillette: 'pate', riz: 'riz', cafe: 'cafe', the: 'the', infusion: 'the',
  sucre: 'sucre', farine: 'farine', huile: 'huile', chocolat: 'chocolat', confiture: 'confiture', sel: 'sel',
  eau: 'eau', jus: 'jus', vin: 'vin', biere: 'biere',
  glace: 'glace', pizza: 'pizza',
  pq: 'papiertoilette', lessive: 'lessive', eponge: 'eponge', savon: 'savon', dentifrice: 'dentifrice', poubelle: 'poubelle'
};

// "pommes" → "pomme", "œufs" → "œuf" (mots de plus de 3 lettres)
const singular = w => (w.length > 3 && /[sx]$/.test(w) ? w.slice(0, -1) : w);

// Renvoie le SVG du dessin pour ce nom d'article, ou '' s'il n'y en a pas
export function iconFor(name) {
  const words = norm(name).split(/[\s'’-]+/).filter(Boolean).map(singular);
  const text = ' ' + words.join(' ') + ' ';
  for (const [phrase, key] of Object.entries(PHRASES)) {
    if (text.includes(' ' + phrase + ' ')) return svg(key);
  }
  for (const w of words) if (WORDS[w]) return svg(WORDS[w]);  // premier mot reconnu : « jus d'orange » → jus
  return '';
}

const svg = key => `<svg viewBox="0 0 32 32" aria-hidden="true">${ART[key]}</svg>`;

// Pour la page de test : tous les dessins
export const allIcons = () => Object.keys(ART).map(k => [k, svg(k)]);
