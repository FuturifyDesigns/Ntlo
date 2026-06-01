/** Interactive onboarding step configs per page. */

export const ONBOARDING_STEPS_BY_PAGE = {
  student_dashboard: [
    {
      id: 'welcome',
      type: 'center',
      icon: 'GraduationCap',
      titleKey: 'onboarding.student.welcomeTitle',
      bodyKey: 'onboarding.student.welcomeBody',
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
    },
    {
      id: 'compare',
      target: 'student-compare',
      titleKey: 'onboarding.student.compareTitle',
      bodyKey: 'onboarding.student.compareBody',
      onEnter: { section: 'saved' },
    },
    {
      id: 'housing',
      target: 'student-tab-housing',
      titleKey: 'onboarding.student.housingTitle',
      bodyKey: 'onboarding.student.housingBody',
      onEnter: { section: 'housing', housingTab: 'applications' },
    },
    {
      id: 'housing-tabs',
      target: 'student-housing-tabs',
      titleKey: 'onboarding.student.housingTabsTitle',
      bodyKey: 'onboarding.student.housingTabsBody',
      onEnter: { section: 'housing', housingTab: 'applications' },
    },
    {
      id: 'browse',
      target: 'student-browse-cta',
      titleKey: 'onboarding.student.browseTitle',
      bodyKey: 'onboarding.student.browseBody',
      onEnter: { section: 'saved' },
    },
    {
      id: 'done',
      type: 'center',
      icon: 'PartyPopper',
      titleKey: 'onboarding.student.dashboardDoneTitle',
      bodyKey: 'onboarding.student.dashboardDoneBody',
    },
  ],

  student_browse: [
    {
      id: 'browse-welcome',
      type: 'center',
      icon: 'Search',
      titleKey: 'onboarding.student.browseWelcomeTitle',
      bodyKey: 'onboarding.student.browseWelcomeBody',
    },
    {
      id: 'filters',
      target: 'browse-filters',
      titleKey: 'onboarding.student.filtersTitle',
      bodyKey: 'onboarding.student.filtersBody',
    },
    {
      id: 'save-heart',
      target: 'browse-listings',
      titleKey: 'onboarding.student.saveHeartTitle',
      bodyKey: 'onboarding.student.saveHeartBody',
    },
    {
      id: 'view-toggle',
      target: 'browse-view-toggle',
      titleKey: 'onboarding.student.viewToggleTitle',
      bodyKey: 'onboarding.student.viewToggleBody',
    },
    {
      id: 'browse-done',
      type: 'center',
      icon: 'PartyPopper',
      titleKey: 'onboarding.student.browseDoneTitle',
      bodyKey: 'onboarding.student.browseDoneBody',
    },
  ],

  student_listing: [
    {
      id: 'listing-welcome',
      type: 'center',
      icon: 'Home',
      titleKey: 'onboarding.student.listingWelcomeTitle',
      bodyKey: 'onboarding.student.listingWelcomeBody',
    },
    {
      id: 'listing-apply',
      target: 'listing-apply-panel',
      titleKey: 'onboarding.student.listingApplyTitle',
      bodyKey: 'onboarding.student.listingApplyBody',
    },
    {
      id: 'listing-advisor',
      target: 'listing-advisor-panel',
      titleKey: 'onboarding.student.listingAdvisorTitle',
      bodyKey: 'onboarding.student.listingAdvisorBody',
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
    },
    {
      id: 'stats',
      target: 'landlord-stats',
      titleKey: 'onboarding.landlord.statsTitle',
      bodyKey: 'onboarding.landlord.statsBody',
      onEnter: { scrollTarget: 'landlord-stats' },
    },
    {
      id: 'add-listing',
      target: 'landlord-add-listing',
      titleKey: 'onboarding.landlord.addListingTitle',
      bodyKey: 'onboarding.landlord.addListingBody',
    },
    {
      id: 'listings',
      target: 'landlord-listings',
      titleKey: 'onboarding.landlord.listingsTitle',
      bodyKey: 'onboarding.landlord.listingsBody',
      onEnter: { scrollTarget: 'landlord-listings' },
    },
    {
      id: 'inquiries',
      target: 'landlord-inquiries',
      titleKey: 'onboarding.landlord.inquiriesTitle',
      bodyKey: 'onboarding.landlord.inquiriesBody',
      onEnter: { scrollTarget: 'landlord-inquiries' },
    },
    {
      id: 'done',
      type: 'center',
      icon: 'PartyPopper',
      titleKey: 'onboarding.landlord.dashboardDoneTitle',
      bodyKey: 'onboarding.landlord.dashboardDoneBody',
    },
  ],

  landlord_browse: [
    {
      id: 'landlord-browse-welcome',
      type: 'center',
      icon: 'Search',
      titleKey: 'onboarding.landlord.browseWelcomeTitle',
      bodyKey: 'onboarding.landlord.browseWelcomeBody',
    },
    {
      id: 'landlord-browse-market',
      target: 'browse-listings',
      titleKey: 'onboarding.landlord.browseMarketTitle',
      bodyKey: 'onboarding.landlord.browseMarketBody',
    },
    {
      id: 'landlord-browse-done',
      type: 'center',
      icon: 'PartyPopper',
      titleKey: 'onboarding.landlord.browseDoneTitle',
      bodyKey: 'onboarding.landlord.browseDoneBody',
    },
  ],
}

/** @deprecated use ONBOARDING_STEPS_BY_PAGE */
export const STUDENT_ONBOARDING_STEPS = ONBOARDING_STEPS_BY_PAGE.student_dashboard
export const LANDLORD_ONBOARDING_STEPS = ONBOARDING_STEPS_BY_PAGE.landlord_dashboard
