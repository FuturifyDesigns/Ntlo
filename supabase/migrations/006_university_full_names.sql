-- Use full Google Maps campus names (no abbreviations) for accurate geocoding and display
update public.universities set
  name = 'University of Botswana',
  short_name = 'University of Botswana'
where slug = 'university-of-botswana';

update public.universities set
  name = 'Botswana International University of Science and Technology',
  short_name = 'Botswana International University of Science and Technology'
where slug = 'biust';

update public.universities set
  name = 'Botho University',
  short_name = 'Botho University'
where slug = 'botho-university';

update public.universities set
  name = 'Limkokwing University College',
  short_name = 'Limkokwing University College'
where slug = 'limkokwing';

update public.universities set
  name = 'Ba Isago University',
  short_name = 'Ba Isago University'
where slug = 'ba-isago';

update public.universities set
  name = 'ABM University College',
  short_name = 'ABM University College'
where slug = 'abm-university';

update public.universities set
  name = 'Gaborone University College',
  short_name = 'Gaborone University College'
where slug = 'guc';
