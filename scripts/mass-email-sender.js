const fs = require('fs');
const csv = require('csv-parser');
const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config();

// Configuration
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = process.env.SMTP_PORT || 465;
const SMTP_USER = process.env.SMTP_USER || 'letsgetbonded@gmail.com';
const SMTP_PASS = process.env.SMTP_PASS;
const SENDER_EMAIL = process.env.SENDER_EMAIL || 'letsgetbonded@gmail.com';

// Check for missing config
if (!SMTP_PASS) {
    console.error('Error: Missing SMTP_PASS (Password).');
    console.error('Please add SMTP_PASS to your .env file.');
    process.exit(1);
}

// Create Transporter
const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT),
    secure: parseInt(SMTP_PORT) === 465, // true for 465, false for other ports
    auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
    },
});

const csvFilePath = path.join(__dirname, '../uri_outreach_list_full.csv');
const results = [];

// Helper to clean organization names
function cleanOrgName(name) {
    return name
        .replace(/\s*\(URI STUDENT SENATE\)\s*/i, '')
        .replace(/\s*\(PENDING.*?\)\s*/i, '')
        .replace(/\s*\(URI Student Senate\)\s*/i, '')
        .trim();
}

function getEmailBody(orgName) {
    const cleanName = cleanOrgName(orgName);
    return `Hello ${cleanName},

We are a group of URI students working on Bonded, a new campus app being built by URI students to make it easier for students to connect both socially and academically.

One thing we kept hearing from students is that URI Involved isn’t widely used. It’s a static website, not well advertised, and students don’t naturally check it. After surveying 200+ URI students, the most common feedback we heard was:

* It’s hard to discover clubs unless you already know someone in them
* Finding meeting times, locations, and updates is frustrating
* Students rely on scattered Instagram pages, GroupMe links, and word of mouth

Bonded is designed to fix that.

For student organizations, Bonded will allow you to:

* Create a verified club profile
* Post meetings and events in a shared campus feed students actually use
* Reach students who are actively looking to get involved
* Make it easier for new members to find you—even if they don’t know anyone yet

Beyond clubs, Bonded is also a general campus social app. Students sign up with their .edu email, upload a screenshot of their schedule, and are automatically added to group chats for all of their classes making it easier to meet classmates, form study groups, and stay connected.

The app is fully built and currently in pre-launch. Before going live, we’re inviting URI clubs to join the waitlist and help shape the final experience. Our goal is to reach 2,000 URI student signups so the platform launches with real activity from day one. Every single signup on the waitlist matters as we can't go live until we hit this goal.

We’d love for ${cleanName} to:

* Share the student waitlist with your members
* Reach out to us and let us know what features we should add to make organizing your org and members easier

You can see more about the app and join the waitlist here:
👉 bondeduni.com

Thanks for everything you do for the URI community,
Isaac Gbaba - Founder of Bonded`;
}

async function sendEmail(row) {
    const { "Organization Name": orgName, "Contact Email": toEmail } = row;

    if (!toEmail || toEmail === 'No email found.') {
        return;
    }

    const subject = `URI has a new social network`;
    const bodyContent = getEmailBody(orgName);

    const mailOptions = {
        from: `"Bonded" <${SENDER_EMAIL}>`,
        to: toEmail,
        subject: subject,
        text: bodyContent,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`[SENT] ${orgName} (${toEmail}): ${info.messageId}`);
    } catch (error) {
        console.error(`[ERROR] ${orgName} (${toEmail}):`, error.message);
    }
}

function processList() {
    console.log('Reading CSV file from: ' + csvFilePath);

    fs.createReadStream(csvFilePath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', async () => {
            console.log(`Loaded ${results.length} organizations.`);

            // Filter valid contacts (exclude ASO explicitly)
            const validContacts = results.filter(r => {
                const email = r["Contact Email"];
                const name = r["Organization Name"];

                // Skip if no email
                if (!email || email === 'No email found.' || !email.includes('@')) return false;

                // Exclude African Student Organization
                if (name && (name.includes("African Student Organization") || email.trim() === "aso@rhodysenate.org")) {
                    console.log(`[FILTERED] Skipping excluded organization: ${name} (${email})`);
                    return false;
                }

                return true;
            });

            console.log(`Found ${validContacts.length} organizations to email.`);

            console.log('\n=============================================');
            console.log('                 PREVIEW                     ');
            console.log('=============================================');
            console.log(`Subject: URI has a new social network`);
            console.log(`From:    ${SENDER_EMAIL}`);
            console.log('---------------------------------------------');
            console.log(getEmailBody("[Organization Name]"));
            console.log('=============================================');

            console.log(`\nReady to send to ${validContacts.length} recipients.`);
            console.log('Starting execution in 10 seconds...');
            console.log('Press Ctrl+C NOW to abort if the preview is wrong.');

            await new Promise(resolve => setTimeout(resolve, 10000));
            console.log('\n🚀 Starting email blast...');

            for (const row of validContacts) {
                await sendEmail(row);
                // Wait 2 seconds between emails to be gentle on Gmail rate limits
                await new Promise(resolve => setTimeout(resolve, 2000));
            }

            console.log('\n✅ All emails processed.');
            process.exit(0);
        });
}

// Verify connection first
transporter.verify(function (error, success) {
    if (error) {
        console.error('SMTP Connection Error:', error);
        console.error('Make sure you are using an App Password if you have 2FA enabled on Gmail.');
    } else {
        console.log('SMTP Server is ready to take messages');
        processList();
    }
});
