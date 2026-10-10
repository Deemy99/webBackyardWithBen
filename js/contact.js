/* =========================================================
   CONTACT form — validation, loading, success and error states.
   Posts to /api/contact (urlencoded), which emails the team via Resend.
========================================================= */
(function () {
    "use strict";

    var form = document.getElementById("contact-form");
    if (!form) return;

    var msg = form.querySelector(".wb-form__msg");
    var btn = form.querySelector('button[type="submit"]');
    var label = btn.querySelector(".wb-btn__label");
    var idle = label.textContent;
    var rules = {
        name: function (v) { return v.trim().length >= 2 ? "" : "Please tell us your name."; },
        email: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? "" : "Please enter a valid email address."; },
        subject: function (v) { return v.trim().length >= 3 ? "" : "Please add a short subject."; },
        message: function (v) { return v.trim().length >= 10 ? "" : "Please write a few words (at least 10 characters)."; }
    };

    function check(name) {
        var input = form.elements[name], err = document.getElementById("err-" + name);
        var text = rules[name](input.value);
        err.textContent = text;
        if (text) input.setAttribute("aria-invalid", "true"); else input.removeAttribute("aria-invalid");
        return !text;
    }
    function banner(type, text) { msg.setAttribute("data-type", type); msg.textContent = text; }

    Object.keys(rules).forEach(function (n) {
        form.elements[n].addEventListener("blur", function () { check(n); });
        form.elements[n].addEventListener("input", function () { if (form.elements[n].getAttribute("aria-invalid")) check(n); });
    });

    form.addEventListener("submit", function (e) {
        e.preventDefault();
        banner("", "");
        var firstBad = null;
        Object.keys(rules).forEach(function (n) { if (!check(n) && !firstBad) firstBad = form.elements[n]; });
        if (firstBad) { firstBad.focus(); return; }

        btn.disabled = true; label.textContent = "Sending…";
        fetch(form.action, {
            method: "POST",
            headers: { Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams(new FormData(form))
        }).then(function (r) {
            if (!r.ok) throw new Error("bad status");
            form.reset();
            banner("success", "Thanks! Your message is on its way to our team. We'll reply as soon as we can.");
        }).catch(function () {
            banner("error", "Something went wrong sending your message. Please try again, or email us directly at ben@backyardwithben.com.");
        }).then(function () { btn.disabled = false; label.textContent = idle; });
    });
})();
