/* Product line icons (24x24, stroke 1.8, round caps), one per product
   type. Used in the media area of the product cards; which product gets
   which icon + label is set in data/product-types.json. */
export const PRODUCT_ICONS = {
    /* power tools */
    "p-drill": '<path d="M4 7a1 1 0 011-1h9.5a2 2 0 012 2v2a2 2 0 01-2 2H5a1 1 0 01-1-1z"/><path d="M16.5 7.5h1.8v3h-1.8M18.3 9h3.2"/><path d="M6.5 12l-.8 5.5M10 12l-.8 5.5M9.8 12.8v1.6"/><rect x="3.5" y="17.5" width="8" height="3" rx="1"/>',
    "p-circsaw": '<path d="M2.5 14h19"/><path d="M5 14a7 7 0 0114 0"/><path d="M7 14a5 5 0 0010 0"/><circle cx="12" cy="11" r="1.3"/><path d="M14.5 7.3l2-3.8h3.2l-.9 6"/><path d="M8.2 17.6l-.9.9M12 19v1.2M15.8 17.6l.9.9"/>',
    "p-multitool": '<rect x="2" y="8" width="12" height="5.5" rx="2.75"/><path d="M5.5 10.75h4"/><path d="M14 9h3.5v3.5H14"/><path d="M15 12.5v6h3v-6"/><path d="M15 18.5l.75 1 .75-1 .75 1 .75-1"/>',
    "p-jigsaw": '<path d="M4.5 13.5V10a4 4 0 014-4H14a4 4 0 014 4v3.5z"/><path d="M8.5 10h5.5"/><path d="M3 16h17"/><path d="M4.5 13.5L3 16M18 13.5l1.5 2.5"/><path d="M14 16v5.5M14 18l1.2.6M14 20l1.2.6"/>',
    "p-sander": '<path d="M7 12V9.5A3.5 3.5 0 0110.5 6H15a3 3 0 013 3v3"/><path d="M15 6V4h-3"/><rect x="4" y="12" width="16" height="4" rx="1.5"/><path d="M5 19.5h14"/>',
    /* sanding & finishing */
    "p-discs": '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="1.6"/><circle cx="12" cy="7" r=".7"/><circle cx="16.3" cy="9.5" r=".7"/><circle cx="16.3" cy="14.5" r=".7"/><circle cx="12" cy="17" r=".7"/><circle cx="7.7" cy="14.5" r=".7"/><circle cx="7.7" cy="9.5" r=".7"/>',
    "p-can": '<ellipse cx="12" cy="8" rx="6.5" ry="2"/><path d="M5.5 8v10.5c0 1.1 2.9 2 6.5 2s6.5-.9 6.5-2V8"/><path d="M5.5 12.5c0 1.1 2.9 2 6.5 2s6.5-.9 6.5-2"/><path d="M6 7.5C6.5 3 17.5 3 18 7.5"/>',
    /* hand tools & measuring */
    "p-square": '<path d="M4 4v16h16z"/><path d="M8.5 15.5h3.5V12z"/><path d="M4 8h2.5M4 12h2.5M4 16h2.5"/>',
    "p-tape": '<path d="M3.5 7a3 3 0 013-3h7.5a3 3 0 013 3v8a3 3 0 01-3 3H6.5a3 3 0 01-3-3z"/><circle cx="10.25" cy="11" r="3"/><path d="M17 15h4.5v3H17"/><path d="M19 15v1.3"/>',
    "p-level": '<rect x="2" y="8.5" width="20" height="7" rx="3.5"/><rect x="9" y="10.25" width="6" height="3.5" rx="1.75"/><path d="M12 10.25v3.5M5.5 12h1M17.5 12h1"/>',
    "p-knife": '<path d="M3.6 16.4L12.5 9.5l2.6 3.4-8.8 6.9a2.2 2.2 0 01-2.7-3.4z"/><path d="M12.5 9.5L17 6l3.5.8-5.4 6.1"/><circle cx="8" cy="15.6" r=".8"/>',
    "p-hammer": '<path d="M10 5l2-2 7 7-2 2z"/><path d="M13.2 7.6L3.9 16.9a1.4 1.4 0 002 2l9.3-9.3"/><path d="M11 4C9.5 2.6 7.4 2.5 5.8 3.2"/>',
    /* clamps & joinery */
    "p-jig": '<path d="M2.5 19h19"/><rect x="5" y="9" width="10" height="10" rx="1"/><path d="M7.5 19l3-6.5M11 19l3-6.5"/><path d="M19.5 3.5l-4.2 8.2M17.5 7.4l1.6.8"/>',
    "p-screws": '<path d="M4 4h5M14.5 4h5"/><path d="M5 4.5l1.5 14 1.5-14M15.5 4.5l1.5 14 1.5-14"/><path d="M5.6 8.5l2-1M5.9 11.5l1.6-.9M6.2 14.5l1.1-.7M16.1 8.5l2-1M16.4 11.5l1.6-.9M16.7 14.5l1.1-.7"/>',
    "p-barclamp": '<path d="M2.5 6h19"/><path d="M4.5 6v9.5h3V6M13.5 6v9.5h3V6"/><path d="M16.5 10h2.2l1.3 7.5"/>',
    "p-glue": '<path d="M8 9h8v10a2 2 0 01-2 2h-4a2 2 0 01-2-2z"/><path d="M10 9V6.5h4V9"/><path d="M11.2 6.5L12 3l.8 3.5"/><path d="M8 13h8M8 16.5h8"/>',
    /* safety */
    "p-glasses": '<path d="M3 10a2 2 0 012-2h14a2 2 0 012 2v3a3 3 0 01-3 3h-2.5L14 14h-4l-1.5 2H6a3 3 0 01-3-3z"/><path d="M3 11H1.5M21 11h1.5"/>',
    "p-earmuffs": '<path d="M6 12V9.5a6 6 0 0112 0V12"/><rect x="3.5" y="11" width="5" height="8.5" rx="2.5"/><rect x="15.5" y="11" width="5" height="8.5" rx="2.5"/>',
    "p-mask": '<path d="M6 9.5C6 7 8.7 5 12 5s6 2 6 4.5V13a6 6 0 01-12 0z"/><circle cx="12" cy="13.5" r="2"/><path d="M10 7.5h4"/><path d="M6 10H2.5M18 10h3.5M6.6 15.5H3M17.4 15.5H21"/>',
    "p-glove": '<path d="M7 21v-5.5L4.6 11.7a1.4 1.4 0 012.3-1.6l1.6 2.2V5a1.3 1.3 0 012.6 0v5.5V3.8a1.3 1.3 0 012.6 0v6.7V5.3a1.3 1.3 0 012.6 0v5.9-3.3a1.3 1.3 0 012.6 0V15c0 3-1.5 4.5-3 6"/><path d="M7 18h9.6"/>',
    /* planters */
    "p-planter": '<path d="M5 10.5h14V13H5z"/><path d="M6.5 13h11l-1.5 8H8z"/><path d="M12 10.5V6"/><path d="M12 7.5c-1-2.5-3.5-3-5-2.5.5 2 2.5 3 5 2.5zM12 8c1-2.5 3.5-3 5-2.5-.5 2-2.5 3-5 2.5z"/>',
    "p-tallplanter": '<path d="M6 9h12"/><path d="M7 9l2 12h6l2-12"/><path d="M12 9V3.5"/><path d="M12 6.5C10.5 5 9 5 7.5 5.5M12 5c1.5-1.5 3-1.5 4.5-1M12 8c1.3-1 2.8-1 4-.5"/>',
    "p-windowbox": '<path d="M2.5 13h19l-1.5 6.5H4z"/><path d="M7 13v-3M12 13V9M17 13v-3"/><circle cx="7" cy="8.5" r="1.5"/><circle cx="12" cy="7.5" r="1.5"/><circle cx="17" cy="8.5" r="1.5"/>',
    "p-hanging": '<path d="M12 2v3M12 5l-5 7M12 5l5 7"/><path d="M5.5 12h13l-1.5 6.5a2 2 0 01-2 1.5H9a2 2 0 01-2-1.5z"/><path d="M8 17c-1.2 1.5-1.2 3 0 4.5M16 17c1.2 1.5 1.2 3 0 4.5"/>',
    /* raised beds */
    "p-bedmetal": '<path d="M3 10h18v9H3z"/><path d="M6.5 10v9M10 10v9M14 10v9M17.5 10v9"/><path d="M8 10V6.5M8 8c-1-1-2-1.2-3-.6M8 7.5c1-1.2 2.2-1.3 3.2-.7M16 10V6M16 7.5c-1-1-2.2-1.1-3.2-.6M16 7c1-1.2 2.2-1.3 3.2-.7"/>',
    "p-bedoval": '<path d="M3 11c0-1.7 4-3 9-3s9 1.3 9 3v6c0 1.7-4 3-9 3s-9-1.3-9-3z"/><path d="M3 11c0 1.7 4 3 9 3s9-1.3 9-3"/><path d="M7 13.6v5.6M12 14v6M17 13.6v5.6"/>',
    "p-bedelevated": '<path d="M3 8h18v5.5H3z"/><path d="M5 13.5V21M19 13.5V21M5 17.5h14"/><path d="M8 8V5.5M12 8V4.5M16 8V5.5"/>',
    "p-bedwood": '<rect x="3" y="10" width="18" height="9" rx="1"/><path d="M3 14.5h18M7.5 10v9M16.5 10v9"/><path d="M10 10V7M10 8c-1-1-2.2-1.1-3-.5M14 10V7M14 8c1-1 2.2-1.1 3-.5"/>',
    /* lighting */
    "p-stringlights": '<path d="M2 4.5c6 4.5 14 4.5 20 0"/><path d="M6 7v1.5M12 8.3v1.5M18 7v1.5"/><path d="M6 8.5c-1.2 0-2 1.1-2 2.4S5 14 6 14s2-1.8 2-3.1-.8-2.4-2-2.4zM12 9.8c-1.2 0-2 1.1-2 2.4s1 3.1 2 3.1 2-1.8 2-3.1-.8-2.4-2-2.4zM18 8.5c-1.2 0-2 1.1-2 2.4s1 3.1 2 3.1 2-1.8 2-3.1-.8-2.4-2-2.4z"/>',
    "p-pathlight": '<path d="M7 4.5h10L15.5 8h-7z"/><rect x="9" y="8" width="6" height="5" rx="1"/><path d="M12 13v8M8.5 21h7M4.5 10.5H6M18 10.5h1.5M5.5 6.5l1.2.8M18.5 6.5l-1.2.8"/>',
    "p-lantern": '<circle cx="12" cy="3.5" r="1.3"/><path d="M8 7.2L9.6 5h4.8L16 7.2z"/><rect x="8" y="7.2" width="8" height="10.8" rx="1"/><path d="M7 18h10v2.2H7z"/><path d="M12 15.6c-.9 0-1.5-.7-1.5-1.5 0-1 1.5-2.4 1.5-2.4s1.5 1.4 1.5 2.4c0 .8-.6 1.5-1.5 1.5z"/>',
    "p-walllight": '<rect x="3" y="5" width="4" height="14" rx="1"/><path d="M7 9h5a3 3 0 010 6H7"/><path d="M17.5 9l2.5-1.5M18 12h3.5M17.5 15l2.5 1.5"/>',
    /* fire pits */
    "p-firebowl": '<path d="M3 12h18c0 2.8-4 5-9 5s-9-2.2-9-5z"/><path d="M7 16.4L5.5 21M17 16.4l1.5 4.6"/><path d="M12 11c-1.8 0-3-1.1-3-2.6 0-1.6 1.6-2.4 2-4.4 1.6 1 2 2.2 2 3.2.6-.4 1-1.1 1-1.8.8.8 1 1.9 1 2.9 0 1.6-1.2 2.7-3 2.7z"/>',
    "p-smokeless": '<ellipse cx="12" cy="10" rx="7" ry="2"/><path d="M5 10v7c0 1.1 3.1 2 7 2s7-.9 7-2v-7"/><path d="M8.5 15.5v-1.5M12 16v-1.5M15.5 15.5v-1.5"/><path d="M7.5 18.5L6.5 21.5M16.5 18.5l1 3"/><path d="M12 7.5c-1.1 0-1.9-.8-1.9-1.7 0-1.2 1.2-1.9 1.4-3.3 1.2.8 2.4 2 2.4 3.3 0 .9-.8 1.7-1.9 1.7z"/>',
    "p-firetable": '<path d="M2.5 11.5h19v3h-19z"/><rect x="4.5" y="14.5" width="15" height="6.5" rx="1"/><path d="M12 11.5c-1.6 0-2.6-1-2.6-2.2 0-1.5 1.5-2.3 1.8-4.3 1.6 1 2.9 2.6 2.9 4.3 0 1.2-1 2.2-2.1 2.2z"/>',
    "p-sparkscreen": '<path d="M3 18.5c0-5 4-9 9-9s9 4 9 9z"/><path d="M7.2 18.5c0-4 2-7.4 4.8-9M16.8 18.5c0-4-2-7.4-4.8-9M12 9.5v9M4.4 14.5h15.2"/><path d="M12 9.5V6.5M10.5 6.5h3"/>',
    /* furniture */
    "p-adirondack": '<path d="M4 3.5L8.5 14.5l9.5-1.5"/><path d="M5.6 7.5l1.4-.5M6.6 10.2l1.4-.5"/><path d="M6.5 9.5h13"/><path d="M17 9.5V21M8.5 14.5L7 21"/>',
    "p-bench": '<rect x="4" y="4" width="16" height="6" rx="1"/><path d="M4 7h16"/><rect x="3" y="12" width="18" height="2.5" rx="1"/><path d="M5 14.5V20M19 14.5V20M5.5 10v2M18.5 10v2"/>',
    "p-hammock": '<path d="M2 20.5h20"/><path d="M4 20.5L6 7.5M20 20.5L18 7.5"/><path d="M6 7.5c2 7 10 7 12 0"/><path d="M6.6 10c2.6 4 8.2 4 10.8 0"/>',
    "p-bistro": '<path d="M8.5 10.5h7M12 10.5V19M10 19h4"/><path d="M3.5 4.5V19M3.5 13.5h4V19M20.5 4.5V19M20.5 13.5h-4V19"/>',
    /* decor */
    "p-rug": '<rect x="5" y="4" width="14" height="16" rx="1"/><path d="M7 4V2M10 4V2M14 4V2M17 4V2M7 20v2M10 20v2M14 20v2M17 20v2"/><path d="M12 8l3 4-3 4-3-4z"/>',
    "p-pillow": '<path d="M5 5c2.5 1 11.5 1 14 0-1 2.5-1 11.5 0 14-2.5-1-11.5-1-14 0 1-2.5 1-11.5 0-14z"/><circle cx="12" cy="12" r="1"/>',
    "p-chimes": '<path d="M4 5h16M12 2.5V5M6 5v1.5M10 5v1.5M14 5v1.5M18 5v1.5"/><rect x="5" y="6.5" width="2" height="8" rx="1"/><rect x="9" y="6.5" width="2" height="11" rx="1"/><rect x="13" y="6.5" width="2" height="9.5" rx="1"/><rect x="17" y="6.5" width="2" height="6.5" rx="1"/><path d="M12 5v13.5"/><circle cx="12" cy="20" r="1.4"/>',
    "p-birdbath": '<path d="M3 8h18c0 2.5-4 4.5-9 4.5S3 10.5 3 8z"/><path d="M8 8c1.3-.7 2.7-.7 4 0"/><path d="M10.5 12.4L9.6 19h4.8l-.9-6.6"/><path d="M7 19h10v2.2H7z"/>'
};
