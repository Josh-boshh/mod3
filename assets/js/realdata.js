/* =============================================================================
 *  MOD — real data pulled from defence.gov.ng (May 2026) + MOD Instagram/Facebook
 *  All headlines, names and image URLs come from the live Ministry properties.
 * ============================================================================= */
window.MOD_DATA = {

  // Hero slider — uses real photos saved in /assets/images/hero/.
  // See website/assets/images/hero/README.txt for filename mapping.
  HERO_SLIDES: [
    {
      img: "assets/images/hero/slide-8.jpg",
      role: "Nigerian Army",
      name: "Counter-terrorism operations — Nigerian soldiers engaged in active theatre operations.",
      alt: "Nigerian Army soldiers on patrol vehicle in counter-terrorism operations",
    },
    {
      img: "assets/images/hero/slide-2.jpg",
      role: "Nigerian Navy",
      name: "Maritime special forces securing Nigeria's territorial waters and the Gulf of Guinea.",
      alt: "Nigerian Navy special boat service operators on patrol in the Gulf of Guinea",
    },
    {
      img: "assets/images/hero/slide-3.jpg",
      role: "Nigerian Air Force",
      name: "NAF 530 on deployment — projecting air power in defence of Nigeria's sovereign skies.",
      alt: "Nigerian Air Force Mi-35 attack helicopter NAF 530 in flight",
    },
    {
      img: "assets/images/hero/slide-4.jpg",
      role: "Nigerian Army",
      name: "Precision and ceremony — the Nigerian Army honour guard stands ready in service of the nation.",
      alt: "Nigerian Army honour guard inspection in full ceremonial uniform",
    },
    {
      img: "assets/images/hero/slide-5.jpg",
      role: "Nigerian Air Force",
      name: "Strike aircraft lined up and ready — the Nigerian Air Force maintains constant operational readiness.",
      alt: "Nigerian Air Force fighter jets taxiing in formation on the runway",
    },
    {
      img: "assets/images/hero/slide-6.jpg",
      role: "Nigerian Air Force",
      name: "Fighter jets on the tarmac — air power standing by in the service of Nigeria's national security.",
      alt: "Nigerian Air Force fighter jets lined up on the flight line with cockpits open",
    },
    {
      img: "assets/images/hero/slide-7.jpg",
      role: "Nigerian Air Force",
      name: "Armed and airborne — Nigeria's air combat capability ready to defend sovereign skies.",
      alt: "Nigerian Air Force fighter jet in flight above clouds, fully armed",
    },
    {
      img: "assets/images/hero/slide-1.jpg",
      role: "Ship House, Abuja",
      name: "Seat of Nigeria's defence policy — home of the Federal Ministry of Defence.",
      alt: "Ship House — Federal Ministry of Defence headquarters, Abuja",
    },
  ],

  // Real press releases — pulled from defence.gov.ng front page (May 2026)
  PRESS: [
    {
      slug: "defence-minister-pledges-amce",
      date: "11 May 2026",
      category: "Press Office",
      title: "Defence Minister pledges to boost military healthcare, reduce medical tourism during AMCE visit",
      excerpt: "The Honourable Minister of Defence, General Christopher Gwabin Musa (rtd), has pledged the Ministry of Defence's commitment to strengthening military healthcare and reducing medical tourism, during a working visit to the African Medical Centre of Excellence (AMCE) in Abuja.",
      img: "https://defence.gov.ng/wp-content/uploads/slider/cache/5c91a2fb5a3c3d7d91aa26fb98ea005d/WhatsApp-Image-2026-05-08-at-09.51.56.jpg",
      url: "https://defence.gov.ng/2026/05/11/defence-minister-pledges-to-boost-military-healthcare-reduce-medical-tourism-during-amce-visit/",
    },
    {
      slug: "icrc-humanitarian",
      date: "08 May 2026",
      category: "Press Office",
      title: "Defence Minister commends ICRC for humanitarian services in the country",
      excerpt: "The Honourable Minister of Defence, General Christopher Musa (rtd), has commended the International Committee of the Red Cross (ICRC) for its sustained humanitarian engagement across Nigeria, particularly in conflict-affected communities.",
      img: "https://defence.gov.ng/wp-content/uploads/slider/cache/7ed124706b9db62fa4aae0e8bdc44f70/WhatsApp-Image-2026-05-06-at-09.44.49.jpg",
      url: "https://defence.gov.ng/2026/05/08/defence-minister-commends-icrc-for-humanitarian-services-in-the-country/",
    },
    {
      slug: "regional-security-meeting",
      date: "06 May 2026",
      category: "Press Office",
      title: "Defence Minister participates in regional security meeting",
      excerpt: "Reaffirming Nigeria's commitment to regional cooperation and collective security, the Honourable Minister of Defence joined counterparts from the West African sub-region for a high-level consultation on emerging threats.",
      img: "https://defence.gov.ng/wp-content/uploads/slider/cache/f2ac3e9cb69b47524dec83e6268b40b1/WhatsApp-Image-2026-05-05-at-16.06.33.jpg",
      url: "https://defence.gov.ng/2026/05/06/defence-minister-participates-in-regional-security-meeting/",
    },
    {
      slug: "prestigious-fellowship",
      date: "06 May 2026",
      category: "Press Office",
      title: "Defence Minister conferred with prestigious fellowship",
      excerpt: "Sets historic milestone. The Ministry of Defence has welcomed the conferment of an Honorary Fellowship on the Honourable Minister in recognition of his contributions to national security and defence reform.",
      img: "https://defence.gov.ng/wp-content/uploads/slider/cache/b64dada37ea1a198b4a6e0382f45f0c0/WhatsApp-Image-2026-05-05-at-04.41.488-1.jpg",
      url: "https://defence.gov.ng/2026/05/06/defence-minister-conferred-with-prestigious-fellowship/",
    },
    {
      slug: "musa-students-security",
      date: "05 May 2026",
      category: "Press Office",
      title: "Gen. Musa urges Nigerian students to play active role in national security",
      excerpt: "Speaking at a stakeholders' engagement, the Honourable Minister urged Nigerian students and youth to take ownership of the national security conversation through civic responsibility, intelligence sharing and lawful conduct.",
      img: "https://defence.gov.ng/wp-content/uploads/slider/cache/7d5dab6eb3370ef45d22dfbeceb170b0/WhatsApp-Image-2026-05-05-at-04.41.4644.jpg",
      url: "https://defence.gov.ng/2026/05/05/gen-musa-urges-nigerian-students-to-play-active-role-in-national-security/",
    },
    {
      slug: "veritas-university",
      date: "05 May 2026",
      category: "Press Office",
      title: "Hon. Minister receives Veritas University Political Science delegation",
      excerpt: "The Honourable Minister of Defence received a delegation from the Department of Political Science and Diplomacy of Veritas University at Ship House, Abuja, for a courtesy and research engagement.",
      img: "https://defence.gov.ng/wp-content/uploads/slider/cache/f2ac3e9cb69b47524dec83e6268b40b1/WhatsApp-Image-2026-05-05-at-16.06.33.jpg",
      url: "https://defence.gov.ng/2026/05/05/the-honourable-minister-of-defence-general-christopher-gwabin-musa-ofrrtd-received-a-delegation-from-the-department-of-political-science-and-diplomacy-veritas-university/",
    },
    {
      slug: "three-committees-inaugurated",
      date: "30 April 2026",
      category: "Press Office",
      title: "Hon. Minister inaugurates three committees at Ship House",
      excerpt: "The Honourable Minister of Defence inaugurated three strategic committees at the Ministry's Conference Room, Ship House, Abuja, on Wednesday, 29 April 2026, in furtherance of the Ministry's reform agenda.",
      img: "https://defence.gov.ng/wp-content/uploads/slider/cache/de24e192a317d951778e07962e82686d/WhatsApp-Image-2026-04-29-at-21.34.414.jpg",
      url: "https://defence.gov.ng/2026/04/30/the-honourable-minister-of-defence-general-christopher-gwabin-musa-rtd-inaugurated-three-committees-at-the-ministerys-conference-room-ship-house-abuja-on-wednesday-29-april-2026/",
    },
    {
      slug: "strategic-committees-security-veterans",
      date: "30 April 2026",
      category: "Press Office",
      title: "Defence Ministry inaugurates strategic committees to strengthen national security and veterans welfare",
      excerpt: "The Ministry of Defence has inaugurated strategic committees aimed at strengthening national security architecture and improving the welfare and resettlement of veterans of the Armed Forces.",
      img: "https://defence.gov.ng/wp-content/uploads/slider/cache/39e7bd9f42f86e2e15e02a7a8e72b6bb/WhatsApp-Image-2026-04-29-at-21.34.426.jpg",
      url: "https://defence.gov.ng/2026/04/30/defence-ministry-inaugurates-strategic-committees-to-strengthen-national-security-and-veterans-welfare/",
    },
  ],

  // Real leadership — local headshot assets
  LEADERSHIP: {
    minister: {
      name: "General Christopher Gwabin Musa (rtd), OFR",
      title: "Honourable Minister of Defence",
      photo: "assets/images/headshots/general-christopher-musa.jpeg",
    },
    ministerOfState: {
      name: "Dr. Bello Mohammed Matawalle, MON",
      title: "Honourable Minister of State for Defence",
      photo: "assets/images/headshots/dr-bello-matawalle.jpg",
    },
    permSec: {
      name: "Mr. Richard P. Pheelandwah",
      title: "Permanent Secretary, Federal Ministry of Defence",
      photo: "assets/images/headshots/permanent-secretary.jpeg",
    },
  },

  // Real management team (Directors) — names pulled from defence.gov.ng /team/ pages
  MANAGEMENT: [
    { name: "Dr. Jibrin Alhassan", title: "Director, Health Services" },
    { name: "Mrs. Gloria Okopi", title: "Director, Internal Audit" },
    { name: "Mr. Henshaw Ogubike", title: "Director, Information, Press & Public Relations" },
    { name: "Mr. Afolabi Idowu Omoniwa", title: "Director, Finance and Accounts" },
    { name: "Mr. Otalike P. Yahaya", title: "Director, Procurement" },
    { name: "Mrs. B.O. Olaniyi", title: "Director, Joint Services" },
    { name: "Dr. Ahmad Ibrahim Sulaiman", title: "Director, Air Force Affairs" },
    { name: "Mal. Idris Shehu Gaya, mni", title: "Director, Human Resource Management" },
    { name: "Mr. Joel Adeoye Christopher", title: "Director, Navy Affairs" },
    { name: "Alh. Abdulrahman Suleiman", title: "Director, Planning, Research and Statistics" },
    { name: "Barr. Adebola Odugbesa", title: "Director, Legal Services" },
    { name: "Nneji Nkiru Florence", title: "Director, Reforms Coordination & Service Improvement" },
    { name: "Mr. Kura Markus", title: "Director, Education Services" },
    { name: "Uwaneyi Raymond Erurane", title: "Director, General Services" },
    { name: "Mr. SM Attah", title: "Director, Army Affairs" },
  ],

  // Real Service & Agency logos — hotlinked from defence.gov.ng
  LOGOS: {
    dhq:      "https://defence.gov.ng/wp-content/uploads/2020/11/dhq_logo.png",
    army:     "https://defence.gov.ng/wp-content/uploads/2020/11/army_logo-1.png",
    navy:     "https://defence.gov.ng/wp-content/uploads/2020/11/navy_logo-1.png",
    airforce: "https://defence.gov.ng/wp-content/uploads/2020/11/air_force.png",
    ndc:      "https://defence.gov.ng/wp-content/uploads/2020/11/national_defence_college.png",
    nda:      "https://defence.gov.ng/wp-content/uploads/2020/11/nda_logo.png",
    afcsc:    "https://defence.gov.ng/wp-content/uploads/2020/11/afcsc.jpg",
    dicon:    "https://defence.gov.ng/wp-content/uploads/2020/11/dicon.png",
    nafrc:    "https://defence.gov.ng/wp-content/uploads/2020/11/nafrc.png",
    mpb:      "https://defence.gov.ng/wp-content/uploads/2020/11/mpb.png",
    dia:      "https://defence.gov.ng/wp-content/uploads/2020/12/dia-logo.png",
  },
};
