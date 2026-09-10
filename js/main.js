/* =========================================================
   BACKYARD WITH BEN
   Main JavaScript
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       HERO SLIDER
    ====================================================== */

    const slider = document.querySelector(".hero-slider");
    const sliderTrack = document.querySelector(".slider-track");
    const originalSlides = Array.from(
        document.querySelectorAll(".hero-slide")
    );

    const dots = Array.from(
        document.querySelectorAll(".slider-dot")
    );

    const prevButton = document.querySelector(".slider-arrow-left");
    const nextButton = document.querySelector(".slider-arrow-right");


    if (
        slider &&
        sliderTrack &&
        originalSlides.length > 0
    ) {

        const slideCount = originalSlides.length;

        let currentIndex = 1;
        let isAnimating = false;
        let autoplayTimer = null;

        const autoplayDelay = 5000;


        /* -------------------------------------------------
           CREATE CLONES FOR INFINITE SLIDER
        -------------------------------------------------- */

        const firstClone = originalSlides[0].cloneNode(true);
        const lastClone = originalSlides[slideCount - 1].cloneNode(true);

        firstClone.classList.add("slide-clone");
        lastClone.classList.add("slide-clone");

        sliderTrack.appendChild(firstClone);
        sliderTrack.insertBefore(
            lastClone,
            sliderTrack.firstChild
        );


        /* -------------------------------------------------
           INITIAL POSITION
        -------------------------------------------------- */

        sliderTrack.style.transition = "none";
        sliderTrack.style.transform =
            `translateX(-${currentIndex * 100}%)`;

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                sliderTrack.style.transition = "";
            });
        });


        /* -------------------------------------------------
           GET CURRENT REAL SLIDE
        -------------------------------------------------- */

        function getRealIndex() {

            let realIndex = currentIndex - 1;

            if (realIndex < 0) {
                realIndex = slideCount - 1;
            }

            if (realIndex >= slideCount) {
                realIndex = 0;
            }

            return realIndex;
        }


        /* -------------------------------------------------
           UPDATE DOTS
        -------------------------------------------------- */

        function updateDots() {

            const realIndex = getRealIndex();

            dots.forEach((dot, index) => {

                if (index === realIndex) {
                    dot.classList.add("active");
                } else {
                    dot.classList.remove("active");
                }

            });

        }


        /* -------------------------------------------------
           MOVE SLIDER
        -------------------------------------------------- */

        function moveSlider(animated = true) {

            if (!animated) {
                sliderTrack.style.transition = "none";
            } else {
                sliderTrack.style.transition =
                    "transform 0.75s cubic-bezier(.65, 0, .35, 1)";
            }

            sliderTrack.style.transform =
                `translateX(-${currentIndex * 100}%)`;

            updateDots();

        }


        /* -------------------------------------------------
           NEXT SLIDE
        -------------------------------------------------- */

        function nextSlide() {

            if (isAnimating) return;

            isAnimating = true;

            currentIndex++;

            moveSlider();

        }


        /* -------------------------------------------------
           PREVIOUS SLIDE
        -------------------------------------------------- */

        function previousSlide() {

            if (isAnimating) return;

            isAnimating = true;

            currentIndex--;

            moveSlider();

        }


        /* -------------------------------------------------
           INFINITE LOOP FIX
        -------------------------------------------------- */

        sliderTrack.addEventListener("transitionend", () => {

            /*
                currentIndex 0 = clone of last slide
                currentIndex slideCount + 1 = clone of first slide
            */

            if (currentIndex === slideCount + 1) {

                currentIndex = 1;

                sliderTrack.style.transition = "none";

                sliderTrack.style.transform =
                    `translateX(-${currentIndex * 100}%)`;

            }

            else if (currentIndex === 0) {

                currentIndex = slideCount;

                sliderTrack.style.transition = "none";

                sliderTrack.style.transform =
                    `translateX(-${currentIndex * 100}%)`;

            }

            isAnimating = false;

            updateDots();

        });


        /* -------------------------------------------------
           ARROWS
        -------------------------------------------------- */

        if (nextButton) {

            nextButton.addEventListener("click", () => {

                nextSlide();

                restartAutoplay();

            });

        }


        if (prevButton) {

            prevButton.addEventListener("click", () => {

                previousSlide();

                restartAutoplay();

            });

        }


        /* -------------------------------------------------
           DOT NAVIGATION
        -------------------------------------------------- */

        dots.forEach((dot, index) => {

            dot.addEventListener("click", () => {

                if (isAnimating) return;

                isAnimating = true;

                /*
                    +1 because first position is cloned slide
                */

                currentIndex = index + 1;

                moveSlider();

                restartAutoplay();

            });

        });


        /* -------------------------------------------------
           AUTOPLAY
        -------------------------------------------------- */

        function startAutoplay() {

            stopAutoplay();

            autoplayTimer = setInterval(() => {

                nextSlide();

            }, autoplayDelay);

        }


        function stopAutoplay() {

            if (autoplayTimer) {

                clearInterval(autoplayTimer);

                autoplayTimer = null;

            }

        }


        function restartAutoplay() {

            stopAutoplay();
            startAutoplay();

        }


        startAutoplay();


        /* -------------------------------------------------
           PAUSE ON HOVER
        -------------------------------------------------- */

        slider.addEventListener("mouseenter", () => {

            stopAutoplay();

        });


        slider.addEventListener("mouseleave", () => {

            startAutoplay();

        });


        /* -------------------------------------------------
           PAUSE WHEN TAB IS NOT ACTIVE
        -------------------------------------------------- */

        document.addEventListener("visibilitychange", () => {

            if (document.hidden) {

                stopAutoplay();

            } else {

                startAutoplay();

            }

        });


        /* =================================================
           MOBILE SWIPE
        ================================================== */

        let touchStartX = 0;
        let touchEndX = 0;

        const swipeThreshold = 50;


        slider.addEventListener(
            "touchstart",
            (event) => {

                touchStartX =
                    event.changedTouches[0].screenX;

                stopAutoplay();

            },
            {
                passive: true
            }
        );


        slider.addEventListener(
            "touchend",
            (event) => {

                touchEndX =
                    event.changedTouches[0].screenX;

                handleSwipe();

                startAutoplay();

            },
            {
                passive: true
            }
        );


        function handleSwipe() {

            const difference =
                touchStartX - touchEndX;


            /*
                Swipe left
            */

            if (difference > swipeThreshold) {

                nextSlide();

            }


            /*
                Swipe right
            */

            else if (difference < -swipeThreshold) {

                previousSlide();

            }

        }


        /* -------------------------------------------------
           KEYBOARD CONTROL
        -------------------------------------------------- */

        document.addEventListener("keydown", (event) => {

            if (event.key === "ArrowRight") {

                nextSlide();
                restartAutoplay();

            }

            if (event.key === "ArrowLeft") {

                previousSlide();
                restartAutoplay();

            }

        });

    }



    /* =====================================================
       NEWSLETTER NAVBAR BUTTON
    ====================================================== */

    const newsletterButton =
        document.querySelector(".newsletter-nav-button");

    const newsletterSection =
        document.querySelector("#newsletter");


    if (newsletterButton && newsletterSection) {

        newsletterButton.addEventListener(
            "click",
            (event) => {

                event.preventDefault();

                newsletterSection.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                });

            }
        );

    }



    /* =====================================================
       NEWSLETTER FORMS
    ====================================================== */

    const newsletterForms =
        document.querySelectorAll(
            ".newsletter-form, .footer-newsletter-form"
        );


    newsletterForms.forEach((form) => {

        form.addEventListener("submit", (event) => {

            event.preventDefault();

            const emailInput =
                form.querySelector('input[type="email"]');

            const submitButton =
                form.querySelector('button[type="submit"]');


            if (!emailInput || !submitButton) {
                return;
            }


            const email =
                emailInput.value.trim();


            if (!isValidEmail(email)) {

                emailInput.focus();

                emailInput.style.outline =
                    "2px solid #d95757";

                return;

            }


            emailInput.style.outline = "none";


            const originalButtonHTML =
                submitButton.innerHTML;


            /*
                Real signup, stored in Supabase (see
                js/supabase-config.js). Actual newsletter sending
                is handled later by a dedicated email provider —
                this just durably captures the subscriber.

                Falls back to a visual-only success state if
                supabaseClient isn't available (e.g. the page
                hasn't loaded js/supabase-config.js, or it's still
                using the TODO placeholder values).
            */

            if (typeof supabaseClient === "undefined") {

                submitButton.innerHTML = "You're In! ✓";
                submitButton.disabled = true;

                emailInput.value = "";

                setTimeout(() => {

                    submitButton.innerHTML = originalButtonHTML;
                    submitButton.disabled = false;

                }, 3500);

                return;

            }


            submitButton.innerHTML = "Joining...";
            submitButton.disabled = true;

            const source =
                form.classList.contains("footer-newsletter-form")
                    ? "footer"
                    : "inline";

            supabaseClient
                .from("newsletter_subscribers")
                .insert({ email, source })
                .then(({ error }) => {

                    if (!error) {

                        submitButton.innerHTML = "You're In! ✓";
                        emailInput.value = "";

                    } else if (error.code === "23505") {

                        submitButton.innerHTML = "Already Subscribed ✓";
                        emailInput.value = "";

                    } else {

                        submitButton.innerHTML = "Try Again";
                        emailInput.style.outline = "2px solid #d95757";

                    }

                })
                .catch(() => {

                    submitButton.innerHTML = "Try Again";
                    emailInput.style.outline = "2px solid #d95757";

                })
                .finally(() => {

                    setTimeout(() => {

                        submitButton.innerHTML = originalButtonHTML;
                        submitButton.disabled = false;

                    }, 3500);

                });

        });

    });



    /* =====================================================
       EMAIL VALIDATION
    ====================================================== */

    function isValidEmail(email) {

        const emailRegex =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        return emailRegex.test(email);

    }



    /* =====================================================
       CONTACT FORM

       Submits to Formspree (see contact.html form action)
       via fetch so we can show an inline success/error
       state instead of a full page redirect.
    ====================================================== */

    const contactForm =
        document.querySelector("#contact-form");

    if (contactForm) {

        const contactMessage =
            contactForm.querySelector(".contact-form-message");

        contactForm.addEventListener("submit", (event) => {

            event.preventDefault();

            const emailInput =
                contactForm.querySelector('input[type="email"]');

            const submitButton =
                contactForm.querySelector('button[type="submit"]');

            if (!emailInput || !submitButton) {
                return;
            }

            if (!isValidEmail(emailInput.value.trim())) {

                emailInput.focus();

                showContactMessage(
                    "Please enter a valid email address.",
                    "error"
                );

                return;

            }

            const originalButtonHTML =
                submitButton.innerHTML;

            submitButton.innerHTML = "Sending...";
            submitButton.disabled = true;

            fetch(contactForm.action, {
                method: "POST",
                body: new FormData(contactForm),
                headers: {
                    Accept: "application/json"
                }
            })
                .then((response) => {

                    if (response.ok) {

                        contactForm.reset();

                        showContactMessage(
                            "Thanks! Your message has been sent. We'll get back to you soon.",
                            "success"
                        );

                    } else {

                        showContactMessage(
                            "Something went wrong sending your message. Please try again or email us directly.",
                            "error"
                        );

                    }

                })
                .catch(() => {

                    showContactMessage(
                        "Something went wrong sending your message. Please try again or email us directly.",
                        "error"
                    );

                })
                .finally(() => {

                    submitButton.innerHTML = originalButtonHTML;
                    submitButton.disabled = false;

                });

        });

        function showContactMessage(text, type) {

            if (!contactMessage) {
                return;
            }

            contactMessage.textContent = text;

            contactMessage.classList.remove("success", "error");
            contactMessage.classList.add("show", type);

        }

    }



    /* =====================================================
       MOBILE MENU
    ====================================================== */

    const mobileMenuButton =
        document.querySelector(".mobile-menu-button");

    const navigation =
        document.querySelector(".main-navigation");

    const header =
        document.querySelector(".site-header");


    if (
        mobileMenuButton &&
        navigation &&
        header
    ) {

        mobileMenuButton.addEventListener(
            "click",
            () => {

                const isOpen =
                    header.classList.toggle(
                        "mobile-menu-open"
                    );


                mobileMenuButton.setAttribute(
                    "aria-expanded",
                    isOpen
                );

            }
        );


        /*
            Close menu when navigation link is clicked
        */

        const navigationLinks =
            navigation.querySelectorAll("a");


        navigationLinks.forEach((link) => {

            link.addEventListener("click", () => {

                header.classList.remove(
                    "mobile-menu-open"
                );

                mobileMenuButton.setAttribute(
                    "aria-expanded",
                    "false"
                );

            });

        });


        /*
            Close menu when window becomes desktop size
        */

        window.addEventListener("resize", () => {

            if (window.innerWidth > 850) {

                header.classList.remove(
                    "mobile-menu-open"
                );

                mobileMenuButton.setAttribute(
                    "aria-expanded",
                    "false"
                );

            }

        });

    }



    /* =====================================================
       HEADER SHADOW WHEN SCROLLING
    ====================================================== */

    const siteHeader =
        document.querySelector(".site-header");


    if (siteHeader) {

        function updateHeader() {

            if (window.scrollY > 20) {

                siteHeader.classList.add(
                    "header-scrolled"
                );

            } else {

                siteHeader.classList.remove(
                    "header-scrolled"
                );

            }

        }


        window.addEventListener(
            "scroll",
            updateHeader,
            {
                passive: true
            }
        );


        updateHeader();

    }

    /* =====================================================
   BLOG FILTERING + LIVE SEARCH
====================================================== */

