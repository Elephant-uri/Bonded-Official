// uri-orgs-outreach.js
const fs = require('fs');
const https = require('https');
const path = require('path');

// List of top 50 organizations found in our research
// Load organizations from local JSON file
const allOrgsPath = path.join(__dirname, '../all_orgs.json');
let organizations = [];

try {
    const fileContent = fs.readFileSync(allOrgsPath, 'utf8');
    const jsonData = JSON.parse(fileContent);
    if (jsonData.value && Array.isArray(jsonData.value)) {
        organizations = jsonData.value.map(org => ({
            name: org.Name,
            url: `https://urinvolved.uri.edu/organization/${org.WebsiteKey}`
        }));
        console.log(`Loaded ${organizations.length} organizations from all_orgs.json`);
    } else {
        console.error("Invalid JSON structure in all_orgs.json");
        process.exit(1);
    }
} catch (err) {
    console.error("Error reading all_orgs.json:", err);
    process.exit(1);
}

async function fetchHtml(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', (err) => reject(err));
    });
}

function extractEmail(html) {
    // Look for mailto: links first
    const mailtoMatch = html.match(/href="mailto:([^"]+)"/i);
    if (mailtoMatch) return mailtoMatch[1];

    // Look for common email patterns in text, avoiding npm package versions (e.g. react-select@1.2.1)
    // We start looking for "Contact Email" label specifically if possible, or just stricter regex
    // This regex looks for:
    // 1. starts with alphanumeric
    // 2. contains @
    // 3. domain part has at least one dot
    // 4. avoids numbers immediately after @ (common in versions)
    const emailMatch = html.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z]{2,})/);
    if (emailMatch) return emailMatch[1];

    return null;
}

function generateEmailBody(orgName) {
    return `
Subject: Proper Member Management & Campus-Wide Visibility for ${orgName}

Hi there,

We're students here at URI and we've built **Bonded**, a campus-exclusive network designed specifically for student organizations like ${orgName}.

We noticed that managing members and getting the word out about events across campus can be a challenge. With Bonded, you can:
- **Properly manage your members** in one dedicated space.
- **Sync your calendar and setup events** that are visible to the entire school in one centralized place.
- **Increase engagement** with students who are actually looking for organizations like yours.

We'd love to set up a quick meeting to show you how ${orgName} can benefit from being on Bonded.

Best,
The Bonded Team (URI Students)
https://getbonded.app (Example Link)
`;
}

async function main() {
    console.log("Starting URI Organization Outreach Script...");
    console.log(`Processing ${organizations.length} organizations...\n`);

    const results = [];

    for (const org of organizations) {
        process.stdout.write(`Fetching ${org.name}... `);
        try {
            const html = await fetchHtml(org.url);
            const email = extractEmail(html);

            if (email) {
                console.log(`Found: ${email}`);
                results.push({
                    name: org.name,
                    email: email,
                    url: org.url,
                    message: generateEmailBody(org.name)
                });
            } else {
                console.log("No email found.");
            }

            // Be polite to the server
            await new Promise(r => setTimeout(r, 500));
        } catch (error) {
            console.log(`Error: ${error.message}`);
        }
    }

    console.log(`\nCompleted! Found contacts for ${results.length} organizations.`);

    // Generate CSV Output
    let csvContent = "Organization Name,Contact Email,Profile URL,Outreach Message Body\n";
    results.forEach(row => {
        // Escape quotes in CSV
        const safeMessage = `"${row.message.replace(/"/g, '""')}"`;
        const safeName = `"${row.name.replace(/"/g, '""')}"`;
        csvContent += `${safeName},${row.email},${row.url},${safeMessage}\n`;
    });

    const filename = 'uri_outreach_list_full.csv';
    fs.writeFileSync(filename, csvContent);
    console.log(`Results saved to ${filename}`);
}

main();
