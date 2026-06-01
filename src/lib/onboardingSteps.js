/** Interactive onboarding step configs per page. Variants adapt copy/targets to live data. */

export const ONBOARDING_STEPS_BY_PAGE = {
  student_dashboard: [
    {
      id: 'welcome',
      type: 'center',
      icon: 'GraduationCap',
      titleKey: 'onboarding.student.welcomeTitle',
      bodyKey: 'onboarding.student.welcomeBody',
      variants: [
        {
          when: (s) => s.savedCount === 0 && !s.hasHousingActivity,
          bodyKey: 'onboarding.student.welcomeBodyFresh',
        },
      ],
    },
    {
      id: 'sections',
      target: 'student-section-tabs',
      titleKey: 'onboarding.student.sectionsTitle',
      bodyKey: 'onboarding.student.sectionsBody',
    },
    {
      id: 'saved',
      target: 'student-tab-saved',
      titleKey: 'onboarding.student.savedTitle',
      bodyKey: 'onboarding.student.savedBody',
      onEnter: { section: 'saved' },
      variants: [
        {
          when: (s) => s.savedCount === 0,
          target: 'student-saved-empty',
          bodyKey: 'onboarding.student.savedEmptyBody',
        },
        {
          when: (s) => s.savedCount > 0,
          bodyKey: 'onboarding.student.savedHasBody',
        },
      ],
    },
    {
      id: 'compare',
      target: 'student-compare',
      titleKey: 'onboarding.student.compareTitle',
      bodyKey: 'onboarding.student.compareBody',
      onEnter: { section: 'saved' },
      variants: [
        {
          when: (s) => s.savedCount === 0,
          bodyKey: 'onboarding.student.compareEmptyBody',
        },
        {
          when: (s) => s.savedCount === 1,
          bodyKey: 'onboarding.student.compareOneBody',
        },
        {
          when: (s) => s.savedCount >= 2,
          bodyKey: 'onboarding.student.compareManyBody',
        },
      ],
    },
    {
      id: 'housing',
      target: 'student-tab-housing',
      titleKey: 'onboarding.student.housingTitle',
      bodyKey: 'onboarding.student.housingBody',
      onEnter: { section: 'housing', housingTab: 'applications' },
      variants: [
        {
          when: (s) => !s.hasHousingActivity,
          bodyKey: 'onboarding.student.housingEmptyBody',
        },
        {
          when: (s) => s.hasHousingActivity,
          bodyKey: 'onboarding.student.housingHasBody',
        },
      ],
    },
    {
      id: 'housing-tabs',
      target: 'student-housing-tabs',
      titleKey: 'onboarding.student.housingTabsTitle',
      bodyKey: 'onboarding.student.housingTabsBody',
      onEnter: { section: 'housing', housingTab: 'applications' },
      variants: [
        {
          when: (s) => !s.hasHousingActivity,
          bodyKey: 'onboarding.student.housingTabsEmptyBody',
        },
        {
          when: (s) => s.hasHousingActivity,
          bodyKey: 'onboarding.student.housingTabsHasBody',
        },
      ],
    },
    {
      id: 'browse',
      target: 'student-browse-cta',
      titleKey: 'onboarding.student.browseTitle',
      bodyKey: 'onboarding.student.browseBody',
      onEnter: { section: 'saved' },
      variants: [
        {
          when: (s) => s.marketListingCount === 0,
          bodyKey: 'onboarding.student.browseEmptyMarketBody',
        },
      ],
    },
    {
      id: 'done',
      type: 'center',
      icon: 'PartyPopper',
      titleKey: 'onboarding.student.dashboardDoneTitle',
      bodyKey: 'onboarding.student.dashboardDoneBody',
      variants: [
        {
          when: (s) => s.savedCount === 0 && s.marketListingCount === 0,
          bodyKey: 'onboarding.student.dashboardDoneLaunchBody',
        },
      ],
    },
  ],

  student_browse: [
    {
      id: 'browse-welcome',
      type: 'center',
      icon: 'Search',
      titleKey: 'onboarding.student.browseWelcomeTitle',
      bodyKey: 'onboarding.student.browseWelcomeBody',
      variants: [
        {
          when: (s) => s.listingCount === 0,
          bodyKey: 'onboarding.student.browseWelcomeEmptyBody',
        },
      ],
    },
    {
      id: 'filters',
      target: 'browse-filters',
      titleKey: 'onboarding.student.filtersTitle',
      bodyKey: 'onboarding.student.filtersBody',
      variants: [
        {
          when: (s) => s.listingCount === 0,
          bodyKey: 'onboarding.student.filtersEmptyBody',
        },
      ],
    },
    {
      id: 'save-heart',
      target: 'browse-listings',
      titleKey: 'onboarding.student.saveHeartTitle',
      bodyKey: 'onboarding.student.saveHeartBody',
      when: (s) => s.listingCount > 0,
    },
    {
      id: 'browse-no-listings',
      target: 'browse-listings',
      titleKey: 'onboarding.student.browseNoListingsTitle',
      bodyKey: 'onboarding.student.browseNoListingsBody',
      when: (s) => s.listingCount === 0,
    },
    {
      id: 'view-toggle',
      target: 'browse-view-toggle',
      titleKey: 'onboarding.student.viewToggleTitle',
      bodyKey: 'onboarding.student.viewToggleBody',
      variants: [
        {
          when: (s) => s.listingCount === 0,
          bodyKey: 'onboarding.student.viewToggleEmptyBody',
        },
      ],
    },
    {
      id: 'browse-done',
      type: 'center',
      icon: 'PartyPopper',
      titleKey: 'onboarding.student.browseDoneTitle',
      bodyKey: 'onboarding.student.browseDoneBody',
      variants: [
        {
          when: (s) => s.listingCount === 0,
          bodyKey: 'onboarding.student.browseDoneEmptyBody',
        },
      ],
    },
  ],

  student_listing: [
    {
      id: 'listing-welcome',
      type: 'center',
      icon: 'Home',
      titleKey: 'onboarding.student.listingWelcomeTitle',
      bodyKey: 'onboarding.student.listingWelcomeBody',
      when: (s) => s.hasListing,
    },
    {
      id: 'listing-unavailable',
      type: 'center',
      icon: 'Home',
      titleKey: 'onboarding.student.listingUnavailableTitle',
      bodyKey: 'onboarding.student.listingUnavailableBody',
      when: (s) => !s.hasListing,
    },
    {
      id: 'listing-apply',
      target: 'listing-apply-panel',
      titleKey: 'onboarding.student.listingApplyTitle',
      bodyKey: 'onboarding.student.listingApplyBody',
      when: (s) => s.hasListing,
    },
    {
      id: 'listing-advisor',
      target: 'listing-advisor-panel',
      titleKey: 'onboarding.student.listingAdvisorTitle',
      bodyKey: 'onboarding.student.listingAdvisorBody',
      when: (s) => s.hasListing,
    },
    {
      id: 'listing-done',
      type: 'center',
      icon: 'PartyPopper',
      titleKey: 'onboarding.student.listingDoneTitle',
      bodyKey: 'onboarding.student.listingDoneBody',
    },
  ],

  landlord_dashboard: [
    {
      id: 'welcome',
      type: 'center',
      icon: 'Building2',
      titleKey: 'onboarding.landlord.welcomeTitle',
      bodyKey: 'onboarding.landlord.welcomeBody',
      variants: [
        {
          when: (s) => s.listingCount === 0,
          bodyKey: 'onboarding.landlord.welcomeNoListingsBody',
        },
      ],
    },
    {
      id: 'stats',
      target: 'landlord-stats',
      titleKey: 'onboarding.landlord.statsTitle',
      bodyKey: 'onboarding.landlord.statsBody',
      onEnter: { scrollTarget: 'landlord-stats' },
      variants: [
        {
          when: (s) => s.listingCount === 0,
          bodyKey: 'onboarding.landlord.statsEmptyBody',
        },
      ],
    },
    {
      id: 'add-listing',
      target: 'landlord-add-listing',
      titleKey: 'onboarding.landlord.addListingTitle',
      bodyKey: 'onboarding.landlord.addListingBody',
      variants: [
        {
          when: (s) => s.listingCount === 0,
          bodyKey: 'onboarding.landlord.addListingFirstBody',
        },
      ],
    },
    {
      id: 'listings',
      target: 'landlord-listings',
      titleKey: 'onboarding.landlord.listingsTitle',
      bodyKey: 'onboarding.landlord.listingsBody',
      onEnter: { scrollTarget: 'landlord-listings' },
      variants: [
        {
          when: (s) => s.listingCount === 0,
          target: 'landlord-listings-empty',
          bodyKey: 'onboarding.landlord.listingsEmptyBody',
        },
        {
          when: (s) => s.listingCount > 0,
          bodyKey: 'onboarding.landlord.listingsHasBody',
        },
      ],
    },
    {
      id: 'inquiries',
      target: 'landlord-inquiries',
      titleKey: 'onboarding.landlord.inquiriesTitle',
      bodyKey: 'onboarding.landlord.inquiriesBody',
      onEnter: { scrollTarget: 'landlord-inquiries' },
      variants: [
        {
          when: (s) => !s.hasInquiries,
          bodyKey: 'onboarding.landlord.inquiriesEmptyBody',
        },
        {
          when: (s) => s.hasInquiries,
          bodyKey: 'onboarding.landlord.inquiriesHasBody',
        },
      ],
    },
    {
      id: 'done',
      type: 'center',
      icon: 'PartyPopper',
      titleKey: 'onboarding.landlord.dashboardDoneTitle',
      bodyKey: 'onboarding.landlord.dashboardDoneBody',
      variants: [
        {
          when: (s) => s.listingCount === 0,
          bodyKey: 'onboarding.landlord.dashboardDoneNoListingsBody',
        },
      ],
    },
  ],

  landlord_browse: [
    {
      id: 'landlord-browse-welcome',
      type: 'center',
      icon: 'Search',
      titleKey: 'onboarding.landlord.browseWelcomeTitle',
      bodyKey: 'onboarding.landlord.browseWelcomeBody',
      variants: [
        {
          when: (s) => s.listingCount === 0,
          bodyKey: 'onboarding.landlord.browseWelcomeEmptyBody',
        },
      ],
    },
    {
      id: 'landlord-browse-market',
      target: 'browse-listings',
      titleKey: 'onboarding.landlord.browseMarketTitle',
      bodyKey: 'onboarding.landlord.browseMarketBody',
      variants: [
        {
          when: (s) => s.listingCount === 0,
          bodyKey: 'onboarding.landlord.browseMarketEmptyBody',
        },
      ],
    },
    {
      id: 'landlord-browse-done',
      type: 'center',
      icon: 'PartyPopper',
      titleKey: 'onboarding.landlord.browseDoneTitle',
      bodyKey: 'onboarding.landlord.browseDoneBody',
      variants: [
        {
          when: (s) => s.listingCount === 0,
          bodyKey: 'onboarding.landlord.browseDoneEmptyBody',
        },
      ],
    },
  ],
}

/** @deprecated use ONBOARDING_STEPS_BY_PAGE */
export const STUDENT_ONBOARDING_STEPS = ONBOARDING_STEPS_BY_PAGE.student_dashboard
export const LANDLORD_ONBOARDING_STEPS = ONBOARDING_STEPS_BY_PAGE.landlord_dashboard
