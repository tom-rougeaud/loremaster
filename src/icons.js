/* ═══ LORE MASTER — icônes de thèmes (SVG en ligne, 24×24, trait « currentColor »)
   • TICO[nom]            → chaîne <svg …> (hérite de la couleur du texte ; épaisseur 1,7)
   • themeIcon(nom, cls)  → <span class="tico [cls]">…</span> prêt à insérer (cls = "lg" pour la grande taille) ;
                            nom inconnu ou vide → le d20 (TICO.des)
   • TICO_NAMES           → liste triée des noms disponibles
   Pour ajouter une icône : une ligne dans la table T ci-dessous (contenu SVG seul, viewBox 24×24, trait uniquement ;
   fill="currentColor" pour un petit aplat) — voir DESIGN_NOTES.md. Aperçu : assets/icons_preview.html. */
(function (root) {
  "use strict";
  function S(p) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + p + '</svg>';
  }
  var D = ' fill="currentColor" stroke="none"'; /* petit aplat (yeux, gemmes) */
  var T = {
    /* ── les 19 icônes de royaumes (v1) ── */
    crane: '<path d="M12 3C7.6 3 4.5 6 4.5 10c0 2.6 1.3 4.2 3 5.2V19a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1v-3.8c1.7-1 3-2.6 3-5.2C19.5 6 16.4 3 12 3z"/><circle cx="9" cy="10.5" r="1.7"' + D + '/><circle cx="15" cy="10.5" r="1.7"' + D + '/><path d="M12 12.8l-.9 2.2h1.8zM9.8 20v-2.6M12 20v-2.6M14.2 20v-2.6"/>',
    cornes: '<path d="M4.5 3c-1.2 5 0 8.300 4.300 9.500M19.500 3c1.200 5 0 8.300-4.300 9.500"/><path d="M8.800 12.500C8.200 16 9.500 19.500 12 21c2.500-1.500 3.800-5 3.200-8.500"/><path d="M10 17.500h.01M14 17.500h.01" stroke-width="2.4"/><path d="M9 12.600c1.800-1 4.200-1 6 0"/>',
    geant: '<circle cx="15" cy="5.5" r="3"/><path d="M8 21v-7c0-3 3-5.500 7-5.500s7 2.500 7 5.500v7"/><circle cx="3.800" cy="14.500" r="1.300"/><path d="M3.800 16v5M2 18l1.800 1 1.800-1"/>',
    oeil: '<path d="M2 12s3.600-7 10-7 10 7 10 7-3.600 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3.200"/><circle cx="12" cy="12" r="1.100"' + D + '/>',
    feuille: '<path d="M5 19C4.500 10 10 4.500 20 4c.5 10-4.500 15.500-15 15z"/><path d="M5 19c3-5.500 6.500-9 11-11.500"/>',
    masque: '<path d="M4 5h16v6.200c0 4.800-3.500 8-8 8s-8-3.200-8-8z"/><path d="M7.500 9.800l3 1.200M16.500 9.800l-3 1.200"/><path d="M9 15c1.600 1.100 4.400 1.100 6 0"/>',
    porte: '<path d="M6 21V9a6 6 0 0 1 12 0v12"/><path d="M3 21h18M12 3v18" opacity=".45"/><circle cx="14.800" cy="14.500" r=".9"' + D + '/>',
    portail: '<ellipse cx="12" cy="12" rx="6.500" ry="9.500"/><ellipse cx="12" cy="12" rx="3.200" ry="5.800"/><path d="M12 2v1.500M12 20.500V22M2.500 12H4M20 12h1.500"/>',
    loup: '<path d="M4 3l4.200 4h7.600L20 3v10c0 4-3.300 7.200-8 8-4.700-.8-8-4-8-8z"/><path d="M8.800 12.300l2 1M15.200 12.300l-2 1"/><path d="M10.300 17.200h3.400L12 19z"' + D + '/>',
    vague: '<path d="M2 8.500c2.500-3 4.500-3 7 0s4.500 3 7 0 3.500-2.500 6 0"/><path d="M2 14c2.500-3 4.500-3 7 0s4.500 3 7 0 3.500-2.500 6 0"/><path d="M2 19.500c2.500-3 4.500-3 7 0s4.500 3 7 0 3.500-2.500 6 0" opacity=".55"/>',
    griffe: '<path d="M4 3c1.500 7 4 13 8 18M10 3c1.500 7 4 13 8 18M16 3c1 5 2.500 9 5 13"/>',
    engrenage: '<circle cx="12" cy="12" r="3.200"/><circle cx="12" cy="12" r="6.600"/><path d="M12 2.500v3M12 18.500v3M2.500 12h3M18.500 12h3M5.300 5.300l2.100 2.100M16.600 16.600l2.100 2.100M5.300 18.700l2.100-2.100M16.600 7.400l2.100-2.100"/>',
    visage: '<circle cx="12" cy="12" r="9"/><circle cx="9" cy="10" r="1"' + D + '/><circle cx="15" cy="10" r="1"' + D + '/><path d="M8.300 14.500c1 1.600 2.300 2.300 3.700 2.300s2.700-.7 3.700-2.300"/>',
    epee: '<path d="M14.500 5.500L19.800 3.800 18.100 9.200 9.200 18l-3.200-3.200z"/><path d="M5 12.500l6.500 6.500M7.500 17.500L3.500 21.500M3 17l1.500 1.500"/>',
    etoile: '<path d="M12 2.800l2.800 5.800 6.300.9-4.600 4.400 1.100 6.300L12 17.200l-5.600 3 1.100-6.300L2.900 9.500l6.300-.9z"/>',
    dragon: '<path d="M12 21c-1.500-3-1.500-6.500 0-9.500 1.500 3 1.500 6.500 0 9.500z"/><path d="M11 12.500C8 8.500 5 7 2 8c1 1.500 1.500 3 1 5 1.500-.5 3-.5 4.500.5-.5 1 0 2 1 2.500M13 12.500c3-4 6-5.500 9-4.500-1 1.500-1.500 3-1 5-1.500-.5-3-.5-4.500.5.500 1 0 2-1 2.500"/><path d="M12 11.500V6l-1.500-3M12 6l1.500-3"/>',
    colonne: '<path d="M4 4h16M5.500 7h13M8 7v11M12 7v11M16 7v11M5.500 18h13M3.500 21h17"/>',
    anneau: '<path d="M9 3.500h6l2 3.200-5 3.500-5-3.500z"/><path d="M9 6.700h6" opacity=".5"/><circle cx="12" cy="16" r="5.200"/>',
    des: '<path d="M12 2l8.500 5v10L12 22l-8.500-5V7z"/><path d="M12 2L8 14.500h8zM3.500 7L8 14.500M20.500 7L16 14.500M8 14.500l4 7.500M16 14.500L12 22"/>',

    /* ── bibliothèque pour les futurs lots ── */
    rune: '<path d="M9 3v18M9 8l7.500 4-7.500 4"/><path d="M5 5.500l4 2.500" opacity=".5"/>',
    ankh: '<ellipse cx="12" cy="7" rx="3.300" ry="4.200"/><path d="M12 11.200V21M6.500 14h11"/>',
    trefle: '<circle cx="8.800" cy="8.800" r="3.300"/><circle cx="15.200" cy="8.800" r="3.300"/><circle cx="12" cy="14" r="3.300"/><path d="M12 16.500c.2 2 1 3.500 2.500 4.500"/>',
    chateau: '<path d="M3 21V6h3v2h2V6h8v2h2V6h3v15z"/><path d="M10 21v-4a2 2 0 0 1 4 0v4M7 12v1.500M17 12v1.500"/>',
    bouclier: '<path d="M12 3l8 3v6c0 5-3.500 8-8 9-4.500-1-8-4-8-9V6z"/><path d="M12 3v18M4 11.500h16" opacity=".5"/>',
    heaume: '<path d="M5 20v-8.500a7 7 0 0 1 14 0V20z"/><path d="M5 12.500h14M12 12.500V20M8.500 16h.01M15.500 16h.01" stroke-width="2"/><path d="M12 4.500V2.500" />',
    arc: '<path d="M17 3C9 7 9 17 17 21"/><path d="M17 3v18"/><path d="M2.500 12h16M15 9l3.500 3-3.500 3M2.500 12l-1.500-2M2.500 12l-1.500 2"/>',
    hache: '<path d="M12 3v18"/><path d="M12 4C7 3 4 5 3 9c3 1 6 1 9 0M12 4c5-1 8 1 9 5-3 1-6 1-9 0"/><path d="M10 21h4"/>',
    livre: '<path d="M12 6c-2-1.500-5-2-9-2v14c4 0 7 .5 9 2 2-1.500 5-2 9-2V4c-4 0-7 .5-9 2zM12 6v14"/><path d="M6 8.500c1.500 0 3 .3 4 .8M6 12c1.500 0 3 .3 4 .8" opacity=".5"/>',
    parchemin: '<path d="M8 3h11v13a4 4 0 0 1-4 4H6a3 3 0 0 0 3-3V5a2 2 0 0 0-1-2z"/><path d="M5 3a2 2 0 0 0-2 2v1.500h5"/><path d="M12 8h4M12 12h4"/>',
    fiole: '<path d="M9 3h6M10 3v5.500L5.500 17a3 3 0 0 0 2.700 4.200h7.600a3 3 0 0 0 2.700-4.200L14 8.500V3"/><path d="M7.500 15h9"/><circle cx="11" cy="18" r=".7"' + D + '/><circle cx="14" cy="17" r=".6"' + D + '/>',
    chaudron: '<path d="M4 11h16v2a8 8 0 0 1-16 0z"/><path d="M3 11h18M6.500 19.500L5.500 22M17.500 19.500l1 2.500"/><circle cx="9" cy="6.500" r="1.300"/><circle cx="14.500" cy="5" r="1.900"/>',
    baguette: '<path d="M3.500 20.500L16 8"/><path d="M17.500 3v4M15.500 5h4M20 11v2.500M18.800 12.200h2.500"/><path d="M14.500 9.500l1.500 1.500" stroke-width="3"/>',
    sablier: '<path d="M6 3h12M6 21h12M7 3c0 5 3.500 6 5 9-1.500 3-5 4-5 9M17 3c0 5-3.500 6-5 9 1.500 3 5 4 5 9"/>',
    tarot: '<rect x="5" y="2.500" width="14" height="19" rx="2"/><path d="M12 7.500l1.300 2.800 3 .4-2.200 2.100.6 3L12 14.300 9.300 15.800l.6-3-2.200-2.100 3-.4z"/>',
    lune: '<path d="M20 14.500A8.500 8.500 0 0 1 9.500 4 8.500 8.500 0 1 0 20 14.500z"/><path d="M16 4.500v2.500M14.800 5.700h2.400" opacity=".6"/>',
    soleil: '<circle cx="12" cy="12" r="4"/><path d="M12 2.500v2.500M12 19v2.500M2.500 12H5M19 12h2.500M5.300 5.300L7 7M17 17l1.700 1.700M5.300 18.700L7 17M17 7l1.700-1.700"/>',
    flamme: '<path d="M12 21.500c-4 0-6.500-2.700-6.500-6.200 0-3.500 2.500-5.300 3.800-8 .8 1.200 1.400 2 2.200 2.500C11.500 7 12 4.500 12 2.500c3.500 2.500 6.500 6.500 6.500 12.800 0 3.500-2.500 6.200-6.500 6.200z"/><path d="M12 21.500c-1.800 0-3-1.200-3-3 0-2 1.800-2.800 3-5 1.200 2.200 3 3 3 5 0 1.800-1.200 3-3 3z"/>',
    glace: '<path d="M12 2v20M3.300 7l17.400 10M3.300 17L20.700 7"/><path d="M9.500 3.800L12 6.300l2.500-2.500M9.500 20.200L12 17.700l2.500 2.500M3 10.500l3.400.9-.9 3.400M21 10.500l-3.400.9.9 3.400"/>',
    arbre: '<path d="M12 21v-6"/><path d="M12 15.500c-4 0-6.500-2-6.500-4.700 0-1.500.9-2.700 2.200-3.300-.3-3 1.800-4.700 4.300-4.700s4.600 1.700 4.300 4.700c1.300.6 2.200 1.800 2.200 3.300 0 2.700-2.500 4.700-6.500 4.700z"/>',
    champignon: '<path d="M3 12.500a9 8.500 0 0 1 18 0z"/><path d="M9 12.500v5a3 3 0 0 0 6 0v-5"/><circle cx="8" cy="9.500" r="1"' + D + '/><circle cx="14" cy="8" r="1.200"' + D + '/><circle cx="17.500" cy="11" r=".7"' + D + '/>',
    cle: '<circle cx="8" cy="12" r="4.500"/><circle cx="8" cy="12" r="1.300"' + D + '/><path d="M12.500 12H22M18.500 12v4M21.500 12v3"/>',
    couronne: '<path d="M3 18L2 7.500l5.500 4.500L12 4l4.500 8L22 7.500 21 18z"/><path d="M3 21h18"/>',
    trone: '<path d="M7 3h10v8H7zM4.500 11h15v4h-15zM7 15v6M17 15v6M9 21h6"/>',
    carte: '<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z"/><path d="M9 4v14M15 6v14"/>',
    pion: '<circle cx="12" cy="6.800" r="3.200"/><path d="M10 10.500L8.700 17h6.600L14 10.500M6.500 21h11l-1.200-4H7.700z"/>',
    cartes: '<rect x="3.500" y="5.500" width="10" height="14" rx="1.800" transform="rotate(-12 8.500 12.500)"/><rect x="10.500" y="4.500" width="10" height="14" rx="1.800" transform="rotate(10 15.500 11.500)"/><path d="M15.500 10.200c-1-1.400-3-.4-2 1.100l2 2 2-2c1-1.500-1-2.500-2-1.100z"' + D + '/>',
    echiquier: '<rect x="3" y="3" width="18" height="18" rx="1.500"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18" opacity=".5"/><path d="M3 3h6v6H3zM15 3h6v6h-6zM9 9h6v6H9zM3 15h6v6H3zM15 15h6v6h-6z"' + D + ' opacity=".4"/>',
    manette: '<path d="M6.500 8h11a4.500 4.500 0 0 1 4.400 5.300l-.7 3.600a2.600 2.600 0 0 1-4.500 1.300L14.800 16H9.200l-1.900 2.200a2.600 2.600 0 0 1-4.500-1.300l-.7-3.600A4.500 4.500 0 0 1 6.500 8z"/><path d="M7.500 10.800v3M6 12.300h3"/><circle cx="16" cy="11.600" r=".9"' + D + '/><circle cx="18" cy="13.600" r=".9"' + D + '/>',
    camera: '<rect x="2.500" y="7.500" width="13" height="10" rx="2"/><path d="M15.500 11.500l6-3.500v9l-6-3.500"/><path d="M5 5l2 2.500M9 4l1 3.500" opacity=".6"/>',
    'masque-theatre': '<path d="M3 4h10v6a5 5 0 0 1-10 0z"/><path d="M5.800 7.500l1.500.7M10.200 7.500l-1.500.7M6 11c1 .9 3 .9 4 0"/><path d="M11.500 11H21v4.500a4.700 4.700 0 0 1-9.500 0z"/><path d="M14 14.500l1 .4M18.500 14.500l-1 .4M14.500 18c1-1 3-1 4 0"/>',
    plume: '<path d="M20.500 3C11.500 3 6 8 5 17l-1 4 4-1c9-1 14-6 14-15z"/><path d="M4 21L14.500 10.500M9.500 14.500h5"/>',
    chope: '<path d="M5 8h11v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z"/><path d="M16 10.500h2.500a2 2 0 0 1 2 2v2.500a2 2 0 0 1-2 2H16"/><path d="M5 8c0-2.500 2.200-3.500 3.500-1.800C9.700 4.300 12 4.300 13 6c1.200-1.400 3-.8 3 2M9 11.500v6M12.500 11.500v6"/>',
    tour: '<path d="M7 21V9L5 7V3h3v2h2V3h4v2h2V3h3v4l-2 2v12z"/><path d="M10 21v-4a2 2 0 0 1 4 0v4M12 11.500v2"/>',
    'pont-levis': '<path d="M4 21V5h16v16"/><path d="M8 21v-7a4 4 0 0 1 8 0v7"/><path d="M12 10v11M8 16.500h8"/><path d="M2 21h20"/>',
    catapulte: '<path d="M3 20.500h17"/><path d="M6.500 20.500L10 13h7l2.500 7.500"/><path d="M6 6.500L15 15.500"/><circle cx="5" cy="5" r="2.200"/>',
    alambic: '<circle cx="8" cy="16" r="5"/><path d="M11 11.500L19.500 3M13.500 14.500L22 6M19.500 3L22 6"/><path d="M5.500 15.500c.5-1.500 1.500-2.300 3-2.500" opacity=".6"/>',
    pentacle: '<circle cx="12" cy="12" r="9.500"/><path d="M12 2.500L17.600 19.700 3 9.400h18L6.400 19.700z"/>',
    hibou: '<path d="M6 3.500l3.200 2.200h5.600L18 3.500V14a6 6 0 0 1-12 0z"/><circle cx="9.500" cy="10" r="2"/><circle cx="14.500" cy="10" r="2"/><path d="M12 12.500l-1 2h2zM9 21l1-2.500M15 21l-1-2.500"' + D + '/>',
    corbeau: '<circle cx="15" cy="7.500" r="3"/><path d="M18 7l4.200 1.800L18 10.200"/><path d="M12.500 10C8 11 5 14.500 4 20h14c0-4 0-7-2.500-9.500"/><path d="M9 20v2M13 20v2"/><circle cx="14.500" cy="7" r=".7"' + D + '/>',
    serpent: '<path d="M18 4.500H9a3 3 0 0 0 0 6h6a3.500 3.500 0 0 1 0 7H6a2.500 2.500 0 0 0 0 4.500"/><path d="M18 4.500l3.200-1.500M18 4.500l3.200 1.500"/><circle cx="17.200" cy="3.600" r=".7"' + D + '/>',
    araignee: '<ellipse cx="12" cy="14" rx="3.500" ry="4.500"/><circle cx="12" cy="7.800" r="2"/><path d="M8.500 12L4 7.500M8.500 14H3M8.500 16L4 20.500M9.300 17.800L7.500 21.500M15.500 12L20 7.500M15.500 14H21M15.500 16l4.500 4.500M14.700 17.800l1.800 3.700"/>',
    cheval: '<path d="M7 21h10M9 21c0-3 1-5 2-7-3 1-5 0-6-2 0-3 2-5 5-7l1-2 2 2c4 1 7 4 7 9 0 2-.5 4-1 7z"/><circle cx="10.500" cy="9" r=".8"' + D + '/><path d="M14 5c2 1 4 3.500 5 7" opacity=".55"/>',
    licorne: '<g transform="translate(1.500 3.500) scale(.85)"><path d="M7 21h10M9 21c0-3 1-5 2-7-3 1-5 0-6-2 0-3 2-5 5-7l1-2 2 2c4 1 7 4 7 9 0 2-.5 4-1 7z"/></g><path d="M10.500 6.500L9 1.200l3.200 3.600"/><circle cx="11" cy="11" r=".7"' + D + '/>',
    phenix: '<path d="M12 21.500c-3 0-5-2-5-5 0-3 3-4.500 3-8.500 2 1 3 3 3 5 1-1 1.500-2 1.500-3.500 2 1.500 3.500 4 3.500 6.500 0 3-2 5.500-6 5.500z"/><path d="M7 14.500c-3 0-5-2-5-5.500 3 0 5 1.500 6 3.500M17 14.500c3 0 5-2 5-5.500-3 0-5 1.500-6 3.500"/><path d="M12 21.500v-4"/>',
    tentacule: '<path d="M6 11a6 6 0 0 1 12 0v1.500H6z"/><path d="M9.500 10h.01M14.500 10h.01" stroke-width="2.4"/><path d="M7.500 12.500c0 4-2 5-3 8.500M10.500 12.500c0 4 0 6-1 9M13.500 12.500c0 4 0 6 1 9M16.500 12.500c0 4 2 5 3 8.500"/>',
    ours: '<circle cx="6" cy="6" r="2.500"/><circle cx="18" cy="6" r="2.500"/><path d="M5 11.500a7 7 0 0 1 14 0v2.500a7 7 0 0 1-14 0z"/><ellipse cx="12" cy="15.500" rx="3" ry="2.300"/><circle cx="9" cy="11.500" r=".9"' + D + '/><circle cx="15" cy="11.500" r=".9"' + D + '/><path d="M12 14.300v1.200"/>',
    cerf: '<path d="M8 12.500l4 8.500 4-8.500z"/><path d="M8 12.500L6 3M6 7.500L3 6.500M7 10L4 10M16 12.500l2-9.500M18 7.500l3-1M17 10l3 0"/><circle cx="10.500" cy="13.800" r=".7"' + D + '/><circle cx="13.500" cy="13.800" r=".7"' + D + '/>',
    sirene: '<path d="M12 20.500L4 10.500a9 9 0 0 1 16 0z"/><path d="M12 20.500V5M8.300 18L6 8M15.700 18L18 8M12 20.500l-5-9M12 20.500l5-9M4 22h16"/>',
    pegase: '<g transform="translate(-2 3.500) scale(.82)"><path d="M7 21h10M9 21c0-3 1-5 2-7-3 1-5 0-6-2 0-3 2-5 5-7l1-2 2 2c4 1 7 4 7 9 0 2-.5 4-1 7z"/></g><path d="M12 12c2-4.500 6-6.500 10.500-5.500-1 3.500-2.500 5.500-5.500 7.500 0-2-2-3-5-2z"/><path d="M15 11c1.500-1 3-1.800 5-2" opacity=".6"/>',
    pyramide: '<path d="M3 20L12 4l9 16z"/><path d="M8.500 14.500c1.500-2.200 5.500-2.200 7 0-1.500 2.200-5.500 2.200-7 0z"/><circle cx="12" cy="14.500" r=".9"' + D + '/>',
    kitsune: '<path d="M3 4l6 4h6l6-4-2 9.500-4 7.500h-8l-4-7.500z"/><path d="M8 12.500l2 1.300M16 12.500l-2 1.300"/><path d="M12 17.500l-1.100-1.500h2.200z"' + D + '/>',
    trident: '<path d="M12 22V6M5 3v6c0 3 3 5 7 5s7-2 7-5V3"/><path d="M12 2v4M5 3l-1 2M19 3l1 2"/>',
    lance: '<path d="M3.500 20.500L16 8"/><path d="M13.500 4.500l7-1.500-1.500 7-2.500-2.500-3 3-2-2 3-3z"/>',
    bourse: '<path d="M9 3h6l-1.200 3.200h-3.600z"/><path d="M10.200 6.200C5.500 9 4 12.500 4 16a5 5 0 0 0 5 5h6a5 5 0 0 0 5-5c0-3.500-1.500-7-6.200-9.800"/><circle cx="12" cy="15" r="2.600"/>',
    torche: '<path d="M10 21.500l1.400-10.200h1.200L14 21.500z"/><path d="M12 11c-3.200-1.200-4.300-4.300-2.300-7.500 1 1.500 2.300 2 2.300 2 0-1.700 1-3.200 2.200-3.800 2.300 3.200 2 7.500-2.200 9.300z"/>',
    'carte-monde': '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3.500 3.500 3.500 14.500 0 18M12 3c-3.500 3.500-3.500 14.500 0 18"/>',
    boussole: '<circle cx="12" cy="12" r="9"/><path d="M15.800 8.200l-2.100 5.500-5.500 2.100 2.100-5.500z"/><circle cx="12" cy="12" r=".9"' + D + '/>',
    balance: '<path d="M12 3v18M7 21h10M4 6.500h16"/><path d="M5 6.500L2 14a3 3 0 0 0 6 0zM19 6.500L16 14a3 3 0 0 0 6 0z"/>',
    couteau: '<path d="M12 2l3.200 9H8.800z"/><path d="M6.500 11h11M12 11v8M10 22h4M12 19v3"/>',
    tombe: '<path d="M6 21V9.500a6 6 0 0 1 12 0V21z"/><path d="M3 21h18M12 8v7M9 10.500h6"/>'
  };
  var TICO = {}, names = [], k;
  for (k in T) {
    if (Object.prototype.hasOwnProperty.call(T, k)) {
      TICO[k] = S(T[k].replace(/(\d)\.(\d)00(?=\D)/g, "$1.$2")); /* 4.500 → 4.5 */
      names.push(k);
    }
  }
  names.sort();
  function themeIcon(name, cls) {
    var svg = (name && Object.prototype.hasOwnProperty.call(TICO, name)) ? TICO[name] : TICO.des;
    return '<span class="tico' + (cls ? ' ' + String(cls).replace(/[^\w -]/g, '') : '') + '">' + svg + '</span>';
  }
  root.TICO = TICO;
  root.TICO_NAMES = names;
  root.themeIcon = themeIcon;
  if (typeof module !== "undefined" && module.exports) module.exports = { TICO: TICO, TICO_NAMES: names, themeIcon: themeIcon };
})(typeof window !== "undefined" ? window : this);
