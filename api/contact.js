/* =========================================================
   POST /api/contact

   Receives the contact form (see contact.html + the fetch call
   in js/main.js) and forwards it as an email to Ben via Resend.
   Uses only Node's built-in fetch — no npm dependency, matching
   scripts/publish-article.mjs's "no external packages" approach.

   Requires the RESEND_API_KEY environment variable (set in the
   Vercel project settings, never committed to this repo) and a
   Resend-verified sending domain for backyardwithben.com.
========================================================= */

const TO_EMAIL = "ben@backyardwithben.com";
const FROM_EMAIL = "Backyard with Ben Website <contact@backyardwithben.com>";

module.exports = async function handler(req, res) {

    if (req.method !== "POST") {
        res.status(405).json({ error: "Method not allowed" });
        return;
    }

    const { name, email, subject, message } = req.body || {};

    if (!name || !email || !subject || !message) {
        res.status(400).json({ error: "Missing required fields" });
        return;
    }

    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
        console.error("RESEND_API_KEY is not configured");
        res.status(500).json({ error: "Email service not configured" });
        return;
    }

    try {

        const resendResponse = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                Authorization: "Bearer " + apiKey,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                from: FROM_EMAIL,
                to: [TO_EMAIL],
                reply_to: email,
                subject: "New contact form message: " + subject,
                text:
                    "From: " + name + " <" + email + ">\n\n" +
                    message
            })
        });

        if (!resendResponse.ok) {
            const errText = await resendResponse.text();
            console.error("Resend error:", errText);
            res.status(502).json({ error: "Failed to send email" });
            return;
        }

        res.status(200).json({ success: true });

    } catch (err) {

        console.error("Contact form error:", err);
        res.status(500).json({ error: "Unexpected error" });

    }

};