const blogCategoryButtons =
    document.querySelectorAll(".blog-category-button");

let blogCards =
    Array.from(document.querySelectorAll(".blog-card"));

const blogSearchInput =
    document.querySelector("#blog-search-input");

const blogNoResults =
    document.querySelector(".blog-no-results");

const blogLoadMore =
    document.querySelector(".blog-load-more");


let selectedCategory = "all";
let searchQuery = "";
let blogFilterInitialized = false;


/* =================================================
   NORMALIZE TEXT
   Makes searching easier and case-insensitive
================================================== */

function normalizeText(text) {

    return text
        .toLowerCase()
        .trim()
        .replace(/\s+/g, " ");

}


/* =================================================
   GET SEARCHABLE ARTICLE TEXT
================================================== */

function getCardSearchText(card) {

    const title =
        card.dataset.title || "";

    const category =
        card.dataset.category || "";

    const heading =
        card.querySelector("h3")?.textContent || "";

    const description =
        card.querySelector(".article-content p")?.textContent || "";

    const categoryLabel =
        card.querySelector(".article-category")?.textContent || "";


    return normalizeText(
        title +
        " " +
        category +
        " " +
        heading +
        " " +
        description +
        " " +
        categoryLabel
    );

}


/* =================================================
   SYNONYMS / RELATED WORDS
================================================== */

