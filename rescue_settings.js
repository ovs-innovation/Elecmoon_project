const fs = require('fs');
const settings = require('./backend/utils/settings.js');

// Current state (messed up):
// settings[1] is storeCustomizationSetting
const storeCust = settings[1].setting;

// 1. Extract the long T&C content from the wrong place
const longTC = storeCust.home.description.en;

// 2. Restore home.promotion_title
storeCust.home.promotion_title = {
  en: "100% Natural Quality Organic Product",
  de: "100 % natürliches Bio-Qualitätsprodukt",
};

// 3. Restore home.description
storeCust.home.description = {
  en: "See Our latest discounted products from here and get a special discount product",
  de: "Sehen Sie sich hier unsere neuesten reduzierten Produkte an und sichern Sie sich ein spezielles Rabattprodukt",
};

// 4. Restore home.promotion_description (was at line 109 originally)
storeCust.home.promotion_description = {
  en: "See Our latest discounted products from here and get a special discount product",
  de: "Sehen Sie sich hier unsere neuesten reduzierten Produkte an und sichern Sie sich ein spezielles Rabattprodukt",
};

// 5. Fix term_and_condition structure
storeCust.navbar.term_and_condition = {
  en: "Terms & Conditions",
  de: "Terms & Bedingungen",
};

// 6. Add the description to term_and_condition (the one that was missing/wrong)
// Note: In the original file, it was settings[1].setting.term_and_condition (at top level of setting object, not under navbar)
// Let's check original structure.
// Step 106: settings[1].setting.term_and_condition starts at line 395.
// Navbar is a subkey of setting.

if (!storeCust.term_and_condition) storeCust.term_and_condition = {};
storeCust.term_and_condition.status = true;
storeCust.term_and_condition.header_bg = "https://res.cloudinary.com/ahossain/image/upload/v1697439245/settings/yw3cd2xupqwqpqcbxv9l.jpg";
storeCust.term_and_condition.title = {
  en: "Terms & Conditions",
  de: "Terms & Bedingungen",
};
storeCust.term_and_condition.description = {
  en: longTC,
};

// 7. Cleanup navbar.term_and_condition (if it was redundant)
// The menu link still needs it.

