const fs = require('fs');
const path = 'c:/Users/Ashish/OneDrive/Desktop/Project/Elecmoon/backend/utils/settings.js';
let content = fs.readFileSync(path, 'utf8');

const startMarker = 'title: {';
const endMarker = 'faq: {';

// Find the occurrence around line 400
let startIndex = -1;
let currentPos = 0;
for (let i = 0; i < 2; i++) {
    startIndex = content.indexOf(startMarker, currentPos);
    if (startIndex === -1) break;
    currentPos = startIndex + 1;
}

const endIndex = content.indexOf(endMarker, startIndex);

if (startIndex !== -1 && endIndex !== -1) {
    const replacement = `title: {
          en: "Terms & Conditions",
          de: "Terms & Bedingungen",
        },
        description: {
          en: \`<h1><strong>Welcome to Elecmoon!</strong></h1>\\n<p>These terms and conditions outline the rules and regulations for the use of Elecmoon's Website, located at https://Elecmoon.com/. By accessing this website we assume you accept these terms and conditions. Do not continue to use Elecmoon if you do not agree to take all of the terms and conditions stated on this page.</p>\\n<p>The following terminology applies to these Terms and Conditions, Privacy Statement and Disclaimer Notice and all Agreements: Client, You and Your refers to you, the person log on this website and compliant to the Company's terms and conditions.The Company, refers to our CompanyPartParties or Us refers to both the Client and ourselves.All terms refer to the offer, acceptance and consideration of payment necessary to undertake the process of our assistance to the Client in the most appropriate manner for the express purpose of meeting the Client's needs in respect of provision of the Company's stated services, in accordance with and subject to, prevailing law of Netherlands.Any use of the above terminology or other words in the singular, plural, capitalization and/ or he/ she or they, are taken as interchangeable and therefore as referring to same.</p>\\n<h1>< strong > Cookies</strong ></h1 >\\n < p > We employ the use of cookies.By accessing Elecmoon, you agreed to use cookies in agreement with the Elecmoon's Privacy Policy. Most interactive websites use cookies to let us retrieve the user's details for each visit.Cookies are used by our website to enable the functionality of certain areas to make it easier for people visiting our website.Some of our affiliate / advertising partners may also use cookies.</p >\\n < h1 > <strong>License</strong></h1 >\\n < p > Unless otherwise stated, Elecmoon and / or its licensors own the intellectual property rights for all material on Elecmoon.All intellectual property rights are reserved.You may access this from Elecmoon for your own personal use subjected to restrictions set in these terms and conditions.This Agreement shall begin on the date hereof.Our Terms and Conditions were created with the help of the Terms And Conditions Generator.< strong > You must not:</strong ></p >\\n < ul >\\n < li > 1. Identifiers(e.g.name, mailing address, email address, phone number, credit / debit card number)</li >\\n < li > 2. Characteristics of protected classifications(e.g.gender, age)</li >\\n < li > 3. Commercial information(e.g.products or services purchased, purchase history)</li >\\n < li > 4. Internet or other electronic network activity(e.g.browse or search history)</li >\\n < li > 5. Geo location data(e.g.latitude or longitude)</li >\\n < li > 6. Audio, electronic, visual, or similar information(e.g.recording of Guest service calls)</li >\\n < li > 7. Inferences drawn from any of the above(e.g.preferences or characteristics)</li >\\n</ul >\\n < p > Parts of this website offer an opportunity for users to post and exchange opinions and information in certain areas of the website.Elecmoon does not filter, edit, publish or review Comments prior to their presence on the website.Comments do not reflect the views and opinions of Elecmoon, its agents and / or affiliates.Comments reflect the views and opinions of the person who post their views and opinions.To the extent permitted by applicable laws, Elecmoon shall not be liable for the Comments or for any liability, damages or expenses caused and / or suffered as a result of any use of and / or posting of and / or appearance of the Comments on this website.</p >\\n < h1 > <strong>Content Liability</strong></h1 >\\n < p > We shall not be hold responsible for any content that appears on your Website.You agree to protect and defend us against all claims that is rising on your Website.No link(s) should appear on any Website that may be interpreted as libelous, obscene or criminal, or which infringes, otherwise violates, or advocates the infringement or other violation of, any third party rights.Without prior approval and written permission, you may not create frames around our Webpages that alter in any way the visual presentation or appearance of our Website.</p >\\n < h1 > <strong>Your Privacy</strong></h1 >\\n < p > Please read < a href = "https://Elecmoon-store.vercel.app/privacy-policy" target = "_self" > Privacy Policy</a ></p >\\n < h1 > <strong>Reservation of Rights</strong></h1 >\\n < p > We reserve the right to request that you remove all links or any particular link to our Website.You approve to immediately remove all links to our Website upon request.We also reserve the right to amen these terms and conditions and it's linking policy at any time. By continuously linking to our Website, you agree to be bound to and follow these linking terms and conditions.</p>\\n<h1><strong>Disclaimer</strong></h1>\\n<p>To the maximum extent permitted by applicable law, we exclude all representations, warranties and conditions relating to our website and the use of this website. Nothing in this disclaimer will:</p>\\n<ul>\\n<li>1. limit or exclude our or your liability for death or personal injury;</li>\\n<li>2. limit or exclude our or your liability for fraud or fraudulent misrepresentation;</li>\\n<li>3. limit any of our or your liabilities in any way that is not permitted under applicable law; or</li>\\n<li>4. exclude any of our or your liabilities that may not be excluded under applicable law.</li>\\n</ul>\\n<p>The limitations and prohibitions of liability set in this Section and elsewhere in this disclaimer: (a) are subject to the preceding paragraph; and (b) govern all liabilities arising under the disclaimer, including liabilities arising in contract, in tort and for breach of statutory duty. As long as the website and the information and services on the website are provided free of charge, we will not be liable for any loss or damage of any nature.</p>\\n\`,
        },
      },
`;
    content = content.substring(0, startIndex) + replacement + content.substring(endIndex);
    fs.writeFileSync(path, content);
    console.log('Fixed syntax error successfully.');
} else {
    console.error('Markers not found: startIndex=' + startIndex + ', endIndex=' + endIndex);
    process.exit(1);
}