const searchSynonyms = {

    garden: [
        "garden",
        "gardening",
        "plants",
        "flowers",
        "planting"
    ],

    gardening: [
        "garden",
        "gardening",
        "plants",
        "flowers",
        "planting"
    ],

    flower: [
        "flower",
        "flowers",
        "garden",
        "gardening",
        "plants"
    ],

    flowers: [
        "flower",
        "flowers",
        "garden",
        "gardening",
        "plants"
    ],

    lawn: [
        "lawn",
        "grass",
        "yard",
        "mowing"
    ],

    grass: [
        "grass",
        "lawn",
        "yard"
    ],

    tree: [
        "tree",
        "trees",
        "landscaping"
    ],

    trees: [
        "tree",
        "trees",
        "landscaping"
    ],

    patio: [
        "patio",
        "outdoor living",
        "deck",
        "backyard"
    ],

    deck: [
        "deck",
        "patio",
        "outdoor living",
        "diy"
    ],

    grill: [
        "grill",
        "grilling",
        "bbq",
        "barbecue"
    ],

    grilling: [
        "grill",
        "grilling",
        "bbq",
        "barbecue"
    ],

    bbq: [
        "bbq",
        "grill",
        "grilling",
        "barbecue"
    ],

    diy: [
        "diy",
        "projects",
        "build",
        "backyard projects"
    ],

    pool: [
        "pool",
        "pools",
        "outdoor living"
    ],

    birds: [
        "birds",
        "wildlife",
        "plants",
        "garden"
    ],

    landscaping: [
        "landscaping",
        "landscape",
        "yard",
        "garden",
        "trees"
    ]

};


