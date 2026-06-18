/** Interactive onboarding step configs per page. Variants adapt copy/targets to live data. */

export const ONBOARDING_STEPS_BY_PAGE = {
  student_dashboard: [
    {
      id: 'welcome',
      type: 'center',
      icon: 'GraduationCap',
      mascot: 'welcome',
      titleKey: 'onboarding.student.welcomeTitle',
      bodyKey: 'onboarding.student.welcomeBody',
      variants: [
        {
          when: (s) => s.isLaunchMode,
          titleKey: 'onboarding.student.welcomeLaunchTitle',
          bodyKey: 'onboarding.student.welcomeLaunchBody',
        },
        {
          when: (s) => s.savedCount === 0 && !s.hasHousingActivity,
          bodyKey: 'onboarding.student.welcomeBodyFresh',
        },
      ],
    },
    {
      id: 'sections',
      target: 'student-section-tabs',
      mascot: 'pointRight',
      titleKey: 'onboarding.student.sectionsTitle',
      bodyKey: 'onboarding.student.sectionsBody',
      variants: [
        {
          when: (s) => s.isLaunchMode,
          bodyKey: 'onboarding.student.sectionsLaunchBody',
        },
      ],
    },
    {
      id: 'saved',
      target: 'student-tab-saved',
      mascot: 'pointRight',
      titleKey: 'onboarding.student.savedTitle',
      bodyKey: 'onboarding.student.savedBody',
      onEnter: { section: 'saved' },
      variants: [
        {
          when: (s) => s.isLaunchMode && s.savedCount === 0,
          target: 'student-saved-empty',
          bodyKey: 'onboarding.student.savedLaunchBody',
        },
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
      placement: 'above',
      mascot: 'thinking',
      titleKey: 'onboarding.student.compareTitle',
      bodyKey: 'onboarding.student.compareBody',
      onEnter: { section: 'saved', scrollTarget: 'student-compare' },
      variants: [
        {
          when: (s) => s.isLaunchMode,
          bodyKey: 'onboarding.student.compareLaunchBody',
        },
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
      mascot: 'pointRight',
      titleKey: 'onboarding.student.housingTitle',
      bodyKey: 'onboarding.student.housingBody',
      onEnter: { section: 'housing', housingTab: 'applications' },
      variants: [
        {
          when: (s) => s.isLaunchMode,
          bodyKey: 'onboarding.student.housingLaunchBody',
        },
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
      mascot: 'explain',
      titleKey: 'onboarding.student.housingTabsTitle',
      bodyKey: 'onboarding.student.housingTabsBody',
      onEnter: { section: 'housing', housingTab: 'applications' },
      variants: [
        {
          when: (s) => s.isLaunchMode,
          bodyKey: 'onboarding.student.housingTabsLaunchBody',
        },
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
      mascot: 'pointLeft',
      titleKey: 'onboarding.student.browseTitle',
      bodyKey: 'onboarding.student.browseBody',
      onEnter: { section: 'saved' },
      variants: [
        {
          when: (s) => s.isLaunchMode,
          bodyKey: 'onboarding.student.browseEmptyMarketBody',
        },
      ],
    },
    {
      id: 'done',
      type: 'center',
      icon: 'PartyPopper',
      mascot: 'thumbsUp',
      titleKey: 'onboarding.student.dashboardDoneTitle',
      bodyKey: 'onboarding.student.dashboardDoneBody',
      variants: [
        {
          when: (s) => s.isLaunchMode,
          titleKey: 'onboarding.student.dashboardDoneLaunchTitle',
          bodyKey: 'onboarding.student.dashboardDoneLaunchBody',
        },
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
      mascot: 'wave',
      titleKey: 'onboarding.student.browseWelcomeTitle',
      bodyKey: 'onboarding.student.browseWelcomeBody',
      variants: [
        {
          when: (s) => s.isLaunchMode,
          titleKey: 'onboarding.student.browseWelcomeLaunchTitle',
          bodyKey: 'onboarding.student.browseWelcomeEmptyBody',
        },
        {
          when: (s) => s.listingCount === 0,
          bodyKey: 'onboarding.student.browseWelcomeEmptyBody',
        },
      ],
    },
    {
      id: 'filters',
      target: 'browse-filters',
      placement: 'above',
      mascot: 'pointUp',
      titleKey: 'onboarding.student.filtersTitle',
      bodyKey: 'onboarding.student.filtersBody',
      onEnter: { scrollTarget: 'browse-filters' },
      variants: [
        {
          when: (s) => s.isLaunchMode,
          bodyKey: 'onboarding.student.filtersEmptyBody',
        },
        {
          when: (s) => s.listingCount === 0,
          bodyKey: 'onboarding.student.filtersEmptyBody',
        },
      ],
    },
    {
      id: 'save-heart',
      target: 'browse-save-heart',
      placement: 'left',
      spotlightPad: 8,
      spotlightRadius: 999,
      mascot: 'pointLeft',
      titleKey: 'onboarding.student.saveHeartTitle',
      bodyKey: 'onboarding.student.saveHeartBody',
      onEnter: { scrollTarget: 'browse-save-heart' },
      when: (s) => s.listingCount > 0 && !s.isLaunchMode,
    },
    {
      id: 'browse-no-listings',
      target: 'browse-listings',
      mascot: 'thinking',
      titleKey: 'onboarding.student.browseNoListingsTitle',
      bodyKey: 'onboarding.student.browseNoListingsBody',
      when: (s) => s.isLaunchMode || s.listingCount === 0,
    },
    {
      id: 'view-toggle',
      target: 'browse-view-toggle',
      placement: 'above',
      mascot: 'pointRight',
      titleKey: 'onboarding.student.viewToggleTitle',
      bodyKey: 'onboarding.student.viewToggleBody',
      onEnter: { scrollTarget: 'browse-view-toggle' },
      variants: [
        {
          when: (s) => s.isLaunchMode,
          bodyKey: 'onboarding.student.viewToggleEmptyBody',
        },
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
      mascot: 'thumbsUp',
      titleKey: 'onboarding.student.browseDoneTitle',
      bodyKey: 'onboarding.student.browseDoneBody',
      variants: [
        {
          when: (s) => s.isLaunchMode,
          titleKey: 'onboarding.student.browseDoneLaunchTitle',
          bodyKey: 'onboarding.student.browseDoneEmptyBody',
        },
        {
          when: (s) => s.listingCount === 0,
          bodyKey: 'onboarding.student.browseDoneEmptyBody',
        },
      ],
    },
  ],

  student_listing: [
    {
      id: 'listing-launch',
      type: 'center',
      icon: 'Home',
      mascot: 'thinking',
      titleKey: 'onboarding.student.listingLaunchTitle',
      bodyKey: 'onboarding.student.listingLaunchBody',
      when: (s) => s.isLaunchMode,
    },
    {
      id: 'listing-launch-done',
      type: 'center',
      icon: 'PartyPopper',
      mascot: 'thumbsUp',
      titleKey: 'onboarding.student.listingLaunchDoneTitle',
      bodyKey: 'onboarding.student.listingLaunchDoneBody',
      when: (s) => s.isLaunchMode,
    },
    {
      id: 'listing-welcome',
      type: 'center',
      icon: 'Home',
      mascot: 'welcome',
      titleKey: 'onboarding.student.listingWelcomeTitle',
      bodyKey: 'onboarding.student.listingWelcomeBody',
      when: (s) => s.hasListing && !s.isLaunchMode,
    },
    {
      id: 'listing-unavailable',
      type: 'center',
      icon: 'Home',
      mascot: 'thinking',
      titleKey: 'onboarding.student.listingUnavailableTitle',
      bodyKey: 'onboarding.student.listingUnavailableBody',
      when: (s) => !s.hasListing && !s.isLaunchMode,
    },
    {
      id: 'listing-apply',
      target: 'listing-apply-panel',
      mascot: 'pointRight',
      titleKey: 'onboarding.student.listingApplyTitle',
      bodyKey: 'onboarding.student.listingApplyBody',
      when: (s) => s.hasListing && !s.isLaunchMode,
    },
    {
      id: 'listing-advisor',
      target: 'listing-advisor-panel',
      mascot: 'thinking',
      titleKey: 'onboarding.student.listingAdvisorTitle',
      bodyKey: 'onboarding.student.listingAdvisorBody',
      when: (s) => s.hasListing && !s.isLaunchMode,
    },
    {
      id: 'listing-done',
      type: 'center',
      icon: 'PartyPopper',
      mascot: 'thumbsUp',
      titleKey: 'onboarding.student.listingDoneTitle',
      bodyKey: 'onboarding.student.listingDoneBody',
      when: (s) => !s.isLaunchMode,
    },
  ],

  landlord_dashboard: [
    {
      id: 'welcome',
      type: 'center',
      icon: 'Building2',
      mascot: 'welcome',
      titleKey: 'onboarding.landlord.welcomeTitle',
      bodyKey: 'onboarding.landlord.welcomeBody',
      variants: [
        {
          when: (s) => s.isLaunchMode,
          titleKey: 'onboarding.landlord.welcomeLaunchTitle',
          bodyKey: 'onboarding.landlord.welcomeNoListingsBody',
        },
        {
          when: (s) => s.listingCount === 0,
          bodyKey: 'onboarding.landlord.welcomeNoListingsBody',
        },
      ],
    },
    {
      id: 'stats',
      target: 'landlord-stats',
      mascot: 'explain',
      titleKey: 'onboarding.landlord.statsTitle',
      bodyKey: 'onboarding.landlord.statsBody',
      onEnter: { scrollTarget: 'landlord-stats' },
      variants: [
        {
          when: (s) => s.isLaunchMode || s.listingCount === 0,
          bodyKey: 'onboarding.landlord.statsEmptyBody',
        },
      ],
    },
    {
      id: 'add-listing',
      target: 'landlord-add-listing',
      mascot: 'pointUp',
      titleKey: 'onboarding.landlord.addListingTitle',
      bodyKey: 'onboarding.landlord.addListingBody',
      variants: [
        {
          when: (s) => s.isLaunchMode || s.listingCount === 0,
          bodyKey: 'onboarding.landlord.addListingFirstBody',
        },
      ],
    },
    {
      id: 'listings',
      target: 'landlord-listings',
      mascot: 'pointRight',
      titleKey: 'onboarding.landlord.listingsTitle',
      bodyKey: 'onboarding.landlord.listingsBody',
      onEnter: { scrollTarget: 'landlord-listings' },
      variants: [
        {
          when: (s) => s.isLaunchMode || s.listingCount === 0,
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
      mascot: 'explain',
      titleKey: 'onboarding.landlord.inquiriesTitle',
      bodyKey: 'onboarding.landlord.inquiriesBody',
      onEnter: { scrollTarget: 'landlord-inquiries' },
      variants: [
        {
          when: (s) => s.isLaunchMode || !s.hasInquiries,
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
      mascot: 'thumbsUp',
      titleKey: 'onboarding.landlord.dashboardDoneTitle',
      bodyKey: 'onboarding.landlord.dashboardDoneBody',
      variants: [
        {
          when: (s) => s.isLaunchMode || s.listingCount === 0,
          titleKey: 'onboarding.landlord.dashboardDoneLaunchTitle',
          bodyKey: 'onboarding.landlord.dashboardDoneNoListingsBody',
        },
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
      mascot: 'wave',
      titleKey: 'onboarding.landlord.browseWelcomeTitle',
      bodyKey: 'onboarding.landlord.browseWelcomeBody',
      variants: [
        {
          when: (s) => s.isLaunchMode,
          titleKey: 'onboarding.landlord.browseWelcomeLaunchTitle',
          bodyKey: 'onboarding.landlord.browseWelcomeEmptyBody',
        },
        {
          when: (s) => s.listingCount === 0,
          bodyKey: 'onboarding.landlord.browseWelcomeEmptyBody',
        },
      ],
    },
    {
      id: 'landlord-browse-market',
      target: 'browse-listings',
      mascot: 'pointLeft',
      titleKey: 'onboarding.landlord.browseMarketTitle',
      bodyKey: 'onboarding.landlord.browseMarketBody',
      variants: [
        {
          when: (s) => s.isLaunchMode,
          bodyKey: 'onboarding.landlord.browseMarketEmptyBody',
        },
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
      mascot: 'thumbsUp',
      titleKey: 'onboarding.landlord.browseDoneTitle',
      bodyKey: 'onboarding.landlord.browseDoneBody',
      variants: [
        {
          when: (s) => s.isLaunchMode,
          titleKey: 'onboarding.landlord.browseDoneLaunchTitle',
          bodyKey: 'onboarding.landlord.browseDoneEmptyBody',
        },
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
