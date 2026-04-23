# Legal Features To Add Later

This document tracks legal copy intentionally left out of the published website because the related product features are not live yet.

Public pages should describe only the current product. When one of the features below becomes real, update the public legal pages, support page, store disclosures, and any signup consent text in the same release.

## Deferred Features

### Apple Sign-In

Add back only when Apple Sign-In is actually available to users.

When it goes live, update:

- public Terms
- public Privacy Policy
- support page
- store disclosures if needed

Copy points to reintroduce:

- Apple as a supported sign-in method
- Apple relay email / Hide My Email wording
- provider-supplied profile details from Apple

### Paid Plans and Subscriptions

Do not publish billing terms until paid access is actually live.

Current assumption for future rollout:

- billing channel: app store only
- no direct web billing unless the product changes

If subscriptions launch, add:

- plan and subscription language in the Terms
- purchase and entitlement data in the Privacy Policy
- cancellation route through the relevant app-store tools
- statement that account deletion does not automatically cancel store-billed subscriptions
- refund wording aligned with the relevant app-store rules and applicable law

### Push Notifications and Marketing Messaging

Add only when the app actually sends them.

When enabled, update:

- Terms for reminder/product/marketing communication language
- Privacy Policy for push tokens, notification preferences, and engagement metadata
- consent and opt-out wording where required

### Attribution Fields

Add only when onboarding or account creation actually stores them.

Examples:

- `heard_about_us`
- referral source
- campaign source
- invite attribution

If introduced, update the Privacy Policy data categories and purposes section.

### Expanded AI Features

Current public copy should stay broad enough for AI-assisted workout feedback and session review, but should not claim features that are not live.

Add only when shipped:

- coach chat
- conversational support
- richer generative planning assistance

If the AI stack changes materially, review:

- data-sharing language
- provider descriptions
- store disclosures

### Social, Sharing, and Messaging Features

Do not publish moderation or user-to-user content terms until these features exist.

If introduced later, add:

- user-to-user content and visibility rules
- moderation and reporting language
- deletion treatment for shared content
- harassment / abuse / spam restrictions

### Verified Retention Numbers

Do not hardcode backup-retention or log-retention timelines until they are confirmed by infrastructure reality.

Once verified, update:

- Privacy Policy
- Delete Account page
- support guidance if needed

## Release Checklist

Before publishing any deferred feature in the public legal pages:

1. Confirm the feature is live in the real product, not just planned.
2. Update the public legal page copy in the same release.
3. Check support and delete-account copy for consistency.
4. Check App Store / Google Play disclosures.
5. Update `site.config.json` `lastUpdated`.