/* =================================================
   EXPAND SEARCH QUERY
================================================== */

function getSearchTerms(query) {

    const words =
        normalizeText(query)
            .split(" ")
            .filter(Boolean);


    const terms = new Set(words);


    words.forEach(word => {

        if (searchSynonyms[word]) {

            searchSynonyms[word].forEach(term => {

                terms.add(term);

            });

        }

    });


    return Array.from(terms);

}


/* =================================================
   FILTER ARTICLES
================================================== */

function filterArticles() {

    let visibleCards = [];


    const searchTerms =
        getSearchTerms(searchQuery);


    blogCards.forEach(card => {

        const cardCategory =
            card.dataset.category;

        const searchableText =
            getCardSearchText(card);


        /* CATEGORY MATCH */

        const categoryMatches =
            selectedCategory === "all" ||
            cardCategory === selectedCategory;


        /* SEARCH MATCH */

        let searchMatches = true;


        if (searchQuery.length > 0) {

            searchMatches =
                searchTerms.some(term =>

                    searchableText.includes(term)

                );

        }


        /* FINAL RESULT */

        if (categoryMatches && searchMatches) {

            card.hidden = false;

            visibleCards.push(card);

        } else {

            card.hidden = true;

        }

    });


    /* =================================================
       NO RESULTS MESSAGE
    ================================================== */

    if (blogNoResults) {

        if (visibleCards.length === 0) {

            blogNoResults.classList.add("show");

        } else {

            blogNoResults.classList.remove("show");

        }

    }


    /* =================================================
       LOAD MORE BUTTON

       Hide it while filtering/searching because right
       now all matching results should be visible.
    ================================================== */

    if (blogLoadMore) {

        if (
            selectedCategory !== "all" ||
            searchQuery.length > 0
        ) {

            blogLoadMore.style.display = "none";

        } else {

            blogLoadMore.style.display = "flex";

        }

    }

}


