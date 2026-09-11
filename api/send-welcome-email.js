/* =========================================================
   POST /api/send-welcome-email

   Called from js/main.js right after a newsletter signup is
   durably stored in Supabase (see js/supabase-config.js). Sends
   a one-off welcome email via Resend. Uses only Node's built-in
   fetch — no npm dependency.

   Requires the RESEND_API_KEY environment variable (set in the
   Vercel project settings, never committed to this repo) and a
   Resend-verified sending domain for backyardwithben.com.
========================================================= */

const FROM_EMAIL = "Ben from Backyard with Ben <ben@backyardwithben.com>";

const WELCOME_EMAIL_HTML = `
<div style="font-family: Arial, Helvetica, sans-serif; max-width: 560px; margin: 0 auto; color: #1a1a1a;">
    <h1 style="color: #1f5c3a; font-size: 22px;">Welcome to Backyard with Ben! 🌿</h1>
    <p style="font-size: 15px; line-height: 1.6;">
        Thanks for joining the newsletter. You'll get practical backyard ideas,
        gardening tips, landscaping inspiration, BBQ guides and DIY projects
        straight to your inbox.
    </p>
    <p style="font-size: 15px; line-height: 1.6;">
        In the meantime, check out the latest articles:
        <a href="https://www.backyardwithben.com/blogs.html" style="color: #1f5c3a;">
            backyardwithben.com/blogs.html
        </a>
    </p>
    <p style="font-size: 15px; line-height: 1.6;">
        Talk soon,<br>
        Ben
    </p>
    <p style="font-size: 12px; color: #777; margin-top: 32px;">
        You're receiving this because you signed up at backyardwithben.com.
    </p>
</div>
`;

module.exports = async function handler(req, res) {

    if (req.method !== "POST") {
        res.status(405).json({ error: "Method not allowed" });
        return;
    }

    const { email } = req.body || {};

    if (!email || typeof email !== "string") {
        res.status(400).json({ error: "Missing email" });
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
                to: [email],
                subject: "Welcome to Backyard with Ben!",
                html: WELCOME_EMAIL_HTML
            })
        });

        if (!resendResponse.ok) {
            const errText = await resendResponse.text();
            console.error("Resend error:", errText);
            res.status(502).json({ error: "Failed to send welcome email" });
            return;
        }

        res.status(200).json({ success: true });

    } catch (err) {

        console.error("Welcome email error:", err);
        res.status(500).json({ error: "Unexpected error" });

    }

};