// 8. Restore privacy_policy (just in case)
storeCust.privacy_policy = {
    status: true,
    header_bg: "https://res.cloudinary.com/ahossain/image/upload/v1697439245/settings/yw3cd2xupqwqpqcbxv9l.jpg",
    title: {
      en: "Privacy Policy",
      de: "Datenschutz-Bestimmungen",
    },
    description: {
      en: `<h1><strong>Last updated: February 15, 2022</strong></h1>\n<p>At Elecmoon, accessible from Elecmoon dot com, one of our main priorities is the privacy of our visitors. This Privacy Policy document contains types of information that is collected and recorded by Elecmoon and how we use it. If you have additional questions or require more information about our Privacy Policy, do not hesitate to contact us.we may receive additional information about you such as your name, email address, phone number, the contents of the message and/or attachments you may send us, and any other information you may choose to provide. When you register for an Account, we may ask for your contact information, including items such as name, company name, address, email address, and telephone number.</p>\n<p>This Privacy Policy applies only to our online activities and is valid for visitors to our website with regards to the information that they shared and/or collect in Elecmoon.we may receive additional information about you such as your name, email address, phone number, the contents of the message and/or attachments you may send us, we may ask for your contact information, including items such as name, company name, address, email address, and telephone number. This policy is not applicable to any information collected offline or via channels other than this website. Our Privacy Policy was created with the help of the Free Privacy Policy Generator.</p>\n<h1><strong>Consent</strong></h1>\n<p>By using our website, you hereby consent to our Privacy Policy and agree to its terms.</p>\n<h1><strong>Information we collect</strong></h1>\n<p>The personal information that you are asked to provide, and the reasons why you are asked to provide it, will be made clear to you at the point we ask you to provide your personal information. If you contact us directly, we may receive additional information about you such may choose to provide. When you register for an Account, we may ask for your contact information, including items such as name, company name, address, email address, and telephone number.</p>\n<p>Please note that the Company will not ask you to share any sensitive data or information via email or telephone. If you receive any such request by email or telephone, please do not respond/divulge any sensitive data or information and forward the information relating to the same to</p>\n<h1><strong>How we use your information</strong></h1>\n<p>We use the information we collect in various ways, including to:</p>\n<ol>\n<li>1. Provide, operate, and maintain our website, to provide you with updates and other information.</li>\n<li>2. Improve, personalize, and expand our website,and other information relating to the website.</li>\n<li>3. Understand and analyze how you use our website, to provide you with updates and other information relating to the website.</li>\n<li>4. Develop new products, services, features, and functionality,and other information relating to the website.</li>\n<li>5. Communicate with you, either directly or through one of our partners, including for customer service, to provide you with updates.</li>\n<li>6. Send you emails. To provide you with updates and other information relating to the website, and for marketing and promotional purposes</li>\n<li>7. Find and prevent fraud. To provide you with updates and other information relating to the website, and for marketing and promotional purposes</li>\n</ol>\n<h1><strong>Log Files</strong></h1>\n<p>Elecmoon follows a standard procedure of using log files. These files log visitors when they visit websites. All hosting companies do this and a part of hosting. The information collected by log files include internet protocol (IP) addresses, browser type, Internet Service Provider (ISP), date and time stamp, referring/exit pages, and possibly the number of clicks. These are not linked to any information that is personally identifiable. The purpose of the information is for analyzing trends, administering the site, tracking users' movement on the website, and gathering demographic information.</p>\n<h1><strong>Advertising Partners Privacy Policies</strong></h1>\n<p>You may consult this list to find the Privacy Policy for each of the advertising partners of Elecmoon. Third-party ad servers or ad networks uses technologies like cookies, JavaScript, or Web Beacons that are used in their respective advertisements and links that appear on Elecmoon, which are sent directly to users' browser. They automatically receive your IP address when this occurs. These technologies are used to measure the effectiveness of their advertising campaigns and/or to personalize the advertising content that you see on websites that you visit. Note that Elecmoon has no access to or control over these cookies that are used by third-party advertisers.</p>\n<h1><strong>Third Party Privacy Policies</strong></h1>\n<p>Third-party ad servers or ad networks uses technologies like cookies, JavaScript, or Web Beacons that are used in their respective advertisements and links that appear on Elecmoon, which are sent directly to users' browser. They automatically receive your IP address when this occurs. These technologies are used to measure the effectiveness of their advertising campaigns and/or to personalize the advertising content that you see on websites that you visit. Note that Elecmoon has no access to or control over these cookies that are used by third-party advertisers.</p>\n<p>Elecmoon's Privacy Policy does not apply to other advertisers or websites. Thus, we are advising you to consult the respective Privacy Policies of these third-party ad servers for more detailed information. It may include their practices and instructions about how to opt-out of certain options. You can choose to disable cookies through your individual browser options. To know more detailed information about cookie management with specific web browsers, it can be found at the browsers' respective websites.</p>\n<h1><strong>CCPA Privacy Rights</strong></h1>\n<p>Under the CCPA, among other rights, California consumers have the right to: Request that a business that collects a consumer's personal data disclose the categories and specific pieces of personal data that a business has collected about consumers. Request that a business delete any personal data about the consumer that a business has collected. Request that a business that sells a consumer's personal data, not sell the consumer's personal data. If you make a request, we have one month to respond to you. If you would like to exercise any of these rights, please contact us.</p>\n<h1><strong>Children's Information</strong></h1>\n another part of our priority is adding protection for children while using the internet. We encourage parents and guardians to observe, participate in, and/or monitor and guide their online activity.Request that a business delete any personal data about the consumer that a business has collected. If you make a request, we have one month to respond to you. If you would like to exercise any of these rights, please contact us.</p>\n<p>Elecmoon does not knowingly collect any Personal Identifiable Information from children under the age of 13. If you think that your child provided this kind of information on our website, we strongly encourage you to contact us immediately and we will do our best efforts to promptly remove such information from our records.</p>\n`
    }
};

// 9. FAQ section check - ensure it has all items
// (I'll skip full restore for now unless I see it missing, but I'll make sure it's in the right place)
// It's already in storeCust.faq in the messed up version.

// 10. Write back
const output = "const setting = " + JSON.stringify(settings, null, 2) + ";\n\nmodule.exports = setting;\n";
fs.writeFileSync('./backend/utils/settings.js', output);
console.log('Rescue completed successfully.');