/* =================================================
   SET UP / RE-SCAN BLOG CARDS

   Called once at page load, and again whenever
   dynamically-loaded (Supabase) cards finish inserting
   (see js/blog-articles.js, which dispatches
   "blog:cards-loaded" after appending new cards). The
   category-button and search-input listeners only ever
   get attached once, guarded by blogFilterInitialized —
   re-running this just re-collects blogCards and
   re-filters.
================================================== */

function setupBlogFilter() {

    blogCards =
        Array.from(document.querySelectorAll(".blog-card"));

    if (blogCards.length === 0) {
        return;
    }

    if (blogFilterInitialized) {

        filterArticles();

        return;

    }

    blogFilterInitialized = true;


    /* =================================================
       CATEGORY BUTTONS
    ================================================== */

    blogCategoryButtons.forEach(button => {

        button.addEventListener("click", () => {

            selectedCategory =
                button.dataset.category;


            /* Remove active from every button */

            blogCategoryButtons.forEach(btn => {

                btn.classList.remove("active");

            });


            /* Active clicked button */

            button.classList.add("active");


            /* Change URL without refreshing page */

            const url =
                new URL(window.location);


            if (selectedCategory === "all") {

                url.searchParams.delete("category");

            } else {

                url.searchParams.set(
                    "category",
                    selectedCategory
                );

            }


            window.history.replaceState(
                {},
                "",
                url
            );


            filterArticles();

        });

    });


    /* =================================================
       LIVE SEARCH

       Results change after every typed character.
    ================================================== */

    if (blogSearchInput) {

        blogSearchInput.addEventListener(
            "input",
            () => {

                searchQuery =
                    normalizeText(
                        blogSearchInput.value
                    );


                filterArticles();

            }
        );

    }


    /* =================================================
       CATEGORY FROM URL

       Example:
       blogs.html?category=gardening
    ================================================== */

    const urlParams =
        new URLSearchParams(
            window.location.search
        );


    const urlCategory =
        urlParams.get("category");


    if (urlCategory) {

        const matchingButton =
            Array.from(blogCategoryButtons)
                .find(button =>

                    button.dataset.category ===
                    urlCategory

                );


        if (matchingButton) {

            selectedCategory =
                urlCategory;


            blogCategoryButtons.forEach(button => {

                button.classList.remove("active");

            });


            matchingButton.classList.add("active");

        }

    }


    filterArticles();

}


setupBlogFilter();

document.addEventListener("blog:cards-loaded", setupBlogFilter);

});